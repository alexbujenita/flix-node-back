const actorMoviesRouter = require("express").Router();
const axios = require("axios");
const uniqBy = require("lodash.uniqby");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const actorMoviesCache = new Map();

actorMoviesRouter.get("/:actorId", async (req, res) => {
  const {
    params: { actorId },
  } = req;

  if (actorMoviesCache.has(parseInt(actorId))) {
    console.log(colours.FgCyan, "Actor Movies Cache HIT!!!");
    res.send(actorMoviesCache.get(parseInt(actorId)));
  } else {
    let page = 1;
    let totalPages;
    const actorMovies = [];

    try {
      do {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity_desc&include_adult=true&include_video=false&page=${page}&with_cast=${actorId}`
        );
        totalPages = data.total_pages;
        page++;
        actorMovies.push(...data.results);
      } while (page <= totalPages);
    } catch {
      res.status(501).send("Internal server error");
    }
    const uniqueActorMovies = uniqBy(actorMovies, "id");
    actorMoviesCache.set(parseInt(actorId), uniqueActorMovies)
    res.send(uniqueActorMovies);
  }
});

exports.actorMoviesRouter = actorMoviesRouter;
