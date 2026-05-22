# Gmail Guard

Gmail Guard is a Chrome extension that helps Gmail users notice suspicious unread messages before opening them.

用途很單純：在 Gmail 畫面上提醒哪些未讀信可能有 phishing risk，讓使用者在點開信件前多一層提醒。

## Product Purpose

Gmail Guard is built for people who receive many Gmail messages and want a lightweight safety check before opening unread mail.

The extension scans unread messages that are already visible on the current Gmail page and highlights messages that may look suspicious because of sender/domain clues, brand impersonation wording, urgent account-verification language, payment/refund wording, prize or gift-card lures, or risky file wording.

它的目的不是幫使用者管理信箱，也不是自動判定信件安全與否；it is a warning layer that helps suspicious messages stand out before the user clicks.

## Local Install

Requirements:

- Chrome `114` or newer
- Node.js
- PowerShell, if running the icon script on Windows

From the project root:

```powershell
npm run icons
```

Then install it in Chrome:

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `extension` folder in this project.
6. Open Gmail at `https://mail.google.com/`.

安裝完成後，Gmail 頁面右下角會出現 Gmail Guard summary panel。

## How To Use

Open Gmail and stay on the inbox or any Gmail list page that contains unread messages.

Gmail Guard will scan unread rows that are currently loaded on the page. If a message meets the selected risk threshold, the extension can:

- Add a small badge beside the Gmail row.
- Show the suspicious item in the floating summary panel.
- Show a score and short reason so you know why it was flagged.

Panel buttons:

- `Scan`: scan the current Gmail page again.
- `Options`: open extension settings.
- `+` / `-`: expand or collapse the panel.

如果你切換 Gmail 分頁、翻頁、搜尋、或捲動後載入更多信件，可以按 `Scan` 重新掃描目前畫面。

## Settings

Open settings from the extension popup or the Gmail Guard panel.

Available settings:

- Show or hide the floating summary panel.
- Highlight suspicious unread rows in Gmail.
- Collapse the panel by default.
- Choose the risk threshold: low, medium, or high.
- Set the scan limit for unread rows currently loaded on the page.

注意：scan limit 是「目前頁面已載入未讀列」的上限，不是整個信箱的讀取數量。例如 scan limit 是 `100`，但 Gmail 目前只載入 `50` 封未讀信，Gmail Guard 只會掃描那 `50` 封。

## Privacy

Gmail Guard runs locally in the browser.

It does not:

- Use Gmail API.
- Request OAuth.
- Send email content to a server.
- Use analytics, ads, tracking, or external AI services.
- Read other websites.
- Delete, move, label, archive, mark read/unread, send, or forward email.

它只讀取目前 Gmail 頁面已經顯示在瀏覽器裡的內容，並在同一個 Gmail 頁面上顯示提醒。
