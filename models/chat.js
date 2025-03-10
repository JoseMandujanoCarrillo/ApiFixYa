// models/Chat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['user', 'cleaner']]
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiverType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['user', 'cleaner']]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'Chats',
  timestamps: true, // Esto crea automáticamente createdAt y updatedAt
});

module.exports = Chat;
