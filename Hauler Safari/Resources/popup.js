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
    try {
        const response = await extensionAPI.runtime.sendNativeMessage(payload);
        return response || {};
    } catch (error) {
        console.error("Native message failed", error);
        throw error;
    }
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
        closePopup();
        const fallbackLink = referralLink || "https://haulerbuy.com/";
        alert(`We couldn't copy your referral link automatically. Copy it manually:\n${fallbackLink}`);
    }
}

function showStatus(message, isError = false) {
    clearStatusTimeout();

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

function clearStatusTimeout() {
    if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
        statusTimeoutId = undefined;
    }
}

function closePopup() {
    clearStatusTimeout();
    const mainElement = document.querySelector("main");

    if (mainElement) {
        mainElement.hidden = true;
    }

    if (typeof window !== "undefined" && typeof window.close === "function") {
        window.close();
    }
}
