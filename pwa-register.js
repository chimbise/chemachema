(function registerPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const ENTITLEMENT_STORAGE_KEY = "offlineEntitlement";

  function getStoredEntitlementPayload() {
    try {
      const raw = localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed?.allowOffline !== "boolean") {
        return null;
      }
      return {
        type: "SET_ENTITLEMENT",
        allowOffline: parsed.allowOffline === true,
        checkedAt: Number(parsed.checkedAt) || Date.now(),
        expiresAt: Number(parsed.expiresAt) || 0,
      };
    } catch {
      return null;
    }
  }

  function syncStoredEntitlement(registration) {
    const payload = getStoredEntitlementPayload();
    if (!payload) {
      return;
    }
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
    }
    if (registration?.active) {
      registration.active.postMessage(payload);
    }
    if (registration?.waiting) {
      registration.waiting.postMessage(payload);
    }
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("../sw.js", {
        scope: "../",
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }
        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            installingWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      syncStoredEntitlement(registration);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        syncStoredEntitlement(registration);
      });
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  });
})();
