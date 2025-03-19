const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Se requiere para usar el operador IN en Sequelize
const Auditor = require('../models/Auditor');
const Cleaner = require('../models/Cleaner');
const Service = require('../models/Service');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SECRET_KEY = 'your_secret_key'; // Cambia esto por una clave segura

/**
 * @swagger
 * tags:
 *   name: Auditors
 *   description: Gestión de auditores
 */

/**
 * @swagger
 * /auditors/register:
 *   post:
 *     summary: Registrar un nuevo auditor
 *     tags: [Auditors]
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
 *     responses:
 *       201:
 *         description: Auditor registrado exitosamente
 *       400:
 *         description: El correo ya está en uso
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el auditor ya existe
    const existingAuditor = await Auditor.findOne({ where: { email } });
    if (existingAuditor) return res.status(400).send('Email already registered');

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el auditor
    const auditor = await Auditor.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json(auditor);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/login:
 *   post:
 *     summary: Iniciar sesión como auditor
 *     tags: [Auditors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, devuelve un token
 *       404:
 *         description: Auditor no encontrado
 *       400:
 *         description: Contraseña inválida
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el auditor existe
    const auditor = await Auditor.findOne({ where: { email } });
    if (!auditor) return res.status(404).send('Auditor not found');

    // Comparar contraseñas
    const validPassword = await bcrypt.compare(password, auditor.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    // Generar token con la información necesaria
    const token = jwt.sign(
      { auditor_id: auditor.auditor_id, email: auditor.email },
      SECRET_KEY,
      { expiresIn: '3d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me:
 *   get:
 *     summary: Obtener la información del auditor autenticado
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del auditor
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Se asume que el middleware 'authenticate' añade la propiedad 'user' al request
    const auditorId = req.user.auditor_id;
    const auditor = await Auditor.findOne({ where: { auditor_id: auditorId } });
    if (!auditor) return res.status(404).send('Auditor not found');

    res.json({
      auditor_id: auditor.auditor_id,
      name: auditor.name,
      email: auditor.email,
      created_at: auditor.created_at,
      updated_at: auditor.updated_at
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me:
 *   patch:
 *     summary: Editar datos del auditor autenticado
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Objeto con los campos a actualizar. Se permite actualizar el nombre, email y contraseña.
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
 *     responses:
 *       200:
 *         description: Datos actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auditor_id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Datos inválidos o correo en uso
 *       404:
 *         description: Auditor no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.patch('/me', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    const { name, email, password } = req.body;

    // Buscar al auditor autenticado
    const auditor = await Auditor.findOne({ where: { auditor_id: auditorId } });
    if (!auditor) return res.status(404).send('Auditor not found');

    // Si se actualiza el email, verificar que no esté en uso por otro auditor
    if (email && email !== auditor.email) {
      const emailExists = await Auditor.findOne({
        where: {
          email,
          auditor_id: { [Op.ne]: auditorId }
        }
      });
      if (emailExists) return res.status(400).send('Email already in use');
    }

    // Actualizar los campos si fueron proporcionados
    if (name) auditor.name = name;
    if (email) auditor.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      auditor.password = hashedPassword;
    }

    await auditor.save();

    res.json({
      auditor_id: auditor.auditor_id,
      name: auditor.name,
      email: auditor.email,
      created_at: auditor.created_at,
      updated_at: auditor.updated_at
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me/services:
 *   get:
 *     summary: Obtener la lista de servicios y la cantidad para los cleaners asignados al auditor autenticado
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios y la cantidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 servicesCount:
 *                   type: integer
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       cleanerId:
 *                         type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/me/services', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    
    // Obtener los cleaners asignados al auditor
    const cleaners = await Cleaner.findAll({ where: { auditor_id: auditorId } });
    // Se asume que el modelo Cleaner tiene 'id' como clave primaria
    const cleanerIds = cleaners.map(cleaner => cleaner.cleaner_id);

    // Obtener todos los servicios que pertenezcan a alguno de esos cleaners
    const services = await Service.findAll({
      where: {
        cleanerId: {
          [Op.in]: cleanerIds
        }
      }
    });
    
    res.json({ servicesCount: services.length, services });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/all:
 *   get:
 *     summary: Obtener todos los auditores
 *     tags: [Auditors]
 *     responses:
 *       200:
 *         description: Lista de todos los auditores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   auditor_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error en el servidor
 */
router.get('/all', async (req, res) => {
  try {
    const auditors = await Auditor.findAll();
    res.json(auditors);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me/cleaners:
 *   get:
 *     summary: Obtener todos los cleaners asignados al auditor autenticado
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cleaners asignados al auditor autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cleaner'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error en el servidor
 */
router.get('/me/cleaners', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    const cleaners = await Cleaner.findAll({ where: { auditor_id: auditorId } });
    res.json(cleaners);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}/verify:
 *   patch:
 *     summary: Actualizar el estado de verificación de un cleaner
 *     tags: [Cleaners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cleaner a actualizar
 *     requestBody:
 *       required: true
 *       description: Objeto con el nuevo estado de verificación para el cleaner
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verified:
 *                 type: boolean
 *                 description: Nuevo estado de verificación para el cleaner
 *             example:
 *               is_verified: true
 *     responses:
 *       200:
 *         description: Estado de verificación actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estado de verificación actualizado exitosamente
 *                 cleaner:
 *                   $ref: '#/components/schemas/Cleaner'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Cleaner no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.patch('/cleaners/:id/verify', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    if (typeof is_verified !== 'boolean') {
      return res.status(400).send('Formato de datos inválido');
    }

    const cleaner = await Cleaner.findByPk(id);
    if (!cleaner) {
      return res.status(404).send('Cleaner not found');
    }

    cleaner.is_verified = is_verified;
    await cleaner.save();

    res.json({ message: 'Verification status updated successfully', cleaner });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me/proposals:
 *   get:
 *     summary: Obtener las propuestas para un servicio específico asignado al auditor
 *     description: >
 *       Se requiere pasar el id del servicio por query (?serviceId=).
 *       Retorna una lista de propuestas para el servicio indicado, incluyendo:
 *         - Imágenes (imagen_antes e imagen_despues)
 *         - Información del usuario (id y nombre)
 *         - Información del cleaner (id y nombre)
 *         - Datos del servicio (id y nombre)
 *         - Dirección
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Lista de propuestas para el servicio indicado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error en el servidor
 */
router.get('/me/proposals', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    const { serviceId } = req.query;
    if (!serviceId) {
      return res.status(400).json({ error: 'El id del servicio es requerido' });
    }
    
    // Verificar que el servicio exista y pertenezca al auditor
    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
    if (service.auditorId !== auditorId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este servicio' });
    }
    
    // Obtener las propuestas asociadas al servicio
    const proposals = await Proposal.findAll({
      where: { serviceId },
      attributes: ['id', 'serviceId', 'userId', 'imagen_antes', 'imagen_despues', 'direccion']
    });
    
    const results = await Promise.all(
      proposals.map(async proposal => {
        const cleaner = await Cleaner.findByPk(service.cleanerId);
        const user = await User.findByPk(proposal.userId);
        return {
          cleaner: cleaner ? { id: cleaner.id, name: cleaner.name } : null,
          user: user ? { id: user.id, name: user.name } : null,
          imagen_antes: proposal.imagen_antes,
          imagen_despues: proposal.imagen_despues,
          service: { id: service.id, name: service.name },
          direccion: proposal.direccion
        };
      })
    );
    
    res.json(results);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /auditors/me/proposals/details:
 *   get:
 *     summary: Obtener detalles de las propuestas para un servicio específico asignado al auditor
 *     description: >
 *       Se requiere pasar el id del servicio por query (?serviceId=).
 *       Retorna una lista de propuestas con detalles, incluyendo:
 *         - Cleaner (id y nombre)
 *         - Usuario (id y nombre)
 *         - Imágenes: imagen_antes e imagen_despues
 *         - Servicio (id y nombre)
 *         - Dirección
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Lista de detalles de propuestas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cleaner:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                   imagen_antes:
 *                     type: string
 *                   imagen_despues:
 *                     type: string
 *                   service:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                   direccion:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error en el servidor
 */
router.get('/me/proposals/details', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    const { serviceId } = req.query;
    if (!serviceId) {
      return res.status(400).json({ error: 'El id del servicio es requerido' });
    }
    
    // Verificar que el servicio exista y pertenezca al auditor
    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
    if (service.auditorId !== auditorId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este servicio' });
    }
    
    // Obtener las propuestas asociadas al servicio
    const proposals = await Proposal.findAll({
      where: { serviceId },
      attributes: ['id', 'serviceId', 'userId', 'imagen_antes', 'imagen_despues', 'direccion']
    });
    
    const detailedResults = await Promise.all(
      proposals.map(async proposal => {
        const cleaner = await Cleaner.findByPk(service.cleanerId);
        const user = await User.findByPk(proposal.userId);
        return {
          cleaner: cleaner ? { id: cleaner.id, name: cleaner.name } : null,
          user: user ? { id: user.id, name: user.name } : null,
          imagen_antes: proposal.imagen_antes,
          imagen_despues: proposal.imagen_despues,
          service: { id: service.id, name: service.name },
          direccion: proposal.direccion
        };
      })
    );
    
    res.json(detailedResults);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
