const movieCreditsRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

movieCreditsRouter.get("/:movieId", async (req, resp) => {
  const {
    params: { movieId },
  } = req;
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
    );
    resp.send(data);
  } catch {
    resp.status(404).send("Credits not found");
  }
});

exports.movieCreditsRouter = movieCreditsRouter;
