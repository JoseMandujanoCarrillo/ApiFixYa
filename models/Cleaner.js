const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Cleaner:
 *       type: object
 *       properties:
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
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
});

module.exports = Cleaner;
