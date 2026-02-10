const APP_VERSION = "v1";
const STATIC_CACHE = `chemachema-static-${APP_VERSION}`;
const RUNTIME_CACHE = `chemachema-runtime-${APP_VERSION}`;
const ENTITLEMENT_CACHE_KEY = "./pwa/entitlement-state.json";
const DEFAULT_ENTITLEMENT = {
  allowOffline: false,
  checkedAt: 0,
  expiresAt: 0,
};

const PRECACHE_ASSETS = [
  "./manifest.webmanifest",
  "./offline.html",
  "./offline-disabled.html",
  "./pwa-register.js",
  "./pwa/icon-192.svg",
  "./pwa/icon-512.svg",
  "./intro/intro.html",
  "./intro/intro.css",
  "./intro/intro.min.js",
  "./affordability/aff.html",
  "./affordability/aff.css",
  "./affordability/aff.min.js",
  "./img/overview.pdf",
  "./img/affordability.pdf",
  "./img/blil.pdf",
  "./img/tawuOdc.pdf",
  "./img/govOdc.pdf",
  "./img/bpopfOdc.pdf",
  "./img/botsLifeOdc.pdf",
  "./img/metropolitan.pdf",
  "./img/declaration.pdf",
  "./img/fcbApp1.pdf",
  "./img/fcbApp2.pdf",
  "./img/fcbApp3.pdf",
];

const PRECACHE_URLS = new Set(
  PRECACHE_ASSETS.map((asset) => new URL(asset, self.location).href),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => ensureEntitlementState())
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "SET_ENTITLEMENT") {
    event.waitUntil(storeEntitlementState(event.data));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(networkFirst(request, true));
    return;
  }

  if (sameOrigin && PRECACHE_URLS.has(url.href)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (!sameOrigin && shouldRuntimeCache(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (!sameOrigin) {
    event.respondWith(networkOnlyWithCacheFallback(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

function shouldRuntimeCache(request, url) {
  if (request.destination === "script") return true;
  if (request.destination === "style") return true;
  if (request.destination === "font") return true;
  if (request.destination === "image") return true;
  return (
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("unpkg.com")
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackToOffline) {
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const offlineAllowed = await isOfflineAllowed();
    if (!offlineAllowed) {
      return offlineBlockedResponse();
    }
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    if (fallbackToOffline) {
      const offline = await caches.match("./offline.html");
      if (offline) {
        return offline;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && (response.ok || response.type === "opaque")) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  if (request.mode === "navigate") {
    const offline = await caches.match("./offline.html");
    if (offline) {
      return offline;
    }
  }

  return new Response("Offline and no cached copy available.", {
    status: 503,
    statusText: "Service Unavailable",
  });
}

async function networkOnlyWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    return new Response("Offline and no cached copy available.", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function storeEntitlementState(data) {
  const payload = {
    allowOffline: data?.allowOffline === true,
    checkedAt: Number(data?.checkedAt) || Date.now(),
    expiresAt: Number(data?.expiresAt) || 0,
  };

  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(
    ENTITLEMENT_CACHE_KEY,
    new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
    }),
  );
}

async function ensureEntitlementState() {
  const cache = await caches.open(RUNTIME_CACHE);
  const existing = await cache.match(ENTITLEMENT_CACHE_KEY);
  if (!existing) {
    await storeEntitlementState(DEFAULT_ENTITLEMENT);
  }
}

async function getEntitlementState() {
  const cache = await caches.open(RUNTIME_CACHE);
  const response = await cache.match(ENTITLEMENT_CACHE_KEY);
  if (!response) {
    return DEFAULT_ENTITLEMENT;
  }
  try {
    const json = await response.json();
    return {
      allowOffline: json?.allowOffline === true,
      checkedAt: Number(json?.checkedAt) || 0,
      expiresAt: Number(json?.expiresAt) || 0,
    };
  } catch {
    return DEFAULT_ENTITLEMENT;
  }
}

async function isOfflineAllowed() {
  const state = await getEntitlementState();
  return state.allowOffline === true && Date.now() <= state.expiresAt;
}

async function offlineBlockedResponse() {
  const blockedPage = await caches.match("./offline-disabled.html");
  if (blockedPage) {
    return blockedPage;
  }
  return new Response(
    "Offline access is disabled. Please reconnect to verify your subscription.",
    {
      status: 403,
      statusText: "Forbidden",
    },
  );
}
