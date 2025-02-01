const express = require("express");
const bodyParser = require("body-parser");
const cricRoutes = require("./routes/cricRoutes");
const { loadTables } = require("./services/initializerService");

const app = express();
const PORT = 8080;

app.use(bodyParser.json({ limit: "300mb" }));
app.use("/cric", cricRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err?.stack);
  res.status(err?.status || 500).send({
    message: err?.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? "" : err?.stack,
  });
});

// Start Server and Load Data
app.listen(PORT, async () => {
  await loadTables();
  process.env.NODE_ENV = "development"; // Set to "production" to hide stack trace
  console.log(`🚀🚀🚀 Server running at http://localhost:${PORT}`);
});
