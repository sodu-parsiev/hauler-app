 (() => {
   // =======================
   // CONFIG
   // =======================
   const LOGO_URL = "https://haulerbuy.com/wp-content/uploads/2025/09/cropped-hauler-logo.svg";
   const HAULER_HOME_URL = "https://haulerbuy.com/";
   const REFERRAL_SHARE_BASE = "https://haulerbuy.com/?ref=";

   // run only on supported marketplaces
   const host = location.hostname;
  const isMarketplace = /(?:^|\.)taobao\.com$|(?:^|\.)tmall\.com$|(?:^|\.)weidian\.com$|(?:^|\.)1688\.com$|(?:^|\.)cnfans\.com$|(?:^|\.)acbuy\.com$|(?:^|\.)oopbuy\.com$|(?:^|\.)kakobuy\.com$|(?:^|\.)mulebuy\.com$/.test(host);
   if (!isMarketplace) return;

   // avoid double inject
   if (document.getElementById("hb-overlay") || document.getElementById("hb-launcher")) return;

   // URL → haulerbuy mapping
   function toHaulerbuyLink(urlStr) {
     try {
       const u = new URL(urlStr);

       if (/weidian\.com$/.test(u.hostname)) {
         const id = u.searchParams.get("itemID") || u.searchParams.get("itemid");
         if (id) return `https://haulerbuy.com/m/weidian?id=${encodeURIComponent(id)}`;
       }
       if (/taobao\.com$|tmall\.com$/.test(u.hostname)) {
         const id = u.searchParams.get("id");
         if (id) return `https://haulerbuy.com/m/taobao?id=${encodeURIComponent(id)}`;
       }
       if (/1688\.com$/.test(u.hostname)) {
         const m = u.pathname.match(/\/offer\/(\d+)\.html/i);
         if (m && m[1]) return `https://haulerbuy.com/m/1688?id=${encodeURIComponent(m[1])}`;
       }
       if (/cnfans\.com$/.test(u.hostname)) {
         const shopType = (u.searchParams.get("shop_type") || "").toLowerCase();
         const id = u.searchParams.get("id");
         if (!id) return null;

         let mappedUrl = null;
         if (shopType === "weidian") {
           mappedUrl = `https://weidian.com/item.html?itemID=${encodeURIComponent(id)}`;
         } else if (shopType === "taobao" || shopType === "tmall") {
           mappedUrl = `https://item.taobao.com/item.htm?id=${encodeURIComponent(id)}`;
         } else if (shopType === "1688") {
           mappedUrl = `https://detail.1688.com/offer/${encodeURIComponent(id)}.html`;
         }

         if (mappedUrl) {
           return toHaulerbuyLink(mappedUrl);
         }
       }
      if (/mulebuy\.com$/.test(u.hostname)) {
        let id = u.searchParams.get("id");
        let platformRaw = u.searchParams.get("shoptype");

        if (!id || !platformRaw) {
          const hashParams = new URLSearchParams((u.hash || "").replace(/^#\/?/, ""));
          if (!id) id = hashParams.get("id");
          if (!platformRaw) platformRaw = hashParams.get("platform");
        }

        if (!id) return null;
        platformRaw = platformRaw || "";

        const platform = platformRaw.toUpperCase();
        const normalized = platform.replace(/[^A-Z0-9]/g, "");
        let mappedUrl = null;

         if (normalized.includes("WEIDIAN")) {
           mappedUrl = `https://weidian.com/item.html?itemID=${encodeURIComponent(id)}`;
         } else if (normalized.includes("TAOBAO") || normalized.includes("TMALL")) {
           mappedUrl = `https://item.taobao.com/item.htm?id=${encodeURIComponent(id)}`;
         } else if (normalized.includes("1688")) {
           mappedUrl = `https://detail.1688.com/offer/${encodeURIComponent(id)}.html`;
         }

         if (mappedUrl) {
           return toHaulerbuyLink(mappedUrl);
         }
       }
       if (/acbuy\.com$/.test(u.hostname)) {
         const id = u.searchParams.get("id");
         const source = (u.searchParams.get("source") || "").toUpperCase();
         if (!id) return null;

         let mappedUrl = null;
         if (source === "AL") {
           mappedUrl = `https://detail.1688.com/offer/${encodeURIComponent(id)}.html`;
         } else if (source === "TB") {
           mappedUrl = `https://item.taobao.com/item.htm?id=${encodeURIComponent(id)}`;
         } else if (source === "TM") {
           mappedUrl = `https://detail.tmall.com/item.htm?id=${encodeURIComponent(id)}`;
         } else if (source === "WD") {
           mappedUrl = `https://weidian.com/item.html?itemID=${encodeURIComponent(id)}`;
         }

        if (mappedUrl) {
          return toHaulerbuyLink(mappedUrl);
        }
      }
      if (/oopbuy\.com$/.test(u.hostname)) {
        const match = u.pathname.match(/^\/product\/(\d+)\/([^/?#]+)/i);
        if (!match) return null;

        const [, typeCode, productId] = match;
        let mappedUrl = null;

        if (typeCode === "0") {
          mappedUrl = `https://detail.1688.com/offer/${encodeURIComponent(productId)}.html`;
        } else if (typeCode === "1") {
          mappedUrl = `https://item.taobao.com/item.htm?id=${encodeURIComponent(productId)}`;
        } else if (typeCode === "2") {
          mappedUrl = `https://weidian.com/item.html?itemID=${encodeURIComponent(productId)}`;
        }

        if (mappedUrl) {
          return toHaulerbuyLink(mappedUrl);
        }
      }
       if (/kakobuy\.com$/.test(u.hostname)) {
         const marketplaceUrl = u.searchParams.get("url");
         if (marketplaceUrl) {
           return toHaulerbuyLink(marketplaceUrl);
         }
       }
    } catch (_) {}
    return null;
  }

  let haulerUrl = toHaulerbuyLink(location.href);
  let referralToken = "";
  let referralTokenPromise = null;
  let referralTokenFetched = false;

  function getReferralShareLink() {
    if (!referralToken) return "";
    return `${REFERRAL_SHARE_BASE}${encodeURIComponent(referralToken)}`;
  }

  async function fetchReferralToken() {
    if (referralTokenFetched) return referralToken;
    if (referralTokenPromise) return referralTokenPromise;

    const pending = (async () => {
      let token = "";
      try {
        if (typeof browser !== "undefined" && browser.runtime?.sendNativeMessage) {
          const response = await browser.runtime.sendNativeMessage(null, { command: "getReferralToken" });
          token = response && typeof response.referralToken === "string" ? response.referralToken : "";
        } else if (typeof safari !== "undefined" && safari.extension?.dispatchMessage && safari.self?.addEventListener) {
          const messageName = "getReferralToken";
          token = await new Promise((resolve) => {
            let resolved = false;
            const handleMessage = (event) => {
              if (event.name !== messageName) return;
              resolved = true;
              try { safari.self.removeEventListener("message", handleMessage); } catch (_) {}
              const value = event.message && typeof event.message.referralToken === "string" ? event.message.referralToken : "";
              resolve(value);
            };

            try {
              safari.self.addEventListener("message", handleMessage);
              safari.extension.dispatchMessage(messageName, { command: "getReferralToken" });
            } catch (err) {
              console.warn("Unable to dispatch Safari native message", err);
              resolve("");
              return;
            }

            setTimeout(() => {
              if (!resolved) {
                try { safari.self.removeEventListener("message", handleMessage); } catch (_) {}
                resolve("");
              }
            }, 2000);
          });
        }
      } catch (err) {
        console.warn("Failed to fetch referral token", err);
      }

      referralToken = token || "";
      referralTokenFetched = true;
      return referralToken;
    })();

    referralTokenPromise = pending;

    return pending.finally(() => {
      referralTokenPromise = null;
    });
  }

   // =======================
   // Styles (namespaced hb-*)
   // =======================
   const style = document.createElement("style");
   style.textContent = `
     #hb-overlay, #hb-overlay * { box-sizing: border-box; }

     /* Dim + blur background (below confetti) */
     #hb-overlay {
       position: fixed; inset: 0;
       display: none; align-items: center; justify-content: center;
       background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
       padding: 20px; z-index: 2147483646;
       animation: hb-fadeIn .2s ease;
     }
     #hb-overlay.hb-active { display: flex; }
     @keyframes hb-fadeIn { from {opacity:0} to {opacity:1} }

     /* Popup card */
     .hb-popup {
       background: #fff;
       border-radius: 24px;
       padding: 32px 24px;
       width: 100%; max-width: 340px;
       text-align: center;
       box-shadow: 0 20px 60px rgba(0,0,0,.3);
       animation: hb-slideUp .3s cubic-bezier(.34,1.56,.64,1);
       position: relative;
       font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,Helvetica,Arial,sans-serif;
       color: #1a1a1a;
     }
     @keyframes hb-slideUp {
       from { transform: translateY(40px); opacity: 0; }
       to   { transform: translateY(0);   opacity: 1; }
     }

     /* Logo circle */
     .hb-logo-wrap {
       width: 84px; height: 84px; margin: 0 auto 14px;
       border-radius: 50%;
       background: #f4f4f6;
       display: grid; place-items: center;
       overflow: hidden;
     }
     .hb-logo-img { width: 60px; height: 60px; object-fit: contain; }
     .hb-logo-emoji { font-size: 42px; }

     .hb-title { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
     .hb-sub   { font-size: 13px; color: #666; margin-bottom: 18px; }

     /* Buttons */
     .hb-btn {
       padding: 14px 24px; border: none; border-radius: 12px;
       font-size: 15px; font-weight: 700; cursor: pointer;
       width: 100%; display: inline-block; text-align: center; text-decoration: none;
       transition: transform .15s ease, box-shadow .15s ease, background .2s ease, color .2s ease;
     }
     .hb-btn:active { transform: scale(.98); }

     .hb-btn-primary {
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       color: #fff;
       box-shadow: 0 4px 12px rgba(102,126,234,.35);
     }
     .hb-btn-secondary {
       background: #f5f5f5; color: #333; margin-top: 10px;
     }

     /* Close (×) */
     .hb-close {
       position: absolute; top: 12px; right: 12px;
       background: transparent; border: none; cursor: pointer;
       width: 32px; height: 32px; border-radius: 50%;
       font-size: 22px; color: #9a9a9a; display: grid; place-items: center;
       transition: background .15s ease, color .15s ease;
     }
     .hb-close:hover { background: #f3f3f3; color: #333; }

     /* Confetti ABOVE overlay (max safe z-index) */
     .hb-confetti {
       position: fixed;
       width: 10px; height: 10px;
       pointer-events: none;
       z-index: 2147483647;
       left: 50%; top: 50%;
       transform: translate(-50%, -50%);
       will-change: transform, opacity;
       animation: hb-confettiExplode 1.1s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
     }
     @keyframes hb-confettiExplode {
       0%   { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg);    opacity: 1; }
       100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(720deg); opacity: 0; }
     }

     /* Floating launcher button (top-right) */
     #hb-launcher {
       position: fixed; top: 10px; right: 10px; z-index: 2147483645;
       background: #fff; border: 1px solid #ddd; border-radius: 999px;
       box-shadow: 0 6px 20px rgba(0,0,0,.12);
       padding: 6px 10px; display: flex; align-items: center; gap: 8px;
       font: 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,Helvetica,Arial,sans-serif;
       color: #2b2b2b; cursor: pointer; user-select: none;
     }
     #hb-launcher .hb-launcher-logo {
       width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
       background: #f3f3f3;
     }
     #hb-launcher .hb-launcher-logo img { width: 20px; height: 20px; object-fit: contain; }
     #hb-launcher:hover { background: #f9f9f9; }
   `;
   document.head.appendChild(style);

   // =======================
   // DOM: overlay + popup
   // =======================
   const overlay = document.createElement("div");
   overlay.id = "hb-overlay";
   overlay.innerHTML = `
     <div class="hb-popup" role="dialog" aria-modal="true" aria-label="HaulerBuy">
       <button class="hb-close" aria-label="Close">&times;</button>

       <div class="hb-logo-wrap">
         <img src="${LOGO_URL}" alt="Hauler logo" class="hb-logo-img" />
       </div>

      <div class="hb-title">${haulerUrl ? "Product Found!" : "Need help finding it?"}</div>
      <div class="hb-sub">
        ${haulerUrl ? "We detected a marketplace product link." : "Open HaulerBuy or share your referral link."}
      </div>

       <div>
        <a id="hb-open" class="hb-btn hb-btn-primary" target="_blank" rel="noopener noreferrer">
          ${haulerUrl ? "Open in HaulerBuy" : "Open HaulerBuy"}
        </a>
        <a id="hb-secondary" class="hb-btn hb-btn-secondary" target="_blank" rel="noopener noreferrer">
          Share referral link
        </a>
       </div>
     </div>
   `;
   document.documentElement.appendChild(overlay);

   const popup       = overlay.querySelector(".hb-popup");
   const closeBtn    = overlay.querySelector(".hb-close");
   const openBtn     = overlay.querySelector("#hb-open");
   const secondaryBtn= overlay.querySelector("#hb-secondary");
   const titleEl     = overlay.querySelector(".hb-title");
   const subEl       = overlay.querySelector(".hb-sub");

  const shareLabel = "Share referral link";

  function updatePrimaryButton() {
    if (haulerUrl) {
      openBtn.href = haulerUrl;
      openBtn.textContent = "Open in HaulerBuy";
      titleEl.textContent = "Product Found!";
      subEl.textContent = "We detected a marketplace product link.";
    } else {
      const referralLink = getReferralShareLink();
      openBtn.href = referralLink || HAULER_HOME_URL;
      openBtn.textContent = "Open HaulerBuy";
      titleEl.textContent = "Need help finding it?";
      subEl.textContent = referralLink
        ? "Share your referral link with shoppers."
        : "Open HaulerBuy to explore curated finds.";
    }
  }

  updatePrimaryButton();

  secondaryBtn.href = "#";
  secondaryBtn.textContent = shareLabel;
  secondaryBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    let referralLink = "";
    try {
      const token = await fetchReferralToken();
      if (!token) {
        window.alert("Add your referral code in the Hauler app before sharing your link.");
        return;
      }

      referralLink = `${REFERRAL_SHARE_BASE}${encodeURIComponent(token)}`;
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("clipboard-unavailable");
      }
      await navigator.clipboard.writeText(referralLink);

      const old = shareLabel;
      secondaryBtn.textContent = "✓ Copied!";
      secondaryBtn.style.background = "#4ecdc4";
      secondaryBtn.style.color = "#fff";
      setTimeout(() => {
        secondaryBtn.textContent = old;
        secondaryBtn.style.background = "#f5f5f5";
        secondaryBtn.style.color = "#333";
      }, 1800);
    } catch (err) {
      console.error("Failed to share referral link", err);
      const fallbackLink = referralLink || getReferralShareLink();
      if (fallbackLink) {
        window.alert(`Copy failed. Your referral link:\n${fallbackLink}`);
      } else {
        window.alert("Add your referral code in the Hauler app before sharing your link.");
      }
    }
  });

  fetchReferralToken().then(() => {
    updatePrimaryButton();
  }).catch((err) => {
    console.warn("Unable to preload referral token", err);
  });

   // =======================
   // Confetti
   // =======================
   function createConfetti() {
     const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a29bfe', '#fd79a8'];
     const count = 50;
     for (let i = 0; i < count; i++) {
       setTimeout(() => {
         const el = document.createElement("div");
         el.className = "hb-confetti";

         const angle = Math.random() * Math.PI * 2;
         const dist  = 120 + Math.random() * 180;
         const tx = Math.cos(angle) * dist;
         const ty = Math.sin(angle) * dist;

         el.style.background = colors[(Math.random() * colors.length) | 0];
         el.style.setProperty("--tx", tx + "px");
         el.style.setProperty("--ty", ty + "px");

         const size = 6 + Math.random() * 6;
         el.style.width  = size + "px";
         el.style.height = size + "px";
         el.style.borderRadius = Math.random() < 0.5 ? "2px" : "50%";
         el.style.animationDuration = (0.8 + Math.random() * 0.8) + "s";
         el.style.animationDelay = (i * 0.01) + "s";

         document.body.appendChild(el);
         setTimeout(() => el.remove(), 2000);
       }, i * 8);
     }
   }

   // Show/Hide popup
   function showPopup() {
     overlay.classList.add("hb-active");
     createConfetti();
   }
   function hidePopup(e) {
     if (e) e.stopPropagation();
     overlay.classList.remove("hb-active");
   }

   overlay.addEventListener("click", hidePopup);
   popup.addEventListener("click", (e) => e.stopPropagation());
   closeBtn.addEventListener("click", hidePopup);
   document.addEventListener("keydown", (e) => { if (e.key === "Escape") hidePopup(); });

   // Floating launcher (top-right)
   const launcher = document.createElement("div");
   launcher.id = "hb-launcher";
   launcher.innerHTML = `
     <div class="hb-launcher-logo">
       <img src="${LOGO_URL}" alt="Hauler logo" />
     </div>
     <div>HaulerBuy</div>
   `;
   launcher.addEventListener("click", (e) => { e.preventDefault(); showPopup(); });
   document.documentElement.appendChild(launcher);

   // Auto-open on first detection
   showPopup();

   // SPA navigation support
   const origPush = history.pushState;
   const origReplace = history.replaceState;

  function reeval() {
    haulerUrl = toHaulerbuyLink(location.href);
    updatePrimaryButton();
  }

   history.pushState = function () { origPush.apply(this, arguments); setTimeout(reeval, 0); };
   history.replaceState = function () { origReplace.apply(this, arguments); setTimeout(reeval, 0); };
   window.addEventListener("popstate", reeval);
 })();
