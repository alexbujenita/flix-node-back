const movieRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const movieCache = new Map();

/**
 * Can have &append_to_response= query, which merges other resources into the response.
 * Possible combination are (comma separated)
 * images
 * recommendations
 */
movieRouter.get("/:movieId", async (req, res) => {
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

movieRouter.get("/:movieId/:movieResource", async (req, res) => {
  // const PERMITTED_RESOURCES = ['similar', 'now_playing', 'images', 'recommendations', 'popular', 'top_rated']; maybe as a safeguard
  const {
    params: { movieId, movieResource },
    query: { pageNum = 1 },
  } = req;

  const URL = `https://api.themoviedb.org/3/movie/${
    !!parseInt(movieId) ? `${movieId}/` : ""
  }${movieResource}?api_key=${API_KEY}&page=${pageNum}`;

  try {
    const { data } = await axios.get(URL);
    res.send(data);
  } catch {
    res.status(404).send("Movie not found");
  }
});

exports.movieRouter = movieRouter;
