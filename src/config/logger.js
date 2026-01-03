// src/config/logger.js
const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create transports array
const transports = [
  // Always write to console
  new winston.transports.Console(),
];

// Only add file transports in production (not during tests)
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    // INFO level and above (INFO, WARN, ERROR)
    new winston.transports.File({
      filename: '/var/log/webapp/info.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // WARN level and above (WARN, ERROR)
    new winston.transports.File({
      filename: '/var/log/webapp/warn.log',
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // ERROR level only
    new winston.transports.File({
      filename: '/var/log/webapp/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: transports,
});

module.exports = logger;