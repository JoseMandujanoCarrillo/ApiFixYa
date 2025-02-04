const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'service_id', // Mapea a la columna 'service_id' en la base de datos
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id', // Mapea a la columna 'user_id' en la base de datos
  },
  date: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at', // Mapea a la columna 'created_at' en la base de datos
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at', // Mapea a la columna 'updated_at' en la base de datos
  },
}, {
  tableName: 'proposals', // Nombre de la tabla en la base de datos
  timestamps: false, // Desactiva los timestamps automáticos de Sequelize
});

module.exports = Proposal;