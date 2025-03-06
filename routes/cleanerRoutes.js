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
 *               imageurl:
 *                 type: string
 *                 description: URL de la imagen del limpiador
 *     responses:
 *       201:
 *         description: Limpiador registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cleaner'
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, latitude, longitude, imageurl } = req.body;

    // Verificar si el limpiador ya existe
    const existingCleaner = await Cleaner.findOne({ where: { email } });
    if (existingCleaner) return res.status(400).send('Email already registered');

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el limpiador (is_verifiqued se establece por defecto a false)
    const cleaner = await Cleaner.create({
      name,
      email,
      password: hashedPassword,
      latitude,
      longitude,
      imageurl
    });
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
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
    const token = jwt.sign(
      { cleaner_id: cleaner.cleaner_id, email: cleaner.email },
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
 *                 is_verifiqued:
 *                   type: boolean
 *                 auditor_id:
 *                   type: integer
 *                 imageurl:
 *                   type: string
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.cleaner_id; // Extraemos el cleaner_id del token
    const cleaner = await Cleaner.findOne({ where: { cleaner_id: cleanerId } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    res.json({
      id: cleaner.cleaner_id,
      name: cleaner.name,
      email: cleaner.email,
      latitude: cleaner.latitude,
      longitude: cleaner.longitude,
      is_verifiqued: cleaner.is_verifiqued,
      auditor_id: cleaner.auditor_id,
      imageurl: cleaner.imageurl
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
 *                 is_verifiqued:
 *                   type: boolean
 *                 auditor_id:
 *                   type: integer
 *                 imageurl:
 *                   type: string
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
      longitude: cleaner.longitude,
      is_verifiqued: cleaner.is_verifiqued,
      auditor_id: cleaner.auditor_id,
      imageurl: cleaner.imageurl
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/me/services:
 *   get:
 *     summary: Obtener los servicios del limpiador autenticado
 *     tags: [Cleaners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios del limpiador
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
 *                   name:
 *                     type: string
 *                   imagebyte:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error en el servidor
 */
router.get('/me/services', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.cleaner_id;
    const services = await Service.findAll({ where: { cleanerId } });
    res.json(services);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/me:
 *   put:
 *     summary: Editar la información del limpiador autenticado (todos los campos)
 *     tags: [Cleaners]
 *     security:
 *       - bearerAuth: []
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
 *               is_verifiqued:
 *                 type: boolean
 *               auditor_id:
 *                 type: integer
 *               imageurl:
 *                 type: string
 *                 description: URL de la imagen del limpiador
 *     responses:
 *       200:
 *         description: Limpiador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cleaner'
 *       400:
 *         description: Error en la actualización
 *       401:
 *         description: No autorizado
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.cleaner_id;
    const { name, email, password, latitude, longitude, is_verifiqued, auditor_id, imageurl } = req.body;
    const cleaner = await Cleaner.findOne({ where: { cleaner_id: cleanerId } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    if (name !== undefined) cleaner.name = name;
    if (email !== undefined) cleaner.email = email;
    if (latitude !== undefined) cleaner.latitude = latitude;
    if (longitude !== undefined) cleaner.longitude = longitude;
    if (password !== undefined) {
      cleaner.password = await bcrypt.hash(password, 10);
    }
    if (is_verifiqued !== undefined) cleaner.is_verifiqued = is_verifiqued;
    if (auditor_id !== undefined) cleaner.auditor_id = auditor_id;
    if (imageurl !== undefined) cleaner.imageurl = imageurl;

    await cleaner.save();
    res.json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}/verify:
 *   put:
 *     summary: Actualizar el estado de verificación de un limpiador por ID
 *     tags: [Cleaners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del limpiador a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verifiqued:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Limpiador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cleaner'
 *       400:
 *         description: Error en la solicitud
 *       404:
 *         description: Limpiador no encontrado
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const cleanerId = req.params.id;
    const { is_verifiqued } = req.body;
    
    if (typeof is_verifiqued !== 'boolean') {
      return res.status(400).send('El campo is_verifiqued es requerido y debe ser booleano');
    }

    const cleaner = await Cleaner.findOne({ where: { cleaner_id: cleanerId } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    // Asignamos el valor correcto de is_verifiqued
    cleaner.is_verifiqued = is_verifiqued;
    await cleaner.save();
    res.json(cleaner);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /cleaners/{id}/public:
 *   get:
 *     summary: Obtener el nombre y la imagen del limpiador sin autenticación
 *     tags: [Cleaners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del limpiador
 *     responses:
 *       200:
 *         description: Nombre e imagen del limpiador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 imageurl:
 *                   type: string
 *       404:
 *         description: Limpiador no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.get('/:id/public', async (req, res) => {
  try {
    const cleaner = await Cleaner.findOne({ where: { cleaner_id: req.params.id } });
    if (!cleaner) return res.status(404).send('Cleaner not found');

    res.json({
      id: cleaner.cleaner_id,
      name: cleaner.name,
      imageurl: cleaner.imageurl || null
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
