const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         cleanerId:
 *           type: integer
 *           description: ID del limpiador que ofrece el servicio
 *         description:
 *           type: string
 *           description: Descripción del servicio
 *         price:
 *           type: number
 *           format: float
 *           description: Precio del servicio
 */
const Service = sequelize.define('Service', {
  cleanerId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT },
});

module.exports = Service;
