import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 🔹 Base path untuk production
  // Default '/' ok kalau deploy root domain
  base: "/",

  // 🔹 Build options
  build: {
    outDir: "dist", // boleh rename ke 'build' kalau nak
    assetsDir: "assets",
    sourcemap: false, // kalau nak disable source map production
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },

  // 🔹 Server dev options
  server: {
    port: 5173,
    open: true,
    strictPort: true,
  },

  // 🔹 Resolve alias (optional, senang import)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
