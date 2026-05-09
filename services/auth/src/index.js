// auth-service entry point.
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get("/health", (_req, res) => {
  res.json({ service: "auth", status: "ok", uptime: process.uptime() });
});

// All routes mount at root — gateway strips /auth prefix before forwarding
app.use("/", authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[auth] listening on :${PORT}`);
});
