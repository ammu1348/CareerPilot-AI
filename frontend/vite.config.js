import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";
const apiProxy = () => ({
  "/api": {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
});

// Explicitly allow Arena's proxied preview domain without opening the dev
// server to arbitrary Host headers (which can enable DNS-rebinding attacks).
const allowedHosts = [".e2b.app", "localhost", "127.0.0.1"];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts,
    proxy: apiProxy(),
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    allowedHosts,
    proxy: apiProxy(),
  },
});
