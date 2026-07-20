const STORE_KEY = "deutsch-sprint-learning-v2";
const LEGACY_STORE_KEY = "deutsch-sprint-learning-v1";
const STAGE_KEY = "deutsch-sprint-stage";

const freshState = () => ({
  version: 2,
  completed: 0,
  correct: 0,
  sessions: 0,
  review: [],
  recent: [],
  days: {},
  byStage: {
    foundation: { completed: 0, correct: 0 },
    advanced: { completed: 0, correct: 0 }
  },
  byKind: {},
  mastery: {}
});

const normalizeState = (stored = {}) => {
  const base = freshState();
  return {
    ...base,
    ...stored,
    review: Array.isArray(stored.review) ? stored.review : [],
    recent: Array.isArray(stored.recent) ? stored.recent : [],
    days: stored.days || {},
    byStage: { ...base.byStage, ...(stored.byStage || {}) },
    byKind: stored.byKind || {},
    mastery: stored.mastery || {}
  };
};

const getState = () => {
  try {
    const current = localStorage.getItem(STORE_KEY);
    if (current) return normalizeState(JSON.parse(current));
    const legacy = localStorage.getItem(LEGACY_STORE_KEY);
    if (legacy) {
      const migrated = normalizeState(JSON.parse(legacy));
      localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return freshState();
};

const saveState = (state) => localStorage.setItem(STORE_KEY, JSON.stringify(normalizeState(state)));
const getPreferredStage = () => localStorage.getItem(STAGE_KEY) === "advanced" ? "advanced" : "foundation";
const setPreferredStage = (stage) => {
  const normalized = stage === "advanced" ? "advanced" : "foundation";
  localStorage.setItem(STAGE_KEY, normalized);
  return normalized;
};

const dayKey = (timestamp = Date.now()) => new Date(timestamp).toISOString().slice(0, 10);
const accuracyFor = (record = {}) => record.completed ? Math.round((record.correct / record.completed) * 100) : 0;

const addResult = (item, correct) => {
  const state = getState();
  const now = Date.now();
  const stage = item.stage === "advanced" ? "advanced" : item.stage === "foundation" ? "foundation" : getPreferredStage();
  const kind = item.kind || "practice";
  const previous = state.mastery[item.id] || { attempts: 0, correct: 0, strength: 0 };
  const strength = correct ? Math.min(previous.strength + 1, 5) : 0;
  const intervals = [0, 1, 3, 7, 14, 30];
  const dueAt = correct ? now + intervals[strength] * 86400000 : now;
  const normalizedItem = { ...item, stage, kind, dueAt };

  state.completed += 1;
  if (correct) state.correct += 1;
  state.byStage[stage] = state.byStage[stage] || { completed: 0, correct: 0 };
  state.byStage[stage].completed += 1;
  if (correct) state.byStage[stage].correct += 1;
  state.byKind[kind] = state.byKind[kind] || { completed: 0, correct: 0 };
  state.byKind[kind].completed += 1;
  if (correct) state.byKind[kind].correct += 1;
  state.days[dayKey(now)] = (state.days[dayKey(now)] || 0) + 1;
  state.mastery[item.id] = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    strength,
    lastAt: now,
    dueAt
  };

  if (correct) {
    state.review = state.review.filter((entry) => entry.id !== item.id);
  } else {
    const existingIndex = state.review.findIndex((entry) => entry.id === item.id);
    if (existingIndex >= 0) state.review.splice(existingIndex, 1);
    state.review.unshift(normalizedItem);
  }
  state.recent.unshift({ ...normalizedItem, correct, at: now });
  state.recent = state.recent.slice(0, 60);
  saveState(state);
  return state;
};

const completeSession = ({ stage = getPreferredStage(), kind = "daily", completed = 0, correct = 0 } = {}) => {
  const state = getState();
  state.sessions += 1;
  state.recent.unshift({ id: `session-${Date.now()}`, title: "完成一轮学习", detail: `${stage === "advanced" ? "大三大四" : "大一大二"} · ${kind}`, stage, kind: "session", completed, correct, at: Date.now() });
  state.recent = state.recent.slice(0, 60);
  saveState(state);
  return state;
};

const removeReview = (id) => {
  const state = getState();
  state.review = state.review.filter((item) => item.id !== id);
  saveState(state);
  return state;
};

const clearLearningState = () => {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(LEGACY_STORE_KEY);
};
