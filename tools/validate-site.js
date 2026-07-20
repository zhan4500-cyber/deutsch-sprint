const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const vocab = readJson("data/vocab-library.json");
const vocabEntries = vocab.stages.flatMap((stage) => stage.themes.flatMap((theme) => theme.entries.map((entry) => ({ ...entry, stage: stage.id, theme: theme.id }))));
assert(vocabEntries.length === 326, `Expected 326 vocabulary entries, got ${vocabEntries.length}`);
for (const entry of vocabEntries) {
  for (const field of ["term", "pos", "meaning", "collocation", "example", "translation", "cefr", "difficulty"]) assert(entry[field], `Vocabulary ${entry.term || entry.theme} is missing ${field}`);
}
assert(new Set(vocabEntries.map((entry) => `${entry.stage}:${entry.term}`)).size === vocabEntries.length, "Duplicate vocabulary term inside a stage");
const advancedVocab = vocabEntries.filter((entry) => entry.stage === "advanced");
assert(new Set(advancedVocab.map((entry) => entry.example)).size === advancedVocab.length, "Advanced vocabulary contains duplicate examples");
assert(advancedVocab.every((entry) => entry.sourceType === "original_context_example"), "Advanced vocabulary contains an unreviewed example type");

const vocabIndex = readJson("data/vocab-index.json");
assert(vocabIndex.items.length === 5000, `Expected 5000 indexed vocabulary items, got ${vocabIndex.items.length}`);
assert(vocabIndex.items.filter((entry) => entry.stage === "foundation").length >= 2400, "Foundation index must contain at least 2400 items");
assert(vocabIndex.items.filter((entry) => entry.stage === "advanced").length >= 2400, "Advanced index must contain at least 2400 items");
assert(vocabIndex.items.every((entry) => entry.richCard), "Every indexed vocabulary item must be a complete card");
assert(vocabIndex.items.filter((entry) => entry.curated).length >= 170, "Too few curated vocabulary cards survived the textbook-first rebuild");
assert(vocabIndex.items.filter((entry) => entry.textbookAligned).length >= 4800, "Vocabulary index is not sufficiently aligned with the four textbook indexes");
for (const book of [1, 2, 3, 4]) assert(vocabIndex.items.filter((entry) => entry.bookSources?.some((source) => source.book === book)).length >= 1000, `Textbook ${book} coverage is too small`);
assert(new Set(vocabIndex.items.map((entry) => entry.id)).size === vocabIndex.items.length, "Vocabulary index has duplicate IDs");
assert(!vocabIndex.items.some((entry) => entry.meaning.startsWith("英文释义：")), "Vocabulary index still contains English-only fallback meanings");
assert(!vocabIndex.items.some((entry) => entry.translationStatus === "open_dictionary"), "Vocabulary index still contains unsanitized English-pivot meanings");
assert(!vocabIndex.items.some((entry) => /(^|；)\s*(?:vt|vi|n|a|adv|adj)\./i.test(entry.meaning)), "Vocabulary index still contains dictionary part-of-speech noise");
assert(vocabIndex.items.filter((entry) => entry.translationStatus === "meaning_pending_review").length <= 250, "Too many textbook glosses still need review");
assert(vocabIndex.formCoverage?.pluralForms >= 2250, "Vocabulary index does not contain enough verified noun plural forms");
assert(vocabIndex.ciaCoverage?.ipa >= 4300, "C-I-A vocabulary does not contain enough IPA matches");
assert(vocabIndex.ciaCoverage?.conjugationDictionary >= 880, "C-I-A vocabulary does not contain enough dictionary conjugations");
for (const entry of vocabIndex.items) {
  for (const field of ["term", "stage", "cefr", "pos", "meaning", "usagePattern", "example", "exampleTranslation", "reviewStatus"]) assert(entry[field], `Indexed vocabulary ${entry.id} is missing ${field}`);
  assert(entry.exampleTranslationLanguage === "zh", `Indexed vocabulary ${entry.id} does not have a Chinese example translation`);
  assert(entry.cia?.title && entry.cia?.core?.zh && entry.cia?.morphology?.logic && entry.cia?.application?.example, `Indexed vocabulary ${entry.id} has an incomplete C-I-A card`);
  assert(entry.cia?.memory?.scene && entry.cia?.memory?.spokenCue && entry.cia?.memory?.contrast && entry.cia?.memory?.recallPrompt, `Indexed vocabulary ${entry.id} has an incomplete scene-memory card`);
  assert(["compound", "prefix", "suffix", "simple"].includes(entry.cia?.morphology?.type), `Indexed vocabulary ${entry.id} has an invalid morphology type`);
  if (entry.textbookAligned) assert(entry.bookSources?.length, `Textbook vocabulary ${entry.id} has no book/lesson source`);
  if (entry.cia?.application?.conjugation) {
    const conjugation = entry.cia?.application?.conjugation;
    assert(conjugation?.present?.ich && conjugation?.present?.du && conjugation?.present?.er && conjugation?.preterite && conjugation?.participle, `Indexed verb ${entry.id} has incomplete conjugation`);
    assert(!/\b(?:aus|an|auf|ein|mit|vor|zu) (?:mich|dich|sich)\b/.test(Object.values(conjugation?.present || {}).join(" ")), `Indexed verb ${entry.id} has incorrect reflexive word order`);
  }
}

const indexedByTerm = new Map(vocabIndex.items.map((entry) => [entry.term, entry]));
const fahrenCard = indexedByTerm.get("fahren")?.cia;
const vorbereitenCard = indexedByTerm.get("vorbereiten")?.cia;
assert(fahrenCard?.title === "fahren, fuhr, gefahren", "C-I-A sentinel: fahren lost its irregular forms");
assert(vorbereitenCard?.title === "sich vorbereiten, bereitete sich vor, vorbereitet", "C-I-A sentinel: sich vorbereiten has incorrect separable forms");
assert(vorbereitenCard?.application?.conjugation?.present?.ich === "bereite mich vor", "C-I-A sentinel: sich vorbereiten has incorrect reflexive word order");

const grammar = readJson("data/grammar-library.json");
const grammarTopics = grammar.structure.flatMap((group) => group.topics);
assert(grammarTopics.length === 117, `Expected 117 grammar topics, got ${grammarTopics.length}`);
for (const topic of grammarTopics) {
  assert(topic.examples?.length, `Grammar ${topic.id} has no example`);
  assert(topic.exercise?.options?.length >= 3, `Grammar ${topic.id} has no complete exercise`);
  assert(Number.isInteger(topic.exercise?.answer) && topic.exercise.answer >= 0 && topic.exercise.answer < topic.exercise.options.length, `Grammar ${topic.id} has an invalid answer`);
}
assert(!grammarTopics.some((topic) => topic.exercise.question.startsWith("下面哪组内容属于")), "Grammar library still contains placeholder recognition questions");
const foundationGrammar = grammarTopics.filter((topic) => topic.id.startsWith("grammar-"));
assert(!foundationGrammar.some((topic) => topic.exercise.question.includes("是否符合")), "Foundation grammar still contains yes/no recognition exercises");
assert(foundationGrammar.every((topic) => topic.application?.prompt && topic.application?.modelAnswer), "Foundation grammar is missing transfer exercises");
const answerPositions = foundationGrammar.reduce((counts, topic) => { counts[topic.exercise.answer] = (counts[topic.exercise.answer] || 0) + 1; return counts; }, {});
assert(Object.keys(answerPositions).length >= 3 && Object.values(answerPositions).every((count) => count >= 9), "Foundation grammar answer positions are not distributed");
const advancedGrammar = grammarTopics.filter((topic) => topic.id.startsWith("advanced-"));
const advancedAnswerPositions = advancedGrammar.reduce((counts, topic) => { counts[topic.exercise.answer] = (counts[topic.exercise.answer] || 0) + 1; return counts; }, {});
assert(Object.keys(advancedAnswerPositions).length === 3 && Object.values(advancedAnswerPositions).every((count) => count >= 9), "Advanced grammar answer positions are not distributed");

const quotes = readJson("data/classic-quotes.json");
assert(quotes.items.length >= 8, "Classic quote collection is too small");
for (const quote of quotes.items) {
  for (const field of ["quote", "translation", "author", "work", "focus"]) assert(quote[field], `Classic quote ${quote.id} is missing ${field}`);
}

const skills = readJson("data/skills-library.json");
const lessons = readJson("data/skill-lessons.json");
assert(skills.modules.length >= 16, `Expected at least 16 skill modules, got ${skills.modules.length}`);
assert(lessons.modules.length === skills.modules.length, "Skill outlines and lessons have different module counts");
for (const module of skills.modules) {
  const lessonModule = lessons.modules.find((item) => item.id === module.id);
  assert(lessonModule?.lessons?.length, `Skill ${module.id} has no lesson`);
  for (const item of lessonModule?.lessons || []) {
    assert(item.content?.length, `Lesson ${item.id} has no content`);
    if (!module.id.startsWith("foundation-")) assert(item.glossary?.length >= 4, `Lesson ${item.id} needs at least four glossary items`);
    assert(item.questions?.length >= (module.id.startsWith("foundation-") ? 1 : 4), `Lesson ${item.id} does not have enough questions`);
    for (const question of item.questions || []) {
      assert(question.prompt, `Lesson ${item.id} has an empty question`);
      if (question.type === "mcq") assert(question.options?.[question.answer], `Lesson ${item.id}/${question.id} has an invalid answer`);
      if (question.type === "open") assert(question.modelAnswer && question.checklist?.length, `Lesson ${item.id}/${question.id} has no model answer`);
    }
  }
}
assert(lessons.modules.find((module) => module.id === "foundation-dictation")?.lessons.length >= 12, "Foundation dictation course is incomplete");
assert(lessons.modules.find((module) => module.id === "foundation-writing")?.lessons.length >= 8, "Foundation writing course is incomplete");
const skillMcq = lessons.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.questions.filter((question) => question.type === "mcq")));
const skillAnswerPositions = skillMcq.reduce((counts, question) => { counts[question.answer] = (counts[question.answer] || 0) + 1; return counts; }, {});
assert(Object.keys(skillAnswerPositions).length === 4 && Math.max(...Object.values(skillAnswerPositions)) - Math.min(...Object.values(skillAnswerPositions)) <= 1, "Skill lesson answer positions are biased");

const bankDirectories = ["data/questions", "data/questions-advanced"];
let questionTotal = 0;
const allQuestionIds = new Set();
for (const directory of bankDirectories) {
  const manifest = readJson(`${directory}/manifest.json`);
  let directoryTotal = 0;
  for (const module of manifest.modules) {
    const data = readJson(module.path);
    assert(data.items.length === module.count, `${module.id} count does not match manifest`);
    directoryTotal += data.items.length;
    for (const item of data.items) {
      assert(!allQuestionIds.has(item.id), `Duplicate question id ${item.id}`);
      allQuestionIds.add(item.id);
      assert(item.prompt && item.answer && item.explanation, `Question ${item.id} is incomplete`);
      if (item.type === "mcq") assert(item.options.length === 4 && item.options.includes(item.answer), `Question ${item.id} has invalid options`);
    }
  }
  assert(directoryTotal === manifest.total, `${directory} total does not match manifest`);
  questionTotal += directoryTotal;
  const passageData = readJson(`${directory}/passages.json`);
  const passages = passageData.passages || [];
  assert(new Set(passages.map((item) => item.id)).size === passages.length, `${directory} has duplicate passage IDs`);
  if (directory.endsWith("questions-advanced")) assert(new Set(passages.map((item) => item.text)).size === passages.length, "Advanced bank has duplicate passage text");
  for (const passage of passages) assert(!/\{[a-zA-Z]+\}/.test(passage.text), `Passage ${passage.id} has an unresolved placeholder`);
}
assert(questionTotal === 16000, `Expected 16000 questions, got ${questionTotal}`);

const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith(".html"));
const localReferences = [];
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
  const matches = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const match of matches) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|#)/.test(reference)) continue;
    const target = reference.split(/[?#]/)[0];
    if (!target) continue;
    localReferences.push(`${htmlFile}:${target}`);
    assert(fs.existsSync(path.join(root, target)), `${htmlFile} points to missing ${target}`);
  }
  assert(!/href=""|href="#"/.test(html), `${htmlFile} contains an empty link`);
}

const publicFiles = fs.readdirSync(root).filter((name) => /\.(?:html|js|css|md)$/.test(name));
const publicText = publicFiles.map((name) => fs.readFileSync(path.join(root, name), "utf8")).join("\n");
assert(!/宁波大学|NINGBO UNIVERSITY/i.test(publicText), "Forbidden university branding found");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  htmlFiles: htmlFiles.length,
  localReferences: localReferences.length,
  vocabulary: vocabEntries.length,
  vocabularyIndex: vocabIndex.items.length,
  grammar: grammarTopics.length,
  skillModules: lessons.modules.length,
  skillQuestions: lessons.modules.flatMap((module) => module.lessons).reduce((sum, item) => sum + item.questions.length, 0),
  questions: questionTotal
}, null, 2));
