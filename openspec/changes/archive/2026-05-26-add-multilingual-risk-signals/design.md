## Context

Gmail Guard 的 runtime 判斷集中在 `extension/src/rules.js`，目前透過 sender domain confidence、brand allowlist/lookalike、local wording signals、dangerous file wording，以及 optional Safe Browsing API URL reputation evidence 產生 score。wording signals 現在主要由繁體中文與英文詞彙組成，匹配方式是 normalization 後的 substring search。

這個 model 符合 extension 的 single-purpose 與 privacy boundary，但多語信件會暴露一個缺口：非英文/繁中 phishing pressure 可能無法命中 urgent、credential theft、lure 或 routine/transactional context，只剩 domain/TLD 或 URL reputation evidence。若 sender domain 沒有明顯可疑特徵，這類信件可能低於 default visible threshold。

這個變更應延伸 local deterministic scoring，而不是導入遠端分類服務。任何多語支援都必須維持 no backend、no mailbox API、no OAuth、no analytics、no external AI、no translation API 與 default local-only behavior。

## Goals / Non-Goals

**Goals:**

- 讓 local wording signals 至少覆蓋繁體中文、簡體中文、英文、日文、西文與法文。
- 讓 urgent credential pressure、credential theft、routine account access、transactional context、lure/prize wording、dangerous file/macro wording 都能透過多語詞彙命中。
- 保留 contextual scoring：交易/帳務語境本身不得單獨造成 default-threshold visible risk。
- 將多語詞彙集中管理，使新增語言或新增 signal category 時可測試、可 review。
- 補強文字 normalization，降低大小寫、全半形、Unicode form、重音符號造成的漏判。
- 以 regression tests 保護多語 phishing positives 與 benign transactional false-positive cases。

**Non-Goals:**

- 不做完整自然語言理解、語意分類、語言偵測模型或機器學習 classifier。
- 不呼叫翻譯 API、external AI、remote reputation service 或任何新的 network endpoint。
- 不新增 Gmail API、Microsoft Graph API、OAuth、`tabs`、`webRequest`、`scripting`、`identity` 或 broader host permissions。
- 不掃描目前 Gmail/Outlook 頁面已載入 unread rows 之外的 mailbox content。
- 不在此 change 內完整實作 UI locale/i18n。UI 字串多語化可另開 change；本 change 只處理 phishing-risk 判斷支援多語 input。

## Decisions

### 決策：使用 deterministic signal dictionary，不使用 language detector

多語詞彙應以 signal category 為中心管理，例如 `urgent`、`accountAccess`、`routineAccess`、`credentialTheft`、`transactional`、`lure`、`dangerousFile`。每個 category 可以包含語言標記與詞彙來源，但 scoring 只需要知道命中的 signal category。

替代方案是先偵測語言再套用語言專屬 rules。這會讓混合語言 phishing、品牌英文加本地語言內容、以及 Gmail/Outlook row snippet 過短的情境變得脆弱。直接用 category dictionary 可以處理 mixed-language rows，也比較符合目前 deterministic rules engine。

### 決策：第一版採固定支援語言集合

第一版支援語言集合應至少包含：

- `zh-Hant`: 既有繁體中文 coverage。
- `zh-Hans`: 常見簡體中文 credential pressure、transactional、lure wording。
- `en`: 既有英文 coverage。
- `ja`: 常見日文帳號停止、密碼確認、請求書/配送/ギフトカード wording。
- `es`: 常見西文 cuenta、contraseña、factura、pedido、tarjeta regalo wording。
- `fr`: 常見法文 compte、mot de passe、facture、commande、carte cadeau wording。

這個集合涵蓋目前觀察到的缺口，同時讓測試矩陣仍可控。未列語言可以後續以小 change 擴充。

### 決策：normalization 先解決文字形態，不做翻譯

`normalizeText` 應升級為 deterministic local normalization pipeline，例如：

1. 將 input 轉為 string 並 trim。
2. 套用 Unicode `NFKC`，合併全半形與 compatibility characters。
3. lower-case。
4. 壓縮 whitespace。
5. 對 Latin-based terms 提供 accent-insensitive matching，讓 `contraseña` / `contrasena`、`vérifier` / `verifier` 都可命中。

這能降低多語詞彙表的重複量。CJK 與 kana 不應做破壞性 transliteration；簡繁差異先用詞彙表覆蓋，不在第一版引入大型 conversion table。

### 決策：保留現有 severity model，但多語命中需遵守相同 contextual rules

多語 terms 命中後應進入既有 severity/category flow，而不是為每種語言創造不同分數。例如法文 `dernier avis` + `mot de passe` 應等同英文 `final notice` + `password`；日文 `請求書` 應等同 `invoice`，只作為 transactional context。

這樣可以維持 scoring 可預測，也避免某些語言因詞彙新增而過度放大風險。

### 決策：issue title 可先維持目前 UI 語言

本 change 的核心是判斷支援多語 input，不是 UI i18n。`risk.label`、issue title、panel copy 可以先維持目前語言，但 issue detail 應能顯示命中的原始 term 或安全摘要，方便 debug。

若需要完整多語 UI，應另開 change 處理 `chrome.i18n` 或 local string table，避免把判斷能力與介面語系混成同一個不可驗證範圍。

## Risks / Trade-offs

- 多語詞彙增加 false positives -> Mitigation: 每個新語言都必須有 benign transactional tests，並保留 routine access 與 credential theft 的分離。
- 詞彙表變大後維護困難 -> Mitigation: 用 category-based dictionary 或 helper 結構集中管理，新增詞彙需搭配 tests。
- substring matching 可能誤命中短詞 -> Mitigation: 對 Latin script 使用 word-boundary 或 phrase matching；對 CJK/kana 使用較長 phrase，避免單字級弱訊號。
- accent-insensitive matching 可能合併不該合併的詞 -> Mitigation: 僅作為 normalized matching view，不改變原始 row data；新增語言時用 regression tests 檢查。
- 支援語言聲明可能被理解為完整保護 -> Mitigation: docs/store copy 若更新，必須說明這是 local phishing-risk hints，不是 perfect detection，也不是 mailbox-wide scanning。
- 與 optional Safe Browsing API 的界線混淆 -> Mitigation: 多語 wording signals 不應新增任何 network behavior；`npm run validate` 必須持續通過。

## Migration Plan

1. 先重構 local signal data structure 與 normalization，保持既有 tests 通過。
2. 逐步加入 `zh-Hans`、`ja`、`es`、`fr` terms 與 tests，每次確認 benign 與 phishing-positive coverage。
3. 跑 `npm run test`，確認既有 phishing detections 沒被削弱，benign transactional examples 仍低於 default threshold。
4. 跑 `npm run validate`，確認沒有新增未授權 permission、host access、network API 或 remote code。
5. 若文件或 store claim 有提到支援語言，更新 docs 並避免誇大 detection 能力。
6. 若發現 false-positive 明顯上升，可 rollback dictionary entries 或降低特定 signal severity，而不需改變 extension manifest。

## Open Questions

- 第一版是否只宣稱「多語 risk wording coverage」，還是要在 README/store copy 明列支援語言？
- 是否要把 signal dictionary 保留在 `rules.js` 內，還是拆成同目錄的 local data module？若拆檔，需確認 MV3 manifest content script 載入順序。
- 是否要新增 minimal UI note 表示「判斷支援多語內容」，或避免新增 UI copy 以降低驗證成本？
