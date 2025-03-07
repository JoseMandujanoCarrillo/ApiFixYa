const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Proposal:
 *       type: object
 *       properties:
 *         proposal_id:
 *           type: integer
 *           description: ID de la propuesta
 *         serviceId:
 *           type: integer
 *           description: ID del servicio
 *         userId:
 *           type: integer
 *           description: ID del usuario que crea la propuesta
 *         datetime:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora combinadas de la propuesta (en formato ISO 8601)
 *         status:
 *           type: string
 *           description: Estado de la propuesta (e.g., pending, finished)
 *         direccion:
 *           type: string
 *           description: Dirección asociada a la propuesta
 *         Descripcion:
 *           type: string
 *           description: Descripción adicional
 *         UsuarioEnCasa:
 *           type: boolean
 *           description: Indica si el usuario estará en casa
 *         servicioConstante:
 *           type: boolean
 *           description: Indica si es un servicio constante
 *         tipodeservicio:
 *           type: string
 *           description: Tipo de servicio
 *         paymentMethod:
 *           type: string
 *           description: Método de pago utilizado
 *         paymentReferenceId:
 *           type: string
 *           description: Referencia del pago
 */
const Proposal = sequelize.define('Proposal', {
  proposal_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Se usa "datetime" sin mapearlo a otro nombre en la DB
  datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  UsuarioEnCasa: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  servicioConstante: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  tipodeservicio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentReferenceId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Proposals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Proposal;
