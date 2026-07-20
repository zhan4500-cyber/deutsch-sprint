const skillParams = new URLSearchParams(location.search);
const requestedSkill = skillParams.get("id") || "listening-news";
const skillContent = document.querySelector("#skill-content");
let lessonData = null;
let lessonIndex = 0;
let answered = 0;
let correct = 0;

const skillEscape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const currentLesson = () => lessonData.lessons[lessonIndex];
const updateSkillStep = () => { document.querySelector("#skill-step").textContent = `${answered} / ${currentLesson().questions.length}`; };

const speakText = (rate = 0.88) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentLesson().content.join(" "));
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const germanVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("de"));
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
};

const recordSkillAnswer = (question, isCorrect) => {
  addResult({ id: `skill-${currentLesson().id}-${question.id}`, title: question.prompt, detail: `能力 · ${lessonData.title}`, href: `skill.html?id=${lessonData.id}`, stage: "advanced", kind: "skill" }, isCorrect);
  answered += 1;
  if (isCorrect) correct += 1;
  updateSkillStep();
};

const questionMarkup = (question, index) => {
  if (question.type === "mcq") return `<article class="question-block" data-question="${question.id}"><h3>${index + 1}. ${skillEscape(question.prompt)}</h3><div class="choice-list">${question.options.map((option, optionIndex) => `<button class="choice" data-option="${optionIndex}" type="button">${skillEscape(option)}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></article>`;
  return `<article class="question-block" data-question="${question.id}"><h3>${index + 1}. ${skillEscape(question.prompt)}</h3><textarea class="open-answer" aria-label="开放题回答"></textarea><button class="secondary" data-show-model type="button">查看参考表达</button><div class="model-answer" hidden><strong>参考表达</strong><p lang="de">${skillEscape(question.modelAnswer)}</p><small>${skillEscape(question.checklist.join(" · "))}</small></div><div class="answers self-check" hidden><button class="answer" data-self="correct" type="button">我的表达达到要求</button><button class="answer" data-self="wrong" type="button">需要继续修改</button></div></article>`;
};

const bindQuestions = () => {
  document.querySelectorAll("[data-question]").forEach((block) => {
    const question = currentLesson().questions.find((item) => item.id === block.dataset.question);
    if (question.type === "mcq") {
      block.querySelectorAll("button[data-option]").forEach((button) => button.addEventListener("click", () => {
        if (block.dataset.done) return;
        block.dataset.done = "true";
        const choice = Number(button.dataset.option);
        const isCorrect = choice === question.answer;
        block.querySelectorAll("button[data-option]").forEach((item) => { item.disabled = true; });
        button.classList.add(isCorrect ? "correct" : "wrong");
        if (!isCorrect) block.querySelector(`[data-option="${question.answer}"]`).classList.add("correct");
        block.querySelector(".feedback").textContent = question.explanation;
        recordSkillAnswer(question, isCorrect);
      }));
    } else {
      block.querySelector("[data-show-model]").addEventListener("click", () => {
        block.querySelector(".model-answer").hidden = false;
        block.querySelector("[data-show-model]").hidden = true;
        block.querySelector(".self-check").hidden = false;
      });
      block.querySelectorAll("[data-self]").forEach((button) => button.addEventListener("click", () => {
        if (block.dataset.done) return;
        block.dataset.done = "true";
        block.querySelectorAll("[data-self]").forEach((item) => { item.disabled = true; });
        const isCorrect = button.dataset.self === "correct";
        button.classList.add(isCorrect ? "correct" : "wrong");
        recordSkillAnswer(question, isCorrect);
      }));
    }
  });
  document.querySelector("#finish-lesson").addEventListener("click", () => {
    if (answered < currentLesson().questions.length) {
      document.querySelector("#lesson-feedback").textContent = "请先完成全部题目。开放题需要查看参考表达并进行自评。";
      return;
    }
    completeSession({ stage: "advanced", kind: "skill", completed: answered, correct });
    renderResult();
  });
  document.querySelector("#play-normal")?.addEventListener("click", () => speakText(.9));
  document.querySelector("#play-slow")?.addEventListener("click", () => speakText(.72));
  document.querySelector("#show-transcript")?.addEventListener("click", () => {
    document.querySelector("#transcript").hidden = false;
    document.querySelector("#show-transcript").hidden = true;
  });
};

const renderLesson = () => {
  const lesson = currentLesson();
  answered = 0;
  correct = 0;
  document.title = `${lesson.title} | Deutsch Sprint`;
  document.querySelector("#skill-meta").textContent = `${lessonData.skill} · ${lesson.level} · 约 ${lesson.duration} 分钟`;
  document.querySelector("#skill-title").textContent = lesson.title;
  document.querySelector("#skill-lead").textContent = lesson.objective;
  updateSkillStep();
  const text = `<div class="lesson-text" id="transcript"${lesson.mode === "listening" ? " hidden" : ""}>${lesson.content.map((paragraph) => `<p lang="${lesson.contentLang || "de"}">${skillEscape(paragraph)}</p>`).join("")}</div>`;
  const listening = lesson.mode === "listening" ? `<div class="audio-controls"><button class="primary" id="play-normal" type="button">播放德语</button><button class="secondary" id="play-slow" type="button">慢速播放</button><button class="secondary" id="show-transcript" type="button">显示原文</button></div><div class="transcript-cover">建议先听两遍并完成题目，再查看原文。</div>` : "";
  skillContent.innerHTML = `<div class="lesson-layout"><article class="lesson-copy"><p class="eyebrow">ORIGINAL MATERIAL</p><h2>${skillEscape(lesson.contentTitle)}</h2>${listening}${text}<p class="lesson-summary"><strong>内容提示</strong><br>${skillEscape(lesson.summary)}</p><div class="glossary">${lesson.glossary.map(([term, meaning]) => `<div><strong lang="de">${skillEscape(term)}</strong><small>${skillEscape(meaning)}</small></div>`).join("")}</div></article><aside class="lesson-questions"><p class="eyebrow">TASKS</p><h2>完成本课训练</h2>${lesson.questions.map(questionMarkup).join("")}<button class="primary" id="finish-lesson" type="button">完成课程</button><p class="feedback" id="lesson-feedback" aria-live="polite"></p></aside></div>`;
  bindQuestions();
};

const renderResult = () => {
  const lesson = currentLesson();
  const hasNext = lessonIndex + 1 < lessonData.lessons.length;
  skillContent.innerHTML = `<section class="lesson-result"><span class="tag">课程完成</span><h2>${correct} / ${answered} 项达到要求</h2><p>${skillEscape(lesson.takeaway)}</p><div class="actions">${hasNext ? '<button class="primary" id="next-lesson" type="button">下一课</button>' : '<a class="primary" href="skills.html">选择其他模块</a>'}<a class="secondary" href="review.html">查看复盘</a></div></section>`;
  if (hasNext) document.querySelector("#next-lesson").addEventListener("click", () => { lessonIndex += 1; renderLesson(); });
};

fetch("data/skill-lessons.json").then((response) => {
  if (!response.ok) throw new Error();
  return response.json();
}).then((data) => {
  lessonData = data.modules.find((module) => module.id === requestedSkill) || data.modules[0];
  renderLesson();
}).catch(() => { skillContent.innerHTML = '<div class="empty">课程暂时没有加载成功，请刷新页面再试。</div>'; });
