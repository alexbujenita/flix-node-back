const { pingRouter } = require("./ping");
const { moviesRouter } = require("./movies");
const { movieRouter } = require("./movie");
const { movieTrailerRouter } = require("./movieTrailer");
const { movieCreditsRouter } = require("./movieCredits");
const { actorMoviesRouter } = require("./actorMovies");
const { searchRouter } = require("./search");
const { randomRouter } = require("./random");

const applyApi = (app) => {
  const routes = {
    "/api/movies": moviesRouter,
    "/api/movie": movieRouter,
    "/api/actor-movies": actorMoviesRouter,
    "/api/trailer": movieTrailerRouter,
    "/api/credits": movieCreditsRouter,
    "/api/search": searchRouter,
    "/api/random": randomRouter,
    "/status": pingRouter,
  };

  for (const path of Object.keys(routes)) {
    app.use(path, routes[path]);
  }
};

exports.applyApi = applyApi;
