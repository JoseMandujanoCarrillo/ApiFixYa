// routes/auditorRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Auditor = require('../models/Auditor');
const { authenticate } = require('../middleware/auth'); // Reutilizamos tu 'auth.js'
const router = express.Router();

const SECRET_KEY = 'my_super_secret_key'; // Cámbialo a algo seguro

/**
 * @swagger
 * tags:
 *   name: Auditors
 *   description: Gestión de auditores
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
 *         description: El correo ya está en uso
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si ya existe ese email
    const existing = await Auditor.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Encriptar la contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear el registro
    const newAuditor = await Auditor.create({
      name,
      email,
      password: hashed
    });

    res.status(201).json({
      auditor_id: newAuditor.auditor_id,
      name: newAuditor.name,
      email: newAuditor.email,
      created_at: newAuditor.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar auditor' });
  }
});

/**
 * @swagger
 * /auditors/login:
 *   post:
 *     summary: Iniciar sesión como auditor
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
 *         description: Devuelve token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const auditor = await Auditor.findOne({ where: { email } });
    if (!auditor) {
      return res.status(401).json({ message: 'Auditor not found' });
    }

    const valid = await bcrypt.compare(password, auditor.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generar token
    const token = jwt.sign({
      auditor_id: auditor.auditor_id,
      email: auditor.email
    }, SECRET_KEY, { expiresIn: '1d' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

/**
 * @swagger
 * /auditors/me:
 *   get:
 *     summary: Obtener la información del auditor autenticado
 *     tags: [Auditors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del auditor
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // 'authenticate' debería inyectar req.user con { auditor_id, email }
    const auditorId = req.user?.auditor_id;
    if (!auditorId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const auditor = await Auditor.findByPk(auditorId);
    if (!auditor) {
      return res.status(404).json({ message: 'Auditor not found' });
    }

    res.json({
      auditor_id: auditor.auditor_id,
      name: auditor.name,
      email: auditor.email,
      created_at: auditor.created_at,
      updated_at: auditor.updated_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener auditor' });
  }
});

module.exports = router;