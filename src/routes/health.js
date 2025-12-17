const express = require('express');
const router = express.Router();
const HealthCheck = require('../models/HealthCheck');

// Health check endpoint - GET /healthz
router.get('/healthz', async (req, res) => {
  try {
    // Check if request has a body/payload - return 400 if present
    if (req.body && Object.keys(req.body).length > 0) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.status(400).end();
    }

    // Insert a new health check record
    await HealthCheck.create({
      check_datetime: new Date()
    });

    // Set required headers and return 200 with empty body
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(200).end();

  } catch (error) {
    // Database insert failed - return 503
    console.error('Health check failed:', error.message);
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).end();
  }
});

// Handle all other HTTP methods - return 405
router.all('/healthz', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.status(405).end();
});

module.exports = router;