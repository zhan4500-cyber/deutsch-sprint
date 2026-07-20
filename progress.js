const kindLabels = { vocab: "词汇", grammar: "语法", practice: "综合练习", skill: "能力课程", mock: "综合模拟" };
const formatAccuracy = (record) => record?.completed ? `${accuracyFor(record)}%` : "尚未开始";

const recentDays = () => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - index));
  return dayKey(date.getTime());
});

const calculateStreak = (days) => {
  let streak = 0;
  const cursor = new Date();
  if (!days[dayKey(cursor.getTime())]) cursor.setDate(cursor.getDate() - 1);
  while (days[dayKey(cursor.getTime())]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const renderProgress = () => {
  const state = getState();
  const accuracy = accuracyFor(state);
  const mastered = Object.values(state.mastery).filter((item) => item.strength >= 3).length;
  const due = getDueReview(state).length;
  document.querySelector("#progress-summary").textContent = state.completed ? `已完成 ${state.completed} 次练习` : "还没有开始。";
  document.querySelector("#progress-details").innerHTML = `<li><strong>${state.sessions}</strong>完整学习轮次</li><li><strong>${state.correct}</strong>答对或掌握</li><li><strong>${due}</strong>今天到期复习</li><li><strong>${state.review.length}</strong>已安排复习项目</li><li><strong>${mastered}</strong>稳定掌握项目</li><li><strong>${accuracy}%</strong>总体正确率</li>`;
  document.querySelector("#next-step").textContent = due ? `先处理 ${Math.min(due, 8)} 个到期内容，再开始新任务。` : "今天没有到期内容，可以开始新的学习任务。";
  document.querySelector("#daily-link").href = `study.html?kind=daily&stage=${getPreferredStage()}`;

  document.querySelector("#stage-breakdown").innerHTML = [
    ["大一大二", state.byStage.foundation], ["大三大四", state.byStage.advanced]
  ].map(([label, record]) => `<article><span>${label}</span><strong>${record.completed}</strong><small>次练习 · ${formatAccuracy(record)}</small><div class="bar"><span style="width:${accuracyFor(record)}%"></span></div></article>`).join("");

  const kindEntries = Object.entries(state.byKind).filter(([, record]) => record.completed);
  document.querySelector("#kind-breakdown").innerHTML = kindEntries.length ? kindEntries.map(([kind, record]) => `<article><span>${kindLabels[kind] || kind}</span><strong>${record.completed}</strong><small>次练习 · ${formatAccuracy(record)}</small><div class="bar"><span style="width:${accuracyFor(record)}%"></span></div></article>`).join("") : '<p class="muted">完成学习后，这里会显示词汇、语法和综合能力的分项数据。</p>';

  const days = recentDays();
  const max = Math.max(1, ...days.map((day) => state.days[day] || 0));
  document.querySelector("#activity-grid").innerHTML = days.map((day) => {
    const value = state.days[day] || 0;
    const label = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${day}T12:00:00`));
    return `<div><span class="activity-bar"><i style="height:${Math.max(value ? 12 : 2, Math.round((value / max) * 100))}%"></i></span><strong>${value}</strong><small>${label}</small></div>`;
  }).join("");
  const streak = calculateStreak(state.days);
  document.querySelector("#streak-title").textContent = streak ? `已经连续学习 ${streak} 天。` : "从今天开始。";
};

document.querySelector("#export-progress").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `deutsch-sprint-${dayKey()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  document.querySelector("#data-feedback").textContent = "学习记录已经导出。";
});

document.querySelector("#import-progress").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (typeof imported !== "object" || imported === null) throw new Error();
    saveState(normalizeState(imported));
    renderProgress();
    document.querySelector("#data-feedback").textContent = "学习记录已经导入。";
  } catch {
    document.querySelector("#data-feedback").textContent = "这个文件不是有效的学习记录。";
  }
  event.target.value = "";
});

document.querySelector("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("确定清空当前浏览器中的全部学习与复盘记录吗？此操作无法撤销。")) return;
  clearLearningState();
  renderProgress();
  document.querySelector("#data-feedback").textContent = "本机学习记录已清空。";
});

renderProgress();
