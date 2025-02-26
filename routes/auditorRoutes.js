const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Auditor = require('../models/Auditor');
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

module.exports = router;
