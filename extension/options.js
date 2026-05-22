const DEFAULT_SETTINGS = {
  collapsedByDefault: false,
  highlightRows: true,
  riskThreshold: "medium",
  scanLimit: 80,
  showPanel: true
};

const fields = {
  collapsedByDefault: document.getElementById("collapsedByDefault"),
  highlightRows: document.getElementById("highlightRows"),
  riskThreshold: document.getElementById("riskThreshold"),
  scanLimit: document.getElementById("scanLimit"),
  showPanel: document.getElementById("showPanel")
};

const statusNode = document.getElementById("status");

function readForm() {
  return {
    collapsedByDefault: fields.collapsedByDefault.checked,
    highlightRows: fields.highlightRows.checked,
    riskThreshold: fields.riskThreshold.value,
    scanLimit: Math.max(10, Math.min(200, Number(fields.scanLimit.value) || DEFAULT_SETTINGS.scanLimit)),
    showPanel: fields.showPanel.checked
  };
}

function writeForm(settings) {
  fields.collapsedByDefault.checked = Boolean(settings.collapsedByDefault);
  fields.highlightRows.checked = Boolean(settings.highlightRows);
  fields.riskThreshold.value = settings.riskThreshold || DEFAULT_SETTINGS.riskThreshold;
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
    writeForm({ ...DEFAULT_SETTINGS, ...stored });
  });
}

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set(readForm(), () => showStatus("已儲存"));
});

document.getElementById("reset").addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    writeForm(DEFAULT_SETTINGS);
    showStatus("已恢復預設");
  });
});

loadSettings();
