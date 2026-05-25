const SAFE_BROWSING_HOST_PERMISSION = "https://safebrowsing.googleapis.com/*";
const SAFE_BROWSING_URL_SEARCH_ENDPOINT = "https://safebrowsing.googleapis.com/v5/urls:search";
const SAFE_BROWSING_CACHE_KEY = "safeBrowsingCache";
const SAFE_BROWSING_MAX_URLS = 8;
const SAFE_BROWSING_DEFAULT_CACHE_MS = 30 * 60 * 1000;
const SAFE_BROWSING_MAX_CACHE_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_SENDER_URLS = [
  /^https:\/\/mail\.google\.com\//i,
  /^https:\/\/outlook\.live\.com\//i,
  /^https:\/\/outlook\.office\.com\//i,
  /^https:\/\/outlook\.office365\.com\//i,
  /^https:\/\/outlook\.com\//i,
  /^https:\/\/www\.outlook\.com\//i
];

function isSupportedSender(sender) {
  const url = sender && sender.url ? sender.url : "";
  return SUPPORTED_SENDER_URLS.some((pattern) => pattern.test(url));
}

function storageGet(area, defaults) {
  return new Promise((resolve) => {
    chrome.storage[area].get(defaults, (stored) => resolve({ ...defaults, ...stored }));
  });
}

function storageSet(area, value) {
  return new Promise((resolve) => {
    chrome.storage[area].set(value, () => resolve());
  });
}

function normalizeCheckUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (!/^https?:$/i.test(url.protocol)) return "";
    if (/^(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|outlook\.office365\.com|outlook\.com|www\.outlook\.com)$/i.test(url.hostname)) {
      return "";
    }
    return url.href;
  } catch (_) {
    return "";
  }
}

function parseDurationMs(value) {
  const match = String(value || "").match(/^(\d+)(?:\.(\d{1,9}))?s$/);
  if (!match) return SAFE_BROWSING_DEFAULT_CACHE_MS;
  const seconds = Number(match[1]);
  const fraction = Number(`0.${match[2] || "0"}`);
  const durationMs = Math.round((seconds + fraction) * 1000);
  return Math.min(Math.max(durationMs, 60 * 1000), SAFE_BROWSING_MAX_CACHE_MS);
}

function responseThreats(json) {
  if (!json || typeof json !== "object") return [];
  if (Array.isArray(json.threats)) return json.threats;
  if (json.threat) return [json.threat];
  return [];
}

function cacheDurationMs(json, threats) {
  const durations = [
    json && json.cacheDuration,
    ...threats.map((threat) => threat && threat.cacheDuration)
  ].filter(Boolean);
  return parseDurationMs(durations[0]);
}

async function loadSafeBrowsingSettings() {
  const sync = await storageGet("sync", { safeBrowsingEnabled: false });
  const local = await storageGet("local", { safeBrowsingApiKey: "" });
  return {
    enabled: Boolean(sync.safeBrowsingEnabled),
    apiKey: String(local.safeBrowsingApiKey || "").trim()
  };
}

async function loadCache() {
  const stored = await storageGet("local", { [SAFE_BROWSING_CACHE_KEY]: {} });
  const cache = stored[SAFE_BROWSING_CACHE_KEY] || {};
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(cache).filter(([, entry]) => entry && Number(entry.expiresAt || 0) > now)
  );
}

async function saveCache(cache) {
  await storageSet("local", { [SAFE_BROWSING_CACHE_KEY]: cache });
}

async function querySafeBrowsingUrl(apiKey, url) {
  const endpoint = new URL(SAFE_BROWSING_URL_SEARCH_ENDPOINT);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.append("urls", url);

  const response = await fetch(endpoint.href, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Safe Browsing API HTTP ${response.status}`);
  }

  const json = await response.json();
  const threats = responseThreats(json);
  return {
    checked: true,
    cacheHit: false,
    threats,
    expiresAt: Date.now() + cacheDurationMs(json, threats)
  };
}

async function checkSafeBrowsingUrls(message, sender) {
  if (!isSupportedSender(sender)) {
    return { ok: false, error: "Unsupported sender origin", results: {} };
  }

  const settings = await loadSafeBrowsingSettings();
  if (!settings.enabled) return { ok: true, disabled: true, results: {} };
  if (!settings.apiKey) return { ok: true, missingApiKey: true, results: {} };

  const urls = Array.from(new Set((message.urls || []).map(normalizeCheckUrl).filter(Boolean))).slice(
    0,
    SAFE_BROWSING_MAX_URLS
  );
  if (urls.length === 0) return { ok: true, results: {} };

  const cache = await loadCache();
  const results = {};

  for (const url of urls) {
    if (cache[url]) {
      results[url] = { ...cache[url], cacheHit: true };
      continue;
    }

    try {
      const result = await querySafeBrowsingUrl(settings.apiKey, url);
      cache[url] = result;
      results[url] = result;
    } catch (error) {
      results[url] = {
        checked: false,
        error: error && error.message ? error.message : "Safe Browsing API request failed",
        threats: []
      };
    }
  }

  await saveCache(cache);
  return {
    ok: true,
    attribution: "Google Safe Browsing API",
    endpoint: SAFE_BROWSING_HOST_PERMISSION,
    results
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === "openOptions") {
    chrome.runtime.openOptionsPage(() => {
      sendResponse({ ok: !chrome.runtime.lastError });
    });
    return true;
  }

  if (message.type === "checkSafeBrowsingUrls") {
    checkSafeBrowsingUrls(message, sender).then(sendResponse);
    return true;
  }

  return false;
});
