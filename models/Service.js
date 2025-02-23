const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
      field: 'cleaner_id',
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.FLOAT,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imagebyte: {
      type: DataTypes.STRING,
      field: 'image',
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      field: 'image_url',
      allowNull: true,
    },
    // Nuevo campo para almacenar el horario del servicio
    schedule: {
      type: DataTypes.JSON,
      field: 'schedule',
      allowNull: true, // O false si es obligatorio
      // Ejemplo de dato:
      // [
      //   { days: ["lunes", "martes", "miércoles", "jueves", "viernes"], startTime: "06:00", endTime: "19:00" },
      //   { days: ["lunes", "miércoles", "viernes"], startTime: "10:00", endTime: "19:00" }
      // ]
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'Services',
    timestamps: true,
  }
);

module.exports = Service;
