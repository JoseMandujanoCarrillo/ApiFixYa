const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FixYa API',
      version: '1.0.0',
      description: 'API para la gestión de servicios de limpieza',
    },
    servers: [
      {
        url: 'https://apifixya.onrender.com',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
