const reviewList = document.querySelector("#review-list");
const renderReview = () => {
  const state = getState();
  if (!state.review.length) { reviewList.innerHTML = '<div class="empty">复盘队列是空的。完成一次练习后，答错的内容会自动出现在这里。</div>'; return; }
  reviewList.innerHTML = state.review.map((item) => `<article class="review-item"><div><p class="eyebrow">${item.detail}</p><h2>${item.title}</h2><p>重新学习后，再把它标记为已复盘。</p></div><div class="actions"><a class="secondary" href="${item.href || "study.html?kind=daily"}">再练一次</a><button class="primary" data-id="${item.id}" type="button">已复盘</button></div></article>`).join("");
  reviewList.querySelectorAll("button[data-id]").forEach((button) => button.addEventListener("click", () => { removeReview(button.dataset.id); renderReview(); }));
};
renderReview();
document.querySelector("#clear-review").addEventListener("click", () => { const state=getState(); state.review=[]; saveState(state); renderReview(); });