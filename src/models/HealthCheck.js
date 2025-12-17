const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define HealthCheck model matching assignment requirements
const HealthCheck = sequelize.define('health_checks', {
  check_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'check_id'
  },
  check_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'check_datetime'
  }
}, {
  tableName: 'health_checks',
  timestamps: false,
  underscored: true
});

module.exports = HealthCheck;