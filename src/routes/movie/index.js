const movieRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");
const authJWT = require('../../middleware/auth/authJWT')

const movieCache = new Map();

movieRouter.get("/:movieId", authJWT ,async (req, res) => {
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
