// @TODO really rudimentary ATM, maybe one day use some good practices!
const adminRouter = require("express").Router();
const db = require("../../../models/index");
const authJWT = require("../../middleware/auth/authJWT");

const USER_ATTRB = ["id", "firstName", "lastName"];

adminRouter.get("/users", authJWT, async (req, res) => {
  if (req.loggedUser !== 1) {
    return res.sendStatus(403);
  }
  try {
    const users = await db.User.findAndCountAll({
      attributes: USER_ATTRB,
    });
    res.send(users);
  } catch (error) {
    res.status(400).send(error);
  }
});

adminRouter.get("/users/:id/movies", authJWT, async (req, res) => {
  if (req.loggedUser !== 1) {
    return res.sendStatus(403);
  }
  const { id } = req.params;
  try {
    const userFavs = await db.User.findAndCountAll({
      where: { id: parseInt(id) },
      subQuery: false,
      order: [[db.UserFavourite, "movieTitle", "ASC"]],
      include: [
        {
          model: db.UserFavourite,
          attributes: [
            "id",
            "movieRefId",
            "movieTitle",
            "moviePosterPath",
            "seen",
            "watchlist",
            "rating",
            "isRecommended",
            "description",
            "createdAt",
          ],
        },
      ],
      attributes: USER_ATTRB,
      benchmark: true,
    });

    res.send(userFavs);
  } catch (error) {
    res.status(400).send(error);
  }
});

adminRouter.delete(
  "/users/:userId/movie/:movieId",
  authJWT,
  async (req, res) => {
    if (req.loggedUser !== 1) {
      return res.sendStatus(403);
    }
    const { userId, movieId } = req.params;
    try {
      const fav = await db.UserFavourite.findOne({
        where: { id: parseInt(movieId), userId: parseInt(userId) },
      });
      await fav.destroy();
      res.sendStatus(204);
    } catch (error) {
      res.status(400).send(error?.message);
    }
  }
);

exports.adminRouter = adminRouter;
