## 1. Accuracy Test Baseline

- [x] 1.1 新增 benign transactional test cases，涵蓋 Shopee、momo、invoices、orders、billing、bank notices 與 logistics notices，並確認它們維持在 default threshold 以下。
- [x] 1.2 新增 phishing-positive test cases，涵蓋 urgent credential theft、brand impersonation、suspicious domains、dangerous file terms、lure language 與 unsafe URL evidence。
- [x] 1.3 新增 routine account-access phrases 的 regression coverage，區分 sign in to view invoice 與 password verification / account reactivation requests。

## 2. Local Rule Rebalancing

- [x] 2.1 重構 scoring，將 transactional terms 分類為 contextual signals，而不是 standalone visible-risk reasons。
- [x] 2.2 在 rules engine 中拆分 routine account-access phrases 與 credential theft phrases。
- [x] 2.3 新增 sender-confidence levels：trusted、unknown、untrusted、suspicious sender domains。
- [x] 2.4 確認 trusted brand domains 會抑制 weak contextual findings，而 suspicious domains 仍會在 configured threshold 下顯示 risk。
- [x] 2.5 執行 `npm run test`，確認 benign transactional examples 通過，且沒有削弱既有 phishing detections。

## 3. Provider Row Extraction

- [x] 3.1 改善 Gmail unread-row extraction，在 fallback 到 display text 前優先使用 parseable sender email/domain attributes。
- [x] 3.2 改善 Outlook unread-row extraction，在 fallback 到 display text 前優先使用 provider sender metadata。
- [x] 3.3 保留 no parseable sender identity 時的既有 fallback behavior，並將 row 標示為 lower sender-confidence input。
- [x] 3.4 視可行性新增 focused extraction tests 或 fixtures；DOM behavior 無法可靠 unit-test 的部分，需記錄 manual Gmail/Outlook verification steps。

## 4. Optional Safe Browsing API URL Reputation

- [x] 4.1 新增 disabled-by-default setting 控制 URL reputation checks，並保持 existing default scan path network-free。
- [x] 4.2 只從 visible 或 explicitly opened message context 抽取 URLs，不掃描 loaded page content 之外的內容。
- [x] 4.3 串接 Google Safe Browsing API lookup；本次使用 `urls.search`，並提供 explicit user-facing disclosure 說明 queried URLs 會送到 Google。
- [x] 4.4 依照 returned cache durations 快取 Safe Browsing API responses，避免 expiration 前重複檢查相同 URL。
- [x] 4.5 將 Safe Browsing API matches 呈現為 potential risk indicators，並包含 source-specific details 與 Google advisory attribution。
- [x] 4.6 確認 empty Safe Browsing API results 絕不會把 message 標示為 safe。

## 5. Boundaries, Documentation, And Validation

- [x] 5.1 更新 `scripts/validate-extension.mjs`，當 feature 存在時只允許 intended Safe Browsing API network path，並持續拒絕 Gmail API、Microsoft Graph、OAuth、analytics、tracking、external AI 與 unrelated network APIs。
- [x] 5.2 更新 `docs/PRIVACY.md`、`docs/REVIEW_NOTES.md`、`docs/STORE_LISTING.md` 與 README/store claims，描述 default local-only behavior 與 opt-in URL reputation data flow。
- [x] 5.3 保持 `extension/src/content.js` 與 `extension/options.js` 的 settings defaults 同步。
- [x] 5.4 執行 `npm run validate`，確認 validator 仍會阻擋 unauthorized boundary expansion。

## 6. Manual Verification

- [ ] 6.1 在 Chrome Developer Mode 載入 `extension/`，確認 Gmail unread rows 仍可正確 scan、badge、panel。
- [ ] 6.2 確認 Outlook unread rows 在 supported Outlook hosts 仍可正確 scan、badge、panel。
- [ ] 6.3 確認 reset/default settings 不會串接 Safe Browsing API 或產生其他 external network requests。
- [ ] 6.4 確認啟用 URL reputation checks 時會揭露行為，且只檢查 extracted URLs。
