const skillParams = new URLSearchParams(location.search);
const requestedSkill = skillParams.get("id") || "listening-news";
const skillContent = document.querySelector("#skill-content");
let lessonData = null;
let lessonIndex = 0;
let answered = 0;
let correct = 0;
let dictationDone = false;

const skillEscape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const currentLesson = () => lessonData.lessons[lessonIndex];
const updateSkillStep = () => { document.querySelector("#skill-step").textContent = `${answered} / ${currentLesson().questions.length}`; };
const wordsOf = (value) => String(value || "").toLocaleLowerCase("de-DE").match(/[a-zäöüß]+/giu) || [];
const wordDistance = (left, right) => {
  const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) for (let j = 1; j <= right.length; j += 1) rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
  return rows[left.length][right.length];
};

const speakText = (rate = 0.88) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentLesson().content.join(" "));
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const germanVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("de"));
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
};

const recordSkillAnswer = (question, isCorrect) => {
  addResult({ id: `skill-${currentLesson().id}-${question.id}`, title: question.prompt, detail: `能力 · ${lessonData.title}`, href: `skill.html?id=${lessonData.id}`, stage: lessonData.stage || "advanced", kind: "skill" }, isCorrect);
  answered += 1;
  if (isCorrect) correct += 1;
  updateSkillStep();
};

const questionMarkup = (question, index) => {
  if (question.type === "mcq") return `<article class="question-block" data-question="${question.id}"><h3>${index + 1}. ${skillEscape(question.prompt)}</h3><div class="choice-list">${question.options.map((option, optionIndex) => `<button class="choice" data-option="${optionIndex}" type="button">${skillEscape(option)}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></article>`;
  return `<article class="question-block" data-question="${question.id}"><h3>${index + 1}. ${skillEscape(question.prompt)}</h3><textarea class="open-answer" aria-label="开放题回答"></textarea><p class="draft-feedback" aria-live="polite"></p><button class="secondary" data-show-model type="button">检查并查看参考</button><div class="model-answer" hidden><strong>参考表达</strong><p lang="de">${skillEscape(question.modelAnswer)}</p><small>${skillEscape(question.checklist.join(" · "))}</small></div><div class="answers self-check" hidden><button class="answer" data-self="correct" type="button">达到检查点</button><button class="answer" data-self="wrong" type="button">需要继续修改</button></div></article>`;
};

const bindQuestions = () => {
  document.querySelectorAll("[data-question]").forEach((block) => {
    const question = currentLesson().questions.find((item) => item.id === block.dataset.question);
    if (question.type === "mcq") {
      block.querySelectorAll("button[data-option]").forEach((button) => button.addEventListener("click", () => {
        if (block.dataset.done) return;
        block.dataset.done = "true";
        const choice = Number(button.dataset.option);
        const isCorrect = choice === question.answer;
        block.querySelectorAll("button[data-option]").forEach((item) => { item.disabled = true; });
        button.classList.add(isCorrect ? "correct" : "wrong");
        if (!isCorrect) block.querySelector(`[data-option="${question.answer}"]`).classList.add("correct");
        block.querySelector(".feedback").textContent = question.explanation;
        recordSkillAnswer(question, isCorrect);
      }));
    } else {
      block.querySelector("[data-show-model]").addEventListener("click", () => {
        const draft = block.querySelector(".open-answer").value.trim();
        if (!draft) {
          block.querySelector(".draft-feedback").textContent = "请先独立写出答案，再查看参考表达。";
          return;
        }
        const wordCount = wordsOf(draft).length;
        const sentenceCount = (draft.match(/[.!?]/g) || []).length;
        const target = question.targetWords || (question.modelAnswer.length > 240 ? 120 : 40);
        block.querySelector(".draft-feedback").textContent = `初步检查：${wordCount} 词，${sentenceCount || "未识别到"} 个完整句末标点；建议本题约 ${target} 词。请继续检查动词位置、格和词尾。`;
        block.querySelector(".model-answer").hidden = false;
        block.querySelector("[data-show-model]").hidden = true;
        block.querySelector(".self-check").hidden = false;
      });
      block.querySelectorAll("[data-self]").forEach((button) => button.addEventListener("click", () => {
        if (block.dataset.done) return;
        block.dataset.done = "true";
        block.querySelectorAll("[data-self]").forEach((item) => { item.disabled = true; });
        const isCorrect = button.dataset.self === "correct";
        button.classList.add(isCorrect ? "correct" : "wrong");
        recordSkillAnswer(question, isCorrect);
      }));
    }
  });
  document.querySelector("#finish-lesson").addEventListener("click", () => {
    if (currentLesson().mode === "dictation" && !dictationDone) {
      document.querySelector("#lesson-feedback").textContent = "请先完成并检查听写。";
      return;
    }
    if (answered < currentLesson().questions.length) {
      document.querySelector("#lesson-feedback").textContent = "请先完成全部题目。开放题需要查看参考表达并进行自评。";
      return;
    }
    completeSession({ stage: lessonData.stage || "advanced", kind: "skill", completed: answered + (currentLesson().mode === "dictation" ? 1 : 0), correct });
    renderResult();
  });
  document.querySelector("#play-normal")?.addEventListener("click", () => speakText(.9));
  document.querySelector("#play-slow")?.addEventListener("click", () => speakText(.72));
  document.querySelector("#show-transcript")?.addEventListener("click", () => {
    document.querySelector("#transcript").hidden = false;
    document.querySelector("#show-transcript").hidden = true;
  });
  document.querySelector("#check-dictation")?.addEventListener("click", () => {
    const draft = document.querySelector("#dictation-input").value.trim();
    if (!draft) {
      document.querySelector("#dictation-feedback").textContent = "请先根据录音完成听写。";
      return;
    }
    const expectedWords = wordsOf(currentLesson().content.join(" "));
    const actualWords = wordsOf(draft);
    const distance = wordDistance(expectedWords, actualWords);
    const score = Math.max(0, Math.round((1 - distance / Math.max(expectedWords.length, actualWords.length, 1)) * 100));
    dictationDone = true;
    document.querySelector("#transcript").hidden = false;
    document.querySelector("#show-transcript").hidden = true;
    document.querySelector("#dictation-feedback").innerHTML = `<strong>词序相似度 ${score}%</strong><br>原文 ${expectedWords.length} 词，你写了 ${actualWords.length} 词。请对照检查漏词、词尾、名词大写和标点。`;
    addResult({ id: `dictation-${currentLesson().id}`, title: currentLesson().title, detail: "基础听写", href: `skill.html?id=${lessonData.id}`, stage: "foundation", kind: "skill", spaced: true }, score >= 80);
  });
};

const renderLesson = () => {
  const lesson = currentLesson();
  answered = 0;
  correct = 0;
  dictationDone = false;
  document.title = `${lesson.title} | Deutsch Sprint`;
  document.querySelector("#skill-meta").textContent = `${lessonData.skill} · ${lesson.level} · 约 ${lesson.duration} 分钟`;
  document.querySelector("#skill-title").textContent = lesson.title;
  document.querySelector("#skill-lead").textContent = lesson.objective;
  updateSkillStep();
  const audioMode = lesson.mode === "listening" || lesson.mode === "dictation";
  const text = `<div class="lesson-text" id="transcript"${audioMode ? " hidden" : ""}>${lesson.content.map((paragraph) => `<p lang="${lesson.contentLang || "de"}">${skillEscape(paragraph)}</p>`).join("")}</div>`;
  const listening = audioMode ? `<div class="audio-controls"><button class="primary" id="play-normal" type="button">播放德语</button><button class="secondary" id="play-slow" type="button">慢速播放</button><button class="secondary" id="show-transcript" type="button">显示原文</button></div><div class="transcript-cover">${lesson.mode === "dictation" ? "先完整听一遍，再分段听写；提交后系统会计算词序相似度。" : "建议先听两遍并完成题目，再查看原文。"}</div>` : "";
  const dictation = lesson.mode === "dictation" ? `<div class="dictation-work"><label for="dictation-input">听写区</label><textarea id="dictation-input" rows="10" spellcheck="false" placeholder="在这里输入你听到的德语"></textarea><button class="primary" id="check-dictation" type="button">检查听写</button><p class="feedback" id="dictation-feedback" aria-live="polite"></p></div>` : "";
  skillContent.innerHTML = `<div class="lesson-layout"><article class="lesson-copy"><p class="eyebrow">ORIGINAL MATERIAL</p><h2>${skillEscape(lesson.contentTitle)}</h2>${listening}${dictation}${text}<p class="lesson-summary"><strong>内容提示</strong><br>${skillEscape(lesson.summary)}</p><div class="glossary">${lesson.glossary.map(([term, meaning]) => `<div><strong lang="de">${skillEscape(term)}</strong><small>${skillEscape(meaning)}</small></div>`).join("")}</div></article><aside class="lesson-questions"><p class="eyebrow">TASKS</p><h2>完成本课训练</h2>${lesson.questions.map(questionMarkup).join("")}<button class="primary" id="finish-lesson" type="button">完成课程</button><p class="feedback" id="lesson-feedback" aria-live="polite"></p></aside></div>`;
  bindQuestions();
};

const renderResult = () => {
  const lesson = currentLesson();
  const hasNext = lessonIndex + 1 < lessonData.lessons.length;
  skillContent.innerHTML = `<section class="lesson-result"><span class="tag">课程完成</span><h2>${correct} / ${answered} 项达到要求</h2><p>${skillEscape(lesson.takeaway)}</p><div class="actions">${hasNext ? '<button class="primary" id="next-lesson" type="button">下一课</button>' : '<a class="primary" href="skills.html">选择其他模块</a>'}<a class="secondary" href="review.html">查看复盘</a></div></section>`;
  if (hasNext) document.querySelector("#next-lesson").addEventListener("click", () => { lessonIndex += 1; renderLesson(); });
};

fetch("data/skill-lessons.json").then((response) => {
  if (!response.ok) throw new Error();
  return response.json();
}).then((data) => {
  lessonData = data.modules.find((module) => module.id === requestedSkill) || data.modules[0];
  renderLesson();
}).catch(() => { skillContent.innerHTML = '<div class="empty">课程暂时没有加载成功，请刷新页面再试。</div>'; });
