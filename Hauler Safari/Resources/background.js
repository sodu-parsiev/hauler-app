// Hauler Safari / Resources/background.js
const extensionRuntime = typeof browser !== "undefined" ? browser : chrome;

extensionRuntime.runtime.onInstalled.addListener(() => {
  // On macOS this will open a tab with instructions.
  // On iOS behavior may be ignored — harmless to keep.
  extensionRuntime.tabs
    .create({ url: extensionRuntime.runtime.getURL("welcome.html") })
    .catch(() => {});
});

async function sendNativePayload(payload) {
  const api = extensionRuntime.runtime;
  if (!api?.sendNativeMessage) {
    console.warn("Native messaging API unavailable in this browser context");
    return null;
  }

  try {
    // Safari supports a single-argument form; Chromium/Firefox require a host name.
    if (api.sendNativeMessage.length === 1) {
      console.info("Sending native message via Safari runtime", payload);
      return await api.sendNativeMessage(payload);
    }

    const manifestHost = api.getManifest?.()?.nativeMessagingHost;
    if (manifestHost) {
      console.info("Sending native message to host", manifestHost, payload);
      return await api.sendNativeMessage(manifestHost, payload);
    }

    console.warn("Native messaging host missing from manifest");
  } catch (error) {
    console.warn("Native messaging failed", error);
  }

  return null;
}

async function handleMessage(request) {
  const payload = request?.payload || request;
  if (!payload || typeof payload !== "object") return {};

  const response = await sendNativePayload(payload);
  if (response && typeof response === "object") {
    return response;
  }

  // Fallback so the content script still gets a predictable shape.
  if (payload.command === "getReferralToken" || payload.command === "getReferral") {
    return { referralToken: "", token: "" };
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
