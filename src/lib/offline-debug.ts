/**
 * PWA Debug Utility for Vitaena
 *
 * This utility provides debugging tools for testing Progressive Web App (PWA)
 * functionality, including service worker status, cache contents, and offline navigation.
 *
 * Usage:
 * - Access via browser console: window.offlineDebug
 * - Full debug report: window.offlineDebug.fullDebugReport()
 * - Visit /debug page for UI interface
 *
 * @author Vitaena Team
 * @version 1.0.0
 */

// Debug utility for testing offline navigation and PWA functionality
export const OfflineNavigationDebugger = {
  // Check if service worker is registered
  checkServiceWorker: async (): Promise<boolean> => {
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log("Service Worker registrations:", registrations);

        if (registrations.length === 0) {
          console.warn("❌ No service worker registered");
          return false;
        }

        const sw = registrations[0];
        console.log("✅ Service Worker found:", {
          scope: sw.scope,
          state: sw.active?.state || sw.installing?.state || sw.waiting?.state,
          scriptURL:
            sw.active?.scriptURL ||
            sw.installing?.scriptURL ||
            sw.waiting?.scriptURL,
        });

        // Wait for service worker to become active if it's installing
        if (!sw.active && (sw.installing || sw.waiting)) {
          console.log(
            "⏳ Service worker is installing/waiting, checking again in 2 seconds..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return await OfflineNavigationDebugger.checkServiceWorker();
        }

        return true;
      } catch (error) {
        console.error("❌ Service Worker check failed:", error);
        return false;
      }
    } else {
      console.warn("❌ Service Worker not supported");
      return false;
    }
  },

  // Check cache contents
  checkCacheContents: async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        console.log("📦 Available caches:", cacheNames);

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          const urls = requests.map((req) => req.url);

          console.log(`📦 Cache "${cacheName}" contains ${urls.length} items:`);

          // Show first few URLs and categorize them
          const htmlPages = urls.filter(
            (url) =>
              !url.includes("_next") &&
              !url.includes(".js") &&
              !url.includes(".css")
          );
          const jsFiles = urls.filter((url) => url.includes(".js"));
          const other = urls.filter(
            (url) => !jsFiles.includes(url) && !htmlPages.includes(url)
          );

          if (htmlPages.length > 0) {
            console.log(
              `  📄 HTML Pages (${htmlPages.length}):`,
              htmlPages.slice(0, 5)
            );
          }
          if (jsFiles.length > 0) {
            console.log(
              `  📜 JS Files (${jsFiles.length}):`,
              jsFiles.slice(0, 3)
            );
          }
          if (other.length > 0) {
            console.log(`  📁 Other (${other.length}):`, other.slice(0, 3));
          }
        }
        return cacheNames;
      } catch (error) {
        console.error("❌ Cache check failed:", error);
        return [];
      }
    } else {
      console.warn("❌ Cache API not supported");
      return [];
    }
  },

  // Test offline status
  checkOfflineStatus: () => {
    const isOnline = navigator.onLine;
    console.log(`🌐 Online status: ${isOnline ? "✅ Online" : "❌ Offline"}`);
    return isOnline;
  },

  // Force cache a URL
  forceCacheURL: async (url: string) => {
    try {
      console.log(`🔄 Force caching: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Successfully fetched: ${url}`);
      } else {
        console.warn(`⚠️ Failed to fetch: ${url} (${response.status})`);
      }
    } catch (error) {
      console.error(`❌ Error caching ${url}:`, error);
    }
  },

  // Test navigation function
  testNavigation: (navigate: (path: string) => void, path: string) => {
    console.log(`🧪 Testing navigation to: ${path}`);
    console.log(`🌐 Current online status: ${navigator.onLine}`);

    try {
      navigate(path);
      console.log(`✅ Navigation call succeeded`);
    } catch (error) {
      console.error(`❌ Navigation call failed:`, error);
    }
  },

  // Full debug report
  fullDebugReport: async () => {
    console.log("🔍 === OFFLINE NAVIGATION DEBUG REPORT ===");

    // Check online status
    OfflineNavigationDebugger.checkOfflineStatus();

    // Check service worker
    await OfflineNavigationDebugger.checkServiceWorker();

    // Check caches
    await OfflineNavigationDebugger.checkCacheContents();

    // Check current URL
    console.log(`📍 Current URL: ${window.location.href}`);

    console.log("🔍 === END DEBUG REPORT ===");
  },
};

// Make debug utility available globally for development and testing
// Note: This is only available in development or when explicitly needed
if (typeof window !== "undefined") {
  // Only expose in development or when explicitly enabled
  if (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEBUG === "true"
  ) {
    (
      window as typeof window & {
        offlineDebug: typeof OfflineNavigationDebugger;
      }
    ).offlineDebug = OfflineNavigationDebugger;
  }
}
