const express = require('express');
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Request logger (for debugging)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Register routes
app.use('/', healthRoutes);
app.use('/', userRoutes);
app.use('/', productRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).end();
});

module.exports = app;