const express = require('express');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware to parse JSON (needed for body detection)
app.use(express.json());

// Register health check routes
app.use('/', healthRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).end();
});

module.exports = app;