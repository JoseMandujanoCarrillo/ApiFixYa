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
 *     summary: Obtener todos los servicios con paginación
 *     tags: [Service]
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
 *         description: Cantidad de servicios por página (por defecto 10)
 *     responses:
 *       200:
 *         description: Lista de servicios con paginación
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       cleanerId:
 *                         type: integer
 *                       auditorId:
 *                         type: integer
 *                         description: ID del auditor (si existe)
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       name:
 *                         type: string
 *                       imagebyte:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       schedule:
 *                         type: object
 *                         description: Horario del servicio en formato JSON.
 *                       isCleanFast:
 *                         type: boolean
 *                         description: Indica si el servicio es rápido
 *                       tags:
 *                         type: object
 *                         description: Etiquetas del servicio
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { count, rows } = await Service.findAndCountAll({ limit, offset });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      data: rows,
    });
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
 *                 auditorId:
 *                   type: integer
 *                   description: ID del auditor (si existe)
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 name:
 *                   type: string
 *                 imagebyte:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *                 schedule:
 *                   type: object
 *                   description: Horario del servicio en formato JSON.
 *                 isCleanFast:
 *                   type: boolean
 *                   description: Indica si el servicio es rápido
 *                 tags:
 *                   type: object
 *                   description: Etiquetas del servicio
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
 *               auditorId:
 *                 type: integer
 *                 description: ID del auditor (opcional)
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *               imagebyte:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 description: Horario del servicio en formato JSON.
 *               isCleanFast:
 *                 type: boolean
 *                 description: Indica si el servicio es rápido
 *               tags:
 *                 type: object
 *                 description: Etiquetas del servicio
 *             example:
 *               cleanerId: 1
 *               auditorId: 2
 *               description: "Servicio de limpieza a domicilio"
 *               price: 100.5
 *               name: "Limpieza Express"
 *               imagebyte: ""
 *               imageUrl: "http://example.com/image.jpg"
 *               schedule:
 *                 days: ["lunes", "martes"]
 *                 startTime: "08:00"
 *                 endTime: "18:00"
 *               isCleanFast: false
 *               tags:
 *                 tipo: "express"
 *     responses:
 *       201:
 *         description: Servicio creado
 *       500:
 *         description: Error al crear el servicio
 */
router.post('/', async (req, res) => {
  try {
    const { cleanerId, auditorId, description, price, name, imagebyte, imageUrl, schedule, isCleanFast, tags } = req.body;
    const service = await Service.create({ cleanerId, auditorId, description, price, name, imagebyte, imageUrl, schedule, isCleanFast, tags });
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
 *               auditorId:
 *                 type: integer
 *                 description: ID del auditor (opcional)
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *               imagebyte:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 description: Horario del servicio en formato JSON.
 *               isCleanFast:
 *                 type: boolean
 *                 description: Indica si el servicio es rápido
 *               tags:
 *                 type: object
 *                 description: Etiquetas del servicio
 *             example:
 *               cleanerId: 1
 *               auditorId: 2
 *               description: "Actualización del servicio"
 *               price: 120.0
 *               name: "Limpieza Express Actualizada"
 *               imagebyte: ""
 *               imageUrl: "http://example.com/image_updated.jpg"
 *               schedule:
 *                 days: ["lunes", "miércoles"]
 *                 startTime: "09:00"
 *                 endTime: "17:00"
 *               isCleanFast: true
 *               tags:
 *                 tipo: "premium"
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
    const { cleanerId, auditorId, description, price, name, imagebyte, imageUrl, schedule, isCleanFast, tags } = req.body;
    await service.update({ cleanerId, auditorId, description, price, name, imagebyte, imageUrl, schedule, isCleanFast, tags });
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
