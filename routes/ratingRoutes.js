// File: routes/ratingRoutes.js
const express = require('express');
const { Op } = require('sequelize');
const Rating = require('../models/Rating');
const { authenticate } = require('../middleware/auth'); // Middleware de autenticación
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Gestión de calificaciones de servicios
 */

/**
 * @swagger
 * /ratings:
 *   get:
 *     summary: Obtener todas las calificaciones con paginación
 *     tags: [Ratings]
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
 *         description: Lista de calificaciones
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
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;
  try {
    const { count, rows } = await Rating.findAndCountAll({ limit, offset });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      ratings: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings/my:
 *   get:
 *     summary: Obtener todas las calificaciones del usuario autenticado
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de calificaciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Se asume que el middleware coloca el id del usuario en req.user.id
    const ratings = await Rating.findAll({ where: { userId } });
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings/{id}:
 *   get:
 *     summary: Obtener una calificación por ID
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la calificación
 *     responses:
 *       200:
 *         description: Calificación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Calificación no encontrada' });
    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings:
 *   post:
 *     summary: Crear una nueva calificación (ruta pública)
 *     tags: [Ratings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *             required:
 *               - userId
 *               - serviceId
 *               - rating
 *     responses:
 *       201:
 *         description: Calificación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  try {
    const { userId, serviceId, rating, comment } = req.body;
    const newRating = await Rating.create({ userId, serviceId, rating, comment });
    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings/create:
 *   post:
 *     summary: Crear una nueva calificación para un servicio por el usuario autenticado
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *             required:
 *               - serviceId
 *               - rating
 *     responses:
 *       201:
 *         description: Calificación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { serviceId, rating, comment } = req.body;
    const userId = req.user.id; // Se extrae el id del usuario del token
    const newRating = await Rating.create({ userId, serviceId, rating, comment });
    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings/{id}:
 *   put:
 *     summary: Actualizar una calificación por ID
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la calificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Calificación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const ratingToUpdate = await Rating.findByPk(req.params.id);
    if (!ratingToUpdate) return res.status(404).json({ error: 'Calificación no encontrada' });
    const { rating, comment } = req.body;
    ratingToUpdate.rating = rating !== undefined ? rating : ratingToUpdate.rating;
    ratingToUpdate.comment = comment !== undefined ? comment : ratingToUpdate.comment;
    await ratingToUpdate.save();
    res.json(ratingToUpdate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /ratings/{id}:
 *   delete:
 *     summary: Eliminar una calificación por ID
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la calificación
 *     responses:
 *       200:
 *         description: Calificación eliminada
 *       404:
 *         description: Calificación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const ratingToDelete = await Rating.findByPk(req.params.id);
    if (!ratingToDelete) return res.status(404).json({ error: 'Calificación no encontrada' });
    await ratingToDelete.destroy();
    res.json({ message: 'Calificación eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
