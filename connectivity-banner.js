(function setupConnectivityBanner() {
  const STYLE_ID = "network-status-banner-style";
  const BANNER_ID = "network-status-banner";
  let hasBeenOffline = false;
  let hideTimer = null;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID} {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translate(-50%, -120%);
        z-index: 9999;
        padding: 8px 12px;
        border-radius: 999px;
        font-family: "Segoe UI", Tahoma, sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
        border: 1px solid transparent;
        opacity: 0;
        transition: transform 180ms ease, opacity 180ms ease;
        pointer-events: none;
      }

      #${BANNER_ID}.show {
        transform: translate(-50%, 0);
        opacity: 1;
      }

      #${BANNER_ID}.offline {
        color: #8f2334;
        background: #fff2f5;
        border-color: rgba(207, 54, 79, 0.35);
      }

      #${BANNER_ID}.online {
        color: #145b34;
        background: #edfff4;
        border-color: rgba(26, 146, 88, 0.4);
      }
    `;

    document.head.appendChild(style);
  }

  function ensureBanner() {
    let banner = document.getElementById(BANNER_ID);
    if (banner) {
      return banner;
    }

    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    document.body.appendChild(banner);
    return banner;
  }

  function showBanner(kind, text) {
    const banner = ensureBanner();
    banner.textContent = text;
    banner.classList.remove("online", "offline");
    banner.classList.add(kind, "show");
  }

  function hideBanner() {
    const banner = ensureBanner();
    banner.classList.remove("show");
  }

  function updateState(isOnline) {
    clearTimeout(hideTimer);

    if (!isOnline) {
      hasBeenOffline = true;
      showBanner("offline", "You are offline");
      return;
    }

    if (hasBeenOffline) {
      showBanner("online", "Back online");
      hideTimer = setTimeout(hideBanner, 1800);
    } else {
      hideBanner();
    }
  }

  function start() {
    ensureStyle();
    updateState(navigator.onLine);
    window.addEventListener("offline", () => updateState(false));
    window.addEventListener("online", () => updateState(true));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
