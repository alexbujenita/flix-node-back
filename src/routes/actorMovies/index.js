const actorMoviesRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

actorMoviesRouter.get("/:actorId", async (req, resp) => {
  const {
    params: { actorId },
  } = req;
  let page = 1;
  let totalPages;
  const actorMovies = [];

  try {
    do {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity_desc&include_adult=true&include_video=false&page=${page}&with_people=${actorId}`
      );
      totalPages = data.total_pages;
      page++;
      actorMovies.push(...data.results);
    } while (page <= totalPages);
  } catch {
    resp.status(501).send("Internal server error")
  }
  resp.send(actorMovies);
});

exports.actorMoviesRouter = actorMoviesRouter;
