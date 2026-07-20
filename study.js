const params = new URLSearchParams(location.search);
const kind = params.get("kind") || "daily";
const requestedStage = params.get("stage") || getPreferredStage();
const requestedSlug = params.get("slug");
const lessonPanel = document.querySelector("#lesson-panel");

setPreferredStage(requestedStage);

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const setHeadings = (kicker, title, lead) => {
  document.querySelector("#study-kicker").textContent = kicker;
  document.querySelector("#study-title").textContent = title;
  document.querySelector("#study-lead").textContent = lead;
};

const renderStats = () => {
  const state = getState();
  document.querySelector("#total-tasks").textContent = state.completed;
  document.querySelector("#review-count").textContent = state.review.length;
};

const record = (item, correct) => {
  addResult(item, correct);
  renderStats();
};

const loadJson = (path) => fetch(path).then((response) => {
  if (!response.ok) throw new Error("资料加载失败");
  return response.json();
});

const hashText = (text) => [...text].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
const rotateTake = (items, count, seedText) => {
  if (!items.length) return [];
  const offset = hashText(seedText) % items.length;
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(offset + index) % items.length]);
};

const vocabDetails = (entry) => [
  `<li><strong>释义</strong>${escapeHtml(entry.meaning)}</li>`,
  entry.collocation ? `<li><strong>常用搭配</strong><span lang="de">${escapeHtml(entry.collocation)}</span></li>` : "",
  entry.example ? `<li><strong>例句</strong><span lang="de">${escapeHtml(entry.example)}</span>${entry.translation ? `<br><span class="muted">${escapeHtml(entry.translation)}</span>` : ""}</li>` : ""
].filter(Boolean).join("");

const renderVocabSession = (theme, { stage, count = 10, daily = false, onComplete, round = 0 } = {}) => {
  const date = new Date().toISOString().slice(0, 10);
  const entries = rotateTake(theme.entries, count, `${date}-${theme.id}-${daily ? "daily" : `theme-${round}`}`);
  let index = 0;
  let mastered = 0;

  if (!daily) setHeadings("VOCABULARY SPRINT", theme.label, `${theme.usageFocus} 每轮练习 ${entries.length} 个词。`);

  const finish = () => {
    if (onComplete) {
      onComplete({ completed: entries.length, correct: mastered });
      return;
    }
    completeSession({ stage, kind: "vocab", completed: entries.length, correct: mastered });
    lessonPanel.innerHTML = `<div class="session-complete"><span class="tag">本轮完成</span><h2>${mastered} / ${entries.length} 个词已掌握</h2><p>没有掌握的词已经进入复盘队列。下一轮会从这个主题继续练习。</p><div class="actions"><button class="primary" id="repeat-session" type="button">再练一轮</button><a class="secondary" href="vocab.html">返回词库</a></div></div>`;
    document.querySelector("#repeat-session").addEventListener("click", () => renderVocabSession(theme, { stage, count, round: round + 1 }));
  };

  const showEntry = () => {
    if (index >= entries.length) {
      finish();
      return;
    }
    const entry = entries[index];
    lessonPanel.innerHTML = `<div class="session-meter"><span style="width:${Math.round((index / entries.length) * 100)}%"></span></div><span class="tag">词汇 ${index + 1} / ${entries.length}</span><h2 class="word" lang="de">${escapeHtml(entry.term)}</h2><p class="word-note">${escapeHtml(entry.pos)} · 先回想意思和搭配，再查看答案。</p><div class="recall-gate"><button class="primary" id="reveal-word" type="button">显示释义与例句</button></div>`;

    document.querySelector("#reveal-word").addEventListener("click", () => {
      lessonPanel.querySelector(".recall-gate").innerHTML = `<ul class="details">${vocabDetails(entry)}</ul><div class="exercise"><strong>对照答案后，你记得怎么样？</strong><div class="answers"><button class="answer" data-level="hard" type="button">没想起来</button><button class="answer" data-level="medium" type="button">有些模糊</button><button class="answer" data-level="easy" type="button">准确掌握</button></div><p class="feedback" aria-live="polite"></p></div>`;
      lessonPanel.querySelectorAll("button[data-level]").forEach((button) => button.addEventListener("click", () => {
        const correct = button.dataset.level === "easy";
        if (correct) mastered += 1;
        record({ id: `vocab-${theme.id}-${entry.term}`, title: entry.term, detail: `词汇 · ${theme.label}`, href: `study.html?kind=vocab&slug=${encodeURIComponent(theme.id)}&stage=${stage}`, stage, kind: "vocab" }, correct);
        lessonPanel.querySelectorAll("button[data-level]").forEach((item) => { item.disabled = true; });
        button.classList.add(correct ? "correct" : "wrong");
        lessonPanel.querySelector(".feedback").innerHTML = `${correct ? "已记为掌握。" : "已加入复盘。"} <button class="secondary inline-next" id="next-word" type="button">${index + 1 === entries.length ? "完成词汇部分" : "下一个词"}</button>`;
        document.querySelector("#next-word").addEventListener("click", () => { index += 1; showEntry(); });
      }));
    });
  };
  showEntry();
};

const renderGrammarTopic = (topic, { stage, daily = false, onComplete } = {}) => {
  if (!daily) setHeadings("GRAMMAR SPRINT", topic.title, "先理解一条核心规则，再完成一道即时自测。");
  const examples = topic.examples?.length ? `<div class="example-list">${topic.examples.map((text) => {
    const [de, note] = text.split("｜");
    return `<p><span lang="de">${escapeHtml(de)}</span><small>${escapeHtml(note || "")}</small></p>`;
  }).join("")}</div>` : "";
  lessonPanel.innerHTML = `${daily ? '<div class="session-meter"><span style="width:78%"></span></div><span class="tag">语法与自测</span>' : '<span class="tag">语法专题</span>'}<h2>${escapeHtml(topic.title)}</h2><p class="lead">${escapeHtml(topic.rule)}</p>${examples}<ul class="details"><li><strong>易错提醒</strong>${escapeHtml(topic.commonMistake)}</li></ul><div class="exercise"><strong>${escapeHtml(topic.exercise.question)}</strong><div class="answers">${topic.exercise.options.map((option, index) => `<button class="answer" data-index="${index}" type="button">${escapeHtml(option)}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></div>`;

  lessonPanel.querySelectorAll("button[data-index]").forEach((button) => button.addEventListener("click", () => {
    const correct = Number(button.dataset.index) === topic.exercise.answer;
    lessonPanel.querySelectorAll("button[data-index]").forEach((item) => { item.disabled = true; });
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) lessonPanel.querySelector(`button[data-index="${topic.exercise.answer}"]`).classList.add("correct");
    record({ id: `grammar-${topic.id}`, title: topic.title, detail: "语法专题", href: `study.html?kind=grammar&slug=${encodeURIComponent(topic.id)}&stage=${stage}`, stage, kind: "grammar" }, correct);
    const nextLabel = daily ? "查看今日结果" : "完成本专题";
    lessonPanel.querySelector(".feedback").innerHTML = `${escapeHtml(topic.exercise.explanation)} <button class="secondary inline-next" id="finish-grammar" type="button">${nextLabel}</button>`;
    document.querySelector("#finish-grammar").addEventListener("click", () => {
      if (onComplete) onComplete({ completed: 1, correct: correct ? 1 : 0 });
      else {
        completeSession({ stage, kind: "grammar", completed: 1, correct: correct ? 1 : 0 });
        lessonPanel.innerHTML = `<div class="session-complete"><span class="tag">专题完成</span><h2>${correct ? "回答正确" : "已加入复盘"}</h2><p>${escapeHtml(topic.exercise.explanation)}</p><div class="actions"><a class="primary" href="grammar.html">选择下一个专题</a><a class="secondary" href="review.html">查看复盘</a></div></div>`;
      }
    });
  }));
};

const renderDailyComplete = ({ stage, vocabResult, grammarResult, quote }) => {
  const completed = vocabResult.completed + grammarResult.completed;
  const correct = vocabResult.correct + grammarResult.correct;
  completeSession({ stage, kind: "daily", completed, correct });
  lessonPanel.innerHTML = `<div class="session-complete"><div class="session-meter"><span style="width:100%"></span></div><span class="tag">今日任务完成</span><h2>${correct} / ${completed} 项掌握</h2><p>模糊或答错的内容已经进入复盘。明天会根据日期换一组内容。</p><blockquote class="daily-quote"><p lang="de">${escapeHtml(quote.quote)}</p><footer>${escapeHtml(quote.author)} · ${escapeHtml(quote.work)}</footer><small>${escapeHtml(quote.translation)}</small><small>${escapeHtml(quote.focus)}</small></blockquote><div class="actions"><a class="primary" href="review.html">复盘薄弱项</a><a class="secondary" href="progress.html">查看学习进度</a></div></div>`;
};

const startDaily = (vocab, grammar, quotes) => {
  const stage = vocab.stages.find((item) => item.id === requestedStage) || vocab.stages[0];
  const date = new Date().toISOString().slice(0, 10);
  const theme = stage.themes[hashText(`${date}-${stage.id}`) % stage.themes.length];
  const grammarTopics = grammar.structure.filter((group) => group.stage.includes(stage.label)).flatMap((group) => group.topics);
  const topic = grammarTopics[hashText(`${date}-${stage.id}-grammar`) % grammarTopics.length];
  const quote = quotes.items[hashText(`${date}-quote`) % quotes.items.length];
  setHeadings("TODAY'S SPRINT", "今日任务", `${stage.label} · 6 个词、1 条语法和 1 道即时自测。`);
  renderVocabSession(theme, { stage: stage.id, count: 6, daily: true, onComplete: (vocabResult) => renderGrammarTopic(topic, { stage: stage.id, daily: true, onComplete: (grammarResult) => renderDailyComplete({ stage: stage.id, vocabResult, grammarResult, quote }) }) });
};

const start = async () => {
  renderStats();
  try {
    if (kind === "grammar") {
      const data = await loadJson("data/grammar-library.json");
      const topics = data.structure.flatMap((group) => group.topics);
      const fallbackTopic = topics.find((item) => requestedStage === "advanced" ? item.id.startsWith("advanced-") : !item.id.startsWith("advanced-"));
      const topic = topics.find((item) => item.id === requestedSlug) || fallbackTopic || topics[0];
      const stage = topic.id.startsWith("advanced-") ? "advanced" : requestedStage;
      renderGrammarTopic(topic, { stage });
      return;
    }
    const vocab = await loadJson("data/vocab-library.json");
    const themes = vocab.stages.flatMap((stage) => stage.themes.map((theme) => ({ ...theme, stage: stage.id })));
    if (kind === "vocab") {
      const theme = themes.find((item) => item.id === requestedSlug) || themes.find((item) => item.stage === requestedStage) || themes[0];
      renderVocabSession(theme, { stage: theme.stage, count: 10 });
      return;
    }
    const [grammar, quotes] = await Promise.all([loadJson("data/grammar-library.json"), loadJson("data/classic-quotes.json")]);
    startDaily(vocab, grammar, quotes);
  } catch (error) {
    lessonPanel.innerHTML = `<div class="empty">学习内容暂时没有加载成功，请刷新页面再试。<br><small>${escapeHtml(error.message)}</small></div>`;
  }
};

start();
