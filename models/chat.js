const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // FK que referencia al usuario que participa en el chat
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // nombre de la tabla del modelo User
      key: 'id'
    }
  },
  // FK que referencia al limpiador participante
  cleanerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Cleaners', // nombre de la tabla del modelo Cleaner
      key: 'cleaner_id'
    }
  },
  // Contenido del mensaje
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Campo para identificar quién envía el mensaje, puede ser 'user' o 'cleaner'
  sender: {
    type: DataTypes.ENUM('user', 'cleaner'),
    allowNull: false,
  },
}, {
  tableName: 'chat', // Nombre real de la tabla en la base de datos
  timestamps: true,  // Crea automáticamente los campos createdAt y updatedAt
});

module.exports = Chat;
