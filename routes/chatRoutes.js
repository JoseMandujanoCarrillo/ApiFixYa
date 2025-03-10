const express = require('express');
const { Op } = require('sequelize');
const Conversation = require('../models/Conversation'); // Modelo de conversaciones
const Chat = require('../models/chat'); // Modelo de mensajes de chat
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: Gestión de conversaciones y mensajes de chat
 */

/**
 * @swagger
 * /conversations/my:
 *   get:
 *     summary: Obtener todas las conversaciones del usuario autenticado
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Error del servidor
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    let conversations;
    // Si el usuario autenticado es un limpiador (se espera que tenga cleaner_id)
    if (req.user.cleaner_id) {
      conversations = await Conversation.findAll({
        where: { cleaner_id: req.user.cleaner_id },
        order: [['updated_at', 'DESC']]
      });
    } else { // Si es un cliente
      conversations = await Conversation.findAll({
        where: { user_id: req.user.id },
        order: [['updated_at', 'DESC']]
      });
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /conversations/{id}:
 *   get:
 *     summary: Obtener una conversación por ID junto con sus mensajes
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación y sus mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) return res.status(404).send('Conversation not found');

    // Verificar que el usuario autenticado participe en la conversación
    if (
      (req.user.cleaner_id && conversation.cleaner_id !== req.user.cleaner_id) ||
      (!req.user.cleaner_id && conversation.user_id !== req.user.id)
    ) {
      return res.status(403).send('No tienes permiso para ver esta conversación');
    }

    const messages = await Chat.findAll({
      where: { conversation_id: conversation.id },
      order: [['created_at', 'ASC']]
    });
    res.json({ conversation, messages });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Crear una nueva conversación entre un usuario y un limpiador
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID del usuario (cliente)
 *               cleanerId:
 *                 type: integer
 *                 description: ID del limpiador
 *     responses:
 *       201:
 *         description: Conversación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post('/', authenticate, async (req, res) => {
  try {
    let { userId, cleanerId } = req.body;
    // Si el usuario autenticado es cliente, se asigna su ID automáticamente
    if (!req.user.cleaner_id) {
      userId = req.user.id;
    } else {
      // Si es limpiador, se asigna su cleaner_id
      cleanerId = req.user.cleaner_id;
    }

    // Opcional: Buscar si ya existe una conversación entre ambos participantes
    let conversation = await Conversation.findOne({
      where: { user_id: userId, cleaner_id: cleanerId }
    });
    if (!conversation) {
      conversation = await Conversation.create({ user_id: userId, cleaner_id: cleanerId });
    }
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /conversations/{id}/message:
 *   post:
 *     summary: Enviar un mensaje dentro de una conversación
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Contenido del mensaje
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de URLs de archivos adjuntos (opcional)
 *     responses:
 *       201:
 *         description: Mensaje enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/message', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) return res.status(404).send('Conversation not found');

    // Verificar que el usuario autenticado sea parte de la conversación
    if (
      (req.user.cleaner_id && conversation.cleaner_id !== req.user.cleaner_id) ||
      (!req.user.cleaner_id && conversation.user_id !== req.user.id)
    ) {
      return res.status(403).send('No tienes permiso para enviar mensajes en esta conversación');
    }

    const { message, attachments } = req.body;
    if (!message) return res.status(400).send('El campo message es requerido');

    // Determinar el tipo de remitente según el usuario autenticado
    const senderType = req.user.cleaner_id ? 'cleaner' : 'user';

    const chatMessage = await Chat.create({
      conversation_id: conversation.id,
      sender_type: senderType,
      message,
      attachments,
      status: 'unread'
    });

    res.status(201).json(chatMessage);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
