const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Auditor = require('../models/Auditor');
const Cleaner = require('../models/Cleaner'); // Se requiere para obtener los cleaners
const Service = require('../models/Service'); // Se requiere para obtener los services
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SECRET_KEY = 'your_secret_key'; // Cambia esto por una clave segura y asegúrate de usar la misma en tu middleware

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
 * /auditors/me/services:
 *   get:
 *     summary: Obtener la lista de servicios y la cantidad para el auditor autenticado
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
 *                       service_id:
 *                         type: integer
 *                       service_name:
 *                         type: string
 *                       auditor_id:
 *                         type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/me/services', authenticate, async (req, res) => {
  try {
    const auditorId = req.user.auditor_id;
    const services = await Service.findAll({ where: { auditor_id: auditorId } });
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de verificación actualizado exitosamente
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
      return res.status(400).send('Invalid data format');
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

module.exports = router;
