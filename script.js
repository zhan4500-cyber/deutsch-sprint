const revealItems = document.querySelectorAll(".reveal-section");
const stageTabs = document.querySelectorAll(".stage-tab");
const stagePanels = document.querySelectorAll(".stage-detail");
const dailyLinks = document.querySelectorAll('a[href^="study.html?kind=daily"]');

const applyStage = (stage) => {
  const selected = setPreferredStage(stage);
  stageTabs.forEach((tab) => {
    const active = tab.dataset.stage === selected;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  stagePanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.stagePanel === selected));
  dailyLinks.forEach((link) => { link.href = `study.html?kind=daily&stage=${selected}`; });
};

stageTabs.forEach((button) => button.addEventListener("click", () => applyStage(button.dataset.stage)));
applyStage(getPreferredStage());

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}
