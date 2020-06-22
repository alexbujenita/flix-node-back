const { pingRouter } = require("./ping");
const { moviesRouter } = require("./movies");
const { movieRouter } = require("./movie");
const { movieTrailerRouter } = require("./movieTrailer");
const { movieCreditsRouter } = require("./movieCredits");
const { actorMoviesRouter } = require("./actorMovies");

const applyApi = (app) => {
  const routes = {
    "/api/movies": moviesRouter,
    "/api/movie": movieRouter,
    "/api/actor-movies": actorMoviesRouter,
    "/api/trailer": movieTrailerRouter,
    "/api/credits": movieCreditsRouter,
    "/status": pingRouter,
  };

  for(const path of Object.keys(routes)) {
    app.use(path, routes[path]);
  }
};

exports.applyApi = applyApi;
