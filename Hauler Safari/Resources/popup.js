const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

const tokenInput = document.getElementById("referralToken");
const saveButton = document.getElementById("saveToken");
const copyButton = document.getElementById("copyLink");
const statusElement = document.getElementById("status");

let savedToken = "";
let statusTimeoutId;

document.addEventListener("DOMContentLoaded", () => {
    loadReferralToken();
    tokenInput.addEventListener("input", updateSaveState);
    saveButton.addEventListener("click", handleSaveToken);
    copyButton.addEventListener("click", handleCopyLink);
});

async function sendNativeMessage(payload) {
    const runtime = extensionAPI?.runtime;
    if (!runtime?.sendNativeMessage) {
        console.warn("Native messaging API unavailable in this browser context");
        return {};
    }

    try {
        // Safari supports a single-argument form; Chromium requires the host name.
        if (runtime.sendNativeMessage.length === 1) {
            return (await runtime.sendNativeMessage(payload)) || {};
        }

        const manifestHost = runtime.getManifest?.()?.nativeMessagingHost;
        if (manifestHost) {
            return (await runtime.sendNativeMessage(manifestHost, payload)) || {};
        }

        console.warn("Native messaging host missing from manifest");
    } catch (error) {
        console.error("Native message failed", error);
        throw error;
    }

    return {};
}

async function loadReferralToken() {
    try {
        const response = await sendNativeMessage({ command: "getReferral" });
        if (typeof response.token === "string") {
            savedToken = response.token;
            tokenInput.value = savedToken;
            updateSaveState();
        }
    } catch (error) {
        showStatus("Unable to load referral token", true);
    }
}

function updateSaveState() {
    saveButton.disabled = tokenInput.value === savedToken;
}

async function handleSaveToken(event) {
    event.preventDefault();

    try {
        const response = await sendNativeMessage({
            command: "setReferral",
            token: tokenInput.value
        });

        if (typeof response.token === "string") {
            savedToken = response.token;
            tokenInput.value = savedToken;
            updateSaveState();
        }

        showStatus("Referral token saved");
    } catch (error) {
        showStatus("Unable to save referral token", true);
    }
}

async function handleCopyLink(event) {
    event.preventDefault();

    let response;
    let referralLink = "";

    try {
        response = await sendNativeMessage({
            command: "referralLink",
            token: tokenInput.value
        });

        if (typeof response.token === "string") {
            savedToken = response.token;
            tokenInput.value = savedToken;
            updateSaveState();
        }

        if (typeof response.link === "string" && response.link.length > 0) {
            referralLink = response.link;
        } else {
            throw new Error("missing-referral-link");
        }

        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
            throw new Error("clipboard-unavailable");
        }

        await navigator.clipboard.writeText(referralLink);
        showStatus("Referral link copied");
    } catch (error) {
        console.error("Copy failed", error);
        showStatus("Unable to copy referral link", true);
        const fallbackLink = referralLink || "https://haulerbuy.com/";
        alert(`We couldn't copy your referral link automatically. Copy it manually:\n${fallbackLink}`);
    }
}

function showStatus(message, isError = false) {
    if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
        statusTimeoutId = undefined;
    }

    statusElement.textContent = message;
    statusElement.hidden = false;
    statusElement.classList.toggle("error", isError);

    if (!isError) {
        statusTimeoutId = setTimeout(() => {
            statusElement.hidden = true;
            statusElement.classList.remove("error");
            statusTimeoutId = undefined;
        }, 2000);
    }
}
