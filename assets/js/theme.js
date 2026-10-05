(() => {
  const root = document.documentElement;
  const preferenceKey = "causal-atlas-theme";
  let preference;
  try {
    preference = localStorage.getItem(preferenceKey);
  } catch {}
  root.dataset.theme = preference === "dark" ? "dark" : "light";

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector("[data-theme-toggle]");
    const updateLabel = () => {
      const dark = root.dataset.theme === "dark";
      const label = `Switch to ${dark ? "light" : "dark"} mode`;
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.title = label;
    };
    updateLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(preferenceKey, root.dataset.theme);
      } catch {}
      updateLabel();
    });
    const header = document.querySelector(".ca-header");
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  });
})();
