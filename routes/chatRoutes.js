const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Endpoints para gestionar chats y mensajes
 */

/**
 * @swagger
 * /api/chats/contacts:
 *   get:
 *     summary: Obtiene los usuarios con los que hay mensajes (para un limpiador específico)
 *     tags: [Chats]
 *     parameters:
 *       - in: query
 *         name: cleanerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del limpiador
 *     responses:
 *       200:
 *         description: Lista de contactos (userId)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: integer
 *       400:
 *         description: El parámetro cleanerId es requerido
 *       500:
 *         description: Error al obtener los contactos
 */
router.get('/contacts', async (req, res) => {
  try {
    const { cleanerId } = req.query;
    if (!cleanerId) {
      return res.status(400).json({ error: 'El parámetro cleanerId es requerido' });
    }
    const contacts = await Chat.findAll({
      attributes: ['userId'],
      where: { cleanerId },
      group: ['userId']
    });
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
});

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Envía un mensaje
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - cleanerId
 *               - message
 *               - sender
 *             properties:
 *               userId:
 *                 type: integer
 *               cleanerId:
 *                 type: integer
 *               message:
 *                 type: string
 *               sender:
 *                 type: string
 *                 enum: [user, cleaner]
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Todos los campos son obligatorios: userId, cleanerId, message, sender
 *       500:
 *         description: Error al enviar el mensaje
 */
router.post('/', async (req, res) => {
  try {
    const { userId, cleanerId, message, sender } = req.body;
    if (!userId || !cleanerId || !message || !sender) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios: userId, cleanerId, message, sender' });
    }
    const chat = await Chat.create({ userId, cleanerId, message, sender });
    res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

/**
 * @swagger
 * /api/chats/{id}:
 *   delete:
 *     summary: Borra un mensaje por su ID
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del mensaje a borrar
 *     responses:
 *       200:
 *         description: Mensaje borrado exitosamente
 *       404:
 *         description: Mensaje no encontrado
 *       500:
 *         description: Error al borrar el mensaje
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findByPk(id);
    if (!chat) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }
    await chat.destroy();
    res.json({ message: 'Mensaje borrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al borrar el mensaje' });
  }
});

module.exports = router;
