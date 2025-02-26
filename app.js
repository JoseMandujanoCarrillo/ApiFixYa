const express = require('express');
const cors = require('cors'); // Se importa el paquete CORS
const setupSwagger = require('./config/swagger');
const cleanerRoutes = require('./routes/cleanerRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const creditCardRoutes = require('./routes/CreditCardRoutes');
const auditorRoutes = require('./routes/auditorRoutes');

const app = express();

// Middleware
app.use(express.json());

// Configuración de CORS: Puedes ajustar 'origin' según tus necesidades
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Permite solicitudes desde este origen. Si deseas permitir todos los orígenes, puedes usar '*'
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
app.use('/creditcards', creditCardRoutes); // Aquí se define la ruta base
app.use('/auditors', auditorRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});
