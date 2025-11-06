// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost", // keep cookies consistent (localhost everywhere)
    port: 5174,
    proxy: {
      "/auth": { target: "http://localhost:4000", changeOrigin: false },
      "/users": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
});
