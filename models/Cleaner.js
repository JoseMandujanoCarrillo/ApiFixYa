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
 *         is_verifiqued:
 *           type: boolean
 *           description: Indica si el limpiador ha sido verificado
 *         auditor_id:
 *           type: integer
 *           description: ID del auditor asignado
 *         imageurl:
 *           type: string
 *           description: URL de la imagen del limpiador
 */
const Cleaner = sequelize.define('Cleaner', {
  cleaner_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  is_verifiqued: { type: DataTypes.BOOLEAN, defaultValue: false },
  auditor_id: { type: DataTypes.INTEGER, allowNull: true },
  imageurl: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'Cleaners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Cleaner;
