const mockWork = document.querySelector("#mock-work");
const tabs = document.querySelector("#section-tabs");
const sectionOrder = ["dictation", "listening", "reading", "language", "writing"];
const sectionMeta = {
  dictation: ["听写", 10, "约15分钟"], listening: ["听力", 20, "约20分钟"], reading: ["阅读", 20, "约50分钟"], language: ["语法词汇", 35, "约45分钟"], writing: ["写作", 15, "约40分钟"]
};
const mockState = { section: "dictation", answers: {}, scores: {}, done: {}, data: null };
const escapeMock = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const words = (value) => String(value || "").toLocaleLowerCase("de-DE").match(/[a-zäöüß]+/giu) || [];
const distance = (left, right) => {
  const row = Array(right.length + 1).fill(0).map((_, i) => i);
  left.forEach((word, i) => {
    let previous = row[0]; row[0] = i + 1;
    right.forEach((other, j) => { const old = row[j + 1]; row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, previous + (word === other ? 0 : 1)); previous = old; });
  });
  return row[right.length];
};

const speak = (text, rate = .86) => {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE"; utterance.rate = rate;
  const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("de"));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
};

const renderTabs = () => {
  tabs.innerHTML = sectionOrder.map((id) => `<button class="${mockState.section === id ? "active" : ""}" data-section="${id}" type="button">${sectionMeta[id][0]} · ${sectionMeta[id][1]}分${mockState.done[id] ? " ✓" : ""}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { mockState.section = button.dataset.section; render(); }));
};

const correctOption = (item) => typeof item.answer === "number" ? item.options[item.answer] : item.answer;
const mcqMarkup = (items, offset = 0) => items.map((item, index) => `<article class="mock-question" data-id="${item.id}"><h3>${offset + index + 1}. ${escapeMock(item.prompt)}</h3><div class="answers">${item.options.map((option) => `<button class="answer${mockState.answers[item.id] === option ? " selected" : ""}" data-answer="${escapeMock(option)}" type="button">${escapeMock(option)}</button>`).join("")}</div></article>`).join("");
const bindMcq = (items, section, points) => {
  mockWork.querySelectorAll(".mock-question").forEach((block) => block.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    mockState.answers[block.dataset.id] = button.dataset.answer;
    block.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
    const answered = items.filter((item) => mockState.answers[item.id] !== undefined).length;
    const correct = items.filter((item) => mockState.answers[item.id] === correctOption(item)).length;
    mockState.scores[section] = Math.round((correct / items.length) * points * 10) / 10;
    mockState.done[section] = answered === items.length;
    renderTabs();
  })));
};

const sectionHead = (id, copy) => `<div class="mock-section-head"><div><p class="eyebrow">${sectionMeta[id][2]}</p><h2>${sectionMeta[id][0]}</h2><p class="muted">${copy}</p></div><strong>${sectionMeta[id][1]}分</strong></div>`;
const renderDictation = () => {
  const lesson = mockState.data.dictation;
  mockWork.innerHTML = `${sectionHead("dictation", "完整播放一次、分段慢速播放一次，再正常播放一次。系统按词序相似度折算本部分分数。")}<div class="mock-audio"><button class="primary" id="dictation-normal" type="button">正常播放</button> <button class="secondary" id="dictation-slow" type="button">慢速播放</button><p>提交前不会显示原文。</p></div><textarea class="mock-textarea" id="mock-dictation" rows="12" spellcheck="false" placeholder="输入听写内容">${escapeMock(mockState.answers.dictationText || "")}</textarea><div class="actions"><button class="primary" id="check-mock-dictation" type="button">完成听写并计分</button></div><p class="feedback" id="dictation-result"></p>`;
  document.querySelector("#dictation-normal").addEventListener("click", () => speak(lesson.content.join(" "), .86));
  document.querySelector("#dictation-slow").addEventListener("click", () => speak(lesson.content.join(" "), .68));
  document.querySelector("#check-mock-dictation").addEventListener("click", () => {
    const draft = document.querySelector("#mock-dictation").value.trim(); if (!draft) return;
    mockState.answers.dictationText = draft;
    const expected = words(lesson.content.join(" ")), actual = words(draft);
    const similarity = Math.max(0, Math.round((1 - distance(expected, actual) / Math.max(expected.length, actual.length, 1)) * 100));
    mockState.scores.dictation = Math.round(similarity) / 10; mockState.done.dictation = true;
    document.querySelector("#dictation-result").innerHTML = `词序相似度 ${similarity}% · 本部分 ${mockState.scores.dictation}/10。<br><strong>原文：</strong>${escapeMock(lesson.content.join(" "))}`;
    renderTabs();
  });
};
const renderListening = () => {
  const lessons = mockState.data.listening;
  const items = lessons.flatMap((lesson) => lesson.questions.filter((q) => q.type === "mcq").map((q) => ({ ...q, id: `${lesson.id}-${q.id}` })));
  mockWork.innerHTML = `${sectionHead("listening", "每篇材料可正常播放两次。完成全部选择后按比例折算20分。")}${lessons.map((lesson, i) => `<div class="mock-audio"><strong>材料 ${i + 1} · ${escapeMock(lesson.contentTitle)}</strong><div class="actions"><button class="secondary" data-audio="${i}" type="button">播放材料</button></div></div>`).join("")}${mcqMarkup(items)}`;
  mockWork.querySelectorAll("[data-audio]").forEach((button) => button.addEventListener("click", () => speak(lessons[Number(button.dataset.audio)].content.join(" "))));
  bindMcq(items, "listening", 20);
};
const renderMcqSection = (id, copy, items) => { mockWork.innerHTML = `${sectionHead(id, copy)}${mcqMarkup(items)}`; bindMcq(items, id, sectionMeta[id][1]); };
const renderReading = () => {
  const lessons = mockState.data.reading;
  const items = lessons.flatMap((lesson) => lesson.questions);
  let offset = 0;
  mockWork.innerHTML = `${sectionHead("reading", "先通读两篇完整材料，再完成主旨、细节、论证结构和长句理解题。")}${lessons.map((lesson) => {
    const questions = mcqMarkup(lesson.questions, offset);
    offset += lesson.questions.length;
    return `<section class="reading-passage"><p class="eyebrow">TEXT ${lesson.number}</p><h3>${escapeMock(lesson.contentTitle)}</h3>${lesson.content.map((paragraph) => `<p lang="de">${escapeMock(paragraph)}</p>`).join("")}</section>${questions}`;
  }).join("")}`;
  bindMcq(items, "reading", 20);
};
const renderWriting = () => {
  const prompt = "Schreiben Sie etwa 150 Wörter zum Thema: Sollten Universitäten mehr digitale Lehrveranstaltungen anbieten? Begründen Sie Ihre Meinung und berücksichtigen Sie auch ein Gegenargument.";
  const draft = mockState.answers.writingText || "";
  mockWork.innerHTML = `${sectionHead("writing", "40分钟完成约150词短文。先独立写作，再按五项量表自评，每项3分。")}<div class="mock-audio"><strong>${prompt}</strong></div><textarea class="mock-textarea" id="mock-writing" rows="16" placeholder="在这里完成德语作文">${escapeMock(draft)}</textarea><p class="muted" id="writing-count">${words(draft).length} 词</p><div class="rubric">${["内容完整回应题目并有明确立场", "至少两个理由并包含一个反方观点", "段落和连接词使结构清楚", "动词位置、格与词尾已逐句检查", "约150词，语体和标点得体"].map((text, index) => `<label><input type="checkbox" data-rubric="${index}" ${mockState.answers[`rubric-${index}`] ? "checked" : ""}/> ${text}</label>`).join("")}</div><button class="primary" id="finish-writing" type="button">完成写作自评</button><p class="feedback" id="writing-result"></p>`;
  const area = document.querySelector("#mock-writing");
  area.addEventListener("input", () => { mockState.answers.writingText = area.value; document.querySelector("#writing-count").textContent = `${words(area.value).length} 词`; });
  document.querySelectorAll("[data-rubric]").forEach((box) => box.addEventListener("change", () => { mockState.answers[`rubric-${box.dataset.rubric}`] = box.checked; }));
  document.querySelector("#finish-writing").addEventListener("click", () => {
    const count = words(area.value).length; if (count < 80) { document.querySelector("#writing-result").textContent = "目前不足80词，请先完成一篇完整短文。"; return; }
    const checked = Array.from(document.querySelectorAll("[data-rubric]")).filter((box) => box.checked).length;
    mockState.scores.writing = checked * 3; mockState.done.writing = true; document.querySelector("#writing-result").textContent = `自评分 ${checked * 3}/15。正式使用时仍建议由教师复核。`; renderTabs();
  });
};
const render = () => {
  renderTabs(); if (!mockState.data) return;
  if (mockState.section === "dictation") renderDictation();
  if (mockState.section === "listening") renderListening();
  if (mockState.section === "reading") renderReading();
  if (mockState.section === "language") renderMcqSection("language", "覆盖格、词尾、语序、支配、搭配和语言转换。", mockState.data.language);
  if (mockState.section === "writing") renderWriting();
};

Promise.all([fetch("data/skill-lessons.json").then((r) => r.json()), fetch("data/questions/grammar_mcq.json").then((r) => r.json()), fetch("data/questions/vocab_collocation_mcq.json").then((r) => r.json())]).then(([skills, grammar, vocab]) => {
  const dictationModule = skills.modules.find((m) => m.id === "foundation-dictation");
  const listening = skills.modules.filter((m) => m.id.startsWith("listening-")).flatMap((m) => m.lessons).slice(0, 2);
  const readingExtras = {
    "repair-reading": [
      { id: "extra-1", type: "mcq", prompt: "面向消费者的标识应展示什么？", options: ["企业利润和广告预算", "设备颜色和重量", "可维修性和预计费用", "维修人员的姓名"], answer: 2 },
      { id: "extra-2", type: "mcq", prompt: "独立维修店需要获得什么条件？", options: ["新设备销售许可", "可靠的备件与说明书渠道", "统一的门店装修", "更高的能源消耗"], answer: 1 }
    ],
    "sentence-fields": [
      { id: "extra-1", type: "mcq", prompt: "zwar ... jedoch 在句中表达什么关系？", options: ["时间先后", "目的与结果", "条件与假设", "让步与转折"], answer: 3 },
      { id: "extra-2", type: "mcq", prompt: "die bislang nur in einzelnen Städten erprobte Regelung 指什么？", options: ["此前只在部分城市试行的规定", "已经全国实施的规定", "委员会内部的会议规则", "被立即取消的规定"], answer: 0 }
    ]
  };
  const readingLessons = skills.modules.filter((m) => m.id.startsWith("reading-")).flatMap((m) => m.lessons).slice(0, 2).map((lesson, index) => ({
    ...lesson,
    number: index + 1,
    questions: [...lesson.questions.filter((question) => question.type === "mcq"), ...(readingExtras[lesson.id] || [])].map((question) => ({ ...question, id: `${lesson.id}-${question.id}` }))
  }));
  const evenly = (items, count) => Array.from({ length: count }, (_, i) => items[Math.floor(i * items.length / count)]);
  mockState.data = { dictation: dictationModule.lessons[0], listening, reading: readingLessons, language: [...evenly(grammar.items, 20), ...evenly(vocab.items, 15)] };
  render();
}).catch(() => { mockWork.innerHTML = '<div class="empty">组卷失败，请刷新后重试。</div>'; });

let remaining = 170 * 60, timerId = null;
const showTime = () => { document.querySelector("#timer").textContent = `${String(Math.floor(remaining / 60)).padStart(3, "0")}:${String(remaining % 60).padStart(2, "0")}`; };
document.querySelector("#timer-toggle").addEventListener("click", () => {
  if (timerId) { clearInterval(timerId); timerId = null; document.querySelector("#timer-toggle").textContent = "继续计时"; return; }
  document.querySelector("#timer-toggle").textContent = "暂停";
  timerId = setInterval(() => { remaining = Math.max(0, remaining - 1); showTime(); if (!remaining) clearInterval(timerId); }, 1000);
});
showTime();
document.querySelector("#submit-mock").addEventListener("click", () => {
  const missing = sectionOrder.filter((id) => !mockState.done[id]);
  if (missing.length) { document.querySelector("#mock-feedback").textContent = `还有未完成部分：${missing.map((id) => sectionMeta[id][0]).join("、")}。`; return; }
  const total = Math.round(sectionOrder.reduce((sum, id) => sum + (mockState.scores[id] || 0), 0) * 10) / 10;
  completeSession({ stage: "foundation", kind: "mock", completed: 100, correct: Math.round(total) });
  mockWork.innerHTML = `<section class="diagnostic-result"><p class="eyebrow">综合模拟完成</p><h2>${total} / 100</h2><div class="score-grid">${sectionOrder.map((id) => `<article><span>${sectionMeta[id][0]}</span><strong>${mockState.scores[id] || 0}</strong><small>/ ${sectionMeta[id][1]}</small></article>`).join("")}</div><p>优先复习得分比例最低的部分；听写和写作机器评分只作训练参考。</p><div class="actions"><a class="primary" href="review.html">进入复盘</a><a class="secondary" href="course.html">返回学习路线</a></div></section>`;
  document.querySelector("#submit-mock").hidden = true; tabs.hidden = true; document.querySelector("#mock-feedback").textContent = "";
});
