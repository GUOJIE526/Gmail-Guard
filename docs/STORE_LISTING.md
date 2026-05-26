# Chrome Web Store Listing Draft

## Name

Gmail Guard

## Short Description

Local phishing-risk hints for unread messages on the current Gmail or Outlook page.

## Detailed Description

Gmail Guard scans only the unread messages currently loaded on your current Gmail or Outlook page and highlights messages that may deserve extra caution.

It checks sender/domain clues, brand impersonation patterns, urgent account-verification wording, payment and refund wording, prize or gift-card language, risky file wording, optional Safe Browsing API URL reputation signals, and other common phishing signals.

The extension is designed for quiet, on-demand protection. It runs when you open Gmail or Outlook Web and does not send daily reminders.

Privacy-first behavior:

- Runs only on configured Gmail and Outlook Web mail pages
- Scans only the current mail page
- Uses local browser-side rules by default
- Optional Google Safe Browsing API URL reputation checks can be enabled by the user
- Does not use Gmail API, Microsoft Graph API, or OAuth
- Does not send email content to a server
- Sends extracted external URLs to Google Safe Browsing API only if the user enables URL reputation checks
- Does not use analytics, ads, tracking, or external AI services
- Does not delete, move, label, or modify emails

Important limitation: because this version intentionally avoids mail provider API access, it only analyzes unread Gmail or Outlook rows that are currently loaded on the current mail page. It does not scan across mail pages or the full mailbox. The scan limit is an upper bound for the current page, not a mailbox-wide fetch count. Safe Browsing API no-match results do not mean a message is safe.

## Single Purpose

Show phishing-risk hints for unread messages on the current Gmail or Outlook page using local browser-side analysis, with optional user-enabled Safe Browsing API URL reputation checks.

## Permissions Justification

### `storage`

Used to save extension preferences, such as whether to show the floating panel, whether to highlight suspicious rows, scan limit, risk threshold, optional Safe Browsing API enablement, user-provided Safe Browsing API key, and Safe Browsing response cache entries.

### `host_permissions`: `https://safebrowsing.googleapis.com/*`

Used only when the user enables optional URL reputation checks. The extension sends extracted external URLs to Google Safe Browsing API and uses the response as one risk signal. This feature is disabled by default.

### Gmail and Outlook content script matches

Required so the extension can read the current Gmail or Outlook page content already visible in the user's browser and display phishing-risk hints in the current mail page. The extension does not request access to other websites.

## Privacy Practices Suggested Answers

Use these only after confirming they still match the final submitted code:

- Does the extension collect user data? No.
- Does the extension sell or share user data? No.
- Does the extension use data for advertising? No.
- Does the extension transfer user data to third parties? No.
- Does the extension allow humans to read user data? No.
- Does the extension transmit user data off device? No by default. If the user enables optional Safe Browsing API checks, extracted external URLs are sent to Google Safe Browsing API.

## Store Assets Still Needed

Before publishing, prepare:

- 128x128 store icon, already generated in `extension/assets/icon-128.png`
- At least one screenshot of the extension running in Gmail or Outlook
- Developer support email or support URL
- Public privacy policy URL. The content can be based on `docs/PRIVACY.md`
- Final category selection in the Chrome Web Store Developer Dashboard
