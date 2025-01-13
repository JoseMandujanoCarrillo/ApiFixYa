const express = require('express');
const Service = require('../models/Service');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Service
 *   description: Gestión de servicios
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Obtener todos los servicios
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: Lista de servicios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   cleanerId:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 cleanerId:
 *                   type: integer
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).send('Service not found');
    res.json(service);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Crear un nuevo servicio
 *     tags: [Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cleanerId:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Servicio creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 cleanerId:
 *                   type: integer
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error al crear el servicio
 */
router.post('/', async (req, res) => {
  try {
    const { cleanerId, description, price } = req.body;
    const service = await Service.create({ cleanerId, description, price });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Actualizar un servicio por ID
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cleanerId:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error al actualizar el servicio
 */
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).send('Service not found');
    await service.update(req.body);
    res.json(service);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Eliminar un servicio por ID
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio eliminado
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error al eliminar el servicio
 */
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).send('Service not found');
    await service.destroy();
    res.send('Service deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
