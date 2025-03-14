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
      // Aquí se asume que existe una tabla Cleaners con la que se relaciona este campo.
      // Si deseas definir la relación, podrías agregar:
      // references: {
      //   model: 'Cleaners',
      //   key: 'id'
      // },
    },
    auditorId: {
      type: DataTypes.INTEGER,
      field: 'auditor_id',
      allowNull: true,
      references: {
        model: 'Auditors', // Nombre de la tabla de auditores en la base de datos
        key: 'auditor_id', // Clave primaria en la tabla de auditores
      },
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
    // Campo para almacenar el horario del servicio
    schedule: {
      type: DataTypes.JSON,
      field: 'schedule',
      allowNull: true,
    },
    // Nuevo campo para indicar si el servicio es rápido
    isCleanFast: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'isCleanFast',
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
