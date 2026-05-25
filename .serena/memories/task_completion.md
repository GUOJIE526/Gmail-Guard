# Task Completion

- For most code changes: run `npm run test` and `npm run validate`.
- For rules changes: ensure `tests/rules.test.cjs` covers changed scoring/parsing behavior, then run `npm run test`.
- For manifest, permissions, host matches, privacy, or network-related changes: run `npm run validate` and update `docs/PRIVACY.md`, `docs/REVIEW_NOTES.md`, and/or `docs/STORE_LISTING.md` as needed.
- For content-script or UI changes: manually load `extension/` in Chrome Developer mode and verify supported Gmail/Outlook hosts, panel behavior, badges, settings persistence, and no email-state mutation.
- For icon changes: run `npm run icons`, then include generated `extension/assets/icon-*.png` only if intentional.
- For release/package work: run `npm run package`; note it recreates `dist/`.
- After Serena onboarding/memory edits, the user can run `serena memories check` from the project root.