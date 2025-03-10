const express = require('express');
const router = express.Router();
const {
  handleSuccess,
  handleFailure,
  handlePending,
} = require('../controllers/mercadopagoController');

/**
 * @swagger
 * /mercadopago/success:
 *   get:
 *     summary: Procesa un pago exitoso
 *     description: Endpoint para procesar la respuesta de un pago exitoso de Mercado Pago.
 *     parameters:
 *       - in: query
 *         name: payment_id
 *         schema:
 *           type: string
 *         description: ID del pago proporcionado por Mercado Pago.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Estado del pago (por defecto 'approved').
 *       - in: query
 *         name: merchant_order_id
 *         schema:
 *           type: string
 *         description: ID de la orden del comerciante.
 *       - in: query
 *         name: preference_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la preferencia de Mercado Pago.
 *     responses:
 *       200:
 *         description: Pago exitoso procesado correctamente.
 *       500:
 *         description: Error al procesar el pago.
 */
router.get('/success', handleSuccess);

/**
 * @swagger
 * /mercadopago/failure:
 *   get:
 *     summary: Procesa un pago fallido
 *     description: Endpoint para procesar la respuesta de un pago fallido de Mercado Pago.
 *     parameters:
 *       - in: query
 *         name: payment_id
 *         schema:
 *           type: string
 *         description: ID del pago proporcionado por Mercado Pago.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Estado del pago (por defecto 'failure').
 *       - in: query
 *         name: merchant_order_id
 *         schema:
 *           type: string
 *         description: ID de la orden del comerciante.
 *       - in: query
 *         name: preference_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la preferencia de Mercado Pago.
 *     responses:
 *       200:
 *         description: Pago fallido procesado correctamente.
 *       500:
 *         description: Error al procesar el pago.
 */
router.get('/failure', handleFailure);

/**
 * @swagger
 * /mercadopago/pending:
 *   get:
 *     summary: Procesa un pago pendiente
 *     description: Endpoint para procesar la respuesta de un pago pendiente de Mercado Pago.
 *     parameters:
 *       - in: query
 *         name: payment_id
 *         schema:
 *           type: string
 *         description: ID del pago proporcionado por Mercado Pago.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Estado del pago (por defecto 'pending').
 *       - in: query
 *         name: merchant_order_id
 *         schema:
 *           type: string
 *         description: ID de la orden del comerciante.
 *       - in: query
 *         name: preference_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la preferencia de Mercado Pago.
 *     responses:
 *       200:
 *         description: Pago pendiente procesado correctamente.
 *       500:
 *         description: Error al procesar el pago.
 */
router.get('/pending', handlePending);

module.exports = router;
