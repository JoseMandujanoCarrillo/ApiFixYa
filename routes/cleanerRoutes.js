const express = require('express');
const { authenticate, authorizeRole } = require('../middleware/auth');
const Service = require('../models/Service');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Gestión de servicios de limpieza
 */

// Ruta para que los usuarios vean sus servicios
router.get('/', authenticate, authorizeRole('user'), async (req, res) => {
  try {
    const services = await Service.findAll({ where: { userId: req.user.id } });
    res.json(services);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Ruta para que los limpiadores vean los servicios que los contrataron
router.get('/for-cleaner', authenticate, authorizeRole('cleaner'), async (req, res) => {
  try {
    const services = await Service.findAll({ where: { cleanerId: req.user.id } });
    res.json(services);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * tags:
 *   name: Cleaner
 *   description: Gestión de limpiadores
 */

/**
 * @swagger
 * /cleaners:
 *   get:
 *     summary: Obtener todos los limpiadores
 *     tags: [Cleaner]
 *     responses:
 *       200:
 *         description: Lista de limpiadores
 */
router.get('/', async (req, res) => {
  try {
    const cleaners = await Cleaner.findAll();
    res.json(cleaners);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}:
 *   get:
 *     summary: Obtener un limpiador por ID
 *     tags: [Cleaner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del limpiador
 *     responses:
 *       200:
 *         description: Limpiador encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const cleaner = await Cleaner.findByPk(req.params.id);
    if (!cleaner) return res.status(404).send('Cleaner not found');
    res.json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners:
 *   post:
 *     summary: Crear un nuevo limpiador
 *     tags: [Cleaner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Limpiador creado
 */
router.post('/', async (req, res) => {
  try {
    const cleaner = await Cleaner.create(req.body);
    res.status(201).json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}:
 *   put:
 *     summary: Actualizar un limpiador por ID
 *     tags: [Cleaner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del limpiador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Limpiador actualizado
 */
router.put('/:id', async (req, res) => {
  try {
    const cleaner = await Cleaner.findByPk(req.params.id);
    if (!cleaner) return res.status(404).send('Cleaner not found');
    await cleaner.update(req.body);
    res.json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}:
 *   delete:
 *     summary: Eliminar un limpiador por ID
 *     tags: [Cleaner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del limpiador
 *     responses:
 *       200:
 *         description: Limpiador eliminado
 */
router.delete('/:id', async (req, res) => {
  try {
    const cleaner = await Cleaner.findByPk(req.params.id);
    if (!cleaner) return res.status(404).send('Cleaner not found');
    await cleaner.destroy();
    res.send('Cleaner deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
