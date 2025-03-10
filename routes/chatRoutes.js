const express = require('express');
const router = express.Router();
const sequelize = require('../config/database'); // Asegúrate de exportar la instancia de Sequelize
const Cleaner = require('../models/Cleaner');
const Chat = require('../models/chat');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth'); // Importa la función de autenticación


/**
 * @swagger
 * /chats:
 *   get:
 *     summary: "Obtener todos los chats del usuario con los limpiadores (nombre y foto)"
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Lista de limpiadores con los que el usuario ha chateado"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   imageurl:
 *                     type: string
 *       401:
 *         description: "No autenticado"
 *       500:
 *         description: "Error en el servidor"
 */
// GET /
// Obtener todos los chats del usuario con los limpiadores (nombre y foto)
router.get('/', authenticate, async (req, res) => {
  try {
    // Obtener IDs únicos de limpiadores con los que el usuario ha chateado
    const cleanerIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('cleanerId')), 'cleanerId']],
      where: { userId: req.user.id }
    });

    // Extraer los IDs de los resultados
    const ids = cleanerIds.map(c => c.cleanerId);

    // Si no hay limpiadores, retornar array vacío
    if (ids.length === 0) return res.json([]);

    // Obtener detalles de los limpiadores
    const cleaners = await Cleaner.findAll({
      where: { cleaner_id: ids },
      attributes: [
        [sequelize.col('cleaner_id'), 'id'], // Mapear 'cleaner_id' a 'id'
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
 *     summary: "Obtener mensajes con un limpiador específico"
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cleanerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del limpiador"
 *     responses:
 *       200:
 *         description: "Mensajes con el limpiador"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cleaner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     imageurl:
 *                       type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       sender:
 *                         type: string
 *                         enum: [user, cleaner]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: "Limpiador no encontrado"
 *       500:
 *         description: "Error en el servidor"
 */
// GET /:cleanerId
// Obtener mensajes con un limpiador específico
router.get('/:cleanerId', authenticate, async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const userId = req.user.id;

    // Verificar existencia del limpiador
    const cleaner = await Cleaner.findOne({
      where: { cleaner_id: cleanerId },
      attributes: [
        [sequelize.col('cleaner_id'), 'id'],
        'name',
        'imageurl'
      ]
    });

    if (!cleaner) {
      return res.status(404).json({ error: 'Limpiador no encontrado' });
    }

    // Obtener mensajes entre el usuario y el limpiador
    const messages = await Chat.findAll({
      where: {
        userId: userId,
        cleanerId: cleanerId
      },
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
 *     summary: "Enviar un mensaje a un limpiador o usuario"
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del destinatario (limpiador o usuario)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: "Contenido del mensaje"
 *     responses:
 *       201:
 *         description: "Mensaje creado exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 sender:
 *                   type: string
 *                   enum: [user, cleaner]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: "Mensaje vacío o datos inválidos"
 *       404:
 *         description: "Destinatario no encontrado"
 *       500:
 *         description: "Error en el servidor"
 */
// POST /:recipientId/messages
// Enviar un mensaje a un limpiador o usuario
router.post('/:recipientId/messages', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { message } = req.body;
    const { role, id: senderId } = req.user;

    // Validar contenido del mensaje
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    let userId, cleanerId, senderType;

    if (role === 'user') {
      // Usuario enviando a limpiador
      userId = senderId;
      cleanerId = recipientId;
      senderType = 'user';

      // Verificar existencia del limpiador
      const cleanerExists = await Cleaner.findOne({
        where: { cleaner_id: recipientId }
      });
      if (!cleanerExists) {
        return res.status(404).json({ error: 'Limpiador no encontrado' });
      }
    } else if (role === 'cleaner') {
      // Limpiador respondiendo a usuario
      userId = recipientId;
      cleanerId = senderId;
      senderType = 'cleaner';

      // Verificar existencia del usuario
      const userExists = await User.findOne({
        where: { id: recipientId }
      });
      if (!userExists) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    } else {
      return res.status(403).json({ error: 'Rol de usuario no válido' });
    }

    // Crear el mensaje
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
 *     summary: "Obtener todos los usuarios con los que el limpiador ha chateado"
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Lista de usuarios"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   imageurl:
 *                     type: string
 *       401:
 *         description: "No autenticado"
 *       500:
 *         description: "Error en el servidor"
 */
// --- Rutas para el limpiador ---
// GET /cleaner/chats
// Obtener todos los usuarios con los que el limpiador ha chateado
router.get('/cleaner/chats', authenticate, async (req, res) => {
  try {
    const cleanerId = req.user.id;

    // Obtener IDs únicos de usuarios
    const userIds = await Chat.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']],
      where: { cleanerId }
    });

    const ids = userIds.map(u => u.userId);
    if (ids.length === 0) return res.json([]);

    // Obtener detalles de los usuarios
    const users = await User.findAll({
      where: { id: ids },
      attributes: ['id', 'name', 'imageurl']
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
 *     summary: "Obtener mensajes con un usuario específico"
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del usuario"
 *     responses:
 *       200:
 *         description: "Mensajes con el usuario"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     imageurl:
 *                       type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       sender:
 *                         type: string
 *                         enum: [user, cleaner]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: "Usuario no encontrado"
 *       500:
 *         description: "Error en el servidor"
 */
// GET /cleaner/chats/:userId
// Obtener mensajes con un usuario específico
router.get('/cleaner/chats/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const cleanerId = req.user.id;

    // Verificar existencia del usuario
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'imageurl']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener mensajes
    const messages = await Chat.findAll({
      where: { userId, cleanerId },
      attributes: ['id', 'message', 'sender', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        imageurl: user.imageurl
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
 *     summary: "Enviar mensaje a un usuario"
 *     tags: [Cleaner Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del usuario"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: "Mensaje creado"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 sender:
 *                   type: string
 *                   enum: [cleaner]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: "Mensaje vacío o datos inválidos"
 *       404:
 *         description: "Usuario no encontrado"
 *       500:
 *         description: "Error en el servidor"
 */
// POST /cleaner/chats/:userId/messages
// Enviar mensaje a un usuario
router.post('/cleaner/chats/:userId/messages', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const cleanerId = req.user.id;

    // Validar mensaje
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    // Verificar existencia del usuario
    const userExists = await User.findOne({ where: { id: userId } });
    if (!userExists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear mensaje
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