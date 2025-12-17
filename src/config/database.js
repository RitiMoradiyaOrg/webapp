const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '', // Handle empty password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00', // UTC timezone
    dialectOptions: {
      // For macOS local PostgreSQL without password
      ssl: false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;