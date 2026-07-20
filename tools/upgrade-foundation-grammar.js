const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const grammarPath = path.join(root, "data", "grammar-library.json");
const grammarQuestionsPath = path.join(root, "data", "questions", "grammar_mcq.json");
const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));
const bank = JSON.parse(fs.readFileSync(grammarQuestionsPath, "utf8")).items;

const usedBankIds = new Set();
const rotate = (items, offset) => items.map((_, index) => items[(index + offset) % items.length]);

const pickBankQuestion = (topic, topicIndex) => {
  const tags = new Set(topic.tags || []);
  const candidates = bank.filter((item) => !usedBankIds.has(item.id) && (item.tags || []).some((tag) => tags.has(tag)));
  if (!candidates.length) return null;
  const selected = candidates[topicIndex % candidates.length];
  usedBankIds.add(selected.id);
  return selected;
};

const buildAnalysisExercise = (topic, topicIndex) => {
  const example = String(topic.examples?.[0] || "").split("｜")[0];
  const ruleLead = String(topic.unitShape?.[0] || topic.rule).split("。")[0];
  const mistake = String(topic.commonMistake || "机械套用规则").replace(/[。；]$/u, "");
  const correctOption = `${ruleLead}；例句中的相关形式使用正确。`;
  const options = rotate([
    correctOption,
    `例句应按“${mistake}”处理，当前写法不成立。`,
    `该例句只涉及词义，与“${topic.title}”没有语法关系。`
  ], topicIndex % 3);
  return {
    type: "analysis_mcq",
    question: `分析例句“${example}”。哪一项对“${topic.title}”的说明最准确？`,
    options,
    answer: options.indexOf(correctOption),
    explanation: `${topic.rule} 易错点：${topic.commonMistake}`
  };
};

let foundationIndex = 0;
for (const group of grammar.structure) {
  for (const topic of group.topics) {
    if (!topic.id.startsWith("grammar-")) continue;
    const bankItem = pickBankQuestion(topic, foundationIndex);
    if (bankItem) {
      const options = rotate(bankItem.options, foundationIndex % bankItem.options.length);
      topic.exercise = {
        type: "application_mcq",
        question: bankItem.prompt,
        options,
        answer: options.indexOf(bankItem.answer),
        explanation: bankItem.explanation
      };
    } else {
      topic.exercise = buildAnalysisExercise(topic, foundationIndex);
    }
    const example = String(topic.examples?.[0] || "").split("｜")[0];
    topic.application = {
      prompt: `请仿照例句，用“${topic.title}”规则另写一个完整德语句子。`,
      modelAnswer: example,
      checklist: ["目标结构完整", "词形和语序正确", "首字母与标点正确"]
    };
    foundationIndex += 1;
  }
}

fs.writeFileSync(grammarPath, `${JSON.stringify(grammar, null, 2)}\n`);
console.log(`Upgraded ${foundationIndex} foundation grammar topics; ${usedBankIds.size} use application questions from the practice bank.`);
