const userFavsRouter = require("express").Router();
const db = require("../../../models/index");

userFavsRouter.get("/:userId", async (req, res) => {
  const {
    params: { userId },
  } = req;
  try {
    const userFavs = await db.User.findByPk(parseInt(userId), {
      include: db.UserFavourite,
    });
    // console.log(email);
    // const favs = await db.User.findOne({
    //   where: { email },
    //   include: db.UserFavourite,
    // });
    if (!userFavs) throw new Error("User not found.");
    res.send(userFavs);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

userFavsRouter.post("/", async (req, res) => {
  const {
    body: { movieRefId, movieTitle, moviePosterPath, userId },
  } = req;
  try {
    const fav = await db.UserFavourite.create({
      movieRefId: parseInt(movieRefId),
      movieTitle,
      moviePosterPath,
      userId: parseInt(userId),
    });
    res.send(fav);
  } catch (e) {
    res.status(500).send(e);
  }
});

userFavsRouter.patch("/:favId", async (req, res) => {
  const {
    params: { favId },
    body: { seen, description },
  } = req;
  try {
    const fav = await db.UserFavourite.findByPk(parseInt(favId));
    if (seen) fav.seen = !fav.seen;
    if (description) fav.description = description;
    await fav.save();
    res.send(fav);
  } catch {
    res.status(500).send({ error: "Resource not found." });
  }
});

userFavsRouter.delete("/:favId", async (req, res) => {
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
