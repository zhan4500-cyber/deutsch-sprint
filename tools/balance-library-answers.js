const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const write = (name, data) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");

const grammar = read("data/grammar-library.json");
const advancedTopics = grammar.structure
  .filter((group) => group.id.startsWith("advanced-"))
  .flatMap((group) => group.topics);
const grammarPositions = [1, 3, 0, 2];
const grammarCounts = [0, 0, 0, 0];

advancedTopics.forEach((topic, index) => {
  const exercise = topic.exercise;
  const currentAnswer = exercise.answer < exercise.options.length ? exercise.answer : exercise.options.length - 1;
  const correct = exercise.options[currentAnswer];
  const others = exercise.options.filter((_, optionIndex) => optionIndex !== currentAnswer);
  const preferred = grammarPositions[index % grammarPositions.length];
  const target = Array.from({ length: exercise.options.length }, (_, position) => position).sort((left, right) => {
    const countDifference = grammarCounts[left] - grammarCounts[right];
    if (countDifference) return countDifference;
    return ((left - preferred + 4) % 4) - ((right - preferred + 4) % 4);
  })[0];
  others.splice(target, 0, correct);
  exercise.options = others;
  exercise.answer = target;
  grammarCounts[target] += 1;
});

const skills = read("data/skill-lessons.json");
const skillPositions = [2, 0, 3, 1];
let skillIndex = 0;

for (const module of skills.modules) {
  for (const lesson of module.lessons) {
    for (const question of lesson.questions) {
      if (question.type !== "mcq") continue;
      const currentAnswer = question.answer < question.options.length ? question.answer : question.options.length - 1;
      const correct = question.options[currentAnswer];
      const others = question.options.filter((_, optionIndex) => optionIndex !== currentAnswer);
      const target = skillPositions[skillIndex % skillPositions.length];
      others.splice(target, 0, correct);
      question.options = others;
      question.answer = target;
      skillIndex += 1;
    }
  }
}

write("data/grammar-library.json", grammar);
write("data/skill-lessons.json", skills);
console.log(JSON.stringify({ advancedGrammar: advancedTopics.length, skillMcq: skillIndex }));
