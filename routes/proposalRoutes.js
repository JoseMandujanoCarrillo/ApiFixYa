const express = require('express');
const { Op } = require('sequelize');
const Proposal = require('../models/Proposal');
const Service = require('../models/Service'); // Se importa el modelo Service para relacionar los servicios con los cleaners
const { authenticate } = require('../middleware/auth');
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
 *     summary: Obtener las propuestas del usuario autenticado (cliente) con paginación
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
 *         description: Lista de propuestas realizadas por el usuario autenticado
 */
router.get('/my', authenticate, async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  try {
    // Se asume que para clientes se almacena el id en req.user.id
    const { count, rows } = await Proposal.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset,
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
 *         description: Número de página (por defecto 1)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *         description: Cantidad de elementos por página (por defecto 10)
 *     responses:
 *       200:
 *         description: Lista de todas las propuestas
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
 * /proposals/service/{serviceId}:
 *   get:
 *     summary: Obtener todas las propuestas para un servicio dado
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Lista de propuestas para el servicio especificado
 *       404:
 *         description: No se encontraron propuestas para el servicio
 */
router.get('/service/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const proposals = await Proposal.findAll({ where: { serviceId } });
    if (!proposals || proposals.length === 0) {
      return res.status(404).send('No proposals found for this service');
    }
    res.json(proposals);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/for-cleaner:
 *   get:
 *     summary: Obtener todas las propuestas conectadas a los servicios del limpiador autenticado
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de propuestas para los servicios del limpiador
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: No se encontraron servicios o propuestas para el limpiador
 */
router.get('/for-cleaner', authenticate, async (req, res) => {
  try {
    // Se asume que el token para limpiadores contiene la propiedad cleaner_id
    const cleanerId = req.user.cleaner_id;
    
    // Buscar los servicios que pertenecen al limpiador autenticado
    const services = await Service.findAll({ where: { cleanerId } });
    const serviceIds = services.map(service => service.id);

    if (serviceIds.length === 0) {
      return res.status(404).send("No services found for this cleaner");
    }

    // Buscar todas las propuestas de esos servicios
    const proposals = await Proposal.findAll({
      where: { serviceId: { [Op.in]: serviceIds } }
    });

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
 *         direccion:
 *           type: string
 *           description: Dirección de la propuesta
 *         cardId:
 *           type: integer
 *           description: ID de la tarjeta (foreign key de creditcards)
 *         Descripcion:
 *           type: string
 *           description: Descripción de la propuesta
 *         UsuarioEnCasa:
 *           type: boolean
 *           description: Indica si el usuario estará en casa
 *         servicioConstante:
 *           type: boolean
 *           description: Indica si el servicio es constante/recurrente
 *         tipodeservicio:
 *           type: string
 *           description: Tipo de servicio
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
 *         - direccion
 */
module.exports = router;
