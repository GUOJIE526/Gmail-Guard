(function bootstrapUnreadGuard() {
  const rules = globalThis.GmailUnreadPhishingGuardRules;
  if (!rules) return;

  const EXTENSION_ID = "gmail-unread-phishing-guard";
  const PANEL_HOST_ID = "gupg-panel-host";
  const BADGE_CLASS = "gupg-row-badge";
  const SCANNED_ATTR = "data-gupg-risk";
  const OUTLOOK_HOSTS = new Set([
    "outlook.live.com",
    "outlook.office.com",
    "outlook.office365.com",
    "outlook.com",
    "www.outlook.com"
  ]);
  const DEFAULT_SETTINGS = {
    collapsedByDefault: false,
    highlightRows: true,
    riskThreshold: "medium",
    scanLimit: 80,
    showPanel: true
  };

  let settings = { ...DEFAULT_SETTINGS };
  let scanTimer = 0;
  let panelRoot = null;
  let panelCollapsed = false;
  let lastFingerprint = "";
  let observer = null;
  let scanInProgress = false;
  let pendingDeepScan = false;
  let pendingShowProgress = false;
  let lastAutoScanAt = 0;

  function isGmailHost(hostname) {
    return String(hostname || "").toLowerCase() === "mail.google.com";
  }

  function isOutlookHost(hostname) {
    return OUTLOOK_HOSTS.has(String(hostname || "").toLowerCase());
  }

  function isSupportedMailHost(hostname) {
    return isGmailHost(hostname) || isOutlookHost(hostname);
  }

  function currentMailProviderLabel() {
    return isOutlookHost(location.hostname) ? "Outlook" : "Gmail";
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (!globalThis.chrome || !chrome.storage || !chrome.storage.sync) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }

      chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
        resolve({ ...DEFAULT_SETTINGS, ...stored });
      });
    });
  }

  function saveRuntimeSettings(nextSettings) {
    settings = { ...DEFAULT_SETTINGS, ...nextSettings };
    panelCollapsed = Boolean(settings.collapsedByDefault);
  }

  function injectRowStyles() {
    if (document.getElementById(`${EXTENSION_ID}-row-style`)) return;

    const style = document.createElement("style");
    style.id = `${EXTENSION_ID}-row-style`;
    style.textContent = `
      .${BADGE_CLASS} {
        display: inline-flex;
        align-items: center;
        height: 18px;
        margin-left: 8px;
        padding: 0 6px;
        border: 1px solid #f59e0b;
        border-radius: 999px;
        color: #92400e;
        background: #fffbeb;
        font-family: Arial, "Microsoft JhengHei", sans-serif;
        font-size: 11px;
        font-weight: 700;
        line-height: 18px;
        vertical-align: middle;
      }

      tr[${SCANNED_ATTR}="high"] .${BADGE_CLASS},
      tr[${SCANNED_ATTR}="critical"] .${BADGE_CLASS} {
        border-color: #dc2626;
        color: #991b1b;
        background: #fef2f2;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function getPanelRoot() {
    if (panelRoot) return panelRoot;

    const host = document.createElement("div");
    host.id = PANEL_HOST_ID;
    document.documentElement.appendChild(host);
    panelRoot = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      .panel {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        width: min(400px, calc(100vw - 32px));
        max-height: calc(100vh - 48px);
        overflow: hidden;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        color: #1f2937;
        background: #ffffff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
        font-family: Arial, "Microsoft JhengHei", sans-serif;
        font-size: 13px;
        line-height: 1.45;
      }

      .panel[data-risk="medium"] {
        border-color: #f59e0b;
      }

      .panel[data-risk="high"],
      .panel[data-risk="critical"] {
        border-color: #dc2626;
      }

      .panel.is-hidden {
        display: none;
      }

      .header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 12px 10px;
        border-bottom: 1px solid #e5e7eb;
      }

      .title {
        color: #111827;
        font-size: 13px;
        font-weight: 700;
      }

      .subtitle {
        margin-top: 2px;
        color: #6b7280;
        font-size: 11px;
      }

      .actions {
        display: flex;
        gap: 6px;
      }

      button {
        min-width: 28px;
        height: 28px;
        padding: 0 8px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        color: #374151;
        background: #f9fafb;
        font: inherit;
        cursor: pointer;
      }

      button:hover {
        background: #f3f4f6;
      }

      .body {
        flex: 1 1 auto;
        display: grid;
        gap: 10px;
        min-height: 0;
        padding: 12px;
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .panel.is-collapsed .body {
        display: none;
      }

      .summary {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 8px;
        color: #111827;
        font-weight: 700;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #16a34a;
      }

      .panel[data-risk="medium"] .dot {
        background: #f59e0b;
      }

      .panel[data-risk="high"] .dot,
      .panel[data-risk="critical"] .dot {
        background: #dc2626;
      }

      .score {
        color: #4b5563;
        font-size: 12px;
      }

      .items {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .item {
        display: grid;
        gap: 4px;
        padding: 8px;
        border-radius: 6px;
        background: #f9fafb;
      }

      .item-title {
        color: #111827;
        font-size: 12px;
        font-weight: 700;
      }

      .item-detail,
      .footnote {
        color: #4b5563;
        font-size: 12px;
      }

      @media (max-width: 640px) {
        .panel {
          right: 12px;
          bottom: 12px;
          width: calc(100vw - 24px);
        }
      }
    `;

    const panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = `
      <div class="header">
        <div>
          <div class="title">Gmail Guard</div>
          <div class="subtitle">Current ${currentMailProviderLabel()} page only</div>
        </div>
        <div class="actions">
          <button type="button" data-action="options" title="Options">Options</button>
          <button type="button" data-action="rescan" title="Rescan">Scan</button>
          <button type="button" data-action="toggle" title="Collapse">-</button>
        </div>
      </div>
      <div class="body"></div>
    `;

    panelRoot.append(style, panel);

    panelRoot.querySelector('[data-action="rescan"]').addEventListener("click", () => {
      lastFingerprint = "";
      scheduleScan(0, { deep: true, force: true, showProgress: true });
    });

    panelRoot.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      panelCollapsed = !panelCollapsed;
      renderCollapseState();
    });

    panelRoot.querySelector('[data-action="options"]').addEventListener("click", () => {
      if (globalThis.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: "openOptions" });
      }
    });

    return panelRoot;
  }

  function renderCollapseState() {
    const root = getPanelRoot();
    const panel = root.querySelector(".panel");
    const toggle = root.querySelector('[data-action="toggle"]');
    panel.classList.toggle("is-collapsed", panelCollapsed);
    toggle.textContent = panelCollapsed ? "+" : "-";
    toggle.title = panelCollapsed ? "Expand" : "Collapse";
  }

  function clearBadges() {
    for (const badge of document.querySelectorAll(`.${BADGE_CLASS}`)) {
      badge.remove();
    }
    for (const row of document.querySelectorAll(`[${SCANNED_ATTR}]`)) {
      row.removeAttribute(SCANNED_ATTR);
    }
  }

  function visible(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function isElementVisibleFast(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isExtensionElement(element) {
    return Boolean(element && (element.id === PANEL_HOST_ID || element.closest(`#${PANEL_HOST_ID}`)));
  }

  function elementText(element) {
    return rules.normalizeText(element ? element.innerText || element.textContent : "");
  }

  function isMailChromeRowText(text) {
    return (
      /已選取這個頁面上全部\s*\d+\s*個/.test(text) ||
      /選取「.*」中全部/.test(text) ||
      /All\s+\d+\s+conversations/i.test(text) ||
      /Select all conversations/i.test(text) ||
      /^\d+\s*[-–]\s*\d+\s*列/.test(text) ||
      /主要\s+促銷內容\s+社群網路\s+最新快訊/.test(text) ||
      /Primary\s+Promotions\s+Social\s+Updates/i.test(text) ||
      /Select all messages/i.test(text) ||
      /Focused\s+Other\s+Filter/i.test(text) ||
      /New mail\s+Delete\s+Archive/i.test(text) ||
      /Favorites\s+Folders\s+Groups/i.test(text)
    );
  }

  function parseOutlookRowLabel(row) {
    const label = rules
      .normalizeText(row && (row.getAttribute("aria-label") || row.getAttribute("title")))
      .replace(/^(Unread|Read|Selected|未讀|未读|未閱讀|未阅读|已讀|已读|已選取|已选取)\s*[,，:：-]?\s*/i, "");
    if (!label) return {};

    const parts = label
      .split(/\s*,\s*/)
      .map((part) => rules.normalizeText(part))
      .filter(Boolean);

    while (
      parts.length > 0 &&
      /^(Unread|Read|Selected|未讀|未读|未閱讀|未阅读|已讀|已读|已選取|已选取)$/i.test(parts[0])
    ) {
      parts.shift();
    }

    return {
      sender: parts[0] || "",
      subject: parts[1] || "",
      snippet: parts.slice(2).join(" ")
    };
  }

  function hasUnreadTextHint(element) {
    const text = [
      element.getAttribute("aria-label"),
      element.getAttribute("data-tooltip"),
      element.getAttribute("title"),
      element.getAttribute("data-isread"),
      element.getAttribute("data-is-read"),
      element.getAttribute("data-read")
    ]
      .filter(Boolean)
      .join(" ");

    return /(Unread|未讀|未读|未閱讀|未阅读)/i.test(text) || /(?:^|\s)(false|0)(?:\s|$)/i.test(text);
  }

  function isBoldTextNode(element) {
    if (!element || !visible(element)) return false;

    const text = rules.normalizeText(element.textContent);
    if (!text) return false;

    const weight = window.getComputedStyle(element).fontWeight;
    if (weight === "bold" || weight === "bolder") return true;

    const numericWeight = Number.parseInt(weight, 10);
    return Number.isFinite(numericWeight) && numericWeight >= 500;
  }

  function hasUnreadTypography(row) {
    const likelyTextNodes = Array.from(
      row.querySelectorAll(".zF, .bqe, .bog, .y6, .yW, .bA4, [role='gridcell'] span, td span, td div")
    );

    return isBoldTextNode(row) || likelyTextNodes.some(isBoldTextNode);
  }

  function detectUnreadReason(row) {
    if (!row || !visible(row)) return "";
    if (row.matches(".zE")) return "row-class-zE";
    if (row.querySelector(".zE")) return "child-class-zE";
    if (row.querySelector(".zF, .bqe")) return "gmail-unread-text-class";
    if (hasUnreadTextHint(row)) return "row-unread-text";
    if (
      Array.from(
        row.querySelectorAll("[aria-label], [data-tooltip], [title], [data-isread], [data-is-read], [data-read]")
      ).some(hasUnreadTextHint)
    ) {
      return "child-unread-text";
    }
    if (!row.matches(".yO") && !row.querySelector(".yO") && hasUnreadTypography(row)) {
      return "bold-typography";
    }
    if (hasUnreadTypography(row)) return "bold-typography";

    return "";
  }

  function isUnreadRow(row) {
    return Boolean(detectUnreadReason(row));
  }

  function isOutlookMessageRow(row) {
    if (!row || !isElementVisibleFast(row) || isExtensionElement(row)) return false;

    if (
      row.matches(
        "[data-automationid='MessageListItem'], [data-automationid='MessageListItemContainer'], [data-convid]"
      )
    ) {
      return true;
    }

    if (
      row.querySelector(
        [
          "[data-automationid='MessageListItemFrom']",
          "[data-automationid='MessageListItemSender']",
          "[data-automationid='MessageListItemSubject']",
          "[data-automationid='MessageListItemPreview']"
        ].join(", ")
      )
    ) {
      return true;
    }

    if (row.matches("div[role='option'][aria-label], div[role='listitem'][aria-label]")) {
      const text = elementText(row);
      if (isMailChromeRowText(text)) return false;
      return text.length >= 12 || rules.normalizeText(row.getAttribute("aria-label")).length >= 12;
    }

    return false;
  }

  function looksLikeMessageRow(row) {
    if (!row || !isElementVisibleFast(row)) return false;
    if (isExtensionElement(row)) return false;
    if (row.matches("[data-legacy-message-id]")) return true;
    if (isOutlookHost(location.hostname)) return isOutlookMessageRow(row);
    if (
      row.querySelector(
        [
          ".yW",
          ".bA4",
          ".bog",
          ".y6",
          "[email]"
        ].join(", ")
      )
    ) {
      return true;
    }

    const cells = row.querySelectorAll("td, [role='gridcell']");
    const text = elementText(row);
    if (isMailChromeRowText(text)) return false;
    return cells.length >= 3 && text.length >= 20;
  }

  function looksLikeVisualMessageRow(element) {
    if (!element || !isElementVisibleFast(element) || isExtensionElement(element)) return false;

    const rect = element.getBoundingClientRect();
    const minWidth = Math.min(520, window.innerWidth * 0.38);

    if (rect.width < minWidth) return false;
    if (rect.height < 24 || rect.height > 96) return false;
    if (rect.top < 72 || rect.bottom > window.innerHeight - 8) return false;

    const text = elementText(element);
    if (text.length < 24) return false;
    if (/Gmail Guard|Current Gmail page only|Current Outlook page only|目前 Gmail 頁面|目前 Outlook 頁面|目前郵件頁面/.test(text)) return false;
    if (isMailChromeRowText(text)) return false;

    return true;
  }

  function findVisualMessageRows() {
    const rows = [];
    const seen = new Set();
    const sampleXs = [0.5, 0.68].map((ratio) =>
      Math.max(24, Math.min(window.innerWidth - 24, Math.round(window.innerWidth * ratio)))
    );

    for (let y = 96; y < window.innerHeight - 16; y += 24) {
      for (const x of sampleXs) {
        let node = document.elementFromPoint(x, y);
        let best = null;

        while (node && node !== document.body && node !== document.documentElement) {
          if (looksLikeVisualMessageRow(node)) {
            best = node;
            break;
          }
          node = node.parentElement;
        }

        if (best && !seen.has(best)) {
          seen.add(best);
          rows.push(best);
        }
      }
    }

    return rows.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function getStructuredMessageRows() {
    const candidates = Array.from(
      document.body.querySelectorAll(
        [
          "tr.zA",
          "tr[role='row']",
          "div[role='row']",
          "[data-legacy-message-id]",
          "div[role='option'][aria-label]",
          "div[role='listitem'][aria-label]",
          "[data-automationid='MessageListItem']",
          "[data-automationid='MessageListItemContainer']",
          "[data-convid]"
        ].join(", ")
      )
    );
    const seen = new Set();
    const rows = [];

    for (const row of candidates) {
      if (seen.has(row) || !looksLikeMessageRow(row)) continue;
      seen.add(row);
      rows.push(row);
    }

    return rows.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function getCandidateMessageRows(options) {
    const structuredRows = getStructuredMessageRows();
    if (structuredRows.length > 0) return structuredRows;
    return options && options.allowVisualFallback ? findVisualMessageRows() : [];
  }

  function getMessageRows() {
    const candidates = getCandidateMessageRows();
    const rows = [];

    for (const row of candidates) {
      if (!isUnreadRow(row)) continue;
      rows.push(row);
      if (rows.length >= Number(settings.scanLimit || DEFAULT_SETTINGS.scanLimit)) break;
    }

    return rows;
  }

  function firstText(row, selectors) {
    for (const selector of selectors) {
      const node = row.querySelector(selector);
      if (!node) continue;
      const value = node.getAttribute("email") || node.getAttribute("title") || node.getAttribute("aria-label") || node.textContent;
      const text = rules.normalizeText(value);
      if (text) return text;
    }
    return "";
  }

  function extractRowData(row) {
    const outlookLabel = isOutlookHost(location.hostname) ? parseOutlookRowLabel(row) : {};
    const sender = firstText(row, [
      ".yW span[email]",
      ".bA4 span[email]",
      "span[email]",
      "[email]",
      ".yW",
      ".bA4",
      "[data-automationid='MessageListItemFrom']",
      "[data-automationid='MessageListItemSender']",
      "[data-automationid='MessageListItemFromLine']",
      "[data-automationid='MessageListItemSenderName']",
      "[data-testid='MessageListItemSender']"
    ]);

    const subject = firstText(row, [
      ".bog",
      ".y6 .bog",
      ".y6 span[id]",
      ".y6",
      "[data-automationid='MessageListItemSubject']",
      "[data-testid='MessageListItemSubject']"
    ]);

    const snippet = firstText(row, [
      ".y2",
      ".xS",
      "[role='gridcell']",
      "[data-automationid='MessageListItemPreview']",
      "[data-automationid='MessageListItemSnippet']",
      "[data-testid='MessageListItemPreview']"
    ]);

    const fallback = elementText(row);
    return {
      sender: sender || outlookLabel.sender,
      subject: subject || outlookLabel.subject || fallback.slice(0, 160),
      snippet: snippet || outlookLabel.snippet || fallback.slice(0, 600)
    };
  }

  function rowLabel(data) {
    const sender = data.sender || "Unknown sender";
    const subject = data.subject || "No subject";
    return `${sender} - ${subject}`.slice(0, 180);
  }

  function addBadge(row, result) {
    if (!settings.highlightRows) return;

    const target = row.querySelector(".bog") || row.querySelector(".y6") || row.querySelector("td:last-child") || row;
    const badge = document.createElement("span");
    badge.className = BADGE_CLASS;
    badge.textContent = result.risk.key === "high" || result.risk.key === "critical" ? "風險" : "注意";
    badge.title = result.issues.map((issue) => `${issue.title}: ${issue.detail}`).join("\n");
    target.appendChild(badge);
    row.setAttribute(SCANNED_ATTR, result.risk.key);
  }

  function scanUnreadRows(options) {
    const candidates = getCandidateMessageRows(options);
    const rows = [];
    const reasonCounts = {};
    const limit = Number(settings.scanLimit || DEFAULT_SETTINGS.scanLimit);

    for (const row of candidates) {
      const reason = detectUnreadReason(row);
      if (!reason) continue;
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      rows.push(row);
      if (rows.length >= limit) break;
    }

    const findings = [];
    let highestScore = 0;
    let highestRisk = "low";

    clearBadges();

    for (const row of rows) {
      const data = extractRowData(row);
      const result = rules.analyzeMessage(data);
      highestScore = Math.max(highestScore, result.score);
      if (result.score === highestScore) highestRisk = result.risk.key;

      if (rules.meetsThreshold(result.risk.key, settings.riskThreshold)) {
        findings.push({ row, data, result });
        addBadge(row, result);
      }
    }

    return {
      candidateCount: candidates.length,
      usedVisualFallback: Boolean(options && options.allowVisualFallback && candidates.length > 0),
      limit,
      reasonCounts,
      rowsScanned: rows.length,
      findings,
      highestScore,
      risk: rules.riskFromScore(highestScore || 0),
      highestRisk
    };
  }

  function renderScanningPanel(options) {
    const root = getPanelRoot();
    const panel = root.querySelector(".panel");
    const body = root.querySelector(".body");
    panel.classList.toggle("is-hidden", !settings.showPanel);
    panel.dataset.risk = "low";

    body.textContent = "";

    const summary = document.createElement("div");
    summary.className = "summary";

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent = options && options.allowVisualFallback ? "深度掃描中..." : "快速掃描中...";

    const score = document.createElement("span");
    score.className = "score";
    score.textContent = "--";

    summary.append(dot, label, score);
    body.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "items";

    const item = document.createElement("li");
    item.className = "item";

    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = options && options.allowVisualFallback ? "正在執行深度掃描" : "正在執行快速掃描";

    const detail = document.createElement("span");
    detail.className = "item-detail";
    detail.textContent =
      options && options.allowVisualFallback
        ? "手動掃描會使用較完整的畫面偵測，可能稍慢。"
        : "進入信箱時只跑快速掃描，避免拖慢頁面。";

    item.append(title, detail);
    list.appendChild(item);
    body.appendChild(list);

    renderCollapseState();
  }

  function renderErrorPanel(error) {
    const root = getPanelRoot();
    const panel = root.querySelector(".panel");
    const body = root.querySelector(".body");
    panel.classList.toggle("is-hidden", !settings.showPanel);
    panel.dataset.risk = "high";

    body.textContent = "";

    const summary = document.createElement("div");
    summary.className = "summary";

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent = "掃描失敗";

    const score = document.createElement("span");
    score.className = "score";
    score.textContent = "Error";

    summary.append(dot, label, score);
    body.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "items";

    const item = document.createElement("li");
    item.className = "item";

    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = "郵件掃描發生錯誤";

    const detail = document.createElement("span");
    detail.className = "item-detail";
    detail.textContent = error && error.message ? error.message : "未知錯誤";

    item.append(title, detail);
    list.appendChild(item);
    body.appendChild(list);

    renderCollapseState();
  }

  function renderPanel(scanResult) {
    const root = getPanelRoot();
    const panel = root.querySelector(".panel");
    const body = root.querySelector(".body");
    panel.classList.toggle("is-hidden", !settings.showPanel);
    panel.dataset.risk = scanResult.risk.key;

    body.textContent = "";

    const summary = document.createElement("div");
    summary.className = "summary";

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent =
      scanResult.rowsScanned === 0
        ? `目前郵件頁面未偵測到未讀列；候選信件列 ${scanResult.candidateCount} 封`
        : `目前頁面已掃描 ${scanResult.rowsScanned} / 上限 ${scanResult.limit} 封已載入未讀信件，${scanResult.findings.length} 封需注意`;

    const score = document.createElement("span");
    score.className = "score";
    score.textContent = `${Math.round(scanResult.highestScore || 0)} / 100`;

    summary.append(dot, label, score);
    body.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "items";

    const visibleFindings = scanResult.findings;
    if (visibleFindings.length === 0) {
      const item = document.createElement("li");
      item.className = "item";

      const title = document.createElement("span");
      title.className = "item-title";
      title.textContent = "目前頁面的未讀列表沒有明顯釣魚特徵";

      const detail = document.createElement("span");
      detail.className = "item-detail";
      detail.textContent =
        scanResult.candidateCount > 0
          ? `診斷：有抓到 ${scanResult.candidateCount} 封目前頁面候選信件列，但未讀標記/粗體判斷都未命中。`
          : "自動深度掃描也沒有抓到信件列，可能是郵件頁面 DOM 結構或頁面容器與預期不同。";

      item.append(title, detail);
      list.appendChild(item);
    } else {
      for (const finding of visibleFindings) {
        const item = document.createElement("li");
        item.className = "item";

        const title = document.createElement("span");
        title.className = "item-title";
        title.textContent = `${finding.result.risk.label}: ${rowLabel(finding.data)}`;

        const detail = document.createElement("span");
        detail.className = "item-detail";
        detail.textContent = finding.result.issues.map((issue) => issue.title).join("、");

        item.append(title, detail);
        list.appendChild(item);
      }
    }

    body.appendChild(list);

    const footnote = document.createElement("div");
    footnote.className = "footnote";
    footnote.textContent =
      scanResult.rowsScanned < scanResult.limit
        ? `僅掃描目前郵件頁面。此頁目前偵測到 ${scanResult.rowsScanned} 封未讀列；耗時 ${scanResult.durationMs}ms。不會傳送信件內容。`
        : `僅分析目前郵件頁面已載入的未讀列，不會跨頁、不會掃整個信箱；耗時 ${scanResult.durationMs}ms。`;
    body.appendChild(footnote);

    renderCollapseState();
  }

  function fingerprint(scanResult) {
    return [
      location.href,
      scanResult.rowsScanned,
      scanResult.findings.length,
      scanResult.highestScore,
      scanResult.candidateCount,
      scanResult.scanMode,
      scanResult.findings.map((finding) => rowLabel(finding.data)).join("|")
    ].join("::");
  }

  function runScan() {
    if (!isSupportedMailHost(location.hostname)) return;
    if (scanInProgress) return;
    scanInProgress = true;
    const allowVisualFallback = pendingDeepScan;
    const showProgress = pendingShowProgress || allowVisualFallback;
    pendingDeepScan = false;
    pendingShowProgress = false;
    if (observer) observer.disconnect();
    injectRowStyles();
    if (showProgress) {
      renderScanningPanel({ allowVisualFallback });
    }

    function completeScan(result) {
      const nextFingerprint = fingerprint(result);
      lastFingerprint = nextFingerprint;
      renderPanel(result);
      scanInProgress = false;
      connectObserver();
    }

    function failScan(error) {
      scanInProgress = false;
      connectObserver();
      renderErrorPanel(error);
    }

    window.setTimeout(() => {
      const startedAt = performance.now();

      try {
        const result = scanUnreadRows({ allowVisualFallback });
        result.durationMs = Math.round(performance.now() - startedAt);
        result.scanMode = allowVisualFallback ? "manual-deep" : "fast";

        if (!allowVisualFallback && result.candidateCount === 0) {
          if (showProgress) {
            renderScanningPanel({ allowVisualFallback: true });
          }

          window.setTimeout(() => {
            try {
              const deepResult = scanUnreadRows({ allowVisualFallback: true });
              deepResult.durationMs = Math.round(performance.now() - startedAt);
              deepResult.scanMode = "auto-deep";
              completeScan(deepResult);
            } catch (error) {
              failScan(error);
            }
          }, 0);

          return;
        }

        completeScan(result);
      } catch (error) {
        failScan(error);
      }
    }, 0);
  }

  function scheduleScan(delay, options) {
    const nextDelay = typeof delay === "number" ? delay : 500;
    const nextOptions = options || {};
    if (nextOptions.deep) pendingDeepScan = true;
    if (nextOptions.showProgress) pendingShowProgress = true;

    if (scanTimer && !nextOptions.force && nextDelay > 0) return;

    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      scanTimer = 0;
      if (!nextOptions.force && !pendingDeepScan) {
        const now = Date.now();
        if (now - lastAutoScanAt < 2500) {
          scheduleScan(2500 - (now - lastAutoScanAt));
          return;
        }
        lastAutoScanAt = now;
      }
      runScan();
    }, nextDelay);
  }

  async function start() {
    saveRuntimeSettings(await loadSettings());
    injectRowStyles();
    getPanelRoot();
    renderCollapseState();

    if (globalThis.chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return;

        const next = { ...settings };
        for (const [key, change] of Object.entries(changes)) {
          next[key] = change.newValue;
        }
        saveRuntimeSettings(next);
        lastFingerprint = "";
        scheduleScan(0, { force: true, showProgress: true });
      });
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => isExtensionElement(mutation.target))) return;
      scheduleScan(900);
    });
    connectObserver();

    window.addEventListener("hashchange", () => {
      lastFingerprint = "";
      scheduleScan(0, { force: true, showProgress: true });
    });
    window.addEventListener("focus", () => scheduleScan(350));
    scheduleScan(0, { force: true, showProgress: true });
  }

  function connectObserver() {
    if (!observer || !document.documentElement) return;
    observer.disconnect();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  start();
})();
