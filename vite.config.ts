import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
