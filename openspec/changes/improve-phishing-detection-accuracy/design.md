## 背景

Gmail Guard 目前從 visible list data 對 unread Gmail/Outlook rows 進行 scoring：sender text、subject、snippet。這個 extension 刻意避免 Gmail API、Microsoft Graph API、OAuth、backend services、analytics、external AI 與 network requests。這個 product boundary 保留了 privacy-preserving 的特性，但也代表 classifier 經常缺少 authenticated sender headers 與完整 message content。

最明顯的 false-positive pattern 是正常交易信。像「發票」、「付款」、「帳單」、`invoice`、`billing` 這些詞常見於合法購買收據；同時 list row 有時只會暴露 sender display name。當這些弱訊號和「登入」或 unknown sender domain 疊加時，合法通知可能達到 default `medium` threshold。

## 目標 / 非目標

**目標：**

- 降低合法交易信的 false positives，同時不壓低明確 impersonation、urgent credential、malware 或 scam patterns。
- 透過 Gmail 與 Outlook list rows 中 DOM 可暴露的資料，抽取 parseable email/domain data 來提升 sender-domain confidence。
- 新增 optional、zero-cost URL reputation check，串接 Google Safe Browsing API 檢查抽取出的 URLs。
- 預設保留 local-only behavior，所有 network behavior 都必須 transparent、user-controlled、validator-enforced。
- 新增 tests，同時涵蓋 benign transactional examples 與 known risky examples，讓 accuracy changes 可衡量。

**非目標：**

- 不導入 Gmail API、Microsoft Graph API、OAuth、IMAP、mailbox-wide scanning 或 message-state modification。
- 不導入 external AI service、paid threat-intelligence feed、analytics、ads、tracking 或 backend proxy。
- 不掃描 supported webmail page 中尚未 visible 或未 explicitly opened 的 messages。
- 不宣稱 perfect phishing detection。

## 技術決策

### 決策：將交易語境詞改為 contextual，而不是獨立風險

Transactional words 應提供 context，而不是單獨形成 visible risk。只包含 invoice/payment/order language，或 invoice language 加上 routine「sign in to view」phrase 的 message，應維持在 default `medium` threshold 以下，除非同時出現更強 evidence，例如 suspicious sender domain、brand impersonation、urgent credential pressure、lure language、dangerous file terms 或 known unsafe URL。

替代方案：完全移除 transactional terms。這會降低 false positives，但也會失去真實 billing/refund phish 的訊號。將它們保留為 contextual、low-weight features，可以在出現更強 indicators 時保留輔助價值。

### 決策：明確計算 sender confidence

Rules engine 應區分：

- `trusted`: parseable sender domain 符合 brand allowlist。
- `unknown`: row 沒有可用的 parseable sender domain。
- `untrusted`: parseable sender domain 存在，但不在該 mentioned brand 的 allowlist。
- `suspicious`: sender domain 具有 suspicious TLD、punycode、lookalike 或其他 high-risk traits。

Unknown sender identity 應被回報為 limited evidence，不應單獨視為 brand impersonation。Trusted brand domains 應降低或抑制 weak contextual findings。

替代方案：為每個觀察到的 false positive 擴充 allowlists。這能修個別品牌，但無法解決 unknown-domain rows 和 weak content terms 疊加成 user-visible findings 的結構性問題。

### 決策：先改善 row extraction，不導入 mailbox APIs

Content extraction 應優先從 DOM attributes、labels、titles 與 provider-specific row metadata 取得 parseable email/domain fields，再 fallback 到 visible display text。這能維持目前 MV3 content-script model，同時改善 sender confidence。

替代方案：使用 Gmail API 或 Microsoft Graph 讀 headers。這些 APIs 能提供更好的 authentication signals，但需要 OAuth 與 restricted mail scopes，會大幅改變 privacy 與 review posture，因此不在本 change 範圍內。

### 決策：Safe Browsing API 必須是 disabled-by-default URL reputation

Safe Browsing API 必須是 optional。當 disabled 時，extension MUST 不發出 network requests。當 enabled 時，可以串接 Google Safe Browsing API，用最 privacy-preserving 且實務可行的 mode 檢查 extracted URLs。優先使用 `hashes.search`，因為它送出 hash prefixes 而不是 raw URLs；只有在 UI 與 documentation 清楚揭露 queried URLs 會送到 Google 時，才可使用 `urls.search`。本次實作採 `urls.search`，原因是 accurate `hashes.search` 需要完整 URL canonicalization 與 hash-prefix pipeline；options、panel footnote、privacy/store docs 必須清楚揭露 queried URLs 會送到 Google Safe Browsing API。

Safe Browsing API results 應作為 URLs 的 additive evidence，而不是取代 local scoring。Negative 或 empty Safe Browsing API results MUST NOT 將 message 標示為 safe。

替代方案：VirusTotal 或 PhishTank。VirusTotal public API 有嚴格 free limits 與 commercial restrictions；PhishTank 適合 database lookups，但有 rate limit 且範圍較窄。Safe Browsing API 較符合 zero-cost opt-in URL reputation layer。

### 決策：Validator 與 documentation 必須隨 network capability 同步調整

目前 validator 會拒絕 `fetch` 和任何 `host_permissions`。若實作 Safe Browsing API，validator 必須只允許 exact Safe Browsing API request path，且必須由 explicit setting 控制。Privacy、review notes、store listing 與 README claims 必須在同一個 change 內更新。

替代方案：讓 validation 寬鬆，依賴人工 review。這會削弱 repo 目前用來防止 accidental network expansion 的最強 boundary。

## 風險 / 取捨

- Lower transactional weights 可能造成 false negatives -> Mitigation: 接受變更前，必須有 existing high-risk credential、impersonation、dangerous-file 與 lure cases 的 tests。
- Provider DOM drift 可能破壞 sender extraction -> Mitigation: provider-specific extraction 保持 narrow，並新增 fixture-style tests 或明確記錄 Gmail/Outlook manual verification。
- Safe Browsing API URL checks 會引入 privacy implications -> Mitigation: 預設 disabled、enable 前揭露 data flow、cache responses，並優先使用 hash-prefix lookup。
- Client-exposed API key 可能被複製 -> Mitigation: 在 Google Cloud 中盡可能限制 API key，並記錄 distributed extension 中 API key 不是 secret。
- Safe Browsing API 偏向 non-commercial-use -> Mitigation: feature 必須維持 zero-cost non-commercial use alignment，不可包裝成 paid 或 enterprise protection service。

## Migration Plan

1. 新增 focused tests，涵蓋目前 false positives 與既有 phishing positives。
2. 在既有 default threshold behavior 下重新校準 local rules 與 sender-confidence scoring。
3. 改善 Gmail/Outlook sender extraction，同時保留現有 fallbacks。
4. 只有在 local accuracy changes 完成測試後，才新增 Safe Browsing API settings、request path、cache、validator allowances 與 documentation。
5. 執行 `npm run test` 與 `npm run validate`；content-script changes 需 manual verify Gmail 與 Outlook unread-row behavior。

Rollback 對 local scoring 與 extraction 來說相對直接，因為 extension 沒有 settings 以外的 persisted migration。若 Safe Browsing API 造成問題，應預設停用該 setting，並在同一個 rollback 中移除 narrow validator/network allowance。

## 待確認問題

- Safe Browsing API 是否應在第一個 implementation pass 一起交付，或應等 local false positives 降低後作為第二階段？
- 若未來要改為 `hashes.search`，需要先設計 URL canonicalization、hash-prefix generation、cache mapping 與 compatibility tests。
- 第一批 benign test corpus 應包含哪些台灣購物、銀行、物流與帳務品牌？
