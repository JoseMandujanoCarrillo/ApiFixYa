const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const Cleaner = require('../models/Cleaner');
const Chat = require('../models/chat');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * Nota: Asegúrate de que el endpoint de login para cleaners incluya la propiedad
 * "cleaner_id" en el token JWT. Por ejemplo, al firmar el token, utiliza:
 * 
 * jwt.sign({ id: cleaner.id, email: cleaner.email, cleaner_id: cleaner.id, role: 'cleaner' }, SECRET_KEY, { expiresIn: '3d' })
 * 
 * De lo contrario, req.user.cleaner_id quedará undefined y provocarás el error indicado.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Cleaner:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         imageurl:
 *           type: string
 *       example:
 *         id: 1
 *         name: "Juan Pérez"
 *         imageurl: "http://example.com/juan.jpg"
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         imageUrl:
 *           type: string
 *       example:
 *         id: 2
 *         name: "María López"
 *         imageUrl: "http://example.com/maria.jpg"
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         message:
 *           type: string
 *         sender:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 10
 *         message: "Hola, ¿cómo estás?"
 *         sender: "user"
 *         createdAt: "2025-03-11T10:00:00.000Z"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Obtener limpiadores con los que el usuario ha chateado
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de limpiadores con los que el usuario ha chateado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cleaner'
 *       500:
 *         description: Error en el servidor.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cleanerIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('cleanerId')), 'cleanerId']],
      where: { userId }
    });

    if (cleanerIds.length === 0) return res.json([]);

    // Paginación: definir page y limit a partir de query params (valores por defecto: page=1, limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const cleaners = await Cleaner.findAll({
      where: { cleaner_id: cleanerIds.map(c => c.cleanerId) },
      attributes: ['cleaner_id', 'name', 'imageurl'],
      limit,
      offset
    });

    // Incluimos tanto 'id' como 'cleaner_id' en la respuesta
    const result = cleaners.map(cleaner => ({
      id: cleaner.cleaner_id,
      cleaner_id: cleaner.cleaner_id,
      name: cleaner.name,
      imageurl: cleaner.imageurl
    }));

    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /chats/{cleanerId}:
 *   get:
 *     summary: Obtener mensajes con un limpiador
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cleanerId
 *         in: path
 *         description: ID del limpiador
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del limpiador y los mensajes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cleaner:
 *                   $ref: '#/components/schemas/Cleaner'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       404:
 *         description: Limpiador no encontrado.
 *       500:
 *         description: Error en el servidor.
 */
router.get('/:cleanerId', authenticate, async (req, res) => {
  try {
    const cleanerId = parseInt(req.params.cleanerId, 10);
    const userId = req.user.id;

    const cleaner = await Cleaner.findOne({
      where: { cleaner_id: cleanerId },
      attributes: [
        [sequelize.col('cleaner_id'), 'id'],
        'name',
        'imageurl'
      ]
    });

    if (!cleaner) return res.status(404).json({ error: 'Limpiador no encontrado' });

    // Paginación: definir page y limit a partir de query params (valores por defecto: page=1, limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const messages = await Chat.findAll({
      where: { userId, cleanerId },
      attributes: ['id', 'message', 'sender', 'createdAt'],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    res.json({
      cleaner: {
        id: cleaner.id,
        name: cleaner.name,
        imageurl: cleaner.imageurl
      },
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender: msg.sender,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /chats/{recipientId}/messages:
 *   post:
 *     summary: Enviar mensaje a limpiador/usuario
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: recipientId
 *         in: path
 *         description: ID del destinatario (puede ser un limpiador o usuario)
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Objeto con el mensaje a enviar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             required:
 *               - message
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Mensaje vacío.
 *       404:
 *         description: Limpiador o usuario no encontrado.
 *       500:
 *         description: Error en el servidor.
 */
router.post('/:recipientId/messages', authenticate, async (req, res) => {
  try {
    const recipientId = parseInt(req.params.recipientId, 10);
    const { message } = req.body;
    const { role } = req.user;

    if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

    let userId, cleanerId, senderType;

    if (role === 'user') {
      userId = req.user.id;
      cleanerId = recipientId;
      senderType = 'user';
      
      const cleanerExists = await Cleaner.findOne({ where: { cleaner_id: recipientId } });
      if (!cleanerExists) return res.status(404).json({ error: 'Limpiador no encontrado' });
    } else if (role === 'cleaner') {
      if (!req.user.cleaner_id) {
        return res.status(400).json({ error: 'Cleaner ID is missing from token' });
      }
      userId = recipientId;
      cleanerId = req.user.cleaner_id;
      senderType = 'cleaner';
      
      const userExists = await User.findOne({ where: { id: recipientId } });
      if (!userExists) return res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      return res.status(403).json({ error: 'Rol no válido' });
    }

    const newMessage = await Chat.create({
      userId,
      cleanerId,
      message,
      sender: senderType
    });

    res.status(201).json({
      id: newMessage.id,
      message: newMessage.message,
      sender: newMessage.sender,
      createdAt: newMessage.createdAt
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /chats/cleaner/chats:
 *   get:
 *     summary: Obtener usuarios con los que el limpiador ha chateado
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios con los que el limpiador ha chateado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Error en el servidor.
 */
router.get('/cleaner/chats', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.cleaner_id;
    if (!cleanerId) {
      return res.status(400).json({ error: 'Cleaner ID is missing from token' });
    }
    const userIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']],
      where: { cleanerId }
    });

    if (userIds.length === 0) return res.json([]);

    // Paginación: definir page y limit a partir de query params (valores por defecto: page=1, limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const users = await User.findAll({
      where: { id: userIds.map(u => u.userId) },
      attributes: ['id', 'name', 'imageUrl'],
      limit,
      offset
    });

    res.json(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /chats/cleaner/chats/{userId}:
 *   get:
 *     summary: Obtener mensajes con un usuario específico
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID del usuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del usuario y sus mensajes.
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error en el servidor.
 */
router.get('/cleaner/chats/:userId', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const cleanerId = req.user.cleaner_id;
    if (!cleanerId) {
      return res.status(400).json({ error: 'Cleaner ID is missing from token' });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'imageUrl']
    });
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Paginación: definir page y limit a partir de query params (valores por defecto: page=1, limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const messages = await Chat.findAll({
      where: { userId, cleanerId },
      attributes: ['id', 'message', 'sender', 'createdAt'],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        imageUrl: user.imageUrl
      },
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender: msg.sender,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /chats/cleaner/chats/{userId}/messages:
 *   post:
 *     summary: Enviar mensaje a usuario
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID del usuario destinatario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Objeto con el mensaje a enviar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             required:
 *               - message
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Mensaje vacío.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error en el servidor.
 */
router.post('/cleaner/chats/:userId/messages', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { message } = req.body;
    const cleanerId = req.user.cleaner_id;
    if (!cleanerId) {
      return res.status(400).json({ error: 'Cleaner ID is missing from token' });
    }
    if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

    const userExists = await User.findOne({ where: { id: userId } });
    if (!userExists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newMessage = await Chat.create({
      userId,
      cleanerId,
      message,
      sender: 'cleaner'
    });

    res.status(201).json({
      id: newMessage.id,
      message: newMessage.message,
      sender: newMessage.sender,
      createdAt: newMessage.createdAt
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
