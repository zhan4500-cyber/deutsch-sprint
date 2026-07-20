const params = new URLSearchParams(location.search);
const kind = params.get("kind") || "daily";
const requestedStage = params.get("stage") || getPreferredStage();
const requestedSlug = params.get("slug");
const requestedWord = params.get("word");
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
  document.querySelector("#review-count").textContent = getDueReview(state).length;
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
  entry.article ? `<li><strong>冠词</strong><span lang="de">${escapeHtml(entry.article)}</span></li>` : "",
  entry.plural ? `<li><strong>复数</strong><span lang="de">${escapeHtml(entry.plural)}</span></li>` : "",
  entry.verbForms ? `<li><strong>主要形式</strong><span lang="de">${escapeHtml(entry.verbForms)}</span></li>` : "",
  entry.usagePattern ? `<li><strong>用法与搭配</strong><span lang="de">${escapeHtml(entry.usagePattern)}</span></li>` : "",
  entry.example ? `<li><strong>例句</strong><span lang="de">${escapeHtml(entry.example)}</span>${entry.exampleTranslation ? `<br><span class="muted">${escapeHtml(entry.exampleTranslation)}</span>` : ""}</li>` : ""
].filter(Boolean).join("");

const renderVocabSession = (theme, { stage, count = 10, daily = false, fixed = false, onComplete, round = 0 } = {}) => {
  const date = new Date().toISOString().slice(0, 10);
  const entries = fixed ? theme.entries.slice(0, count) : rotateTake(theme.entries, count, `${date}-${theme.id}-${daily ? "daily" : `theme-${round}`}`);
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
    const wordLabel = [entry.article, entry.term].filter(Boolean).join(" ");
    lessonPanel.innerHTML = `<div class="session-meter"><span style="width:${Math.round((index / entries.length) * 100)}%"></span></div><span class="tag">词汇 ${index + 1} / ${entries.length} · ${escapeHtml(entry.cefr || "")}</span><h2 class="word" lang="de">${escapeHtml(wordLabel)}</h2><p class="word-note">${escapeHtml(entry.pos)} · 先回想释义、词形和搭配，再查看答案。</p><div class="recall-gate"><button class="primary" id="reveal-word" type="button">显示精讲</button></div>`;

    document.querySelector("#reveal-word").addEventListener("click", () => {
      lessonPanel.querySelector(".recall-gate").innerHTML = `<ul class="details">${vocabDetails(entry)}</ul><div class="exercise"><strong>对照答案后，你记得怎么样？</strong><div class="answers"><button class="answer" data-level="hard" type="button">没想起来</button><button class="answer" data-level="medium" type="button">有些模糊</button><button class="answer" data-level="easy" type="button">准确掌握</button></div><p class="feedback" aria-live="polite"></p></div>`;
      lessonPanel.querySelectorAll("button[data-level]").forEach((button) => button.addEventListener("click", () => {
        const correct = button.dataset.level === "easy";
        if (correct) mastered += 1;
        record({ id: `vocab-${entry.id}`, lexiconId: entry.id, title: wordLabel, detail: `词汇 · ${theme.label}`, href: `study.html?kind=vocab&stage=${stage}&word=${encodeURIComponent(entry.id)}`, stage, kind: "vocab", spaced: true }, correct);
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
    const completeTopic = (applicationCorrect = true) => {
      const finalCorrect = correct && applicationCorrect;
      if (onComplete) onComplete({ completed: topic.application ? 2 : 1, correct: (correct ? 1 : 0) + (topic.application && applicationCorrect ? 1 : 0) });
      else {
        completeSession({ stage, kind: "grammar", completed: topic.application ? 2 : 1, correct: (correct ? 1 : 0) + (topic.application && applicationCorrect ? 1 : 0) });
        lessonPanel.innerHTML = `<div class="session-complete"><span class="tag">专题完成</span><h2>${finalCorrect ? "规则与迁移均已掌握" : "已安排后续复习"}</h2><p>${escapeHtml(topic.exercise.explanation)}</p><div class="actions"><a class="primary" href="grammar.html">选择下一个专题</a><a class="secondary" href="review.html">查看复盘</a></div></div>`;
      }
    };
    const nextLabel = topic.application ? "继续迁移练习" : daily ? "查看今日结果" : "完成本专题";
    lessonPanel.querySelector(".feedback").innerHTML = `${escapeHtml(topic.exercise.explanation)} <button class="secondary inline-next" id="finish-grammar" type="button">${nextLabel}</button>`;
    document.querySelector("#finish-grammar").addEventListener("click", () => {
      if (!topic.application) {
        completeTopic();
        return;
      }
      const exercise = lessonPanel.querySelector(".exercise");
      exercise.innerHTML = `<strong>${escapeHtml(topic.application.prompt)}</strong><textarea class="grammar-transfer" id="grammar-transfer" rows="4" placeholder="在这里写出完整德语句子"></textarea><button class="secondary inline-next" id="show-grammar-model" type="button">查看参考与检查点</button><div class="feedback" aria-live="polite"></div>`;
      document.querySelector("#show-grammar-model").addEventListener("click", () => {
        const response = document.querySelector("#grammar-transfer").value.trim();
        if (!response) {
          exercise.querySelector(".feedback").textContent = "请先写一句，再对照参考。";
          return;
        }
        exercise.querySelector(".feedback").innerHTML = `<p><strong>参考例句</strong><br><span lang="de">${escapeHtml(topic.application.modelAnswer)}</span></p><p>${topic.application.checklist.map((item) => `✓ ${escapeHtml(item)}`).join(" · ")}</p><div class="answers"><button class="answer" data-transfer="correct" type="button">达到三个检查点</button><button class="answer" data-transfer="wrong" type="button">还需要修改</button></div>`;
        exercise.querySelectorAll("button[data-transfer]").forEach((transferButton) => transferButton.addEventListener("click", () => {
          const applicationCorrect = transferButton.dataset.transfer === "correct";
          record({ id: `grammar-app-${topic.id}`, title: `${topic.title}迁移练习`, detail: "语法造句", href: `study.html?kind=grammar&slug=${encodeURIComponent(topic.id)}&stage=${stage}`, stage, kind: "grammar", spaced: true }, applicationCorrect);
          completeTopic(applicationCorrect);
        }));
      });
    });
  }));
};

const renderDailyComplete = ({ stage, vocabResult, grammarResult, quote }) => {
  const completed = vocabResult.completed + grammarResult.completed;
  const correct = vocabResult.correct + grammarResult.correct;
  completeSession({ stage, kind: "daily", completed, correct });
  lessonPanel.innerHTML = `<div class="session-complete"><div class="session-meter"><span style="width:100%"></span></div><span class="tag">今日任务完成</span><h2>${correct} / ${completed} 项掌握</h2><p>模糊或答错的内容已经进入复盘。明天会根据日期换一组内容。</p><blockquote class="daily-quote"><p lang="de">${escapeHtml(quote.quote)}</p><footer>${escapeHtml(quote.author)} · ${escapeHtml(quote.work)}</footer><small>${escapeHtml(quote.translation)}</small><small>${escapeHtml(quote.focus)}</small></blockquote><div class="actions"><a class="primary" href="review.html">复盘薄弱项</a><a class="secondary" href="progress.html">查看学习进度</a></div></div>`;
};

const startDaily = (vocabIndex, grammar, quotes) => {
  const stage = requestedStage === "advanced" ? "advanced" : "foundation";
  const stageLabel = stage === "advanced" ? "大三大四" : "大一大二";
  const date = new Date().toISOString().slice(0, 10);
  const stageEntries = vocabIndex.items.filter((item) => item.stage === stage).sort((a, b) => a.stageRank - b.stageRank);
  const state = getState();
  const byId = new Map(stageEntries.map((item) => [item.id, item]));
  const dueEntries = getDueReview(state)
    .filter((item) => item.kind === "vocab" && item.stage === stage && item.lexiconId)
    .map((item) => byId.get(item.lexiconId))
    .filter(Boolean)
    .slice(0, 8);
  const dueIds = new Set(dueEntries.map((item) => item.id));
  const newEntries = stageEntries
    .filter((item) => !state.mastery[`vocab-${item.id}`] && !dueIds.has(item.id))
    .slice(0, 12);
  const entries = [...dueEntries, ...newEntries];
  const theme = { id: `daily-${stage}`, label: `${stageLabel}核心词汇`, usageFocus: "按到期复习与词频顺序推进。", entries };
  const grammarTopics = grammar.structure.filter((group) => group.stage.includes(stageLabel)).flatMap((group) => group.topics);
  const topic = grammarTopics[hashText(`${date}-${stage}-grammar`) % grammarTopics.length];
  const quote = quotes.items[hashText(`${date}-quote`) % quotes.items.length];
  const dueCopy = dueEntries.length ? `${dueEntries.length} 个到期复习词 + ` : "";
  setHeadings("TODAY'S SPRINT", "今日任务", `${stageLabel} · ${dueCopy}${newEntries.length} 个新词、1 条语法和即时自测。`);
  if (!entries.length) {
    lessonPanel.innerHTML = `<div class="session-complete"><span class="tag">词汇阶段完成</span><h2>本阶段词汇已经全部进入学习记录</h2><p>今天没有到期词汇，可以继续语法训练。</p><div class="actions"><a class="primary" href="grammar.html?stage=${stage}">继续语法</a><a class="secondary" href="progress.html">查看进度</a></div></div>`;
    return;
  }
  renderVocabSession(theme, { stage, count: entries.length, daily: true, fixed: true, onComplete: (vocabResult) => renderGrammarTopic(topic, { stage, daily: true, onComplete: (grammarResult) => renderDailyComplete({ stage, vocabResult, grammarResult, quote }) }) });
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
    const vocab = await loadJson("data/vocab-index.json");
    if (kind === "vocab") {
      const stage = requestedStage === "advanced" ? "advanced" : "foundation";
      const stageLabel = stage === "advanced" ? "大三大四" : "大一大二";
      const stageEntries = vocab.items.filter((item) => item.stage === stage);
      const selected = requestedWord ? stageEntries.filter((item) => item.id === requestedWord) : stageEntries.filter((item) => !requestedSlug || item.theme === requestedSlug);
      const entries = selected.length ? selected : stageEntries;
      const theme = { id: requestedSlug || stage, label: requestedSlug ? "主题词汇" : `${stageLabel}词汇`, usageFocus: "结合释义、词形、搭配和例句主动回忆。", entries };
      renderVocabSession(theme, { stage, count: requestedWord ? 1 : 12, fixed: Boolean(requestedWord) });
      return;
    }
    const [grammar, quotes] = await Promise.all([loadJson("data/grammar-library.json"), loadJson("data/classic-quotes.json")]);
    startDaily(vocab, grammar, quotes);
  } catch (error) {
    lessonPanel.innerHTML = `<div class="empty">学习内容暂时没有加载成功，请刷新页面再试。<br><small>${escapeHtml(error.message)}</small></div>`;
  }
};

start();
