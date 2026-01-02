// src/config/statsd.js
const StatsD = require('node-statsd');

// Create StatsD client
const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'webapp.',
  cacheDns: true,
  mock: process.env.NODE_ENV === 'test', // Don't send metrics during testing
});

// Handle errors
statsd.socket.on('error', (error) => {
  console.error('StatsD socket error:', error);
});

module.exports = statsd;