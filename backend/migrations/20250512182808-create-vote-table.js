'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Votes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nomineeName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      voterNationalNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Each national number can only vote once
      },
      image_base64_1: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      image_base64_2: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Votes');
  }
};
