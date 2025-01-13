const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Asegúrate de que el modelo esté correctamente configurado
const router = express.Router();

const SECRET_KEY = 'your_secure_secret_key'; // Cambia esta clave por una más segura y mantenla en un entorno seguro, como variables de entorno

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gestión de usuarios
 */

// Middleware para autenticar JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).send('Invalid Token');
  }
};

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [User]
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
 *         description: Usuario registrado exitosamente
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, latitude, longitude } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).send('Email already registered');

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      latitude,
      longitude,
    });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [User]
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

    // Verificar si el usuario existe
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).send('User not found');

    // Comparar contraseñas
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener la información del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Exportar el router
module.exports = router;
