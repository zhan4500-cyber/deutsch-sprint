const manifestPaths = {
  foundation: "data/questions/manifest.json",
  advanced: "data/questions-advanced/manifest.json"
};
const stageDefaults = { foundation: "grammar_mcq", advanced: "advanced_grammar" };
const stageCopy = {
  foundation: {
    eyebrow: "大一大二阶段",
    description: "巩固核心语法、常用搭配、填空、改写、改错与基础篇章能力。",
    quality: "题干、选项、语篇、答案与解析为原创模板内容，不含历年试题原文。基础题库已完成数量、字段和答案归属检查；尚未逐题完成德语教师审核。"
  },
  advanced: {
    eyebrow: "大三大四阶段",
    description: "训练复杂句法、学术词汇、篇章阅读、德语区文化、双向翻译与论证写作。",
    quality: "高阶题库依据公开能力框架原创生成，不复制真题、教材例句或付费资料。已完成数量、字段、选项答案、语篇关联和重复 ID 检查；尚未逐题完成德语教师审核，也不作为官方模拟题。"
  }
};
const params = new URLSearchParams(location.search);
const setupPanel = document.querySelector("#setup-panel");
const practiceRun = document.querySelector("#practice-run");
const questionStage = document.querySelector("#question-stage");
const moduleOptions = document.querySelector("#module-options");
const startButton = document.querySelector("#start-practice");
const selectionSummary = document.querySelector("#selection-summary");
const stageOptions = document.querySelector("#stage-options");
const stageEyebrow = document.querySelector("#stage-eyebrow");
const stageDescription = document.querySelector("#stage-description");
const qualityCopy = document.querySelector("#quality-copy");

let manifest;
let selectedStage = Object.hasOwn(manifestPaths, params.get("stage")) ? params.get("stage") : "foundation";
let selectedModule = params.get("module") || stageDefaults[selectedStage];
let selectedDifficulty = "all";
let selectedCount = 10;
let session = [];
let sessionIndex = 0;
let sessionCorrect = 0;
let selectedAnswer = "";
let passageMap = new Map();

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[character]);

const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const normalizeAnswer = (value) => String(value || "")
  .trim().toLocaleLowerCase("de-DE")
  .replace(/[.!?。！？]+$/g, "")
  .replace(/\s+/g, " ");

const currentModule = () => manifest.modules.find((item) => item.id === selectedModule) || manifest.modules[0];

const updateSummary = () => {
  if (!manifest) return;
  const module = currentModule();
  const difficulty = selectedDifficulty === "all" ? "全部难度" : `难度 ${selectedDifficulty}`;
  selectionSummary.textContent = `${module.label} · ${difficulty} · ${selectedCount} 题`;
};

const renderModules = () => {
  moduleOptions.innerHTML = manifest.modules.map((module) => `
    <button class="module-option${module.id === selectedModule ? " selected" : ""}" type="button" data-module="${module.id}">
      <strong>${module.label}</strong><span>${module.count.toLocaleString("zh-CN")} 题</span>
    </button>`).join("");
  moduleOptions.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    selectedModule = button.dataset.module;
    params.set("module", selectedModule);
    history.replaceState(null, "", `${location.pathname}?${params}`);
    moduleOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
    updateSummary();
  }));
};

const bindSegment = (selector, onChange) => {
  document.querySelector(selector).querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
    onChange(button.dataset.value);
    updateSummary();
  }));
};

const matchesDifficulty = (item) => {
  if (selectedDifficulty === "all") return true;
  if (selectedDifficulty === "1-2") return item.difficulty <= 2;
  if (selectedDifficulty === "4-5") return item.difficulty >= 4;
  return item.difficulty === Number(selectedDifficulty);
};

const renderPassage = (passage, blankNo) => {
  if (!passage) return "";
  const body = passage.text.split(/(\[\[\d+\]\])/g).map((part) => {
    const match = part.match(/^\[\[(\d+)\]\]$/);
    if (!match) return escapeHtml(part);
    const number = Number(match[1]);
    return `<span class="passage-blank${number === blankNo ? " current" : ""}">${number}</span>`;
  }).join("");
  return `<section class="passage"><h2>${escapeHtml(passage.title)}</h2><p lang="de">${body}</p></section>`;
};

const answerInput = (item) => {
  if (item.type === "mcq") {
    return `<div class="choice-list">${item.options.map((option, index) => `
      <button class="choice" type="button" data-answer="${escapeHtml(option)}"><b>${String.fromCharCode(65 + index)}</b><span lang="de">${escapeHtml(option)}</span></button>`).join("")}</div>`;
  }
  const longAnswer = item.type === "transformation" || item.type === "error_correction";
  return `${longAnswer ? "<textarea" : "<input"} class="response-field" id="response-field" ${longAnswer ? 'rows="4"' : 'type="text"'} autocomplete="off" spellcheck="false" placeholder="在这里输入你的答案"${longAnswer ? "></textarea>" : " />"}`;
};

const renderQuestion = () => {
  const item = session[sessionIndex];
  const module = currentModule();
  const passage = item.passageId ? passageMap.get(item.passageId) : null;
  selectedAnswer = "";
  document.querySelector("#run-label").textContent = `${sessionIndex + 1} / ${session.length}`;
  document.querySelector("#run-score").textContent = `${sessionCorrect} 正确`;
  document.querySelector("#progress-fill").style.width = `${(sessionIndex / session.length) * 100}%`;
  questionStage.innerHTML = `<article class="question-card">
    <div class="question-main">
      ${renderPassage(passage, item.blankNo)}
      <div class="question-meta"><span>${escapeHtml(module.label)}</span><span>难度 ${item.difficulty}</span></div>
      <h2 class="question-prompt" lang="de">${escapeHtml(item.prompt)}</h2>
      ${answerInput(item)}
      <div class="question-actions"><button class="primary" id="submit-answer" type="button">提交答案</button><button class="secondary" id="skip-question" type="button">暂时不会</button></div>
      <div id="answer-feedback" aria-live="polite"></div>
    </div>
    <aside class="question-side"><div class="side-block"><span>考点</span><strong>${escapeHtml(item.subtopic)}</strong></div><div class="side-block"><span>本轮进度</span><strong>${sessionIndex + 1} / ${session.length}</strong></div></aside>
  </article>`;

  questionStage.querySelectorAll(".choice").forEach((button) => button.addEventListener("click", () => {
    if (button.disabled) return;
    selectedAnswer = button.dataset.answer;
    questionStage.querySelectorAll(".choice").forEach((choice) => choice.classList.toggle("selected", choice === button));
  }));
  const field = document.querySelector("#response-field");
  if (field) {
    field.focus();
    field.addEventListener("input", () => { selectedAnswer = field.value; });
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && item.type !== "transformation" && item.type !== "error_correction") {
        event.preventDefault(); submitAnswer(false);
      }
    });
  }
  document.querySelector("#submit-answer").addEventListener("click", () => submitAnswer(false));
  document.querySelector("#skip-question").addEventListener("click", () => submitAnswer(true));
};

const reviewItem = (item) => ({
  id: `question-${item.id}`,
  title: item.prompt.length > 72 ? `${item.prompt.slice(0, 72)}...` : item.prompt,
  detail: `练习 · ${currentModule().label} · ${item.subtopic}`,
  href: `practice.html?stage=${selectedStage}&module=${item.module}&review=${item.id}`
});

const lockQuestion = () => {
  questionStage.querySelectorAll("button, input, textarea").forEach((control) => { control.disabled = true; });
};

const showResolvedFeedback = (item, correct, skipped = false) => {
  if (correct) sessionCorrect += 1;
  addResult(reviewItem(item), correct);
  lockQuestion();
  if (item.type === "mcq") {
    questionStage.querySelectorAll(".choice").forEach((choice) => {
      if (choice.dataset.answer === item.answer) choice.classList.add("correct");
      else if (choice.dataset.answer === selectedAnswer) choice.classList.add("wrong");
    });
  }
  const feedback = document.querySelector("#answer-feedback");
  feedback.innerHTML = `<div class="feedback-panel${correct ? " correct" : ""}"><h3>${correct ? "回答正确" : skipped ? "已放入复盘" : "这题需要再看一次"}</h3><p>参考答案：<span class="model-answer" lang="de">${escapeHtml(item.answer)}</span></p><p>${escapeHtml(item.explanation)}</p></div><div class="question-actions"><button class="primary" id="next-question" type="button">${sessionIndex + 1 === session.length ? "查看结果" : "下一题"}</button></div>`;
  document.querySelector("#next-question").addEventListener("click", nextQuestion);
  document.querySelector("#run-score").textContent = `${sessionCorrect} 正确`;
};

const submitAnswer = (skipped) => {
  const item = session[sessionIndex];
  if (!skipped && !String(selectedAnswer).trim()) {
    document.querySelector("#answer-feedback").innerHTML = '<p class="feedback">请先选择或填写答案。</p>';
    return;
  }
  const needsSelfCheck = item.type === "transformation" || item.type === "error_correction";
  if (needsSelfCheck && !skipped) {
    lockQuestion();
    const exact = [item.answer, ...item.acceptableAnswers].some((answer) => normalizeAnswer(answer) === normalizeAnswer(selectedAnswer));
    document.querySelector("#answer-feedback").innerHTML = `<div class="feedback-panel${exact ? " correct" : ""}"><h3>${exact ? "与参考答案一致" : "请对照参考答案"}</h3><p>你的答案：<span lang="de">${escapeHtml(selectedAnswer)}</span></p><p>参考答案：<span class="model-answer" lang="de">${escapeHtml(item.answer)}</span></p><p>${escapeHtml(item.explanation)}</p><div class="self-check"><button class="primary" data-self="correct" type="button">我的表达可以接受</button><button class="secondary" data-self="wrong" type="button">需要加入复盘</button></div></div>`;
    document.querySelectorAll("button[data-self]").forEach((button) => button.addEventListener("click", () => showResolvedFeedback(item, button.dataset.self === "correct")));
    return;
  }
  const correct = !skipped && [item.answer, ...item.acceptableAnswers].some((answer) => normalizeAnswer(answer) === normalizeAnswer(selectedAnswer));
  showResolvedFeedback(item, correct, skipped);
};

const nextQuestion = () => {
  sessionIndex += 1;
  if (sessionIndex >= session.length) { renderResult(); return; }
  renderQuestion();
};

const renderResult = () => {
  document.querySelector("#progress-fill").style.width = "100%";
  const accuracy = Math.round((sessionCorrect / session.length) * 100);
  questionStage.innerHTML = `<section class="session-result"><strong>${accuracy}%</strong><h2>本轮完成</h2><p>答对 ${sessionCorrect} 题，需要复盘 ${session.length - sessionCorrect} 题。</p><div class="actions"><button class="primary" id="restart-session" type="button">再来一组</button><a class="secondary" href="review.html">查看复盘</a></div></section>`;
  document.querySelector("#restart-session").addEventListener("click", startPractice);
};

const startPractice = async () => {
  startButton.disabled = true;
  startButton.textContent = "正在组题";
  try {
    const module = currentModule();
    const data = await fetch(module.path).then((response) => {
      if (!response.ok) throw new Error("题库加载失败");
      return response.json();
    });
    const reviewId = params.get("review");
    if (reviewId) {
      const target = data.items.find((item) => item.id === reviewId);
      session = target ? [target] : [];
    } else {
      session = shuffle(data.items.filter(matchesDifficulty)).slice(0, selectedCount);
    }
    if (!session.length) throw new Error("没有找到符合条件的题目");
    if (session.some((item) => item.passageId)) {
      const passageData = await fetch(manifest.passagesPath || "data/questions/passages.json").then((response) => response.json());
      passageMap = new Map(passageData.passages.map((item) => [item.id, item]));
    }
    sessionIndex = 0;
    sessionCorrect = 0;
    setupPanel.hidden = true;
    practiceRun.hidden = false;
    window.scrollTo({ top: practiceRun.offsetTop - 24, behavior: "smooth" });
    renderQuestion();
  } catch (error) {
    selectionSummary.textContent = error.message || "题库暂时没有加载成功，请刷新后重试。";
  } finally {
    startButton.disabled = false;
    startButton.textContent = "开始练习";
  }
};

const exitPractice = () => {
  practiceRun.hidden = true;
  setupPanel.hidden = false;
  params.delete("review");
  history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}`);
  window.scrollTo({ top: setupPanel.offsetTop - 24, behavior: "smooth" });
};

const loadStage = async (stage, updateUrl = true) => {
  startButton.disabled = true;
  selectionSummary.textContent = "正在读取题库目录...";
  const response = await fetch(manifestPaths[stage]);
  if (!response.ok) throw new Error("题库目录加载失败");
  manifest = await response.json();
  selectedStage = stage;
  if (!manifest.modules.some((item) => item.id === selectedModule)) selectedModule = manifest.modules[0].id;
  stageOptions.querySelectorAll("button").forEach((button) => button.classList.toggle("selected", button.dataset.stage === stage));
  stageEyebrow.textContent = stageCopy[stage].eyebrow;
  stageDescription.textContent = stageCopy[stage].description;
  qualityCopy.textContent = stageCopy[stage].quality;
  document.querySelector("#bank-total").textContent = manifest.total.toLocaleString("zh-CN");
  renderModules();
  updateSummary();
  startButton.disabled = false;
  if (updateUrl) {
    params.set("stage", stage);
    params.set("module", selectedModule);
    params.delete("review");
    history.replaceState(null, "", `${location.pathname}?${params}`);
  }
};

const initialize = async () => {
  try {
    bindSegment("#difficulty-options", (value) => { selectedDifficulty = value; });
    bindSegment("#count-options", (value) => { selectedCount = Number(value); });
    stageOptions.querySelectorAll("button").forEach((button) => button.addEventListener("click", async () => {
      if (button.dataset.stage === selectedStage) return;
      try { await loadStage(button.dataset.stage); } catch (error) { selectionSummary.textContent = error.message; }
    }));
    await loadStage(selectedStage, false);
    if (params.get("review")) startPractice();
  } catch (error) {
    selectionSummary.textContent = error.message;
  }
};

startButton.addEventListener("click", startPractice);
document.querySelector("#exit-practice").addEventListener("click", exitPractice);
initialize();
