import { esc, html } from "./text.js";

export function repositoryUrl(config, location = window.location) {
  if (config.repository) {
    try {
      const url = new URL(config.repository);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "github.com" ||
        !/^\/[^/]+\/[^/]+\/?$/.test(url.pathname)
      )
        return null;
      return url.origin + url.pathname.replace(/\/$/, "");
    } catch {
      return null;
    }
  }
  if (!location.hostname.endsWith(".github.io")) return null;
  const owner = location.hostname.slice(0, -".github.io".length);
  const first = location.pathname.split("/").filter(Boolean)[0];
  const project = first === "index.html" ? null : first;
  return `https://github.com/${owner}/${project || `${owner}.github.io`}`;
}

export function mountFooter(root, config) {
  const repository = repositoryUrl(config);
  const author = config.authorUrl
    ? html`
        <a href="${esc(config.authorUrl)}" target="_blank" rel="noopener noreferrer">
          ${esc(config.author)}
        </a>
      `
    : esc(config.author);
  root.querySelector(".ca-footer").innerHTML = html`
    <div class="ca-footer-author">
      <span>${author}</span>
      <span>${esc(config.affiliation)}</span>
    </div>
    <div class="ca-footer-links">
      <span title="Website release, not an annotation review date">
        v${esc(config.version)}
      </span>
      <time datetime="${esc(config.releasedOn)}">${esc(config.releasedOn)}</time>
      ${
        repository
          ? html`
              <a href="${repository}" target="_blank" rel="noopener noreferrer">
                Repository
              </a>
              <a
                href="${repository}/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Suggest a correction
              </a>
            `
          : ""
      }
    </div>
  `;
}
