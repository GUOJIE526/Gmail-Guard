# Chrome Web Store Review Notes

This extension has one purpose: show local phishing-risk hints for unread messages on the current Gmail page.

Technical notes for review:

- Manifest V3 extension.
- Runs only on `https://mail.google.com/*`.
- Uses no remote code.
- Uses no external scripts, fonts, CSS, images, or services.
- Uses no network requests.
- Uses no Gmail API, OAuth, cookies permission, tabs permission, webRequest permission, scripting permission, or identity permission.
- Uses Chrome `storage` only for local user preferences.
- Does not modify email state. It does not delete, move, label, archive, mark read/unread, send, or forward messages.
- Does not collect, transmit, sell, or share user data.

The extension reads only currently loaded Gmail DOM rows marked as unread on the current Gmail page and checks sender, subject, and snippet text using local rules. It does not scan across Gmail pages or the full mailbox. It then adds visual indicators in the Gmail page and a local floating summary panel.
