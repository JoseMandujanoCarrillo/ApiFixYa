const express = require('express');
const Proposal = require('../models/Proposal'); // Importar el modelo corregido
const { authenticate } = require('../middleware/auth'); // Importar el middleware de autenticación
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Proposals
 *   description: Gestión de propuestas
 */

/**
 * @swagger
 * /proposals/my:
 *   get:
 *     summary: Obtener las propuestas del usuario autenticado con paginación
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página (por defecto 1)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *         description: Cantidad de elementos por página (por defecto 10)
 *     responses:
 *       200:
 *         description: Lista de propuestas del usuario autenticado con paginación
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
 *                     $ref: '#/components/schemas/Proposal'
 */
router.get('/my', authenticate, async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  try {
    // Filtrar las propuestas por el id del usuario autenticado (req.user.id)
    const { count, rows } = await Proposal.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset
    });

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
 * /proposals:
 *   get:
 *     summary: Obtener todas las propuestas con paginación
 *     tags: [Proposals]
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
 *                     $ref: '#/components/schemas/Proposal'
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
 *     tags: [Proposals]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Propuesta no encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const foundProposal = await Proposal.findByPk(req.params.id);
    if (!foundProposal) return res.status(404).send('Proposal not found');
    res.json(foundProposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals:
 *   post:
 *     summary: Crear una nueva propuesta
 *     tags: [Proposals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proposal'
 *     responses:
 *       201:
 *         description: Propuesta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  try {
    const newProposal = await Proposal.create(req.body);
    res.status(201).json(newProposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}:
 *   put:
 *     summary: Actualizar una propuesta por ID
 *     tags: [Proposals]
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
 *             $ref: '#/components/schemas/Proposal'
 *     responses:
 *       200:
 *         description: Propuesta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Propuesta no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const foundProposal = await Proposal.findByPk(req.params.id);
    if (!foundProposal) return res.status(404).send('Proposal not found');
    await foundProposal.update(req.body);
    res.json(foundProposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}:
 *   delete:
 *     summary: Eliminar una propuesta por ID
 *     tags: [Proposals]
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
 *       404:
 *         description: Propuesta no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const foundProposal = await Proposal.findByPk(req.params.id);
    if (!foundProposal) return res.status(404).send('Proposal not found');
    await foundProposal.destroy();
    res.send('Proposal deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Proposal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID de la propuesta
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       required:
 *         - serviceId
 *         - userId
 *       example:
 *         id: 1
 *         serviceId: 1
 *         userId: 1
 *         date: "2025-01-13T15:24:39.572Z"
 *         status: "pending"
 *         createdAt: "2025-01-13T15:24:39.572Z"
 *         updatedAt: "2025-01-13T15:24:39.572Z"
 */

module.exports = router;
