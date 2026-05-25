# Core

- Chrome MV3 extension for local phishing-risk hints on unread Gmail/Outlook rows already visible in the current page.
- Runtime source root: `extension/`; package output: `dist/gmail-guard-<manifest version>.zip` from `npm run package`.
- Browser-local invariant: no backend, OAuth, Gmail API, Microsoft Graph API, analytics, external AI, remote code, or network requests.
- Email-state invariant: extension only reads visible DOM row text and renders hints; it must not delete, move, label, archive, mark read/unread, send, or forward mail.
- Important source map: `extension/manifest.json`, `extension/src/rules.js`, `extension/src/content.js`, `extension/src/background.js`, `extension/options.*`, `extension/popup.*`.
- Release/store docs must stay aligned with behavior: `docs/PRIVACY.md`, `docs/REVIEW_NOTES.md`, `docs/STORE_LISTING.md`.
- See project technology details in `mem:tech_stack`, commands in `mem:suggested_commands`, local coding constraints in `mem:conventions`, and done checks in `mem:task_completion`.