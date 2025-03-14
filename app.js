// app.js
const express = require('express');
const cors = require('cors');
const setupSwagger = require('./config/swagger');
const cleanerRoutes = require('./routes/cleanerRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const creditCardRoutes = require('./routes/CreditCardRoutes');
const auditorRoutes = require('./routes/auditorRoutes');
const mercadopagoRoutes = require('./routes/mercadopago');
const ratingRoutes = require('./routes/ratingRoutes'); // Importa el router de ratings

const app = express();

// Middleware
app.use(express.json());

// Configuración de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger
setupSwagger(app);

// Rutas
app.use('/cleaners', cleanerRoutes);
app.use('/proposals', proposalRoutes);
app.use('/services', serviceRoutes);
app.use('/users', userRoutes);
app.use('/chats', chatRoutes);
app.use('/creditcards', creditCardRoutes);
app.use('/auditors', auditorRoutes);
app.use('/mercadopago', mercadopagoRoutes);
app.use('/ratings', ratingRoutes); // Agrega la ruta para ratings

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});
