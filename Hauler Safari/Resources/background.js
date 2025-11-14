// Hauler Safari / Resources/background.js
const extensionRuntime =
  typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
const runtimeNamespace = extensionRuntime?.runtime;

if (runtimeNamespace?.onInstalled) {
  runtimeNamespace.onInstalled.addListener(() => {
    // On macOS this will open a tab with instructions.
    // On iOS behavior may be ignored — harmless to keep.
    const tabsApi = extensionRuntime?.tabs;
    if (!tabsApi?.create) {
      return;
    }

    const url = runtimeNamespace.getURL("welcome.html");

    try {
      const creation = tabsApi.create({ url });
      if (creation && typeof creation.catch === "function") {
        creation.catch(() => {});
      }
    } catch (error) {
      try {
        tabsApi.create({ url }, () => {});
      } catch (_) {
        // Ignore secondary failure — Safari/iOS may not support creating tabs here.
      }
    }
  });
}

if (runtimeNamespace?.onMessage) {
  runtimeNamespace.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "hauler-native") {
      return undefined;
    }

    const payload = message.payload;
    const runtimeApi = runtimeNamespace;
    const sendNative = runtimeApi?.sendNativeMessage;

    if (typeof sendNative !== "function") {
      sendResponse({});
      return false;
    }

    let handledAsync = false;

    const respondWith = (response) => {
      try {
        sendResponse(response && typeof response === "object" ? response : {});
      } catch (_) {
        // Ignore — sendResponse may throw if the channel has closed.
      }
    };

    try {
      if (sendNative.length >= 2) {
        handledAsync = true;
        sendNative.call(runtimeApi, payload, (response) => {
          const lastError = runtimeApi?.lastError;
          if (lastError) {
            console.warn("sendNativeMessage callback error", lastError);
            respondWith({});
            return;
          }
          respondWith(response);
        });
      } else {
        const result = sendNative.call(runtimeApi, payload);
        if (result && typeof result.then === "function") {
          handledAsync = true;
          result
            .then((response) => {
              respondWith(response);
            })
            .catch((error) => {
              console.warn("sendNativeMessage promise error", error);
              respondWith({});
            });
        } else {
          respondWith(result);
        }
      }
    } catch (error) {
      console.warn("sendNativeMessage threw", error);
      respondWith({});
    }

    return handledAsync;
  });
}
