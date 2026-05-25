# Repository Guidelines

<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order

1. `search_graph` - find functions, classes, routes, variables by pattern
2. `trace_path` - trace who calls a function or what it calls
3. `get_code_snippet` - read specific function/class source code
4. `query_graph` - run Cypher queries for complex patterns
5. `get_architecture` - high-level project summary

## When to fall back to grep/glob

- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results or this repo is not indexed

## Examples

- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->

## Project Shape

Gmail Guard is a Chrome Manifest V3 extension that shows local phishing-risk hints for unread messages already visible on Gmail or Outlook Web pages. It is intentionally browser-local: no backend, no OAuth, no Gmail API, no Microsoft Graph API, no analytics, no external AI service, and no network requests.

The source is plain JavaScript, HTML, CSS, and PowerShell. There is no bundler, transpiler, or framework layer. The deployed extension is the `extension/` folder, and `npm run package` produces a zip under `dist/`.

Key paths:

- `extension/manifest.json` - MV3 manifest, content script matches, permissions, version, icons.
- `extension/src/rules.js` - pure local phishing scoring rules. It exports both CommonJS for Node tests and `globalThis.GmailUnreadPhishingGuardRules` for the browser content script.
- `extension/src/content.js` - Gmail/Outlook DOM scanning, unread-row detection, badges, Shadow DOM floating panel, mutation observer, scan scheduling.
- `extension/src/background.js` - message bridge for opening the options page.
- `extension/options.*` - settings UI backed by `chrome.storage.sync`.
- `extension/popup.*` - small popup entry point for opening options.
- `scripts/validate-extension.mjs` - release safety validator for manifest scope, icons, remote code, forbidden APIs, and network APIs.
- `scripts/generate-icons.ps1` - generates extension icon PNGs with `System.Drawing`.
- `scripts/package-extension.ps1` - recreates `dist/` and zips the `extension/` folder.
- `tests/rules.test.cjs` - Node tests for rule scoring and parsing helpers.
- `docs/PRIVACY.md`, `docs/REVIEW_NOTES.md`, `docs/STORE_LISTING.md` - store and privacy claims that must stay aligned with code behavior.
- `store-assets/` - Chrome Web Store image assets; do not treat these as source for runtime behavior.
- `openspec/` and `.codex/skills/openspec-*` - OpenSpec workspace; currently specs/changes may be empty.

## Hard Product Boundaries

Preserve the single purpose: highlight suspicious unread messages on the current Gmail or Outlook page using local rules.

Do not add any of the following without explicit user approval and matching updates to validation, docs, privacy text, and store copy:

- Network calls, `fetch`, `XMLHttpRequest`, remote scripts, remote fonts, analytics, ads, tracking, or external AI.
- Gmail API, Microsoft Graph API, OAuth, cookies permission, `tabs`, `webRequest`, `scripting`, `identity`, or broad host access.
- Behavior that modifies email state, including delete, move, label, archive, mark read/unread, send, or forward.
- Scanning beyond rows already loaded in the current webmail page.

`scripts/validate-extension.mjs` encodes several of these boundaries. If a change intentionally expands the boundary, update the validator and the user-facing documents in the same change.

## Implementation Notes

Keep `extension/src/rules.js` deterministic and browser-API-free. Add or update `tests/rules.test.cjs` when changing scoring thresholds, brand rules, domain parsing, issue titles, or risk labels.

Keep content script order in `extension/manifest.json`: `src/rules.js` must load before `src/content.js`.

Settings defaults are duplicated in `extension/src/content.js` and `extension/options.js`; keep them in sync when adding or changing settings.

`content.js` depends on Gmail and Outlook DOM selectors and accessibility labels. Prefer narrow selector additions and preserve existing provider-specific fallbacks. Manual verification is expected for DOM-scanning changes because the Node test suite does not simulate Gmail or Outlook.

The floating panel is created in a Shadow DOM host with id `gupg-panel-host`; row badges use `gupg-row-badge` and the `data-gupg-risk` attribute. Avoid leaking extension UI text into the mail-row extraction logic; `isExtensionElement` and badge cleanup exist to reduce self-interference.

Version and release metadata should stay aligned between `package.json`, `extension/manifest.json`, README/store docs, and packaged zip names.

## Commands

Run from the repository root:

```powershell
npm run test
npm run validate
npm run icons
npm run package
```

Command meanings:

- `npm run test` runs the local rules tests.
- `npm run validate` checks extension manifest scope and prohibited APIs.
- `npm run icons` regenerates `extension/assets/icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png`.
- `npm run package` deletes/recreates `dist/` and writes `dist/gmail-guard-<manifest version>.zip`.

For most code changes, run at least `npm run test` and `npm run validate`. Run `npm run icons` only after icon/script changes. Run `npm run package` for release/package work.

## Manual Verification

For content-script or UI changes, load `extension/` through `chrome://extensions/` in Developer mode and test against supported hosts:

- `https://mail.google.com/*`
- `https://outlook.live.com/*`
- `https://outlook.office.com/*`
- `https://outlook.office365.com/*`
- `https://outlook.com/*`
- `https://www.outlook.com/*`

Verify that unread rows scan, badges appear only when threshold rules match, the panel opens/collapses/rescans, options persist, and no email state changes occur.

## Generated And Release Files

`dist/` is generated output. Do not edit packaged zip contents as source. `.gitignore` ignores `*.zip`, so release artifacts may be local-only unless the user asks otherwise.

Generated icons under `extension/assets/` are runtime assets and may be committed when intentionally changed. Store screenshots under `store-assets/` are submission assets, not executable extension code.

## OpenSpec

Use OpenSpec for larger behavior or policy changes, especially anything that affects extension purpose, permissions, privacy claims, supported mail providers, or scan semantics. Check current state with:

```powershell
openspec list --json
openspec list --specs --json
```

Validate OpenSpec changes before implementation/archive when a change exists.
