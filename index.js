const express = require("express");
const applyApi = require("./src/routes").applyApi;
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

class User extends Model {}
class UserFavourite extends Model {}

User.init(
  {
    // Model attributes are defined here
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordDigest: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: "User", // We need to choose the model name
  }
);

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
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: "UserFavourite", // We need to choose the model name
  }
);

User.hasMany(UserFavourite);

const app = express();
applyApi(app);

app.get("/", (req, resp) => {
  resp.send("test");
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  await sequelize.sync({ force: true });
  app.listen(3001, () => {
    console.log("Server started on port 3001");
  });
})();

exports.models = { User, UserFavourite };
