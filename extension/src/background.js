chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "openOptions") return false;

  chrome.runtime.openOptionsPage(() => {
    sendResponse({ ok: !chrome.runtime.lastError });
  });

  return true;
});
