const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitud del usuario
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitud del usuario
 */
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
});

module.exports = User;
