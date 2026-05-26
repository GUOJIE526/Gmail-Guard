## ADDED Requirements

### Requirement: 多語 wording signals 必須支援固定語言集合
系統 SHALL 使用 browser-local deterministic wording signals，至少支援繁體中文、簡體中文、英文、日文、西文與法文的 phishing-risk wording detection。

#### Scenario: 非英文 credential pressure 被偵測
- **WHEN** unread row 使用支援語言表達 urgent credential pressure，例如要求立即驗證帳號、重新啟用帳戶或輸入密碼
- **AND** row 具備其他 stronger evidence，例如 suspicious sender domain、brand impersonation、lure wording、dangerous file indicator 或 known unsafe URL
- **THEN** 系統 SHALL 將該 row 分類為 default threshold 下的 visible risk finding。

#### Scenario: Mixed-language row 被一致處理
- **WHEN** unread row 混合品牌英文名稱與支援語言的 credential theft wording
- **THEN** 系統 SHALL 依相同 signal category 與 sender-confidence rules 評估 risk，而不是要求整封 row 屬於單一語言。

### Requirement: 多語 transactional wording 必須維持 contextual
系統 SHALL 將支援語言中的 invoice、payment、billing、refund、order、receipt、shipment 及其等價詞視為 contextual transactional signals，這些詞 MUST NOT 單獨形成 default-threshold visible risk finding。

#### Scenario: 多語 benign transactional notice 低於 default threshold
- **WHEN** unread row 使用支援語言描述 invoice、billing、order、receipt 或 shipment notification
- **AND** sender domain 為 allowed brand domain 或沒有 stronger risk evidence
- **THEN** 系統 MUST 將該 row 維持在 default visible risk threshold 以下。

#### Scenario: 多語 transactional context 支援 stronger evidence
- **WHEN** unread row 使用支援語言描述 transactional context
- **AND** 同時存在 clear credential theft request、suspicious sender domain、dangerous file indicator、lure wording 或 known unsafe URL
- **THEN** 系統 SHALL 將 transactional wording 作為 supporting context，並以 stronger evidence 作為 primary risk reason。

### Requirement: Routine access 必須跨語言區分 credential theft
系統 SHALL 在支援語言中區分 routine account-access phrases 與 credential theft pressure。

#### Scenario: Routine access 不提升風險
- **WHEN** unread row 使用支援語言表示 sign in、login 或 access account 只是為了查看 invoice、order、receipt、shipment 或 account record
- **AND** 沒有 suspicious sender-domain、urgent pressure、dangerous-file、lure 或 unsafe-URL evidence
- **THEN** routine access wording MUST NOT 將 row 提升到 default visible risk threshold。

#### Scenario: Credential theft pressure 仍可見
- **WHEN** unread row 使用支援語言要求 user 緊急 verify、confirm、reactivate 或輸入 password/credential
- **THEN** 系統 SHALL 將該 wording 視為 credential theft signal，並依 sender confidence 與其他 evidence 計算 visible risk。

### Requirement: Text normalization 必須支援多語 matching
系統 SHALL 使用 local deterministic normalization 支援多語 matching，包含 Unicode compatibility normalization、大小寫 normalization、whitespace normalization、全半形 normalization，以及 Latin-script accent-insensitive matching。

#### Scenario: 重音符號不造成漏判
- **WHEN** unread row 使用 Latin-script 支援語言，且 credential wording 含有重音符號或省略重音符號
- **THEN** 系統 SHALL 能以同一 signal dictionary entry 或等效 matching rule 命中該 wording。

#### Scenario: CJK 與 kana 文字不被破壞性轉換
- **WHEN** unread row 使用中文、日文 kanji、hiragana、katakana 或混合文字
- **THEN** normalization MUST NOT 移除足以辨識 phishing-risk wording 的文字內容。

### Requirement: 多語 signal dictionary 必須可維護且可測試
系統 SHALL 將多語 wording signals 以 category-based dictionary 或等效結構管理，讓新增語言、詞彙或 category 時可透過 focused tests 驗證。

#### Scenario: Signal category 被一致使用
- **WHEN** 不同支援語言的詞彙代表相同 phishing-risk concept
- **THEN** 系統 SHALL 將它們映射到相同 signal category，例如 urgent、credential theft、transactional、routine access、lure 或 dangerous file。

#### Scenario: 新增詞彙需要 regression coverage
- **WHEN** implementation 新增或調整支援語言的 risk wording
- **THEN** automated tests MUST 包含至少一個對應 phishing-positive 或 benign false-positive guard case。

### Requirement: 多語支援不得擴張 privacy 或 network boundary
系統 SHALL 在不新增 backend、mailbox API、OAuth、external AI、translation API、analytics、tracking、remote code、remote fonts 或 unrelated network requests 的情況下提供多語 wording signal 判斷。

#### Scenario: Default local-only behavior 保持不變
- **WHEN** extension 被安裝或 settings 被 reset
- **THEN** 多語 wording signal detection MUST 在 browser local runtime 完成
- **AND** scanning unread rows MUST 不因多語支援而發出 network requests。

#### Scenario: Validator 保持阻擋未授權擴張
- **WHEN** release validation 執行
- **THEN** validator MUST 繼續拒絕未授權 network APIs、mailbox APIs、OAuth、analytics、tracking、external AI 與 unrelated host permissions。

### Requirement: 多語 accuracy regression coverage 必須存在
系統 SHALL 包含 automated tests，同時保護支援語言的 phishing-positive detection 與 benign transactional false-positive behavior。

#### Scenario: Supported-language phishing corpus
- **WHEN** tests 使用繁體中文、簡體中文、英文、日文、西文與法文的 credential theft、urgent pressure、lure、dangerous file 或 suspicious-domain examples 執行
- **THEN** 符合 configured scoring rules 的 examples SHALL 維持為 default threshold 下的 visible risk findings。

#### Scenario: Supported-language benign corpus
- **WHEN** tests 使用繁體中文、簡體中文、英文、日文、西文與法文的 benign invoice、billing、order、receipt、shipment 或 routine access examples 執行
- **THEN** 沒有 stronger risk evidence 的 examples MUST 維持在 default visible risk threshold 以下。
