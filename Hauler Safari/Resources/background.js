// Hauler Safari / Resources/background.js
chrome.runtime.onInstalled.addListener(() => {
  // On macOS this will open a tab with instructions.
  // On iOS behavior may be ignored — harmless to keep.
  chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") }).catch(() => {});
});
