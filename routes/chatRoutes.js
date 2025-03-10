// routes/chatRoutes.js
const express = require('express');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Cleaner = require('../models/Cleaner');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Endpoints para el chat entre usuarios y limpiadores
 */

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: Enviar un mensaje en el chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerId:
 *                 type: integer
 *                 description: ID del usuario o limpiador receptor
 *               message:
 *                 type: string
 *                 description: Contenido del mensaje
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   type: object
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error en el servidor
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { partnerId, message } = req.body;
    if (!partnerId || !message) {
      return res.status(400).json({ error: 'partnerId and message are required.' });
    }

    // Determinar el tipo del usuario autenticado
    let currentType, currentId;
    if (req.user.id) {
      currentType = 'user';
      currentId = req.user.id;
    } else if (req.user.cleaner_id) {
      currentType = 'cleaner';
      currentId = req.user.cleaner_id;
    } else {
      return res.status(400).json({ error: 'Invalid user authentication data.' });
    }

    // Asumimos que el chat es entre un usuario y un limpiador, por lo que el tipo de
    // interlocutor es el opuesto al del usuario autenticado.
    const partnerType = currentType === 'user' ? 'cleaner' : 'user';

    // Crear el mensaje de chat
    const chatMessage = await Chat.create({
      senderId: currentId,
      senderType: currentType,
      receiverId: partnerId,
      receiverType: partnerType,
      message: message
    });

    res.status(201).json({ chat: chatMessage });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /chat/contacts:
 *   get:
 *     summary: Obtener los contactos del chat con nombre y foto
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contactos con nombre y foto
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
 *                   image:
 *                     type: string
 *                     description: URL de la imagen del contacto
 *       500:
 *         description: Error en el servidor
 */
router.get('/contacts', authenticate, async (req, res) => {
  try {
    let currentType, currentId;
    if (req.user.id) {
      currentType = 'user';
      currentId = req.user.id;
    } else if (req.user.cleaner_id) {
      currentType = 'cleaner';
      currentId = req.user.cleaner_id;
    } else {
      return res.status(400).json({ error: 'Invalid user authentication data.' });
    }

    // Buscar todos los mensajes de chat donde el usuario actual es emisor o receptor
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { senderId: currentId, senderType: currentType },
          { receiverId: currentId, receiverType: currentType }
        ]
      }
    });

    // Crear un conjunto único de contactos
    const contactsMap = new Map();

    chats.forEach(chat => {
      let contactId, contactType;
      if (chat.senderId === currentId && chat.senderType === currentType) {
        contactId = chat.receiverId;
        contactType = chat.receiverType;
      } else {
        contactId = chat.senderId;
        contactType = chat.senderType;
      }
      const key = `${contactType}-${contactId}`;
      if (!contactsMap.has(key)) {
        contactsMap.set(key, { id: contactId, type: contactType });
      }
    });

    // Obtener detalles de cada contacto desde el modelo correspondiente
    const contacts = [];
    for (let [key, contact] of contactsMap) {
      if (contact.type === 'user') {
        const user = await User.findOne({
          where: { id: contact.id },
          attributes: ['id', 'name', 'imageUrl']
        });
        if (user) {
          contacts.push({
            id: user.id,
            name: user.name,
            image: user.imageUrl
          });
        }
      } else if (contact.type === 'cleaner') {
        const cleaner = await Cleaner.findOne({
          where: { cleaner_id: contact.id },
          attributes: ['cleaner_id', 'name', 'imageurl']
        });
        if (cleaner) {
          contacts.push({
            id: cleaner.cleaner_id,
            name: cleaner.name,
            image: cleaner.imageurl
          });
        }
      }
    }

    res.json(contacts);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
