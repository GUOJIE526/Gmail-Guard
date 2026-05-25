## ADDED Requirements

### Requirement: 交易語境 scoring 必須是 contextual
系統 SHALL 將 transactional terms 視為 contextual signals，包含 invoice、payment、billing、refund、order、receipt 及其繁體中文等價詞；這些詞 MUST NOT 單獨形成 default-threshold visible risk finding。

#### Scenario: 合法交易通知低於 default threshold
- **WHEN** unread row 提到已知購物品牌與交易語境詞，例如「蝦皮購買發票證明」
- **AND** row 沒有 suspicious sender domain、urgent credential pressure、lure language、dangerous file indicator 或 known unsafe URL
- **THEN** 系統 MUST 將該 row 分類在 default visible risk threshold 以下。

#### Scenario: 交易語境詞與更強 evidence 結合
- **WHEN** unread row 包含 transactional terms，且同時包含 suspicious sender domain 或 clear credential theft request
- **THEN** 系統 SHALL 將 transactional terms 作為 supporting context，同時把更強 evidence 作為 primary risk reason 顯示。

### Requirement: Routine account access 必須和 credential theft 區分
系統 SHALL 區分 routine account-access phrases，例如 sign in to view invoice/order，與要求輸入 password、account verification、reactivation 或 security confirmation under pressure 的 credential theft phrases。

#### Scenario: Routine sign-in to view invoice
- **WHEN** unread row 表示 user 可以 sign in 來查看 invoice 或 order record
- **AND** 沒有 suspicious sender-domain、urgent、dangerous-file、lure 或 unsafe-URL evidence
- **THEN** routine sign-in phrase MUST NOT 將 row 提升到 default visible risk threshold。

#### Scenario: 急迫 password verification 仍維持 risky
- **WHEN** unread row 要求 user 緊急 verify、reactivate 或輸入 account password
- **THEN** 系統 SHALL 將該 row 分類為 default threshold 下的 visible risk finding。

### Requirement: Sender confidence 必須影響 brand risk
系統 SHALL 使用可用的 parseable sender domain data 推導 sender-confidence levels，並以此評估 brand-related messages。

#### Scenario: Allowed brand domain 抑制 weak findings
- **WHEN** message 提到 brand，且 parseable sender domain 符合該 brand 的 allowed domain list
- **AND** 只存在 weak contextual signals
- **THEN** 系統 MUST 讓 message 維持在 default visible risk threshold 以下。

#### Scenario: Unknown sender domain 只能作為 limited evidence
- **WHEN** message 提到 brand，但 unread row 沒有暴露 parseable sender email 或 domain
- **THEN** 系統 SHALL 將 missing domain 視為 limited evidence，且 MUST NOT 只因 display name 就分類為 brand impersonation。

#### Scenario: Suspicious sender domain 可以觸發 visible risk
- **WHEN** message 提到 brand，且 parseable sender domain 是 suspicious、lookalike、punycode、high-risk TLD，或不在該 brand allowlist
- **THEN** 當 score 達到 configured threshold 時，系統 SHALL 顯示 brand 或 sender-domain risk reason。

### Requirement: Provider row extraction 必須優先使用 parseable sender identity
Content script SHALL 在 fallback 到 display text 之前，優先從 Gmail 與 Outlook DOM attributes、accessibility labels、titles 與 provider-specific metadata 取得 parseable sender email 與 domain data。

#### Scenario: Gmail row 暴露 email attribute
- **WHEN** Gmail unread row 透過 attribute 或 nested sender element 暴露 sender email
- **THEN** extracted row data MUST 包含可解析的 sender address，供 risk analysis 使用。

#### Scenario: Outlook row 暴露 sender metadata
- **WHEN** Outlook unread row 透過 provider-specific row metadata 暴露 sender address 或 domain data
- **THEN** extracted row data MUST 包含可解析的 sender address 或 domain，供 risk analysis 使用。

#### Scenario: 保留 display text fallback
- **WHEN** 沒有可用的 parseable sender email 或 domain
- **THEN** 系統 SHALL 繼續分析 display sender、subject 與 snippet text，但使用較低 sender-confidence weight。

### Requirement: Safe Browsing API URL reputation 必須 opt-in
除非 user 明確啟用 URL reputation checks，否則系統 SHALL 不串接 Safe Browsing API，也不發出其他 external network request。

#### Scenario: 預設 local-only behavior
- **WHEN** extension 被安裝或 settings 被 reset
- **THEN** URL reputation checks MUST 是 disabled
- **AND** scanning unread rows MUST 不發出 network requests。

#### Scenario: 啟用 reputation check 時只透過 Safe Browsing API 送 URL evidence
- **WHEN** URL reputation checks 已啟用，且系統從 visible 或 explicitly opened message context 抽取出一個或多個 URLs
- **THEN** 系統 SHALL 只將這些 URLs 送往 configured Safe Browsing API endpoint 檢查
- **AND** 系統 MUST NOT 傳送 mailbox credentials、message body text、sender lists、analytics 或 unrelated browsing data。

#### Scenario: Empty reputation result 不是 safe verdict
- **WHEN** Safe Browsing API 對 URL 回傳 no threat match
- **THEN** 系統 MUST NOT 只因該結果就把 message 描述為 safe。

### Requirement: Safe Browsing API findings 必須 transparent 且 cache-aware
系統 SHALL 將 Safe Browsing API-derived warnings 呈現為 potential risk indicators，在適用時包含 required attribution，並遵守 response caching rules。

#### Scenario: Threat match warning language
- **WHEN** Safe Browsing API 對 URL 回傳 threat match
- **THEN** UI MUST 將 URL 描述為 potentially risky，而不是 certainly malicious
- **AND** UI MUST 區分 Safe Browsing API reason 與 local rule reasons。

#### Scenario: Google-derived warning attribution
- **WHEN** warning 是因 Safe Browsing API result 而顯示
- **THEN** UI 或 details panel MUST 依照 Safe Browsing API usage requirements 包含 Google advisory attribution。

#### Scenario: 遵守 cache duration
- **WHEN** Safe Browsing API 對 checked URL 回傳 cache duration
- **THEN** 系統 SHALL 在 cache 到期前重用 cached result，避免重複查詢同一 URL。

### Requirement: Boundary validation 與 documentation 必須保持一致
系統 SHALL 讓 release validation 與 user-facing documents 和任何 network-capable Safe Browsing API behavior 保持一致。

#### Scenario: Validator 只允許預期 network behavior
- **WHEN** Safe Browsing API support 被實作
- **THEN** release validator MUST 拒絕 unrelated network APIs、unrelated hosts、Gmail API usage、Microsoft Graph usage、OAuth usage、analytics、tracking 與 external AI usage。

#### Scenario: Privacy 與 store claims 必須更新
- **WHEN** Safe Browsing API support 被實作
- **THEN** privacy、review、store 與 README documentation MUST 揭露 opt-in URL reputation data flow，並保留 default local-only claim。

### Requirement: Accuracy regression coverage 必須存在
系統 SHALL 包含 automated tests，同時保護 reduced false positives 與既有 high-risk detections。

#### Scenario: Benign transactional corpus
- **WHEN** tests 使用 benign shopping、invoice、order、billing、bank notification 與 logistics examples 執行
- **THEN** 這些 examples MUST 維持在 default visible risk threshold 以下，除非存在 stronger risk evidence。

#### Scenario: Known phishing corpus
- **WHEN** tests 使用 brand impersonation、urgent credential theft、suspicious-domain、dangerous-file、lure 與 unsafe-URL examples 執行
- **THEN** 當 evidence 符合 configured scoring rules 時，這些 examples SHALL 維持為 default threshold 下的 visible risk findings。
