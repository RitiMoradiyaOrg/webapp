const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Image = sequelize.define('Image', {
  image_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'product_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  s3_bucket_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date_created: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'Images',
  timestamps: false
});

module.exports = Image;