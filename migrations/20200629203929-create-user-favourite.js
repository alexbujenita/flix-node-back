'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserFavourites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      movieRefId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      movieTitle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      moviePosterPath: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      seen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      watchlist: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserFavourites');
  }
};