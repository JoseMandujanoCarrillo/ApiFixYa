// controllers/mercadopagoController.js

const Payment = require('../models/payment');

exports.handleSuccess = async (req, res) => {
  // Se reciben los parámetros desde la URL (por ejemplo: ?payment_id=...&status=approved)
  const { payment_id, status, merchant_order_id, preference_id } = req.query;

  const payment = new Payment({
    paymentId: payment_id,
    status: status || 'approved',
    merchantOrderId: merchant_order_id,
    preferenceId: preference_id,
  });

  try {
    await payment.save();
    // Aquí podrías redirigir al usuario a una pantalla en tu app o devolver un JSON
    res.json({ message: 'Pago exitoso', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el pago' });
  }
};

exports.handleFailure = async (req, res) => {
  const { payment_id, status, merchant_order_id, preference_id } = req.query;

  const payment = new Payment({
    paymentId: payment_id,
    status: status || 'failure',
    merchantOrderId: merchant_order_id,
    preferenceId: preference_id,
  });

  try {
    await payment.save();
    res.json({ message: 'Pago fallido', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el pago' });
  }
};

exports.handlePending = async (req, res) => {
  const { payment_id, status, merchant_order_id, preference_id } = req.query;

  const payment = new Payment({
    paymentId: payment_id,
    status: status || 'pending',
    merchantOrderId: merchant_order_id,
    preferenceId: preference_id,
  });

  try {
    await payment.save();
    res.json({ message: 'Pago pendiente', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el pago' });
  }
};
