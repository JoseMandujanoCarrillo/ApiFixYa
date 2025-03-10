const express = require('express');
const cors = require('cors'); // Se importa el paquete CORS
const setupSwagger = require('./config/swagger');
const cleanerRoutes = require('./routes/cleanerRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const creditCardRoutes = require('./routes/CreditCardRoutes');
const auditorRoutes = require('./routes/auditorRoutes');
const mercadopagoRoutes = require('./routes/mercadopago');

const app = express();

// Middleware
app.use(express.json());

// Configuración de CORS: Puedes ajustar 'origin' según tus necesidades
app.use(cors({
  origin: '*', // Permite solicitudes desde este origen. Si deseas permitir todos los orígenes, puedes usar '*'
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
app.use('/mercadopago', mercadopagoRoutes); // Se añade la ruta de Mercado Pago

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});
