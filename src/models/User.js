const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      // Hash password with bcrypt before saving
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      this.setDataValue('password', hash);
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  account_created: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'account_created'
  },
  account_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'account_updated'
  },
  // NEW FIELDS FOR ASSIGNMENT 09 - Email Verification
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'email_verified'
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'verification_token'
  },
  verification_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_token_expiry'
  }
}, {
  tableName: 'users',
  timestamps: false,
  underscored: true,
  hooks: {
    beforeUpdate: (user) => {
      user.account_updated = new Date();
    }
  }
});

// Instance method to compare passwords
User.prototype.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Method to get user without password and sensitive verification fields
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.verification_token;
  delete values.verification_token_expiry;
  return values;
};

module.exports = User;