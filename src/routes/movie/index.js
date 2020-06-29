const movieRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");
const db = require("../../../models")

const movieCache = new Map();

movieRouter.get("/:movieId", async (req, res) => {
  console.log(db.User)
  // const user = await db.User.create({firstName: 'AAA', email: 'asd', passwordDigest: 'asdasda'})
  // const asd = await db.UserFavourite.create({movieRefId: 2243,movieTitle: "adasd",userId: 1,moviePosterPath:"asdada"})
  await db.UserFavourite.create({movieRefId: 22343,movieTitle: "aASDASDdasd",userId: 1,moviePosterPath:"aDGARREFEEFsdada"})
  const usQ = await db.User.findByPk(1)
  const usFav = await usQ.getUserFavourites()
  console.log(usFav)
  const {
    params: { movieId },
  } = req;

  if (movieCache.has(parseInt(movieId))) {
    console.log(colours.FgCyan, "Movie Cache HIT!!!");
    res.send(movieCache.get(parseInt(movieId)));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
      );
      movieCache.set(data.id, data);
      res.send(data);
    } catch {
      res.status(404).send("Movie not found");
    }
  }
});

exports.movieRouter = movieRouter;
