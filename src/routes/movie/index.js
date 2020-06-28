const movieRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

movieRouter.get("/:movieId", async (req, res) => {
  const {
    params: { movieId },
  } = req;
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
    );
    res.send(data);
  } catch {
    res.status(404).send("Movie not found");
  }
});

exports.movieRouter = movieRouter;
