const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ajusta según tu configuración

const Service = sequelize.define(
  'Service',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cleanerId: {
      type: DataTypes.INTEGER,
      field: 'cleaner_id', // Nombre real en la base de datos
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.FLOAT,
    },
    name: {
      type: DataTypes.STRING, // Usamos STRING en lugar de BLOB para nombres
      allowNull: false, // Hacemos que sea obligatorio
    },
    image: {
      type: DataTypes.BLOB('long'), // Permite almacenar imágenes en formato binario
      allowNull: true, // Campo opcional
    },
    imageUrl: {
      type: DataTypes.STRING, // Representa la nueva columna image_url como una URL
      field: 'image_url', // Nombre real en la base de datos
      allowNull: true, // Permite que sea opcional
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at', // Mapea a la columna de la base de datos
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at', // Mapea a la columna de la base de datos
    },
  },
  {
    tableName: 'Services', // Nombre de la tabla en la base de datos
    timestamps: true, // Sequelize manejará automáticamente las marcas de tiempo
  }
);

module.exports = Service;
