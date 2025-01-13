const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Cleaner:
 *       type: object
 *       properties:
 *         cleaner_id:
 *           type: integer
 *           description: ID del limpiador
 *         name:
 *           type: string
 *           description: Nombre del limpiador
 *         email:
 *           type: string
 *           description: Correo electrónico del limpiador
 *         password:
 *           type: string
 *           description: Contraseña del limpiador
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitud del limpiador
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitud del limpiador
 */
const Cleaner = sequelize.define('Cleaner', {
  cleaner_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
}, {
  tableName: 'Cleaners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Cleaner;
