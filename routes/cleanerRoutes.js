const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Cleaner = require('../models/Cleaner');
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

    // Generar token
    const token = jwt.sign({ cleaner_id: cleaner.cleaner_id, email: cleaner.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = router;
