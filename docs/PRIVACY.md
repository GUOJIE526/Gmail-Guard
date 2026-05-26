# Privacy Policy

Effective date: 2026-05-22

Gmail Guard helps users identify suspicious unread messages on the current Gmail or Outlook page while using webmail in Chrome.

## Data Processed

When the user opens Gmail or Outlook, the extension reads only the current mail page content that is already loaded in the browser, including visible unread sender text, email/domain data when the page exposes it, subject text, and message snippets.

This data is used only to show phishing-risk hints to the user inside the current mail page.

## Data Collection

The extension does not collect, store, sell, transmit, or share email content, message metadata, browsing history, personal information, authentication information, or user activity.

The extension does not use a remote server, analytics, advertising, tracking pixels, external AI services, Gmail API, Microsoft Graph API, or OAuth.

By default, the extension makes no external network requests.

## Optional URL Reputation Checks

Users can opt in to Google Safe Browsing API URL reputation checks from the settings page. This feature is disabled by default.

When enabled, Gmail Guard checks only external URLs that it extracts from the currently visible or explicitly opened mail-page content. It sends those URLs to Google Safe Browsing API for reputation lookup. It does not send mailbox credentials, sender lists, full message bodies, unrelated browsing data, analytics, or account information.

Users must provide their own Safe Browsing API key. The key is stored in local Chrome storage on the user's device and is not sent to the developer.

Safe Browsing API results are used only as potential risk indicators. A "no match" response does not mean a message is safe.

## Local Settings

The extension uses Chrome storage to save user preferences such as whether to show the floating panel, whether to highlight rows, the risk threshold, and whether optional Safe Browsing API checks are enabled. If the user provides a Safe Browsing API key, it is stored locally in Chrome storage.

## Data Sharing

No user data is shared with the developer.

If the user enables Safe Browsing API checks, extracted external URLs are sent to Google Safe Browsing API for reputation lookup. This is optional and disabled by default.

## Limited Use Disclosure

The extension's use of information from Gmail or Outlook page content is limited to providing its single user-facing purpose: showing phishing-risk hints for unread messages on the current mail page. Except for optional user-enabled Safe Browsing API URL reputation checks, the extension does not transfer this information to any third party and does not use it for advertising or profiling.

The use of information received from Google services will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Contact

For privacy questions or support, contact:

support@lampstring.com
