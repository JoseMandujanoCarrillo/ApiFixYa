const express = require('express');
const setupSwagger = require('./config/swagger');
const cleanerRoutes = require('./routes/cleanerRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());

// Swagger
setupSwagger(app);

// Rutas
app.use('/cleaners', cleanerRoutes);
app.use('/proposals', proposalRoutes);
app.use('/services', serviceRoutes);
app.use('/users', userRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});
