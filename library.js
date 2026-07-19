const libraryType = document.body.dataset.library;
const results = document.querySelector("#library-results");
const searchInput = document.querySelector("#library-search");
const countNumber = document.querySelector("#library-count-number");
const countLabel = document.querySelector("#library-count-label");
let libraryData = null;
let activeStage = "all";

const matchesSearch = (values, query) =>
  values.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());

const renderVocab = () => {
  const query = searchInput.value.trim();
  let visibleWords = 0;
  const sections = libraryData.stages
    .filter((stage) => activeStage === "all" || stage.id === activeStage)
    .map((stage) => {
      const themes = stage.themes.filter((theme) =>
        matchesSearch([theme.label, theme.usageFocus, ...theme.sampleWords], query)
      );
      visibleWords += themes.reduce((sum, theme) => sum + theme.sampleWords.length, 0);
      if (!themes.length) return "";
      return `
        <section class="result-section">
          <div class="result-heading">
            <h2>${stage.label}</h2>
            <p>${stage.positioning}</p>
          </div>
          <div class="theme-grid">
            ${themes.map((theme) => `
              <article class="theme-card">
                <span class="card-label">主题词包</span>
                <h3>${theme.label}</h3>
                <p>${theme.usageFocus}</p>
                <ul class="word-list">
                  ${theme.sampleWords.map((word) => `<li lang="de">${word}</li>`).join("")}
                </ul>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");

  results.innerHTML = sections || '<div class="empty-state">没有找到匹配内容，换个词试试。</div>';
  countNumber.textContent = visibleWords;
  countLabel.textContent = "个首批词条";
};

const grammarStageMatches = (stage) => {
  if (activeStage === "all") return true;
  if (activeStage === "foundation") return stage.includes("大一大二");
  return stage.includes("大三大四");
};

const renderGrammar = () => {
  const query = searchInput.value.trim();
  let visibleTopics = 0;
  const sections = libraryData.structure
    .filter((group) => grammarStageMatches(group.stage))
    .map((group) => {
      const topics = group.topics.filter((topic) =>
        matchesSearch([group.label, group.stage, topic.title, topic.commonMistake, ...topic.unitShape], query)
      );
      visibleTopics += topics.length;
      if (!topics.length) return "";
      return `
        <section class="result-section">
          <div class="result-heading">
            <h2>${group.label}</h2>
            <p>${group.stage}</p>
          </div>
          <div class="grammar-grid">
            ${topics.map((topic) => `
              <article class="grammar-card">
                <span class="card-label">语法专题</span>
                <h3>${topic.title}</h3>
                <ul class="unit-list">
                  ${topic.unitShape.map((unit) => `<li>${unit}</li>`).join("")}
                </ul>
                <p class="mistake-note"><strong>易错提醒：</strong>${topic.commonMistake}</p>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");

  results.innerHTML = sections || '<div class="empty-state">没有找到匹配内容，换个关键词试试。</div>';
  countNumber.textContent = visibleTopics;
  countLabel.textContent = "个首批专题";
};

const render = () => libraryType === "vocab" ? renderVocab() : renderGrammar();

document.querySelectorAll(".stage-filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeStage = button.dataset.stage;
    document.querySelectorAll(".stage-filter").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    render();
  });
});

searchInput.addEventListener("input", render);

fetch(`data/${libraryType}-library.json`)
  .then((response) => {
    if (!response.ok) throw new Error("Library data could not be loaded.");
    return response.json();
  })
  .then((data) => {
    libraryData = data;
    render();
  })
  .catch(() => {
    results.innerHTML = '<div class="empty-state">资料暂时没有加载成功，请稍后刷新。</div>';
  });

