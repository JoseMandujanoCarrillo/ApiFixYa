const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Proposal:
 *       type: object
 *       properties:
 *         serviceId:
 *           type: integer
 *           description: ID del servicio relacionado
 *         userId:
 *           type: integer
 *           description: ID del usuario que hizo la propuesta
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha de la propuesta
 *         status:
 *           type: string
 *           description: Estado de la propuesta (pending, accepted, rejected)
 */
const proposal = sequelize.define('proposal', {
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
});

module.exports = proposal;
