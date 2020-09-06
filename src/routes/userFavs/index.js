const authJWT = require("../../middleware/auth/authJWT");
const userFavsRouter = require("express").Router();
const db = require("../../../models/index");

userFavsRouter.get("/user-favs", authJWT, async (req, res) => {
  try {
    const userFavs = await db.User.findByPk(req.loggedUser, {
      include: db.UserFavourite,
    });
    if (!userFavs) throw new Error("User not found.");
    res.send(userFavs);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

userFavsRouter.post("/", authJWT, async (req, res) => {
  const {
    body: { movieRefId, movieTitle, moviePosterPath },
  } = req;
  try {
    const fav = await db.UserFavourite.create({
      movieRefId: parseInt(movieRefId),
      movieTitle,
      moviePosterPath,
      userId: req.loggedUser,
    });
    res.send(fav);
  } catch (e) {
    res.status(500).send(e);
  }
});

userFavsRouter.patch("/:favId", authJWT, async (req, res) => {
  const {
    params: { favId },
    body: { seen, description, watchlist, rating },
  } = req;
  try {
    const fav = await db.UserFavourite.findByPk(parseInt(favId));
    if (seen) fav.seen = !fav.seen;
    if (watchlist) fav.watchlist = !fav.watchlist;
    if (rating) fav.rating = parseInt(rating);
    fav.description = description ?? "";
    await fav.save();
    res.send(fav);
  } catch {
    res.status(500).send({ error: "Resource not found." });
  }
});

userFavsRouter.delete("/:favId", authJWT, async (req, res) => {
  const {
    params: { favId },
  } = req;
  try {
    const fav = await db.UserFavourite.findByPk(parseInt(favId));
    await fav.destroy();
    res.status(204).send();
  } catch {
    res.status(500).send({ error: "Resource not found." });
  }
});

exports.userFavsRouter = userFavsRouter;
