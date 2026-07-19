const STORE_KEY = "deutsch-sprint-learning-v1";
const freshState = () => ({ completed: 0, correct: 0, review: [], recent: [] });
const getState = () => { try { return { ...freshState(), ...JSON.parse(localStorage.getItem(STORE_KEY)) }; } catch { return freshState(); } };
const saveState = (state) => localStorage.setItem(STORE_KEY, JSON.stringify(state));
const addResult = (item, correct) => { const state = getState(); state.completed += 1; if (correct) state.correct += 1; if (!correct && !state.review.some((entry) => entry.id === item.id)) state.review.unshift(item); state.recent.unshift({ ...item, correct, at: Date.now() }); state.recent = state.recent.slice(0, 20); saveState(state); return state; };
const removeReview = (id) => { const state = getState(); state.review = state.review.filter((item) => item.id !== id); saveState(state); return state; };