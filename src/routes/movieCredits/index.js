const movieCreditsRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const creditsCache = new Map();

movieCreditsRouter.get("/:movieId", async (req, res) => {
  const {
    params: { movieId },
  } = req;
  if (creditsCache.has(parseInt(movieId))) {
    console.log(colours.FgCyan, "Credits Cache HIT!!!");
    res.send(creditsCache.get(parseInt(movieId)));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
      );
      creditsCache.set(data.id, data);
      res.send(data);
    } catch {
      res.status(404).send("Credits not found");
    }
  }
});

exports.movieCreditsRouter = movieCreditsRouter;
