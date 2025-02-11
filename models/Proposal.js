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
    field: 'service_id',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  date: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true, // Cambia a false si es obligatorio
  },
  // Nueva columna: llave foránea a creditcards
  cardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'card_id',
  },
  // Nueva columna: Descripcion
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descripcion',
  },
  // Nueva columna: UsuarioEnCasa (booleano)
  UsuarioEnCasa: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'usuario_en_casa',
  },
  // Nueva columna: tipodeservicio
  tipodeservicio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'proposals',
  timestamps: false,
});

module.exports = Proposal;
