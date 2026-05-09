// core-service entry point.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const labRoomsRouter = require("./routes/labrooms");
const equipmentRouter = require("./routes/equipment");
const bookingsRouter = require("./routes/bookings");
const availabilityRouter = require("./routes/availability");
const dashboardRouter = require("./routes/dashboard");

const { errorHandler } = require("./middleware/errorHandler");
const { spec } = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get("/health", (_req, res) => {
  res.json({ service: "core", status: "ok", uptime: process.uptime() });
});

app.use("/lab-rooms", labRoomsRouter);
app.use("/equipment", equipmentRouter);
app.use("/bookings", bookingsRouter);
app.use("/availability", availabilityRouter);
app.use("/dashboard", dashboardRouter);

// Swagger UI + raw spec
app.get("/openapi.json", (_req, res) => res.json(spec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[core] listening on :${PORT}`);
  console.log(`[core] Swagger UI: http://localhost:${PORT}/docs`);
});
