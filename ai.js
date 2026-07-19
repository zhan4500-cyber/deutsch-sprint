const AI_PROFILE_KEY = "deutsch-sprint-ai-profile-v1";
const config = window.DEUTSCH_SPRINT_AI_CONFIG || {};
const form = document.querySelector("#tutor-form");
const input = document.querySelector("#tutor-input");
const answerPanel = document.querySelector("#answer-panel");
const profileStage = document.querySelector("#profile-stage");
const profileSummary = document.querySelector("#profile-summary-text");
const explanationStyle = document.querySelector("#explanation-style");
let activeMode = "correction";

const modeCopy = {
  correction: { label: "输入你想纠正的德语句子", hint: "AI 会优先判断错误类型，再给出修改和下一题。", placeholder: "例如：Ich helfe meinen Freund." },
  grammar: { label: "输入你想弄懂的语法问题", hint: "会结合你的阶段和近期薄弱点解释。", placeholder: "例如：为什么 weil 后面的动词要放在句尾？" },
  translation: { label: "输入中文原文或你的德语译文", hint: "会分别看含义、语法、自然度与语域。", placeholder: "例如：这项决定会对学生产生长期影响。" },
  business: { label: "输入你的商务德语场景或草稿", hint: "会优先处理正式程度、邮件结构和常用表达。", placeholder: "例如：请帮我写一封询问报价的德语邮件。" }
};

const defaultProfile = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
  stage: "foundation",
  explanationStyle: "concise",
  totalTasks: 0,
  errorCounts: {},
  recentErrors: []
});

const loadProfile = () => {
  try { return { ...defaultProfile(), ...JSON.parse(localStorage.getItem(AI_PROFILE_KEY)) }; }
  catch { return defaultProfile(); }
};

let profile = loadProfile();

const saveProfile = () => localStorage.setItem(AI_PROFILE_KEY, JSON.stringify(profile));

const humanStage = (stage) => stage === "advanced" ? "大三大四" : "大一大二";

const renderProfile = () => {
  profileStage.textContent = humanStage(profile.stage);
  const entries = Object.entries(profile.errorCounts).sort((a, b) => b[1] - a[1]);
  profileSummary.textContent = entries.length
    ? `已完成 ${profile.totalTasks} 次分析。近期需要关注：${entries.slice(0, 2).map(([tag]) => tag).join("、")}。`
    : "先完成一次练习，系统会开始记录你的薄弱点。";
  explanationStyle.value = profile.explanationStyle;
};

const updateProfile = (result) => {
  profile.totalTasks += 1;
  (result.errorTags || []).forEach((tag) => {
    profile.errorCounts[tag] = (profile.errorCounts[tag] || 0) + 1;
  });
  profile.recentErrors = [...(result.errorTags || []), ...profile.recentErrors].slice(0, 8);
  saveProfile();
  renderProfile();
};

const demoResponse = (text) => {
  if (activeMode === "correction" && /helfe\s+meinen\s+freund/i.test(text)) {
    return {
      heading: "这里的问题不是“朋友”，而是 helfen 的支配。",
      answer: "helfen 后面接第三格。阳性名词 Freund 前面的 mein 要变成 meinem。",
      correctedText: "Ich helfe meinem Freund.",
      errorTags: ["动词支配", "第三格"],
      exercise: "补全：Ich danke ___ Lehrer."
    };
  }
  const templates = {
    grammar: { heading: "先找句子主干，再判断规则。", answer: "语法问答会优先从你的当前阶段和近期错误里选择讲解深度。接入千问后，它会引用对应语法卡片，并给出一组对比例句。", correctedText: "建议先说明：你卡在哪个句子、哪个词或哪个位置。", errorTags: ["语法问答"], exercise: "尝试写一个包含 weil 的从句，再让 AI 检查动词位置。" },
    translation: { heading: "翻译不只看“对不对”，也要看“像不像德语”。", answer: "接入后会分开评价含义、语法、搭配、自然度和语域，不会只给一个模糊分数。", correctedText: "先贴中文原文与自己的译文，AI 才能解释具体取舍。", errorTags: ["翻译表达"], exercise: "写出一版直译和一版更自然的表达，比较两者差异。" },
    business: { heading: "商务德语先把场景和关系说清。", answer: "同一句中文在询价、催款、会议确认和投诉里，正式程度会不同。AI 会根据场景给出合适语域和可替换表达。", correctedText: "例如正式开头可使用：Sehr geehrte Damen und Herren,", errorTags: ["商务语域"], exercise: "说明收件人、目的和希望对方完成的动作，再写两句邮件正文。" }
  };
  return templates[activeMode] || templates.grammar;
};

const renderAnswer = (result, isDemo) => {
  answerPanel.innerHTML = `
    <div class="answer-grid">
      <div>
        <span class="answer-kicker">${isDemo ? "本地演示" : "AI 分析"}</span>
        <h2>${result.heading}</h2>
        <p>${result.answer}</p>
        <div class="corrected-text" lang="de">${result.correctedText}</div>
        <ul class="tag-list">${result.errorTags.map((tag) => `<li>${tag}</li>`).join("")}</ul>
      </div>
      <aside class="next-exercise">
        <strong>下一步练习</strong>
        <p>${result.exercise}</p>
      </aside>
    </div>
    ${isDemo ? '<p class="demo-note">当前是本地演示。接入千问后，回答会结合真实的学习画像与知识库生成。</p>' : ""}
  `;
};

const requestTutor = async (text) => {
  if (!config.endpoint) return { result: demoResponse(text), isDemo: true };
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: activeMode, text, profile })
  });
  if (!response.ok) throw new Error("AI 服务暂时没有响应。");
  return { result: await response.json(), isDemo: false };
};

document.querySelectorAll(".stage-button").forEach((button) => {
  button.addEventListener("click", () => {
    profile.stage = button.dataset.stage;
    document.querySelectorAll(".stage-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    saveProfile();
    renderProfile();
  });
});

document.querySelectorAll(".mode-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeMode = button.dataset.mode;
    document.querySelectorAll(".mode-tab").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    const copy = modeCopy[activeMode];
    document.querySelector("#input-label").textContent = copy.label;
    document.querySelector("#input-hint").textContent = copy.hint;
    input.placeholder = copy.placeholder;
    input.value = "";
  });
});

explanationStyle.addEventListener("change", () => {
  profile.explanationStyle = explanationStyle.value;
  saveProfile();
});

document.querySelector("#reset-profile").addEventListener("click", () => {
  profile = defaultProfile();
  saveProfile();
  document.querySelectorAll(".stage-button").forEach((item) => {
    const selected = item.dataset.stage === profile.stage;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  renderProfile();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  const submitButton = form.querySelector("button[type=submit]");
  submitButton.disabled = true;
  submitButton.textContent = "正在分析";
  try {
    const { result, isDemo } = await requestTutor(text);
    renderAnswer(result, isDemo);
    updateProfile(result);
  } catch (error) {
    answerPanel.innerHTML = `<div class="answer-placeholder"><span>暂时不可用</span><h2>这次分析没有完成。</h2><p>${error.message}</p></div>`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "开始分析";
  }
});

document.querySelector(`.stage-button[data-stage="${profile.stage}"]`)?.classList.add("active");
renderProfile();

