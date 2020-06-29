const movieTrailerRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const trailersCache = new Map();

movieTrailerRouter.get("/:movieId", async (req, res) => {
  const {
    params: { movieId },
  } = req;

  if (trailersCache.has(parseInt(movieId))) {
    console.log(colours.FgCyan, "Trailers Cache HIT!!!");
    res.send(trailersCache.get(parseInt(movieId)));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
      );
      trailersCache.set(data.id, data);
      res.send(data);
    } catch {
      res.status(404).send("Trailer not found");
    }
  }
});

exports.movieTrailerRouter = movieTrailerRouter;
