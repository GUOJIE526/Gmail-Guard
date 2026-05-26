const DEFAULT_SETTINGS = {
  collapsedByDefault: false,
  highlightRows: true,
  riskThreshold: "medium",
  safeBrowsingEnabled: false,
  scanLimit: 80,
  showPanel: true
};

const fields = {
  collapsedByDefault: document.getElementById("collapsedByDefault"),
  highlightRows: document.getElementById("highlightRows"),
  riskThreshold: document.getElementById("riskThreshold"),
  safeBrowsingApiKey: document.getElementById("safeBrowsingApiKey"),
  safeBrowsingEnabled: document.getElementById("safeBrowsingEnabled"),
  scanLimit: document.getElementById("scanLimit"),
  showPanel: document.getElementById("showPanel")
};

const statusNode = document.getElementById("status");

function readForm() {
  return {
    collapsedByDefault: fields.collapsedByDefault.checked,
    highlightRows: fields.highlightRows.checked,
    riskThreshold: fields.riskThreshold.value,
    safeBrowsingEnabled: fields.safeBrowsingEnabled.checked,
    scanLimit: Math.max(10, Math.min(200, Number(fields.scanLimit.value) || DEFAULT_SETTINGS.scanLimit)),
    showPanel: fields.showPanel.checked
  };
}

function readLocalForm() {
  return {
    safeBrowsingApiKey: fields.safeBrowsingApiKey.value.trim()
  };
}

function writeForm(settings, localSettings) {
  fields.collapsedByDefault.checked = Boolean(settings.collapsedByDefault);
  fields.highlightRows.checked = Boolean(settings.highlightRows);
  fields.riskThreshold.value = settings.riskThreshold || DEFAULT_SETTINGS.riskThreshold;
  fields.safeBrowsingEnabled.checked = Boolean(settings.safeBrowsingEnabled);
  fields.safeBrowsingApiKey.value = (localSettings && localSettings.safeBrowsingApiKey) || "";
  fields.scanLimit.value = Number(settings.scanLimit || DEFAULT_SETTINGS.scanLimit);
  fields.showPanel.checked = Boolean(settings.showPanel);
}

function showStatus(message) {
  statusNode.textContent = message;
  window.setTimeout(() => {
    statusNode.textContent = "";
  }, 1800);
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    chrome.storage.local.get({ safeBrowsingApiKey: "" }, (localSettings) => {
      writeForm({ ...DEFAULT_SETTINGS, ...stored }, localSettings);
    });
  });
}

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set(readForm(), () => {
    chrome.storage.local.set(readLocalForm(), () => showStatus("已儲存"));
  });
});

document.getElementById("reset").addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    chrome.storage.local.set({ safeBrowsingApiKey: "", safeBrowsingCache: {} }, () => {
      writeForm(DEFAULT_SETTINGS, { safeBrowsingApiKey: "" });
      showStatus("已恢復預設");
    });
  });
});

loadSettings();
