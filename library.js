const libraryType = document.body.dataset.library;
const results = document.querySelector("#library-results");
const searchInput = document.querySelector("#library-search");
const countNumber = document.querySelector("#library-count-number");
const countLabel = document.querySelector("#library-count-label");
let libraryData = null;
let activeStage = "all";
let visiblePacks = new Map();

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const searchMatches = (values, query) =>
  values.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());

const renderEntry = (entry) => {
  const details = [
    entry.cia ? `<p><strong>C-I-A 词头</strong><span lang="de">${escapeHtml(entry.cia.title)}</span><small>${escapeHtml(entry.cia.ipa || "IPA 待人工核对")}</small></p>` : "",
    entry.usagePattern ? `<p><strong>常用搭配</strong><span lang="de">${escapeHtml(entry.usagePattern)}</span></p>` : "",
    entry.example ? `<p><strong>${entry.exampleSource === "original_curated" ? "原创例句" : "学习例句"}</strong><span lang="de">${escapeHtml(entry.example)}</span>${entry.exampleTranslation ? `<small>${escapeHtml(entry.exampleTranslation)}</small>` : ""}</p>` : "",
    `<a class="entry-cia-link" href="study.html?kind=vocab&amp;stage=${entry.stage}&amp;word=${encodeURIComponent(entry.id)}">进入 C-I-A 主动回忆</a>`
  ].filter(Boolean).join("");
  return `
  <details class="word-entry">
    <summary>
      <span><strong lang="de">${escapeHtml(entry.article ? `${entry.article} ${entry.term.replace(/^(der|die|das)\s+/i, "")}` : entry.term)}</strong><small>${escapeHtml(entry.pos)} · ${escapeHtml(entry.cefr)}</small></span>
      <span class="entry-meaning">${escapeHtml(entry.meaning)}</span>
    </summary>
    <div class="entry-body">${details}</div>
  </details>`;
};

const BOOKS = {
  1: { title: "第一册", subtitle: "入门、校园与基础日常", stage: "foundation" },
  2: { title: "第二册", subtitle: "日常表达与基础能力扩展", stage: "foundation" },
  3: { title: "第三册", subtitle: "叙述、讨论与书面表达", stage: "advanced" },
  4: { title: "第四册", subtitle: "学术、社会与高阶语篇", stage: "advanced" },
  5: { title: "能力补充", subtitle: "高频词、跨主题搭配与迁移表达", stage: "mixed" }
};

const lessonOrder = (lesson) => lesson === "SUP" ? 999 : (lesson.startsWith("V") ? Number(lesson.slice(1)) : 20 + Number(lesson.slice(1)));
const lessonLabel = (lesson) => lesson === "SUP" ? "跨册补充" : lesson.startsWith("V") ? `预备教程 ${Number(lesson.slice(1))}` : `第 ${Number(lesson.slice(1))} 课`;

const renderPackEntries = (packId) => {
  const pack = visiblePacks.get(packId);
  return pack ? pack.entries.map(renderEntry).join("") : "";
};

const bindPackExpansion = () => {
  results.querySelectorAll("details.word-pack").forEach((details) => details.addEventListener("toggle", () => {
    if (!details.open) return;
    const list = details.querySelector(".entry-list");
    if (list.dataset.loaded === "true") return;
    list.innerHTML = renderPackEntries(details.dataset.pack);
    list.dataset.loaded = "true";
  }));
};

const renderVocab = () => {
  const query = searchInput.value.trim();
  const stageItems = libraryData.items.filter((entry) => activeStage === "all" || entry.stage === activeStage);
  const matchedItems = stageItems.filter((entry) => !query || searchMatches([
    entry.term, entry.pos, entry.meaning, entry.englishGloss, entry.usagePattern,
    entry.example, entry.exampleTranslation, entry.cia?.title
  ], query));
  const books = new Map();
  matchedItems.forEach((entry) => {
    const sources = entry.bookSources?.length ? entry.bookSources : [{ book: 5, lesson: "SUP" }];
    sources.forEach((source) => {
      const book = Number(source.book) || 5;
      if (!books.has(book)) books.set(book, new Map());
      const lesson = source.lesson || "SUP";
      if (!books.get(book).has(lesson)) books.get(book).set(lesson, []);
      books.get(book).get(lesson).push(entry);
    });
  });
  visiblePacks = new Map();
  const sections = [...books.entries()].sort(([a], [b]) => a - b).map(([bookNumber, lessons]) => {
    const book = BOOKS[bookNumber] || BOOKS[5];
    const packs = [...lessons.entries()].sort(([a], [b]) => lessonOrder(a) - lessonOrder(b));
    const uniqueCount = new Set(packs.flatMap(([, entries]) => entries.map((entry) => entry.id))).size;
    const packHtml = packs.map(([lesson, entries]) => {
      const packId = `B${bookNumber}-${lesson}`;
      const sorted = entries.slice().sort((a, b) => a.stageRank - b.stageRank);
      visiblePacks.set(packId, { entries: sorted });
      const packStage = sorted[0]?.stage || book.stage;
      const eager = Boolean(query);
      return `<details class="theme-card word-pack" data-pack="${packId}"${eager ? " open" : ""}>
        <summary><span><span class="card-label">${escapeHtml(packId)} · ${sorted.length} 词</span><strong>${lessonLabel(lesson)}</strong></span><span class="pack-chevron" aria-hidden="true"></span></summary>
        <div class="pack-actions"><span>按教材课次整理，例句为本站原创或开放来源。</span><a class="card-link" href="study.html?kind=vocab&amp;stage=${packStage}&amp;pack=${packId}">练习这一课</a></div>
        <div class="entry-list" data-loaded="${eager}">${eager ? sorted.map(renderEntry).join("") : ""}</div>
      </details>`;
    }).join("");
    return `<details class="result-section book-section"${query ? " open" : ""}>
      <summary class="result-heading"><span><span class="card-label">TEXTBOOK ${String(bookNumber).padStart(2, "0")}</span><h2>${book.title}</h2></span><span class="book-meta"><strong>${uniqueCount}</strong> 词 · ${packs.length} 个词包<small>${book.subtitle}</small></span></summary>
      <div class="theme-grid">${packHtml}</div>
    </details>`;
  }).join("");
  results.innerHTML = sections || '<div class="empty-state">没有找到匹配内容，换一个词试试。</div>';
  countNumber.textContent = matchedItems.length.toLocaleString();
  countLabel.textContent = query ? "个匹配词条" : "张完整词卡";
  bindPackExpansion();
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

const libraryPath = libraryType === "vocab" ? "data/vocab-index.json" : `data/${libraryType}-library.json`;
const libraryRequest = fetch(libraryPath).then((response) => {
  if (!response.ok) throw new Error("Library data could not be loaded.");
  return response.json();
});
Promise.all([libraryRequest]).then(([data]) => {
  libraryData = data;
  render();
}).catch(() => {
  results.innerHTML = '<div class="empty-state">资料暂时没有加载成功，请稍后刷新。</div>';
});
