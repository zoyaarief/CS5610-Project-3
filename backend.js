import express from "express";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import tripsRouter from "./routes/trips.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4000";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy all /auth/* and /users/* requests to the auth server
app.use(['/auth', '/users'], createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  // Forward cookies
  onProxyReq: (proxyReq, req) => {
    // Preserve cookies
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Forward set-cookie headers
    if (proxyRes.headers['set-cookie']) {
      res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
    }
  }
}));


app.use("/api/", tripsRouter);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Proxying auth requests to ${AUTH_SERVICE_URL}`);
});
