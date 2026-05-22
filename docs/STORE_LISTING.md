# Chrome Web Store Listing Draft

## Name

Gmail Guard

## Short Description

Local phishing-risk hints for unread messages on the current Gmail page.

## Detailed Description

Gmail Guard scans only the unread messages currently loaded on your current Gmail page and highlights messages that may deserve extra caution.

It checks sender/domain clues, brand impersonation patterns, urgent account-verification wording, payment and refund wording, prize or gift-card language, risky file wording, and other common phishing signals.

The extension is designed for quiet, on-demand protection. It runs when you open Gmail and does not send daily reminders.

Privacy-first behavior:

- Runs only on `mail.google.com`
- Scans only the current Gmail page
- Uses local browser-side rules
- Does not use Gmail API or OAuth
- Does not send email content to a server
- Does not use analytics, ads, tracking, or external AI services
- Does not delete, move, label, or modify emails

Important limitation: because this version intentionally avoids Gmail API access, it only analyzes unread Gmail rows that are currently loaded on the current Gmail page. It does not scan across Gmail pages or the full mailbox. The scan limit is an upper bound for the current page, not a mailbox-wide fetch count.

## Single Purpose

Show phishing-risk hints for unread messages on the current Gmail page using local browser-only analysis.

## Permissions Justification

### `storage`

Used only to save extension preferences, such as whether to show the floating panel, whether to highlight suspicious rows, scan limit, and risk threshold.

### `https://mail.google.com/*` content script match

Required so the extension can read the current Gmail page content already visible in the user's browser and display phishing-risk hints in Gmail. The extension does not request access to other websites.

## Privacy Practices Suggested Answers

Use these only after confirming they still match the final submitted code:

- Does the extension collect user data? No.
- Does the extension sell or share user data? No.
- Does the extension use data for advertising? No.
- Does the extension transfer user data to third parties? No.
- Does the extension allow humans to read user data? No.
- Does the extension transmit user data off device? No.

## Store Assets Still Needed

Before publishing, prepare:

- 128x128 store icon, already generated in `extension/assets/icon-128.png`
- At least one screenshot of the extension running in Gmail
- Developer support email or support URL
- Public privacy policy URL. The content can be based on `docs/PRIVACY.md`
- Final category selection in the Chrome Web Store Developer Dashboard
