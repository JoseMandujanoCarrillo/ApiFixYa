const { Sequelize } = require('sequelize');

// Configuración de la conexión a PostgreSQL en Neon
const sequelize = new Sequelize('postgresql://FixYa_01_owner:rjdeX0sPqg3I@ep-silent-sun-a5q5wwwm.us-east-2.aws.neon.tech/FixYa_01', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Necesario para conexiones SSL en Neon
    },
  },
});

module.exports = sequelize;
