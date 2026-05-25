# Suggested Commands

Run from repo root in PowerShell.

- `npm run test` - Node tests for rule scoring and parsing helpers.
- `npm run validate` - manifest/safety validator; checks permissions, content-script matches, icons, remote script usage, eval/new Function, forbidden Chrome APIs, and network APIs.
- `npm run icons` - regenerate `extension/assets/icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png`.
- `npm run package` - delete/recreate `dist/` and zip the `extension/` folder.
- `openspec list --json` - inspect active OpenSpec changes.
- `openspec list --specs --json` - inspect existing OpenSpec specs.
- `git status --short` - check uncommitted changes; expected generated/local outputs may include `dist/` or `.serena/` depending on current work.