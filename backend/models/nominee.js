const { Model, DataTypes } = require('sequelize');
const sequelize = require('./db');

class Nominee extends Model {}

Nominee.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Nominee'
});

module.exports = Nominee; 