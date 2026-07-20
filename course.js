const routeSemesters = [
  { level: "01", title: "第一学期 · 发音与A1骨架", weeks: "第1–18周", target: "完成约600个基础词，建立动词变位、四格与主句语序。", units: [["词汇", "每日12个新词并完成到期复习"], ["语法", "专题1–30：拼写、格、词尾与基础时态"], ["听写", "基础听写1–4，先准确再追求速度"], ["写作", "邮件与个人经历，完成60–100词短文"]] },
  { level: "02", title: "第二学期 · A2表达扩展", weeks: "第19–36周", target: "累计约1200词，掌握从句、关系句、被动态与常用支配。", units: [["词汇", "从日常表达进入校园与社会主题"], ["语法", "专题31–60：不定式、语序、关系句与被动"], ["听写", "基础听写5–8，记录词尾和名词大写错误"], ["写作", "比较、概括和简短论证"]] },
  { level: "03", title: "第三学期 · B1综合运用", weeks: "第37–54周", target: "累计约1900词，把词汇和语法放入阅读、改写与纠错。", units: [["词汇", "主题搭配、连接词和常见抽象表达"], ["语法", "专题61–87：转换、虚拟式、衔接与语体"], ["听写", "基础听写9–12，逐步接近完整篇章"], ["练习", "单项填空、完形、改写和改错混合训练"]] },
  { level: "04", title: "第四学期 · 考试整合", weeks: "第55–72周", target: "完成2500词基础池，按考试时间训练听写、阅读、语法词汇和150词写作。", units: [["词汇", "清理到期复习与高频薄弱词"], ["整卷", "每两周完成一次170分钟模拟"], ["写作", "40分钟完成、10分钟按量表复核"], ["复盘", "按听写、格、词尾、语序、搭配分类"]] }
];

const state = getState();
const foundationMastery = Object.entries(state.mastery).filter(([id]) => id.startsWith("vocab-LEX") && state.mastery[id].stage === "foundation").length;
const due = getDueReview(state).filter((item) => item.stage === "foundation").length;
const progress = Math.min(100, Math.round((foundationMastery / 2500) * 100));
const semesterIndex = foundationMastery < 600 ? 0 : foundationMastery < 1200 ? 1 : foundationMastery < 1900 ? 2 : 3;
document.querySelector("#route-title").textContent = routeSemesters[semesterIndex].title;
document.querySelector("#route-copy").textContent = routeSemesters[semesterIndex].target;
document.querySelector("#route-percent").textContent = `${progress}%`;
document.querySelector("#route-bar").style.width = `${progress}%`;
document.querySelector("#route-detail").textContent = `基础词汇已接触 ${foundationMastery} / 2500 · 今天到期 ${due} 项`;

const weekly = [
  ["01", "词汇与复习", `${Math.min(due, 8)}个到期 + 12个新词`, "study.html?kind=daily&stage=foundation"],
  ["02", "语法迁移", "规则题 + 独立造句", "grammar.html?stage=foundation"],
  ["03", "系统听写", "一篇听写并对照纠错", "skill.html?id=foundation-dictation"],
  ["04", "基础写作", "完成一篇再看参考", "skill.html?id=foundation-writing"],
  ["05", "混合练习", "20题并清理错题", "practice.html?stage=foundation"]
];
document.querySelector("#weekly-grid").innerHTML = weekly.map(([no, title, copy, href]) => `<article><span>${no}</span><h3>${title}</h3><p>${copy}</p><a href="${href}">开始</a></article>`).join("");
document.querySelector("#semester-grid").innerHTML = routeSemesters.map((semester, index) => `<section class="semester"><div><div class="semester-index">${semester.level}</div><p class="eyebrow">${semester.weeks}</p><h2>${semester.title}</h2><p class="muted">${semester.target}</p></div><div class="semester-units">${semester.units.map(([title, copy]) => `<article><h3>${title}</h3><p>${copy}</p></article>`).join("")}</div></section>`).join("");

document.querySelector("#start-diagnostic").addEventListener("click", async () => {
  const body = document.querySelector("#diagnostic-body");
  document.querySelector(".diagnostic-intro").hidden = true;
  body.hidden = false;
  body.innerHTML = '<p class="muted">正在准备诊断题…</p>';
  try {
    const data = await fetch("data/questions/grammar_mcq.json").then((response) => response.json());
    const step = Math.floor(data.items.length / 12);
    const questions = Array.from({ length: 12 }, (_, index) => data.items[index * step]);
    let score = 0;
    let answered = 0;
    body.innerHTML = questions.map((item, index) => `<article class="diagnostic-question" data-id="${item.id}"><h3>${index + 1}. ${item.prompt}</h3><div class="answers">${item.options.map((option) => `<button class="answer" data-answer="${option}" type="button">${option}</button>`).join("")}</div><p class="feedback"></p></article>`).join("");
    body.querySelectorAll(".diagnostic-question").forEach((block) => {
      const item = questions.find((question) => question.id === block.dataset.id);
      block.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
        if (block.dataset.done) return;
        block.dataset.done = "true";
        const ok = button.dataset.answer === item.answer;
        if (ok) score += 1;
        answered += 1;
        block.querySelectorAll("button").forEach((choice) => { choice.disabled = true; if (choice.dataset.answer === item.answer) choice.classList.add("correct"); });
        if (!ok) button.classList.add("wrong");
        block.querySelector(".feedback").textContent = item.explanation;
        if (answered === questions.length) {
          const recommended = score <= 3 ? 0 : score <= 6 ? 1 : score <= 9 ? 2 : 3;
          localStorage.setItem("deutsch-sprint-diagnostic", JSON.stringify({ score, at: Date.now(), semester: recommended + 1 }));
          body.insertAdjacentHTML("beforeend", `<div class="diagnostic-result"><p class="eyebrow">诊断完成</p><h2>${score} / 12</h2><p>建议从${routeSemesters[recommended].title}开始。诊断只决定起点，薄弱知识仍会进入日常复习。</p><a class="primary" href="study.html?kind=daily&stage=foundation">开始今天的任务</a></div>`);
        }
      }));
    });
  } catch {
    body.innerHTML = '<div class="empty">诊断题加载失败，请刷新后重试。</div>';
  }
});
