"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserFavourite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserFavourite.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  UserFavourite.init(
    {
      movieRefId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      movieTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      moviePosterPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      watchlist: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
      },
      isRecommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "UserFavourite",
    }
  );
  return UserFavourite;
};
