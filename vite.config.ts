// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: {
      entry: "server",
    },
  },

  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",

        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],

        manifest: {
          id: "/",
          name: "Norti Play",
          short_name: "Norti",
          description:
            "Plataforma de música moderna baseada no YouTube.",

          start_url: "/",
          scope: "/",

          display: "standalone",
          orientation: "portrait",

          background_color: "#0f172a",
          theme_color: "#7c3aed",

          lang: "pt-BR",

          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },

        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,

          navigateFallback: "/",

          runtimeCaching: [
            {
              urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "youtube-thumbnails",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "youtube-images",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },

        devOptions: {
          enabled: true,
        },
      }),
    ],
  },
});