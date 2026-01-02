const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

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
    }
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

// Relationships
Image.belongsTo(Product, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE'
});

Product.hasMany(Image, {
  foreignKey: 'product_id',
  as: 'images'
});

module.exports = Image;