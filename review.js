const reviewList = document.querySelector("#review-list");
const escapeReview = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

const renderReview = () => {
  const state = getState();
  const dueItems = getDueReview(state);
  if (!dueItems.length) {
    const next = [...state.review].sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0))[0];
    const nextCopy = next?.dueAt ? `下一次复习安排在 ${new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date(next.dueAt))}。` : "完成学习后，系统会自动安排下一次复习。";
    reviewList.innerHTML = `<div class="empty">今天的到期复习已经清空。<br><small>${escapeReview(nextCopy)}</small></div>`;
    return;
  }
  const sorted = [...dueItems].sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
  reviewList.innerHTML = sorted.map((item) => {
    const due = !item.dueAt || item.dueAt <= Date.now() ? "现在复习" : new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(item.dueAt));
    return `<article class="review-item"><div><p class="eyebrow">${escapeReview(item.detail)} · ${due}</p><h2>${escapeReview(item.title)}</h2><p>重新完成一次练习；答对后按 1、3、7、14、30 天继续安排。</p></div><div class="actions"><a class="primary" href="${escapeReview(item.href || `study.html?kind=daily&stage=${getPreferredStage()}`)}">开始复习</a><button class="secondary" data-id="${escapeReview(item.id)}" type="button">暂时移除</button></div></article>`;
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
