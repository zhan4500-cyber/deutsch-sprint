const PAGE_SIZE = 50;
const results = document.querySelector("#lexicon-results");
const searchInput = document.querySelector("#lexicon-search");
const cefrFilter = document.querySelector("#cefr-filter");
const matchCount = document.querySelector("#match-count");
const pageLabel = document.querySelector("#page-label");
const pageNumber = document.querySelector("#page-number");
const previousPage = document.querySelector("#previous-page");
const nextPage = document.querySelector("#next-page");
let items = [];
let activeStage = "all";
let currentPage = 1;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const stageLabel = (stage) => stage === "foundation" ? "大一大二" : "大三大四";

const renderItem = (item) => {
  const status = item.curated ? '<span class="quality-badge curated">已人工整理</span>' : '<span class="quality-badge">完整卡 · 待复核</span>';
  const title = item.cia?.title || [item.article, item.term.replace(/^(der|die|das)\s+/i, "")].filter(Boolean).join(" ");
  const ipa = item.cia?.ipa ? `<small class="lexicon-ipa">${escapeHtml(item.cia.ipa)}</small>` : "";
  return `<article class="lexicon-row">
    <div class="lexicon-rank"><span>${escapeHtml(stageLabel(item.stage))}</span><strong>${item.stageRank}</strong></div>
    <div class="lexicon-word"><div>${status}<span class="cefr-badge">${escapeHtml(item.cefr)}</span></div><h2 lang="de">${escapeHtml(title)}</h2>${ipa}<p>${escapeHtml(item.pos)}${item.article ? ` · ${escapeHtml(item.article)}` : ""}</p></div>
    <div class="lexicon-meaning"><strong>${escapeHtml(item.meaning)}</strong>${item.englishGloss ? `<small>${escapeHtml(item.englishGloss)}</small>` : ""}</div>
    <details class="lexicon-example"><summary>查看 C-I-A 精讲</summary>${renderCiaCard(item, { showHeader: false })}<a class="lexicon-study-link" href="study.html?kind=vocab&amp;stage=${item.stage}&amp;word=${encodeURIComponent(item.id)}">加入主动回忆</a></details>
  </article>`;
};

const filteredItems = () => {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (activeStage !== "all" && item.stage !== activeStage) return false;
    if (cefrFilter.value !== "all" && item.cefr !== cefrFilter.value) return false;
    if (!query) return true;
    return [item.term, item.lemma, item.meaning, item.englishGloss, item.example].join(" ").toLocaleLowerCase().includes(query);
  });
};

const render = () => {
  const filtered = filteredItems();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  results.innerHTML = visible.length ? visible.map(renderItem).join("") : '<div class="empty-state">没有找到匹配词条，试试更短的关键词。</div>';
  matchCount.textContent = filtered.length.toLocaleString("zh-CN");
  pageLabel.textContent = filtered.length ? `显示第 ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} 条` : "";
  pageNumber.textContent = `${currentPage} / ${totalPages}`;
  previousPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === totalPages;
};

const resetAndRender = () => { currentPage = 1; render(); };

document.querySelectorAll(".stage-filter").forEach((button) => button.addEventListener("click", () => {
  activeStage = button.dataset.stage;
  document.querySelectorAll(".stage-filter").forEach((item) => {
    const selected = item === button;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  resetAndRender();
}));
searchInput.addEventListener("input", resetAndRender);
cefrFilter.addEventListener("change", resetAndRender);
previousPage.addEventListener("click", () => { if (currentPage > 1) { currentPage -= 1; render(); scrollTo({ top: document.querySelector("#lexicon-toolbar").offsetTop - 80, behavior: "smooth" }); } });
nextPage.addEventListener("click", () => { const pages = Math.ceil(filteredItems().length / PAGE_SIZE); if (currentPage < pages) { currentPage += 1; render(); scrollTo({ top: document.querySelector("#lexicon-toolbar").offsetTop - 80, behavior: "smooth" }); } });

fetch("data/vocab-index.json").then((response) => {
  if (!response.ok) throw new Error("词汇索引加载失败");
  return response.json();
}).then((data) => { items = data.items; document.querySelector("#lexicon-total").textContent = data.count.toLocaleString("zh-CN"); render(); }).catch(() => {
  results.innerHTML = '<div class="empty-state">词汇索引暂时没有加载成功，请刷新页面。</div>';
});
