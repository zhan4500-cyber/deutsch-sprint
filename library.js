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

const STAGES = {
  foundation: { title: "大一大二", subtitle: "从日常开口到校园学习，建立稳定的基础表达" },
  advanced: { title: "大三大四", subtitle: "从复杂叙述到观点论证，提升书面与专业表达" }
};
const DOMAINS = {
  communication: { label: "沟通与信息", description: "问答、说明、电话、邮件和信息传递" },
  campus: { label: "校园与学习", description: "课堂、课程、作业、考试与大学生活" },
  nouns: { label: "名词与词形", description: "连同冠词、复数和常用搭配一起掌握" },
  verbs: { label: "动词与配价", description: "结合变位、格支配和固定结构主动回忆" },
  descriptive: { label: "描述与修饰", description: "形容词、副词、程度和状态表达" },
  chunks: { label: "固定搭配", description: "把多词表达作为完整口语块记忆" },
  daily: { label: "日常核心", description: "高频动作、状态、时间与生活表达" },
  travel: { label: "出行与方位", description: "交通、路线、地点和旅行场景" },
  food: { label: "饮食与点单", description: "食物、餐厅、口味和点单交流" },
  consumer: { label: "消费与服务", description: "购物、价格、付款与公共服务" },
  people: { label: "人际与情感", description: "朋友、家庭、关系和感受表达" },
  work: { label: "工作与职业", description: "申请、职场、任务与职业发展" },
  society: { label: "社会与文化", description: "社会、经济、文化、环境和公共议题" },
  argument: { label: "观点与论证", description: "原因、结果、比较、立场和逻辑组织" },
  structure: { label: "句子工具", description: "介词、代词、连接词和结构性高频词" }
};
const PACK_SIZE = 60;

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
  const stages = new Map();
  matchedItems.forEach((entry) => {
    const stage = entry.stage === "advanced" ? "advanced" : "foundation";
    const domain = entry.learningDomain || "daily";
    if (!stages.has(stage)) stages.set(stage, new Map());
    if (!stages.get(stage).has(domain)) stages.get(stage).set(domain, []);
    stages.get(stage).get(domain).push(entry);
  });
  visiblePacks = new Map();
  const sections = ["foundation", "advanced"].filter((stage) => stages.has(stage)).map((stageId) => {
    const stage = STAGES[stageId];
    const domains = stages.get(stageId);
    let packCount = 0;
    const packHtml = Object.keys(DOMAINS).filter((domain) => domains.has(domain)).map((domain) => {
      const domainInfo = DOMAINS[domain];
      const sorted = domains.get(domain).slice().sort((a, b) => a.stageRank - b.stageRank);
      const chunks = Array.from({ length: Math.ceil(sorted.length / PACK_SIZE) }, (_, index) => sorted.slice(index * PACK_SIZE, (index + 1) * PACK_SIZE));
      return chunks.map((entries, index) => {
        packCount += 1;
        const packId = `${stageId}-${domain}-${index + 1}`;
        visiblePacks.set(packId, { entries });
        const eager = Boolean(query);
        return `<details class="theme-card word-pack" data-pack="${packId}"${eager ? " open" : ""}>
          <summary><span><span class="card-label">${stage.title} · ${String(index + 1).padStart(2, "0")} · ${entries.length} 词</span><strong>${domainInfo.label}</strong></span><span class="pack-chevron" aria-hidden="true"></span></summary>
          <div class="pack-actions"><span>${domainInfo.description}</span><a class="card-link" href="study.html?kind=vocab&amp;stage=${stageId}&amp;pack=${packId}">练习这一包</a></div>
          <div class="entry-list" data-loaded="${eager}">${eager ? entries.map(renderEntry).join("") : ""}</div>
        </details>`;
      }).join("");
    }).join("");
    return `<details class="result-section stage-section"${query || activeStage === stageId ? " open" : ""}>
      <summary class="result-heading"><span><span class="card-label">LEARNING STAGE</span><h2>${stage.title}</h2></span><span class="stage-meta"><strong>${matchedItems.filter((entry) => entry.stage === stageId).length}</strong> 词 · ${packCount} 个能力词包<small>${stage.subtitle}</small></span></summary>
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
