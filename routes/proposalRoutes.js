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
 *     summary: Obtener todas las propuestas con paginación
 *     tags: [Proposal]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de la página (por defecto 1)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *         description: Cantidad de elementos por página (por defecto 10)
 *     responses:
 *       200:
 *         description: Lista de propuestas con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 proposals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       serviceId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 */
router.get('/', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  try {
    const { count, rows } = await Proposal.findAndCountAll({ limit, offset });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      proposals: rows,
    });
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
