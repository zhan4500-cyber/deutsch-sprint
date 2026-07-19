const renderProgress = () => {
  const state = getState(); const accuracy = state.completed ? Math.round((state.correct / state.completed) * 100) : 0;
  document.querySelector("#progress-summary").textContent = state.completed ? `已完成 ${state.completed} 次学习` : "还没有开始。";
  document.querySelector("#progress-details").innerHTML = `<li><strong>${state.correct}</strong>答对次数</li><li><strong>${state.review.length}</strong>待复盘内容</li><li><strong>${accuracy}%</strong>当前正确率</li>`;
  document.querySelector("#next-step").textContent = state.review.length ? "先处理一项待复盘内容，再继续新的今日任务。" : "完成一轮今日任务，让你的学习记录从第一格开始。";
};
renderProgress();
document.querySelector("#reset-progress").addEventListener("click", () => { localStorage.removeItem(STORE_KEY); renderProgress(); });
