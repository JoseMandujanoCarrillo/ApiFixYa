const express = require('express');
const { Op } = require('sequelize');
const Proposal = require('../models/Proposal');
const Service = require('../models/Service'); // Se asume la relación: Proposal.belongsTo(Service, { foreignKey: 'serviceId' });
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
 *       500:
 *         description: Error del servidor
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
 *       500:
 *         description: Error del servidor
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: No se encontraron propuestas para el servicio
 *       500:
 *         description: Error del servidor
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
 *       500:
 *         description: Error del servidor
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Propuesta no encontrada
 *       500:
 *         description: Error del servidor
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
 *     security:
 *       - bearerAuth: []
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
 *       400:
 *         description: Error en la solicitud, propuesta duplicada.
 *       500:
 *         description: Error del servidor
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      serviceId,
      userId,
      datetime,
      direccion,
      Descripcion,
      UsuarioEnCasa,
      servicioConstante,
      tipodeservicio,
      paymentMethod,
      paymentReferenceId,
    } = req.body;

    if (!datetime) {
      return res.status(400).json({ error: 'El campo datetime es requerido' });
    }

    // Convertir datetime a objeto Date
    const inputDate = new Date(datetime);
    // Definir el rango de 2 horas (120 minutos) antes y después
    const lowerBound = new Date(inputDate.getTime() - 120 * 60 * 1000);
    const upperBound = new Date(inputDate.getTime() + 120 * 60 * 1000);

    // Verificar si ya existe una propuesta para el mismo serviceId, userId y dentro del rango de 2 horas,
    // cuyo status no sea "finished"
    const existingProposal = await Proposal.findOne({
      where: {
        serviceId,
        userId,
        datetime: { [Op.between]: [lowerBound, upperBound] },
        status: { [Op.ne]: 'finished' }
      }
    });

    if (existingProposal) {
      return res.status(400).json({ 
        error: 'Ya existe una propuesta para este servicio, usuario y fecha/hora (dentro de una diferencia de 2 horas)' 
      });
    }

    const proposal = await Proposal.create({
      serviceId,
      userId,
      datetime: inputDate,
      direccion,
      Descripcion,
      UsuarioEnCasa,
      servicioConstante,
      tipodeservicio,
      paymentMethod,
      paymentReferenceId,
      status: 'pending'
    });

    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /proposals/exists:
 *   get:
 *     summary: Verificar si existe una propuesta para un serviceId y datetime específicos
 *     tags: [Proposals]
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio asociado a la propuesta
 *       - in: query
 *         name: datetime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha y hora de la propuesta (en formato ISO 8601)
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *       400:
 *         description: Parámetros faltantes o incorrectos
 *       500:
 *         description: Error del servidor
 */
router.get('/exists', async (req, res) => {
  try {
    let { serviceId, datetime } = req.query;

    if (!serviceId || !datetime) {
      return res.status(400).json({ error: 'Los parámetros serviceId y datetime son requeridos.' });
    }

    serviceId = parseInt(serviceId, 10);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'El parámetro serviceId debe ser un número válido.' });
    }

    const proposal = await Proposal.findOne({
      where: {
        serviceId,
        datetime,
        status: { [Op.ne]: 'finished' }
      }
    });
    return res.json({ exists: !!proposal });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/my:
 *   get:
 *     summary: Obtener todas las propuestas del usuario autenticado
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de propuestas del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const proposals = await Proposal.findAll({ where: { userId } });
    res.json({ proposals });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
 * /proposals/{id}/confirm:
 *   put:
 *     summary: Confirmar el inicio del servicio (cambiar de 'accepted' a 'in_progress')
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Propuesta actualizada a in_progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       400:
 *         description: La propuesta no está en un estado válido para confirmar
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Propuesta no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');

    if (proposal.userId !== req.user.id) {
      return res.status(403).send('No tienes permiso para confirmar esta propuesta');
    }

    if (proposal.status !== 'accepted') {
      return res.status(400).send('La propuesta no está en un estado válido para confirmar');
    }

    proposal.status = 'in_progress';
    await proposal.save();
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

/* ============================================================
   Nuevos endpoints:
   1. Subir imagen_antes (campo JSONB, se espera un array de URLs)
   2. Subir imagen_despues (campo JSONB, se espera un array de URLs)
   3. Actualizar cleaner_finished
   ============================================================ */

/**
 * @swagger
 * /proposals/{id}/upload-imagen-antes:
 *   put:
 *     summary: Subir imagen_antes de la propuesta
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
 *             type: object
 *             properties:
 *               imagen_antes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de URLs de la imagen antes del servicio.
 *     responses:
 *       200:
 *         description: Propuesta actualizada con imagen_antes.
 *       400:
 *         description: imagen_antes es obligatorio y debe ser un array.
 *       404:
 *         description: Propuesta no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put('/:id/upload-imagen-antes', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');

    const { imagen_antes } = req.body;
    if (!imagen_antes) return res.status(400).send('imagen_antes is required');
    if (!Array.isArray(imagen_antes)) {
      return res.status(400).send('imagen_antes must be an array of strings');
    }

    proposal.imagen_antes = imagen_antes;
    await proposal.save();

    res.json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}/upload-imagen-despues:
 *   put:
 *     summary: Subir imagen_despues de la propuesta
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
 *             type: object
 *             properties:
 *               imagen_despues:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de URLs de la imagen después del servicio.
 *     responses:
 *       200:
 *         description: Propuesta actualizada con imagen_despues.
 *       400:
 *         description: imagen_despues es obligatorio y debe ser un array.
 *       404:
 *         description: Propuesta no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put('/:id/upload-imagen-despues', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');

    const { imagen_despues } = req.body;
    if (!imagen_despues) return res.status(400).send('imagen_despues is required');
    if (!Array.isArray(imagen_despues)) {
      return res.status(400).send('imagen_despues must be an array of strings');
    }

    proposal.imagen_despues = imagen_despues;
    await proposal.save();

    res.json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/{id}/update-cleaner-finished:
 *   put:
 *     summary: Actualizar el campo cleaner_finished de la propuesta
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
 *             type: object
 *             properties:
 *               cleaner_finished:
 *                 type: boolean
 *                 description: Valor para actualizar el campo cleaner_finished.
 *     responses:
 *       200:
 *         description: Propuesta actualizada con el nuevo valor de cleaner_finished.
 *       400:
 *         description: cleaner_finished es obligatorio.
 *       404:
 *         description: Propuesta no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put('/:id/update-cleaner-finished', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).send('Proposal not found');

    const { cleaner_finished } = req.body;
    if (cleaner_finished === undefined) {
      return res.status(400).send('cleaner_finished is required');
    }

    proposal.cleaner_finished = cleaner_finished;
    await proposal.save();

    res.json(proposal);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /proposals/finished:
 *   get:
 *     summary: Obtener las propuestas con estado "finished" y sus precios para un cleaner específico
 *     tags: [Proposals]
 *     parameters:
 *       - in: query
 *         name: cleanerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cleaner para filtrar las propuestas terminadas.
 *     responses:
 *       200:
 *         description: Lista de propuestas con estado finished y sus precios para el cleaner especificado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 finishedCount:
 *                   type: integer
 *                 proposals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       price:
 *                         type: number
 *       400:
 *         description: cleanerId is required or invalid.
 *       500:
 *         description: Error del servidor
 */
router.get('/finished', async (req, res) => {
  try {
    const { cleanerId } = req.query;
    if (!cleanerId) {
      return res.status(400).send('cleanerId is required');
    }
    const parsedCleanerId = parseInt(cleanerId, 10);
    if (isNaN(parsedCleanerId)) {
      return res.status(400).send('cleanerId must be a valid number');
    }

    const proposals = await Proposal.findAll({
      where: { status: 'finished' },
      include: [{
        model: Service,
        attributes: ['price'],
        where: { cleanerId: parsedCleanerId }
      }]
    });

    const finishedCount = proposals.length;
    const proposalsResult = proposals.map(prop => ({
      id: prop.proposal_id,
      status: prop.status,
      price: prop.Service ? prop.Service.price : null
    }));

    res.json({
      finishedCount,
      proposals: proposalsResult
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
