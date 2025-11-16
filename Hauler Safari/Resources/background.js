// Hauler Safari / Resources/background.js
const extensionRuntime = typeof browser !== "undefined" ? browser : chrome;
const logPrefix = "[Hauler Extension]";

function describeCommand(payload) {
  const command = payload?.command || "unknown";
  const messageId = payload?.messageId;
  return messageId ? `${command} (${messageId})` : command;
}

extensionRuntime.runtime.onInstalled.addListener(() => {
  console.debug(logPrefix, "Extension installed — opening welcome page");
  // On macOS this will open a tab with instructions.
  // On iOS behavior may be ignored — harmless to keep.
  extensionRuntime.tabs
    .create({ url: extensionRuntime.runtime.getURL("welcome.html") })
    .catch(() => {});
});

async function sendNativePayload(payload) {
  const api = extensionRuntime.runtime;
  if (!api?.sendNativeMessage) {
    console.debug(logPrefix, "Native messaging API unavailable; returning null", describeCommand(payload));
    return null;
  }

  console.debug(logPrefix, "Forwarding payload to native host", describeCommand(payload));

  try {
    // Safari supports a single-argument form; Chromium/Firefox require a host name.
    if (api.sendNativeMessage.length === 1) {
      const response = await api.sendNativeMessage(payload);
      console.debug(logPrefix, "Native response (Safari style)", response, payload?.messageId);
      return response;
    }

    const manifestHost = api.getManifest?.()?.nativeMessagingHost;
    if (manifestHost) {
      const response = await api.sendNativeMessage(manifestHost, payload);
      console.debug(logPrefix, "Native response (manifest host)", response, payload?.messageId);
      return response;
    }

    console.debug(logPrefix, "Native messaging manifest host missing; unable to forward", describeCommand(payload));
  } catch (error) {
    console.warn("Native messaging failed", error, payload?.messageId || "no-message-id");
  }

  return null;
}

async function handleMessage(request) {
  const payload = request?.payload || request;
  if (!payload || typeof payload !== "object") return {};

  console.debug(logPrefix, "Received message from content script", describeCommand(payload));

  const response = await sendNativePayload(payload);
  if (response && typeof response === "object") {
    console.debug(logPrefix, "Returning native response to content script", response, payload?.messageId);
    return response;
  }

  // Fallback so the content script still gets a predictable shape.
  if (payload.command === "getReferralToken" || payload.command === "getReferral") {
    const messageId = payload?.messageId;
    console.debug(logPrefix, "Native response missing; returning empty token fallback", describeCommand(payload));
    return { referralToken: "", token: "", messageId };
  }

  return {};
}

extensionRuntime.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "hauler:native") return;

  handleMessage(message)
    .then((result) => sendResponse(result || {}))
    .catch((error) => {
      console.warn("Failed to handle message", error);
      sendResponse({});
    });

  // Keep the message channel open for async response
  return true;
});
