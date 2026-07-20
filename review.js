const reviewList = document.querySelector("#review-list");
const escapeReview = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

const renderReview = () => {
  const state = getState();
  if (!state.review.length) {
    reviewList.innerHTML = '<div class="empty">复盘队列是空的。答错或标记为模糊的内容会自动出现在这里。</div>';
    return;
  }
  const sorted = [...state.review].sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
  reviewList.innerHTML = sorted.map((item) => {
    const due = !item.dueAt || item.dueAt <= Date.now() ? "现在复习" : new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(item.dueAt));
    return `<article class="review-item"><div><p class="eyebrow">${escapeReview(item.detail)} · ${due}</p><h2>${escapeReview(item.title)}</h2><p>重新完成一次练习，答对后会自动移出队列。</p></div><div class="actions"><a class="primary" href="${escapeReview(item.href || `study.html?kind=daily&stage=${getPreferredStage()}`)}">再练一次</a><button class="secondary" data-id="${escapeReview(item.id)}" type="button">暂时移除</button></div></article>`;
  }).join("");
  reviewList.querySelectorAll("button[data-id]").forEach((button) => button.addEventListener("click", () => {
    removeReview(button.dataset.id);
    renderReview();
  }));
};

document.querySelector('a[href^="study.html?kind=daily"]').href = `study.html?kind=daily&stage=${getPreferredStage()}`;
document.querySelector("#clear-review").addEventListener("click", () => {
  if (!window.confirm("确定清空全部待复盘内容吗？学习次数和正确率会保留。")) return;
  const state = getState();
  state.review = [];
  saveState(state);
  renderReview();
});
renderReview();
