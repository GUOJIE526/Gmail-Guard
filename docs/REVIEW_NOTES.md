# Chrome Web Store Review Notes

This extension has one purpose: show local phishing-risk hints for unread messages on the current Gmail or Outlook page.

Technical notes for review:

- Manifest V3 extension.
- Runs only on configured Gmail and Outlook Web mail pages.
- Uses no remote code.
- Uses no external scripts, fonts, CSS, or images.
- Makes no network requests by default.
- Optional URL reputation checks can be enabled by the user. When enabled, the extension sends only external URLs extracted from currently visible or explicitly opened mail-page content to Google Safe Browsing API.
- Uses no Gmail API, Microsoft Graph API, OAuth, cookies permission, tabs permission, webRequest permission, scripting permission, or identity permission.
- Uses Chrome `storage` for preferences, local Safe Browsing API key storage when provided by the user, and Safe Browsing API response cache entries.
- Does not modify email state. It does not delete, move, label, archive, mark read/unread, send, or forward messages.
- Does not collect, sell, or share user data with the developer. Optional Safe Browsing API checks send only extracted external URLs to Google when the user enables the feature.

The extension reads only currently loaded Gmail or Outlook DOM rows marked as unread on the current mail page and checks sender, subject, snippet text, and visible external URLs using local rules. It does not scan across mail pages or the full mailbox. It then adds visual indicators in the current mail page and a local floating summary panel.
