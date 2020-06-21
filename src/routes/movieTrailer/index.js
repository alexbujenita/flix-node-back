const movieTrailerRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

movieTrailerRouter.get("/:movieId", async (req, resp) => {
  const {
    params: { movieId },
  } = req;

  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
    );
    resp.send(data);
  } catch {
    resp.status(404).send("Trailer not found");
  }
});

exports.movieTrailerRouter = movieTrailerRouter;
