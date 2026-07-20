const ciaEscape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const ciaField = (label, value, language = "") => value ? `<div class="cia-field"><dt>${ciaEscape(label)}</dt><dd ${language ? `lang="${language}"` : ""}>${ciaEscape(value)}</dd></div>` : "";
const ciaMarked = (value, marked) => marked ? `<strong class="cia-irregular" lang="de">${ciaEscape(value)}</strong>` : `<span lang="de">${ciaEscape(value)}</span>`;

const renderMorphology = (morphology) => {
  if (!morphology) return "";
  const rows = [];
  if (morphology.prefix) rows.push(ciaField("前缀 Präfix", `${morphology.prefix.form}：${morphology.prefix.meaning}${morphology.prefix.separable ? "（可分）" : ""}`));
  if (morphology.stem) rows.push(ciaField("词根 Stamm", `${morphology.stem.form}：${morphology.stem.meaning}`));
  if (morphology.suffix) rows.push(ciaField("后缀 Suffix", `${morphology.suffix.form}：${morphology.suffix.meaning}`));
  if (morphology.components?.length) rows.push(ciaField("复合词 Kompositum", morphology.components.map((part) => `${part.form}（${part.meaning}）`).join(" + ")));
  return `<dl class="cia-fields">${rows.join("")}</dl><div class="cia-logic"><strong>逻辑联想</strong><p>${ciaEscape(morphology.logic)}</p><small>${ciaEscape(morphology.note)}</small></div>`;
};

const renderMemory = (memory) => {
  if (!memory) return "";
  return `<div class="cia-memory">
    <div class="cia-life-hook"><strong>生活钩子</strong><p>${ciaEscape(memory.scene)}</p></div>
    <div><strong>开口触发</strong><p lang="de">${ciaEscape(memory.spokenCue)}</p></div>
    ${memory.englishBridge ? `<div><strong>英德桥</strong><p>${ciaEscape(memory.englishBridge)}</p></div>` : ""}
    <div><strong>别混 / 别裸背</strong><p>${ciaEscape(memory.contrast)}</p></div>
    <div class="cia-recall"><strong>立即回想</strong><p>${ciaEscape(memory.recallPrompt)}</p></div>
  </div>`;
};

const renderApplication = (entry) => {
  const application = entry.cia?.application || {};
  const conjugation = application.conjugation;
  let forms = "";
  if (conjugation) {
    forms = `<div class="cia-conjugation"><h4>动词变位 <span>Konjugation</span></h4><div class="cia-form-grid">
      <div><small>ich</small>${ciaMarked(conjugation.present.ich, conjugation.irregular.ich)}</div>
      <div><small>du</small>${ciaMarked(conjugation.present.du, conjugation.irregular.du)}</div>
      <div><small>er / sie / es</small>${ciaMarked(conjugation.present.er, conjugation.irregular.er)}</div>
      <div><small>Präteritum</small>${ciaMarked(conjugation.preterite, conjugation.irregular.preterite)}</div>
      <div><small>Partizip II</small>${ciaMarked(conjugation.participle, conjugation.irregular.participle)}</div>
    </div>${conjugation.source !== "german_verbs_dict" ? '<p class="cia-source-note">规则生成变位，尚待人工复核。</p>' : ""}</div>`;
  } else if (application.nounForms) {
    forms = `<div class="cia-conjugation"><h4>名词词形 <span>Formen</span></h4><div class="cia-form-grid noun-forms">
      <div><small>Artikel</small><span lang="de">${ciaEscape(application.nounForms.article || "—")}</span></div>
      <div><small>Plural</small><span lang="de">${ciaEscape(application.nounForms.plural || "—")}</span></div>
      <div><small>Genitiv</small><span lang="de">${ciaEscape(application.nounForms.genitive || "—")}</span></div>
    </div></div>`;
  }
  const valency = application.valency ? `<div class="cia-valency"><strong>语法 / 配价 <span>Grammatik / Valenz</span></strong><p lang="de">${ciaEscape(application.valency)}</p></div>` : "";
  const example = application.example ? `<blockquote class="cia-example"><p lang="de">${ciaEscape(application.example)}</p><footer>${ciaEscape(application.translation)}</footer></blockquote>` : "";
  return `${forms}${valency}${example}`;
};

window.renderCiaCard = (entry, options = {}) => {
  const cia = entry.cia;
  if (!cia) return "";
  const stressNote = /[ˈˌ]/.test(cia.ipa || "") ? " · ˈ 标出主重音" : "";
  const header = options.showHeader === false ? "" : `<header class="cia-head"><div><p class="cia-method">C-I-A WORTKARTE</p><h3 lang="de">${ciaEscape(cia.title)}</h3><p class="cia-pronunciation">${cia.ipa ? ciaEscape(cia.ipa) : "IPA 待人工核对"}${stressNote}</p></div><button class="cia-speak" type="button" data-pronounce="${ciaEscape(entry.term)}">播放发音</button></header>`;
  return `<div class="cia-card${options.compact ? " cia-card-compact" : ""}">${header}
    <section class="cia-section cia-core"><span class="cia-letter">C</span><div><p class="cia-section-name">Core · 核心</p><h4>${ciaEscape(cia.core.zh)}</h4>${cia.core.en ? `<p class="cia-english">${ciaEscape(cia.core.en)}</p>` : ""}</div></section>
    <section class="cia-section cia-interlink"><span class="cia-letter">I</span><div><p class="cia-section-name">Interlink · 构词与联想</p>${renderMorphology(cia.morphology)}${renderMemory(cia.memory)}</div></section>
    <section class="cia-section cia-application"><span class="cia-letter">A</span><div><p class="cia-section-name">Application · 应用</p>${renderApplication(entry)}</div></section>
  </div>`;
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pronounce]");
  if (!button || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(button.dataset.pronounce.replace(/^(der|die|das)\s+/i, ""));
  utterance.lang = "de-DE";
  utterance.rate = 0.82;
  const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("de"));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
});
