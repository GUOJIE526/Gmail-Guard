## 1. Accuracy Baseline

- [x] 1.1 新增目前會漏判的 non-English phishing examples，至少涵蓋簡體中文、日文、西文與法文 credential pressure，並先確認現有規則表現。
- [x] 1.2 新增多語 benign transactional examples，涵蓋 invoice、billing、order、receipt、shipment 與 routine access wording。
- [x] 1.3 新增 mixed-language examples，涵蓋英文品牌名稱搭配支援語言 credential theft wording。
- [x] 1.4 確認既有繁體中文與英文 regression cases 在測試基線中仍保留。

## 2. Signal Dictionary And Normalization

- [x] 2.1 將 `extension/src/rules.js` 的 wording term lists 整理成 category-based signal dictionary 或等效集中結構。
- [x] 2.2 補強 `normalizeText` 或 matching helper，支援 Unicode `NFKC`、大小寫、空白與全半形 normalization。
- [x] 2.3 新增 Latin-script accent-insensitive matching，確認 `contraseña` / `contrasena` 與 `vérifier` / `verifier` 類型文字可一致命中。
- [x] 2.4 確認 CJK、kana 與混合文字不會因 normalization 被破壞或移除。
- [x] 2.5 對 Latin-script 短詞使用 phrase 或 boundary-aware matching，避免過短 substring 造成 false positive。

## 3. Multilingual Signal Coverage

- [x] 3.1 新增 `zh-Hans` urgent、credential theft、routine access、transactional、lure 與 dangerous file/macro terms。
- [x] 3.2 新增 `ja` urgent、credential theft、routine access、transactional、lure 與 dangerous file/macro terms。
- [x] 3.3 新增 `es` urgent、credential theft、routine access、transactional、lure 與 dangerous file/macro terms。
- [x] 3.4 新增 `fr` urgent、credential theft、routine access、transactional、lure 與 dangerous file/macro terms。
- [x] 3.5 確認多語 terms 進入既有 severity/category flow，而不是替每種語言建立不同 scoring rule。

## 4. False-Positive Controls

- [x] 4.1 確認所有支援語言的 transactional wording 不會單獨造成 default-threshold visible risk。
- [x] 4.2 確認所有支援語言的 routine access wording 不會在缺少 stronger evidence 時升高為 visible risk。
- [x] 4.3 確認 suspicious sender domain、brand impersonation、dangerous file、lure 或 known unsafe URL 仍可和多語 wording 結合成 visible risk。
- [x] 4.4 確認 sender confidence 既有 behavior 不因多語 wording dictionary 重構而改變。

## 5. Documentation And Boundaries

- [x] 5.1 檢查是否需要更新 `README.md`、`docs/STORE_LISTING.md`、`docs/REVIEW_NOTES.md`、`docs/PRIVACY.md` 或 `docs/index.html` 的 detection coverage wording。
- [x] 5.2 若文件提到多語支援，明確說明這是 local phishing-risk hints，不是 perfect detection，也不是 mailbox-wide scan。
- [x] 5.3 確認本變更未新增 Gmail API、Microsoft Graph API、OAuth、analytics、tracking、external AI、translation API、remote code、remote font 或 unrelated network behavior。
- [x] 5.4 確認 `extension/manifest.json` permissions、host permissions 與 content script scope 不因本變更擴張。

## 6. Validation

- [x] 6.1 執行 `npm run test`，確認多語 phishing positives、benign transactional examples 與既有 regression cases 全部通過。
- [x] 6.2 執行 `npm run validate`，確認 release validator 仍阻擋未授權 boundary expansion。
- [x] 6.3 執行 `openspec validate "add-multilingual-risk-signals" --type change --strict`。
- [x] 6.4 若 implementation 影響 `extension/src/content.js` 或 user-visible panel text，手動載入 `extension/` 並在 Gmail/Outlook 頁面 smoke test badge 與 panel rendering。
