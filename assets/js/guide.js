import { esc, html } from "./text.js";
export function mountGuide(root, vocab, closePopover) {
  const guideButton = document.createElement("button");
  guideButton.type = "button";
  guideButton.className = "ca-guide-button";
  guideButton.textContent = "?";
  guideButton.setAttribute("aria-label", "Open label guide");
  guideButton.title = "Label guide";
  guideButton.setAttribute("aria-haspopup", "dialog");
  guideButton.setAttribute("aria-controls", "ca-label-guide");
  root.append(guideButton);
  const guide = document.createElement("dialog");
  guide.id = "ca-label-guide";
  guide.className = "ca-guide";
  guide.setAttribute("aria-labelledby", "ca-guide-title");
  const definitionOptions = Object.entries(vocab)
    .map(
      ([k, v]) => html`
        <option value="${k}">${esc(v.label)}</option>
      `,
    )
    .join("");
  guide.innerHTML = html`
    <div class="ca-guide-heading">
      <h2 id="ca-guide-title">Label guide</h2>
      <button type="button" data-guide-close aria-label="Close label guide">×</button>
    </div>
    <div class="ca-guide-tabs" role="tablist" aria-label="Guide sections">
      <button
        type="button"
        role="tab"
        id="ca-def-tab"
        aria-selected="true"
        aria-controls="ca-def-panel"
        data-guide-tab="definitions"
      >
        Properties
      </button>
      <button
        type="button"
        role="tab"
        id="ca-state-tab"
        aria-selected="false"
        aria-controls="ca-state-panel"
        tabindex="-1"
        data-guide-tab="states"
      >
        Review states
      </button>
    </div>
    <section id="ca-def-panel" role="tabpanel" aria-labelledby="ca-def-tab">
      <label class="ca-guide-select-label" for="ca-definition-select">
        Choose a property
      </label>
      <select id="ca-definition-select">
        ${definitionOptions}
      </select>
      <div class="ca-definition-copy" aria-live="polite"></div>
    </section>
    <section id="ca-state-panel" role="tabpanel" aria-labelledby="ca-state-tab" hidden>
      <dl class="ca-state-list">
        <dt>Documented</dt>
        <dd>Supported by the cited sources.</dd>
        <dt>Configuration dependent</dt>
        <dd>Depends on the setup or variant.</dd>
        <dt>Not established</dt>
        <dd>The reviewed sources did not confirm it. It may still be present.</dd>
        <dt>Not assessed</dt>
        <dd>Not yet reviewed.</dd>
        <dt>Not applicable</dt>
        <dd>Does not apply to this resource’s scope.</dd>
        <dt>Conflicting evidence</dt>
        <dd>The reviewed sources disagree.</dd>
      </dl>
    </section>
    <p class="ca-guide-footnote">
      For citations, open Sources and provenance in a dataset’s details.
    </p>
  `;
  const selectDefinition = guide.querySelector("#ca-definition-select");
  const showDefinition = () => {
    const v = vocab[selectDefinition.value];
    guide.querySelector(".ca-definition-copy").innerHTML = html`
      <h3>${esc(v.label)}</h3>
      <p>${esc(v.definition)}</p>
    `;
  };
  selectDefinition.addEventListener("change", showDefinition);
  showDefinition();
  const guideTabs = [...guide.querySelectorAll("[data-guide-tab]")];
  function switchGuideTab(tab) {
    guideTabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      guide.querySelector("#" + t.getAttribute("aria-controls")).hidden = !active;
    });
  }
  guideTabs.forEach((tab, i) => {
    tab.addEventListener("click", () => switchGuideTab(tab));
    tab.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next = guideTabs[e.key === "Home" ? 0 : e.key === "End" ? 1 : 1 - i];
        switchGuideTab(next);
        next.focus();
      }
    });
  });
  root.append(guide);
  guideButton.addEventListener("click", () => {
    closePopover();
    guide.showModal();
  });
  guide
    .querySelector("[data-guide-close]")
    .addEventListener("click", () => guide.close());
  guide.addEventListener("click", (e) => {
    if (e.target === guide) {
      const r = guide.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        guide.close();
    }
  });
  guide.addEventListener("close", () => guideButton.focus());
}
