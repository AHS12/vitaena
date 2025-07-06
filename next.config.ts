import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// PWA Configuration
const withPWA = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("next-pwa")({
      dest: "public",
      disable:
        process.env.NODE_ENV === "development" &&
        process.env.ENABLE_PWA !== "true",
      register: false, // Manual registration in PWAWrapper
      skipWaiting: true,
      buildExcludes: [/app-build-manifest\.json$/],
      runtimeCaching: [
        // Cache HTML documents for offline navigation
        {
          urlPattern: ({ request }: { request: Request }) =>
            request.destination === "document",
          handler: "NetworkFirst",
          options: {
            cacheName: "html-pages",
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60,
            },
          },
        },
        // Cache API routes
        {
          urlPattern: /^https?:\/\/[^\/]+\/api\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 5 * 60,
            },
          },
        },
        // Cache pages
        {
          urlPattern: /^https?:\/\/[^\/]+\/.*$/,
          handler: "NetworkFirst",
          options: {
            cacheName: "pages",
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60,
            },
          },
        },
        // Cache static assets
        {
          urlPattern: /^https?:\/\/[^\/]+\/_next\/static\/.*/,
          handler: "CacheFirst",
          options: {
            cacheName: "next-static",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 365 * 24 * 60 * 60,
            },
          },
        },
        // Cache Next.js data
        {
          urlPattern: /^https?:\/\/[^\/]+\/_next\/data\/.*/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "next-data",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 24 * 60 * 60,
            },
          },
        },
        // Cache images
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "images",
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 365 * 24 * 60 * 60,
            },
          },
        },
        // Cache other static resources
        {
          urlPattern: /\.(?:js|css)$/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-resources",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 365 * 24 * 60 * 60,
            },
          },
        },
      ],
    });
  } catch {
    // Fallback if next-pwa is not available
    return (config: NextConfig) => config;
  }
})();

export default withPWA(nextConfig);
