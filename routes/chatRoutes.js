const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const Cleaner = require('../models/Cleaner');
const Chat = require('../models/chat');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// -------------------------
// RUTAS PARA USUARIOS
// -------------------------

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
 *         description: Lista de limpiadores
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cleanerIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('cleanerId')), 'cleanerId']],
      where: { userId }
    });

    if (cleanerIds.length === 0) return res.json([]);

    const cleaners = await Cleaner.findAll({
      where: { cleaner_id: cleanerIds.map(c => c.cleanerId) },
      attributes: [
        [sequelize.col('cleaner_id'), 'id'],
        'name',
        'imageurl'
      ]
    });

    res.json(cleaners);
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
 *     parameters:
 *       - name: cleanerId
 *         in: path
 *         required: true
 *         type: integer
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

    const messages = await Chat.findAll({
      where: { userId, cleanerId },
      attributes: ['id', 'message', 'sender', 'createdAt'],
      order: [['createdAt', 'ASC']]
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
 *     parameters:
 *       - name: recipientId
 *         in: path
 *         required: true
 *         type: integer
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
      userId = recipientId;
      cleanerId = req.user.cleaner_id; // Corrección clave
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

// -------------------------
// RUTAS PARA LIMPIADORES
// -------------------------

/**
 * @swagger
 * /chats/cleaner/chats:
 *   get:
 *     summary: Obtener usuarios con los que el limpiador ha chateado
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cleaner/chats', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.cleaner_id;
    const userIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']],
      where: { cleanerId }
    });

    if (userIds.length === 0) return res.json([]);

    const users = await User.findAll({
      where: { id: userIds.map(u => u.userId) },
      attributes: ['id', 'name', 'imageUrl']
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
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: integer
 */
router.get('/cleaner/chats/:userId', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const cleanerId = req.user.cleaner_id;

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'imageUrl']
    });
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const messages = await Chat.findAll({
      where: { userId, cleanerId },
      attributes: ['id', 'message', 'sender', 'createdAt'],
      order: [['createdAt', 'ASC']]
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
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: integer
 */
router.post('/cleaner/chats/:userId/messages', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { message } = req.body;
    const cleanerId = req.user.cleaner_id;

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