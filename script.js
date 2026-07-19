const navLinks = document.querySelectorAll(".nav-link");
const sections = ["today", "vocab", "grammar", "review", "progress"].map((id) =>
  document.getElementById(id)
);

const setActiveLink = () => {
  let current = null;
  sections.forEach((section) => {
    if (section && section.getBoundingClientRect().top <= 130) {
      current = section;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      current ? link.getAttribute("href") === `#${current.id}` : false
    );
  });
};

const showTemplateHint = (message) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2200);
};

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    const label = button.textContent.trim();
    if (label === "开始今日任务" || label === "进入背词") {
      document.getElementById("vocab")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (label === "查看语法" || label === "打开讲解") {
      document.getElementById("grammar")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    showTemplateHint("这个按钮已预留，接入词库后会变成真实功能。");
  });
});

window.addEventListener("scroll", setActiveLink, { passive: true });
setActiveLink();
