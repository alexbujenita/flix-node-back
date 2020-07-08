'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserFavourite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserFavourite.init({
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
    description: {
      type: DataTypes.TEXT,
    },
    userId: {
      type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
    }
  }, {
    sequelize,
    modelName: 'UserFavourite',
  });
  return UserFavourite;
};