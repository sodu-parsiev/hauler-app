// Hauler Safari / Resources/background.js
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
const BRIDGE_MESSAGE_TYPE = "hauler:native-message";

extensionAPI.runtime.onInstalled.addListener(() => {
  // On macOS this will open a tab with instructions.
  // On iOS behavior may be ignored — harmless to keep.
  extensionAPI.tabs.create({ url: extensionAPI.runtime.getURL("welcome.html") }).catch(() => {});
});

extensionAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== BRIDGE_MESSAGE_TYPE) {
    return;
  }

  const payload = message.payload;
  if (!payload || typeof payload !== "object") {
    sendResponse({ error: "invalid-payload" });
    return;
  }

  const sendNativeMessage = extensionAPI.runtime?.sendNativeMessage;
  if (typeof sendNativeMessage !== "function") {
    sendResponse({ error: "native-messaging-unavailable" });
    return;
  }

  try {
    Promise.resolve(sendNativeMessage(payload))
      .then((response) => {
        sendResponse(response ?? {});
      })
      .catch((error) => {
        console.warn("sendNativeMessage failed", error);
        sendResponse({ error: "native-messaging-failed" });
      });
  } catch (error) {
    console.warn("sendNativeMessage threw", error);
    sendResponse({ error: "native-messaging-failed" });
  }

  return true;
});
