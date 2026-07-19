const params = new URLSearchParams(location.search);
const kind = params.get("kind") || "daily";
const requestedStage = params.get("stage") || "foundation";
const requestedSlug = params.get("slug");
const lessonPanel = document.querySelector("#lesson-panel");

const setHeadings = (kicker, title, lead) => {
  document.querySelector("#study-kicker").textContent = kicker;
  document.querySelector("#study-title").textContent = title;
  document.querySelector("#study-lead").textContent = lead;
};
const renderStats = () => {
  const state = getState();
  document.querySelector("#total-tasks").textContent = state.completed;
  document.querySelector("#review-count").textContent = state.review.length;
};
const record = (item, correct) => { addResult(item, correct); renderStats(); };
const loadJson = (path) => fetch(path).then((response) => {
  if (!response.ok) throw new Error("资料加载失败");
  return response.json();
});

const renderVocabTheme = (theme) => {
  let index = 0;
  setHeadings("VOCABULARY SPRINT", theme.label, `${theme.usageFocus} 本轮共 ${theme.entries.length} 个词。`);
  const showEntry = () => {
    const entry = theme.entries[index];
    const details = [
      entry.collocation ? `<li><strong>常用搭配</strong><span lang="de">${entry.collocation}</span></li>` : "",
      entry.example ? `<li><strong>原创例句</strong><span lang="de">${entry.example}</span>${entry.translation ? `<br><span class="muted">${entry.translation}</span>` : ""}</li>` : ""
    ].filter(Boolean).join("");
    lessonPanel.innerHTML = `<span class="tag">${index + 1} / ${theme.entries.length}</span>
      <h2 class="word" lang="de">${entry.term}</h2><p class="word-note">${entry.pos} · ${entry.meaning}</p>
      <ul class="details">${details}</ul>
      <div class="exercise"><strong>你对这个词的掌握度？</strong><div class="answers">
      <button class="answer" data-level="hard" type="button">不熟</button><button class="answer" data-level="medium" type="button">一般</button><button class="answer" data-level="easy" type="button">掌握</button></div>
      <p class="feedback" aria-live="polite"></p></div>`;
    lessonPanel.querySelectorAll("button[data-level]").forEach((button) => button.addEventListener("click", () => {
      const mastered = button.dataset.level === "easy";
      record({ id:`vocab-${theme.id}-${entry.term}`, title:entry.term, detail:theme.label, href:`study.html?kind=vocab&slug=${theme.id}` }, mastered);
      button.classList.add(mastered ? "correct" : "wrong");
      lessonPanel.querySelector(".feedback").textContent = mastered ? "已记为掌握。" : "已放进复盘队列。";
      lessonPanel.querySelectorAll("button[data-level]").forEach((item) => item.disabled = true);
      window.setTimeout(() => { index = (index + 1) % theme.entries.length; showEntry(); }, 650);
    }));
  };
  showEntry();
};

const renderGrammarTopic = (topic) => {
  setHeadings("GRAMMAR SPRINT", topic.title, "先理解一条核心规则，再完成一道即时自测。");
  const examples = topic.examples.length ? `<div class="example-list">${topic.examples.map((text) => {
    const [de, note] = text.split("｜"); return `<p><span lang="de">${de}</span><small>${note || ""}</small></p>`;
  }).join("")}</div>` : "";
  lessonPanel.innerHTML = `<span class="tag">语法专题</span><h2>${topic.title}</h2>
    <p class="lead">${topic.rule}</p>${examples}
    <ul class="details"><li><strong>易错提醒</strong>${topic.commonMistake}</li></ul>
    <div class="exercise"><strong>${topic.exercise.question}</strong><div class="answers">${topic.exercise.options.map((option, index) => `<button class="answer" data-index="${index}" type="button">${option}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></div>`;
  lessonPanel.querySelectorAll("button[data-index]").forEach((button) => button.addEventListener("click", () => {
    const correct = Number(button.dataset.index) === topic.exercise.answer;
    lessonPanel.querySelectorAll("button[data-index]").forEach((item) => item.disabled = true);
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) lessonPanel.querySelector(`button[data-index="${topic.exercise.answer}"]`).classList.add("correct");
    lessonPanel.querySelector(".feedback").textContent = topic.exercise.explanation;
    record({ id:`grammar-${topic.id}`, title:topic.title, detail:"语法专题", href:`study.html?kind=grammar&slug=${topic.id}` }, correct);
  }));
};

const start = async () => {
  renderStats();
  try {
    if (kind === "grammar") {
      const data = await loadJson("data/grammar-library.json");
      const topics = data.structure.flatMap((group) => group.topics);
      renderGrammarTopic(topics.find((topic) => topic.id === requestedSlug) || topics[3]);
      return;
    }
    const vocab = await loadJson("data/vocab-library.json");
    const themes = vocab.stages.flatMap((stage) => stage.themes);
    if (kind === "vocab") {
      renderVocabTheme(themes.find((theme) => theme.id === requestedSlug) || themes[0]);
      return;
    }
    const stage = vocab.stages.find((item) => item.id === requestedStage) || vocab.stages[0];
    renderVocabTheme(stage.themes[0]);
    setHeadings("TODAY'S SPRINT", "今日任务", `${stage.label} · ${stage.themes[0].label}，从六个词开始。`);
  } catch {
    lessonPanel.innerHTML = '<div class="empty">学习内容暂时没有加载成功，请刷新页面再试。</div>';
  }
};
start();
