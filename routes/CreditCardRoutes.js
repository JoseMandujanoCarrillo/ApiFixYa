const express = require('express');
const { CreditCard } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /creditcards:
 *   post:
 *     summary: Crear una nueva tarjeta de crédito
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               card_number:
 *                 type: string
 *               expiration_date:
 *                 type: string
 *               cvv:
 *                 type: string
 *               cardholder_name:
 *                 type: string
 *               nickname:
 *                 type: string
 *               billing_address:
 *                 type: object
 *               credit_limit:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tarjeta de crédito creada exitosamente
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const creditCard = await CreditCard.create({ ...req.body, user_id: req.user.id });
        res.status(201).json(creditCard);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /creditcards/{id}:
 *   put:
 *     summary: Actualizar una tarjeta de crédito por ID
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               billing_address:
 *                 type: object
 *               credit_limit:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tarjeta de crédito actualizada exitosamente
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        await CreditCard.update(req.body, { where: { id: req.params.id, user_id: req.user.id } });
        res.send('Tarjeta de crédito actualizada exitosamente');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /creditcards/{id}:
 *   delete:
 *     summary: Eliminar una tarjeta de crédito por ID
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarjeta de crédito eliminada exitosamente
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await CreditCard.destroy({ where: { id: req.params.id, user_id: req.user.id } });
        res.send('Tarjeta de crédito eliminada exitosamente');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /creditcards/user:
 *   get:
 *     summary: Obtener las tarjetas de crédito del usuario autenticado
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarjetas de crédito del usuario autenticado
 */
router.get('/user', authenticate, async (req, res) => {
    try {
        const creditCards = await CreditCard.findAll({ where: { user_id: req.user.id } });
        res.json(creditCards);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /creditcards/user/:user_id:
 *   get:
 *     summary: Obtener todas las tarjetas de crédito de un usuario específico (requiere admin)
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de tarjetas de crédito del usuario especificado
 */
router.get('/user/:user_id', authenticate, async (req, res) => {
    try {
        const creditCards = await CreditCard.findAll({ where: { user_id: req.params.user_id } });
        res.json(creditCards);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
