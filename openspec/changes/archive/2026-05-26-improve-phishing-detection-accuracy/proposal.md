## 為什麼

目前 unread-message risk scoring 的 false positive 過高，原因是系統把正常交易語境，例如發票、付款、帳單、登入查看通知，當成風險訊號，但沒有足夠的 sender-domain confidence 來區分真實品牌通知與釣魚信。這在合法購物、發票、帳務通知中特別明顯，因為 Gmail 或 Outlook list row 有時只暴露 sender display name，沒有可解析的 email address。

## 變更內容

- 重新校準 local phishing rules，讓弱交易語境詞不會單獨把信件推到 default visible threshold。
- 新增 confidence-aware scoring，用來區分 verified/allowed sender domain、unknown sender domain、suspicious sender domain。
- 改善 Gmail 與 Outlook unread-row extraction，優先使用可解析的 sender email/domain data，再 fallback 到 display text。
- 新增零成本、opt-in 的 Google Safe Browsing API URL reputation mode，用於檢查 visible 或 opened message content 中可抽取出的 links。
- 預設仍維持 Gmail Guard browser-local；不導入 Gmail API、Microsoft Graph API、OAuth、external AI service、analytics 或 backend service。
- 若實作 Safe Browsing API network checks，必須同步更新 validator 與 user-facing privacy/store documentation。

## Capabilities

### New Capabilities

- `phishing-detection-accuracy`: 涵蓋降低 false positive 的 local scoring、provider row extraction quality，以及可選的零成本 Safe Browsing API URL reputation checks。

### Modified Capabilities

無。

## 影響範圍

- Runtime paths：`extension/src/rules.js`、`extension/src/content.js`，若 Safe Browsing API checks 由 extension service worker 執行，可能包含 `extension/options.*`、`extension/manifest.json`、`extension/src/background.js`。
- Tests and validators：`tests/rules.test.cjs`、`scripts/validate-extension.mjs`，以及可能新增的 row extraction 或 Safe Browsing API request gating focused tests。
- 若導入 network checks，需同步更新 documentation：`docs/PRIVACY.md`、`docs/REVIEW_NOTES.md`、`docs/STORE_LISTING.md`，以及 README/store claims 中目前描述 no network requests 的內容。
- External dependency posture：不使用 paid API、不使用 OAuth mailbox API、不建 backend、不使用 AI API。Safe Browsing API 必須維持 optional、zero-cost、non-commercial-use compatible、cache-aware，並對使用者透明。
