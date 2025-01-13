const express = require('express');
const Proposal = require('../models/Proposal');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Proposal
 *   description: Gestión de propuestas
 */

/**
 * @swagger
 * /proposals:
 *   get:
 *     summary: Obtener todas las propuestas
 *     tags: [Proposal]
 *     responses:
 *       200:
 *         description: Lista de propuestas
 */
router.get('/', async (req, res) => {
  try {
    const proposals = await Proposal.findAll();
    res.json(proposals);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}:
 *   get:
 *     summary: Obtener una propuesta por ID
 *     tags: [Proposal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Propuesta encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');
    res.json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals:
 *   post:
 *     summary: Crear una nueva propuesta
 *     tags: [Proposal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Propuesta creada
 */
router.post('/', async (req, res) => {
  try {
    const proposal = await Proposal.create(req.body);
    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}:
 *   put:
 *     summary: Actualizar una propuesta por ID
 *     tags: [Proposal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la propuesta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Propuesta actualizada
 */
router.put('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');
    await proposal.update(req.body);
    res.json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}:
 *   delete:
 *     summary: Eliminar una propuesta por ID
 *     tags: [Proposal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Propuesta eliminada
 */
router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');
    await proposal.destroy();
    res.send('Proposal deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
