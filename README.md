# Gmail Guard

Gmail Guard is a Manifest V3 Chrome extension that runs only on Gmail and highlights suspicious unread messages on the current Gmail page using local browser-side rules.

The extension does not use Gmail API, OAuth, a remote server, analytics, or external AI services. It scans only the unread rows currently loaded on the current Gmail page and shows risk hints in Gmail itself.

## Project Layout

```text
extension/          Chrome Web Store package root
extension/src/      Content script and phishing rules
docs/               Store listing, privacy policy, review notes
scripts/            Validation, icon generation, ZIP packaging
tests/              Local rule tests
dist/               Generated ZIP output
```

## Local Install

1. Run `npm run icons` once to generate PNG icons.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `extension` folder in this project.
6. Open Gmail.

## Validation

```powershell
npm test
npm run validate
npm run package
```

`npm run package` creates a ZIP under `dist/` with `manifest.json` at the ZIP root, which is the format expected by Chrome Web Store upload.

## Privacy Position

This extension reads Gmail page content only in the user's browser to provide phishing-risk hints. It does not collect, store, sell, transmit, or share email content, message metadata, browsing history, or personal information.

See [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/STORE_LISTING.md](docs/STORE_LISTING.md) before publishing.

## Detection Scope

The first release focuses on unread messages visible on the current Gmail page. It checks sender display data, sender email/domain when Gmail exposes it, subject text, snippets, brand impersonation patterns, urgent credential language, payment language, suspicious top-level domains, and attachment/download wording.

Because it intentionally avoids Gmail API access, it cannot inspect every unread message across the mailbox and does not scan across Gmail pages. The scan limit is an upper bound for the current page, not a mailbox-wide fetch count. For example, if the scan limit is 100 but the current Gmail page has loaded only 50 unread rows, the extension can scan only those 50 rows.
