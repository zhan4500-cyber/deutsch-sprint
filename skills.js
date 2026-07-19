const results = document.querySelector("#skills-results");
const searchInput = document.querySelector("#skills-search");
const count = document.querySelector("#skills-count");
const cycle = document.querySelector("#assessment-cycle");
let data = null;
let activeFilter = "all";

const categoryFor = (skill) => {
  if (["听力", "阅读"].includes(skill)) return "input";
  if (["德译汉", "汉译德", "写作"].includes(skill)) return "output";
  return "knowledge";
};

const matches = (module, query) => [
  module.skill,
  module.title,
  ...module.units,
  ...(module.original_task_types || []),
  module.update_policy || ""
].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());

const renderModule = (module) => `
  <article class="skill-card">
    <span class="card-label">${module.skill} · ${module.priority}</span>
    <h3>${module.title}</h3>
    <ul class="skill-unit-list">${module.units.map((unit) => `<li>${unit}</li>`).join("")}</ul>
    ${module.original_task_types ? `<div class="task-block"><strong>训练任务</strong>${module.original_task_types.map((task) => `<span>${task}</span>`).join("")}</div>` : ""}
    ${module.update_policy ? `<p class="source-policy">${module.update_policy}</p>` : ""}
  </article>`;

const renderCycle = () => {
  const labels = { daily: "每天", weekly: "每周", monthly: "每月" };
  cycle.innerHTML = `<div class="cycle-heading"><p class="eyebrow">Assessment Cycle</p><h2>训练节奏</h2></div><div class="cycle-grid">${Object.entries(data.assessmentCycle).map(([key, items]) => `
    <div><strong>${labels[key]}</strong><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></div>`).join("")}</div>`;
};

const render = () => {
  const query = searchInput.value.trim();
  const visible = data.modules.filter((module) =>
    (activeFilter === "all" || categoryFor(module.skill) === activeFilter) && matches(module, query)
  );
  const skillOrder = [...new Set(visible.map((module) => module.skill))];
  results.innerHTML = skillOrder.map((skill) => {
    const modules = visible.filter((module) => module.skill === skill);
    return `<section class="result-section"><div class="result-heading"><h2>${skill}</h2><p>${modules.length} 个训练模块</p></div><div class="skill-grid">${modules.map(renderModule).join("")}</div></section>`;
  }).join("") || '<div class="empty-state">没有找到匹配模块，换一个关键词试试。</div>';
  count.textContent = visible.length;
};

document.querySelectorAll("[data-skill-filter]").forEach((button) => button.addEventListener("click", () => {
  activeFilter = button.dataset.skillFilter;
  document.querySelectorAll("[data-skill-filter]").forEach((item) => {
    const selected = item === button;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  render();
}));

searchInput.addEventListener("input", render);

fetch("data/skills-library.json").then((response) => {
  if (!response.ok) throw new Error("Skills data could not be loaded.");
  return response.json();
}).then((loaded) => {
  data = loaded;
  render();
  renderCycle();
}).catch(() => {
  results.innerHTML = '<div class="empty-state">能力模块暂时没有加载成功，请稍后刷新。</div>';
});
