## Why

目前 Gmail Guard 的 local phishing-risk 判斷主要覆蓋繁體中文與英文 wording signals。當 unread Gmail/Outlook row 使用其他語言表達「帳號即將停用」、「請驗證密碼」、「發票/帳單通知」、「禮品卡中獎」等常見釣魚語境時，系統多半只能依賴 sender domain、TLD 或 optional Safe Browsing API URL evidence，容易漏掉以法文、西文、日文、簡體中文等語言撰寫的 phishing pressure。

這個變更要讓 wording-based local scoring 具備明確、多語且可測試的 signal coverage，同時保留 extension 的 browser-local default boundary，不導入翻譯 API、外部 AI、mailbox API 或額外 network behavior。

## What Changes

- 新增多語 risk signal coverage，讓 urgent credential pressure、credential theft、routine account access、transactional context、lure/prize wording、dangerous file/macro wording 可以用多語詞彙命中。
- 將多語詞彙整理成可維護的 signal dictionary 或等效結構，避免在 scoring logic 中散落大量硬寫陣列。
- 補強文字 normalization，支援多語判斷需要的大小寫、空白、Unicode normalization、全半形與常見重音處理，但不做遠端翻譯或機器學習分類。
- 建立多語 regression corpus，至少涵蓋繁體中文、簡體中文、英文、日文、西文與法文的 benign transactional examples 與 phishing-positive examples。
- 保留既有 contextual scoring 原則：交易語境詞不得單獨造成 default-threshold visible risk；routine sign-in/access wording 必須和 credential theft pressure 分開判斷。
- 保留現有 privacy/security 邊界：預設 local-only，不新增 Gmail API、Microsoft Graph API、OAuth、analytics、tracking、external AI、remote script、remote font 或 unrelated network request。

## Capabilities

### New Capabilities

- `multilingual-risk-signals`: 定義 local phishing-risk wording signals 的多語支援、normalization、false-positive control、test corpus 與 boundary preservation。

### Modified Capabilities

- 無。`openspec/specs/` 目前沒有已歸檔 capability；本變更以新的 capability 描述多語 signal 行為，並與既有 in-progress `improve-phishing-detection-accuracy` change 的 contextual scoring 原則保持一致。

## Impact

- `extension/src/rules.js`: 多語 signal dictionary、文字 normalization、scoring integration 與 issue reason 輸出。
- `tests/rules.test.cjs`: 多語 benign 與 phishing-positive regression cases。
- `extension/src/content.js`: 若 issue label 或 risk detail 需要更穩定呈現，可能需調整 panel/detail 顯示，但不改變 DOM scan scope。
- `extension/options.*`、`extension/popup.*`: 若本變更只支援多語判斷，預期不需要新增設定；若後續決定讓 UI 字串也多語化，需另行擴充 `chrome.i18n` 或 local string table。
- `scripts/validate-extension.mjs`: 應確認 validator 仍阻擋未授權 network/API/permission 擴張；本變更不應要求放寬 validator。
- `docs/PRIVACY.md`、`docs/REVIEW_NOTES.md`、`docs/STORE_LISTING.md`、`README.md`、`docs/index.html`: 如 user-facing claim 提到支援語言或 detection coverage，需同步更新，但不得宣稱 perfect phishing detection。
