// models/payment.js
const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String }, // ID de pago proporcionado por Mercado Pago
  status: { type: String, required: true }, // 'approved', 'failure', 'pending', etc.
  merchantOrderId: { type: String }, // ID de la orden del comerciante
  preferenceId: { type: String, required: true }, // ID de la preferencia de Mercado Pago
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
