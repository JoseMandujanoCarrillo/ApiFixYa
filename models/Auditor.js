// models/Auditor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Auditor:
 *       type: object
 *       properties:
 *         auditor_id:
 *           type: integer
 *           description: ID del auditor
 *         name:
 *           type: string
 *           description: Nombre del auditor
 *         email:
 *           type: string
 *           description: Correo electrónico del auditor
 *         password:
 *           type: string
 *           description: Contraseña encriptada
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
const Auditor = sequelize.define('Auditor', {
  auditor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Auditors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Auditor;