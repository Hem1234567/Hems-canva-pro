import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'Quicko-Logo.png'],
      manifest: {
        name: 'Quicko',
        short_name: 'Quicko',
        description: 'Professional design tool for everything visual',
        theme_color: '#6C5CE7',
        icons: [
          {
            src: 'Quicko-Logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Quicko-Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  // Allow Vite to serve .wasm files (needed by @imgly/background-removal ONNX runtime)
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    // Exclude from pre-bundling — the library ships pre-built ESM + WASM
    exclude: ["@imgly/background-removal"],
  },
}));
