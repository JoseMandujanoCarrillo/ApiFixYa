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
    allowNull: true,
  },
  cardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'card_id',
  },
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descripcion',
  },
  UsuarioEnCasa: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'usuarioencasa',
  },
  tipodeservicio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  servicioConstante: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'servicio_constante',
  },
  cleanerStarted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'cleaner_started',
  },
  // NUEVOS CAMPOS:
  cleaner_finished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'cleaner_finished',
  },
  imagen_antes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    field: 'imagen_antes',
  },
  imagen_despues: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    field: 'imagen_despues',
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
