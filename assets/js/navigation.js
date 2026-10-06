export function mountNavigation(root) {
  const buttons = [...root.querySelectorAll("[data-page]")];
  const panels = [...root.querySelectorAll("[data-panel]")];
  const indicator = root.querySelector(".ca-nav-indicator");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  function moveIndicator() {
    const active = buttons.find((button) => button.getAttribute("aria-current") === "page");
    indicator.style.width = active.offsetWidth + "px";
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  for (const button of buttons) {
    button.addEventListener("click", () => {
      root.dispatchEvent(new Event("atlas:pagechange"));
      window.scrollTo({ top: 0, behavior: "instant" });
      buttons.forEach((item) => item === button
        ? item.setAttribute("aria-current", "page")
        : item.removeAttribute("aria-current"));
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.page; });
      moveIndicator();
      const panel = panels.find((item) => !item.hidden);
      if (!reduced.matches) panel.animate(
        [{ opacity: 0.5, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    });
  }
  new ResizeObserver(moveIndicator).observe(root.querySelector(".ca-nav"));
  document.fonts.ready.then(moveIndicator);
  moveIndicator();
  requestAnimationFrame(() => root.querySelector(".ca-nav").classList.add("ready"));
}
