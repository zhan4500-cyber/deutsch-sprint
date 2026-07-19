const revealItems = document.querySelectorAll(".reveal-section");
document.querySelectorAll(".stage-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".stage-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".stage-detail").forEach((panel) => panel.classList.toggle("active", panel.dataset.stagePanel === button.dataset.stage));
  });
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); } }), { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else revealItems.forEach((item) => item.classList.add("in-view"));