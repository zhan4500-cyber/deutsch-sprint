const libraryType = document.body.dataset.library;
const results = document.querySelector("#library-results");
const searchInput = document.querySelector("#library-search");
const countNumber = document.querySelector("#library-count-number");
const countLabel = document.querySelector("#library-count-label");
let libraryData = null;
let activeStage = "all";

const searchMatches = (values, query) =>
  values.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());

const renderEntry = (entry) => `
  <details class="word-entry">
    <summary>
      <span><strong lang="de">${entry.term}</strong><small>${entry.pos}</small></span>
      <span class="entry-meaning">${entry.meaning}</span>
    </summary>
    <div class="entry-body">
      <p><strong>常用搭配</strong><span lang="de">${entry.collocation}</span></p>
      <p><strong>原创例句</strong><span lang="de">${entry.example}</span><small>${entry.translation}</small></p>
    </div>
  </details>`;

const renderVocab = () => {
  const query = searchInput.value.trim();
  let visibleWords = 0;
  const sections = libraryData.stages
    .filter((stage) => activeStage === "all" || stage.id === activeStage)
    .map((stage) => {
      const themes = stage.themes.map((theme) => {
        const entries = theme.entries.filter((entry) => searchMatches([
          theme.label, theme.usageFocus, entry.term, entry.pos, entry.meaning,
          entry.collocation, entry.example, entry.translation
        ], query));
        return { ...theme, entries };
      }).filter((theme) => theme.entries.length);
      visibleWords += themes.reduce((sum, theme) => sum + theme.entries.length, 0);
      if (!themes.length) return "";
      return `<section class="result-section">
        <div class="result-heading"><h2>${stage.label}</h2><p>${stage.positioning}</p></div>
        <div class="theme-grid">${themes.map((theme) => `
          <article class="theme-card">
            <span class="card-label">主题词包 · ${theme.entries.length} 词</span>
            <h3>${theme.label}</h3><p>${theme.usageFocus}</p>
            <div class="entry-list">${theme.entries.map(renderEntry).join("")}</div>
            <a class="card-link" href="study.html?kind=vocab&amp;slug=${theme.id}">练习这一主题</a>
          </article>`).join("")}</div>
      </section>`;
    }).join("");
  results.innerHTML = sections || '<div class="empty-state">没有找到匹配内容，换一个词试试。</div>';
  countNumber.textContent = visibleWords;
  countLabel.textContent = "个完整词条";
};

const grammarStageMatches = (stage) => activeStage === "all" ||
  (activeStage === "foundation" ? stage.includes("大一大二") : stage.includes("大三大四"));

const renderGrammar = () => {
  const query = searchInput.value.trim();
  let visibleTopics = 0;
  const sections = libraryData.structure.filter((group) => grammarStageMatches(group.stage)).map((group) => {
    const topics = group.topics.filter((topic) => searchMatches([
      group.label, group.stage, topic.title, topic.rule, topic.commonMistake,
      ...topic.unitShape, ...topic.examples, topic.exercise.question,
      ...topic.exercise.options, topic.exercise.explanation
    ], query));
    visibleTopics += topics.length;
    if (!topics.length) return "";
    return `<section class="result-section">
      <div class="result-heading"><h2>${group.label}</h2><p>${group.stage}</p></div>
      <div class="grammar-grid">${topics.map((topic) => `
        <article class="grammar-card">
          <span class="card-label">语法专题</span><h3>${topic.title}</h3>
          <p class="grammar-rule">${topic.rule}</p>
          <div class="example-list">${topic.examples.map((example) => {
            const [de, zh] = example.split("｜");
            return `<p><span lang="de">${de}</span><small>${zh || ""}</small></p>`;
          }).join("")}</div>
          <p class="mistake-note"><strong>易错提醒</strong>${topic.commonMistake}</p>
          <details class="mini-quiz"><summary>做一道自测</summary><p>${topic.exercise.question}</p>
            <ol>${topic.exercise.options.map((option) => `<li>${option}</li>`).join("")}</ol>
            <p class="quiz-answer"><strong>答案</strong>${topic.exercise.options[topic.exercise.answer]}。${topic.exercise.explanation}</p>
          </details>
          <a class="card-link" href="study.html?kind=grammar&amp;slug=${topic.id}">进入互动练习</a>
        </article>`).join("")}</div>
    </section>`;
  }).join("");
  results.innerHTML = sections || '<div class="empty-state">没有找到匹配内容，换一个关键词试试。</div>';
  countNumber.textContent = visibleTopics;
  countLabel.textContent = "个完整专题";
};

const render = () => libraryType === "vocab" ? renderVocab() : renderGrammar();
document.querySelectorAll(".stage-filter").forEach((button) => button.addEventListener("click", () => {
  activeStage = button.dataset.stage;
  document.querySelectorAll(".stage-filter").forEach((item) => {
    const selected = item === button;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  render();
}));
searchInput.addEventListener("input", render);

fetch(`data/${libraryType}-library.json`).then((response) => {
  if (!response.ok) throw new Error("Library data could not be loaded.");
  return response.json();
}).then((data) => { libraryData = data; render(); }).catch(() => {
  results.innerHTML = '<div class="empty-state">资料暂时没有加载成功，请稍后刷新。</div>';
});