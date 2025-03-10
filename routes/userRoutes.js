// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Proposal = require('../models/Proposal'); // Se asume que este modelo está definido
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SECRET_KEY = 'your_secret_key';
const ADMIN_EMAIL = 'UserAdmin@gmail.com';

// ========== Middlewares ==========

function checkUserOrAdmin(req, res, next) {
  const userId = parseInt(req.params.id);
  if (!isNaN(userId) && (req.user.id === userId || req.user.email === ADMIN_EMAIL)) {
    next();
  } else {
    res.status(403).send('Access denied');
  }
}

function checkAdmin(req, res, next) {
  if (req.user.email === ADMIN_EMAIL) {
    next();
  } else {
    return res.status(403).send('Access denied: Admin only.');
  }
}

// ========== Endpoints ==========

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
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, latitude, longitude, image_url } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).send('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      latitude, 
      longitude,
      imageUrl: image_url 
    });
    
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
 *         description: Inicio de sesión exitoso
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).send('User not found');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '3d' });
    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
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
 *     summary: Obtener todos los usuarios (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *       - name: size
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de usuarios paginada
 */
router.get('/', authenticate, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    const { count, rows } = await User.findAndCountAll({
      offset: (page - 1) * size,
      limit: size,
      attributes: { exclude: ['password'] }
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
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
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
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/:id', authenticate, checkUserOrAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send('User not found');

    const { name, email, password, latitude, longitude, image_url } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(400).send('Email already in use');
    }

    if (password) user.password = await bcrypt.hash(password, 10);
    if (name) user.name = name;
    if (email) user.email = email;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    if (image_url) user.imageUrl = image_url;

    await user.save();
    
    const userData = user.get({ plain: true });
    delete userData.password;
    
    res.json(userData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario eliminado
 */
router.delete('/:id', authenticate, checkAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send('User not found');
    
    await user.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/notifications:
 *   get:
 *     summary: Obtener notificaciones personales con paginación
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: "Devuelve las notificaciones para el usuario autenticado, basadas en propuestas que hayan cambiado de estado (ya no están en 'pending'). Cada notificación tiene el formato: propuesta <tipodeservicio> ha sido '<status>'."
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *         description: Número de página (por defecto 1)
 *       - name: size
 *         in: query
 *         schema: { type: integer }
 *         description: Tamaño de página (por defecto 10)
 *     responses:
 *       200:
 *         description: Lista de notificaciones paginadas
 */
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    // Se buscan las propuestas del usuario cuyo estado ya no sea "pending"
    const { count, rows } = await Proposal.findAndCountAll({
      where: {
        userId: req.user.id,
        status: { [Op.ne]: 'pending' }
      },
      offset: (page - 1) * size,
      limit: size,
      order: [['updatedAt', 'DESC']]
    });

    // Se genera la notificación a partir del tipodeservicio y el estado actual
    const notifications = rows.map(proposal => ({
      message: `propuesta ${proposal.tipodeservicio} ha sido '${proposal.status}'`,
      proposalId: proposal.id,
      tipodeservicio: proposal.tipodeservicio,
      status: proposal.status,
      updatedAt: proposal.updatedAt
    }));

    res.json({
      totalNotifications: count,
      totalPages: Math.ceil(count / size),
      currentPage: page,
      notifications,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/notifications/{proposalId}:
 *   delete:
 *     summary: 'Descartar (borrar) una notificación'
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: "Como las notificaciones se generan a partir de propuestas, al descartar una notificación el servidor no elimina la propuesta. Se espera que el cliente retire la notificación de su interfaz."
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación descartada exitosamente
 *       404:
 *         description: Notificación no encontrada
 */
router.delete('/notifications/:proposalId', authenticate, async (req, res) => {
  try {
    const proposalId = parseInt(req.params.proposalId);
    if (isNaN(proposalId)) return res.status(400).send('Invalid proposal ID');

    // Buscamos la propuesta del usuario cuyo estado ya no es "pending"
    const proposal = await Proposal.findOne({
      where: {
        id: proposalId,
        userId: req.user.id,
        status: { [Op.ne]: 'pending' }
      }
    });

    if (!proposal) return res.status(404).send('Notification not found');

    // Como no contamos con un campo para descartar la notificación, devolvemos un mensaje
    // para que el cliente retire la notificación de su lista.
    res.send('Notification dismissed (client should remove it)');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/name-photo:
 *   get:
 *     summary: Obtener nombre y foto de los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de nombres y fotos de los usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 */
router.get('/name-photo', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['name', 'imageUrl']
    });
    res.json(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
