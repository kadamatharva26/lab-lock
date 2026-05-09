// gateway — single entry point for the frontend.
// Proxies /auth/* to auth-service and everything else to core-service.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const CORE_URL = process.env.CORE_SERVICE_URL || "http://localhost:4002";

app.get("/health", (_req, res) => {
  res.json({ service: "gateway", status: "ok" });
});

// Proxy auth endpoints
app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
  })
);

// Proxy everything else to core
app.use(
  "/api",
  createProxyMiddleware({
    target: CORE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[gateway] listening on :${PORT}`);
});
