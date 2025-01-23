const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Modelo User correctamente configurado
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SECRET_KEY = 'your_secret_key'; // Cambia esto por una clave más segura

const ADMIN_EMAIL = 'UserAdmin@gmail.com'; // Email del administrador

/**
 * Middleware para verificar si el usuario es administrador
 */
function checkAdmin(req, res, next) {
  if (req.user.email === ADMIN_EMAIL) {
    next();
  } else {
    return res.status(403).send('Access denied: Admin only.');
  }
}

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
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
    const user = await User.create({ name, email, password: hashedPassword, latitude, longitude });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión como usuario
 *     tags: [Users]
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
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener la información del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario autenticado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener la lista completa de usuarios (Solo para administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página (por defecto es 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - name: size
 *         in: query
 *         description: Cantidad de usuarios por página (por defecto es 10)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', authenticate, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
    const size = parseInt(req.query.size) || 10; // Tamaño de la página (por defecto 10)

    const { count, rows } = await User.findAndCountAll({
      offset: (page - 1) * size,
      limit: size,
    });

    res.json({
      totalUsers: count,
      totalPages: Math.ceil(count / size),
      currentPage: page,
      users: rows,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


/**
 * @swagger
 * /cleaners:
 *   get:
 *     summary: Listar todos los limpiadores
 *     tags: [Cleaners]
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página (por defecto 1)
 *         schema:
 *           type: integer
 *       - name: size
 *         in: query
 *         description: Cantidad de limpiadores por página (por defecto 10)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada de limpiadores
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const { count, rows } = await Cleaner.findAndCountAll({
      attributes: { exclude: ['password'] },
      offset: (page - 1) * size,
      limit: size,
    });

    res.json({
      totalCleaners: count,
      totalPages: Math.ceil(count / size),
      currentPage: page,
      cleaners: rows,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = router