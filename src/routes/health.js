const express = require('express');
const router = express.Router();
const HealthCheck = require('../models/HealthCheck');
const logger = require('../config/logger');
const statsd = require('../config/statsd');

// Health check endpoint - GET /healthz
router.get('/healthz', async (req, res) => {
  const apiStartTime = Date.now();
  statsd.increment('api.healthcheck.count');
  
  try {
    // Check if request has a body/payload - return 400 if present
    if (req.body && Object.keys(req.body).length > 0) {
      logger.warn('GET /healthz - Request with payload rejected');
      statsd.increment('api.healthcheck.bad_request');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.healthcheck.time', apiTime);
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.status(400).end();
    }

    // Insert a new health check record
    const dbStartTime = Date.now();
    await HealthCheck.create({
      check_datetime: new Date()
    });
    statsd.timing('database.healthcheck.create', Date.now() - dbStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.healthcheck.time', apiTime);
    
    // Set required headers and return 200 with empty body
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(200).end();

  } catch (error) {
    // Database insert failed - return 503
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.healthcheck.time', apiTime);
    statsd.increment('api.healthcheck.error');
    logger.error('GET /healthz - Health check failed', { error: error.message, stack: error.stack });
    
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
  logger.warn('Unsupported HTTP method for /healthz');
  statsd.increment('api.healthcheck.method_not_allowed');
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.status(405).end();
});

module.exports = router;