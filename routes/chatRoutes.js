const express = require('express');
const Proposal = require('../models/Proposal');
const Service = require('../models/Service'); // Asegúrate de importar el modelo Service
const Cleaner = require('../models/Cleaner'); // Asegúrate de importar el modelo Cleaner
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /proposals/cleaners-with-chats:
 *   get:
 *     summary: Obtener limpiadores con los que el usuario ha interactuado (vía propuestas)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de limpiadores con id, nombre y foto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cleaner_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   imageurl:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get('/cleaners-with-chats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener todos los serviceIds asociados a las propuestas del usuario
    const proposals = await Proposal.findAll({
      where: { userId },
      attributes: ['serviceId'],
      raw: true,
    });

    const serviceIds = proposals.map(p => p.serviceId);

    // Obtener los cleaners asociados a esos serviceIds (evitando duplicados)
    const cleaners = await Cleaner.findAll({
      include: [{
        model: Service,
        where: { id: serviceIds },
        attributes: [],
      }],
      attributes: ['cleaner_id', 'name', 'imageurl'],
      distinct: true, // Evita duplicados
    });

    res.json(cleaners);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;