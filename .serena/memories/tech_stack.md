# Tech Stack

- Plain JavaScript/HTML/CSS Chrome extension; no bundler, transpiler, framework, or runtime backend.
- Manifest V3; `extension/manifest.json` declares only `storage` permission and content-script matches for Gmail/Outlook Web hosts.
- `extension/src/rules.js` uses a UMD-style wrapper: CommonJS export for Node tests and `globalThis.GmailUnreadPhishingGuardRules` for browser content scripts.
- Node is used for scripts/tests only: `scripts/validate-extension.mjs`, `tests/rules.test.cjs`.
- PowerShell scripts handle icons and packaging. `scripts/generate-icons.ps1` uses .NET `System.Drawing`; `scripts/package-extension.ps1` uses `Compress-Archive`.
- OpenSpec workspace exists under `openspec/`, with repo-local Codex OpenSpec skills under `.codex/skills/openspec-*`; specs/changes may be empty.