const userFavsRouter = require("express").Router();
const db = require("../../../models/index");

userFavsRouter.post("/", async (req, res) => {
  const {
    body: {
      movieRefId,
      movieTitle,
      moviePosterPath,
      seen,
      description,
      userId,
    },
  } = req;
  try {
    const fav = await db.UserFavourite.create({
      movieRefId: parseInt(movieRefId),
      movieTitle,
      moviePosterPath,
      seen: Boolean(seen),
      description,
      userId: parseInt(userId)
    })
    res.send(fav);
  } catch (e) {
    res.status(500).send(e);
  }
});

userFavsRouter.delete('/:favId', async (req, res) => {
  const { params: { favId } } = req;
  try {
    const fav = await db.UserFavourite.findByPk(parseInt(favId));
    await fav.destroy();
    res.status(204).send();
  } catch {
    res.status(500).send({ error: 'Resource not found.' });
  }
});

exports.userFavsRouter = userFavsRouter;
