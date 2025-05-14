const { Model, DataTypes } = require('sequelize');
const sequelize = require('./db');

class Vote extends Model {}

Vote.init({
  nomineeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  voterNationalNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  image_base64_1: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_base64_2: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Vote',
});

module.exports = Vote; 