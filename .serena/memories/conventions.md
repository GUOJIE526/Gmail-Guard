# Conventions

- Keep `extension/src/rules.js` deterministic and browser-API-free; update `tests/rules.test.cjs` when changing scoring, brand/domain rules, parser helpers, issue titles, or risk labels.
- Keep content script order: `src/rules.js` before `src/content.js` in `extension/manifest.json`.
- Keep duplicated settings defaults in `extension/src/content.js` and `extension/options.js` synchronized.
- Preserve privacy and permission boundaries enforced by `scripts/validate-extension.mjs`; if intentionally expanding behavior, update validator plus privacy/store docs in the same change.
- `content.js` relies on Gmail/Outlook DOM selectors, accessibility labels, Shadow DOM panel host `gupg-panel-host`, badge class `gupg-row-badge`, and `data-gupg-risk`; prefer narrow selector changes and preserve provider-specific fallbacks.
- Manual browser verification is expected for content-script/UI changes because Node tests do not simulate Gmail/Outlook DOM.
- Treat `dist/` as generated output; do not edit packaged zip contents as source.
- Keep version/release metadata aligned between `package.json`, `extension/manifest.json`, README/store docs, and package names.