const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const CreditCard = sequelize.define('CreditCard', {
  card_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  card_number: {
    type: DataTypes.STRING(19),
    allowNull: false,
  },
  expiration_date: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  cvv: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  cardholder_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  nickname: {
    type: DataTypes.STRING(50),
  },
  billing_address: {
    type: DataTypes.JSONB,
  },
  credit_limit: {
    type: DataTypes.DECIMAL(15,2),
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CreditCard;
