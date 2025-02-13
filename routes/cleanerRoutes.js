const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Cleaner = require('../models/Cleaner');
const Service = require('../models/Service'); // Importamos el modelo Service para relacionarlo
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SECRET_KEY = 'your_secret_key'; // Cambia esto por una clave más segura

/**
 * @swagger
 * tags:
 *   name: Cleaners
 *   description: Gestión de limpiadores
 */

/**
 * @swagger
 * /cleaners/register:
 *   post:
 *     summary: Registrar un nuevo limpiador
 *     tags: [Cleaners]
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
 *         description: Limpiador registrado exitosamente
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, latitude, longitude } = req.body;

    // Verificar si el limpiador ya existe
    const existingCleaner = await Cleaner.findOne({ where: { email } });
    if (existingCleaner) return res.status(400).send('Email already registered');

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el limpiador
    const cleaner = await Cleaner.create({ name, email, password: hashedPassword, latitude, longitude });
    res.status(201).json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/login:
 *   post:
 *     summary: Iniciar sesión como limpiador
 *     tags: [Cleaners]
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
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el limpiador existe
    const cleaner = await Cleaner.findOne({ where: { email } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    // Comparar contraseñas
    const validPassword = await bcrypt.compare(password, cleaner.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    // Generar token con la información necesaria
    const token = jwt.sign({ cleaner_id: cleaner.cleaner_id, email: cleaner.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/exists:
 *   get:
 *     summary: Verificar si un limpiador existe según el email proporcionado
 *     tags: [Cleaners]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email del limpiador a verificar
 *     responses:
 *       200:
 *         description: Devuelve un objeto indicando si el limpiador existe o no.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */
router.get('/exists', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'El parámetro email es requerido.' });
    }

    const cleaner = await Cleaner.findOne({ where: { email } });
    return res.json({ exists: !!cleaner });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/me:
 *   get:
 *     summary: Obtener la información del limpiador autenticado
 *     tags: [Cleaners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del limpiador
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Se asume que el middleware 'authenticate' añade la propiedad 'user' al request
    const cleanerId = req.user.cleaner_id; // Extraemos el cleaner_id del token
    const cleaner = await Cleaner.findOne({ where: { cleaner_id: cleanerId } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    // Retornamos la información necesaria del cleaner
    res.json({
      id: cleaner.cleaner_id,
      name: cleaner.name,
      email: cleaner.email,
      latitude: cleaner.latitude,
      longitude: cleaner.longitude
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/service/{serviceId}:
 *   get:
 *     summary: Obtener el limpiador perteneciente al servicio especificado
 *     tags: [Cleaners]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Información del limpiador asociado al servicio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *       404:
 *         description: Servicio o limpiador no encontrado
 */
router.get('/service/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const service = await Service.findOne({ where: { id: serviceId } });
    if (!service) return res.status(404).send('Service not found');

    const cleaner = await Cleaner.findOne({ where: { cleaner_id: service.cleanerId } });
    if (!cleaner) return res.status(404).send('Cleaner not found for this service');

    res.json({
      id: cleaner.cleaner_id,
      name: cleaner.name,
      email: cleaner.email,
      latitude: cleaner.latitude,
      longitude: cleaner.longitude
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
