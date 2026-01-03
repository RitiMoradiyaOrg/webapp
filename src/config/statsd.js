// src/config/statsd.js
const StatsD = require('node-statsd');
const logger = require('./logger');

// Create StatsD client
const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'webapp.',
  cacheDns: true,
  mock: process.env.NODE_ENV === 'test', // Don't send metrics during testing
});

// Handle errors with logger instead of console.error
statsd.socket.on('error', (error) => {
  logger.error('StatsD socket error', { error: error.message, stack: error.stack });
});

module.exports = statsd;