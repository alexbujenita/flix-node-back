const { pingRouter } = require("./ping");
const { moviesRouter } = require("./movies");
const { movieRouter } = require("./movie");
const { movieTrailerRouter } = require("./movieTrailer");
const { movieCreditsRouter } = require("./movieCredits");

const applyApi = (app) => {
  const routes = {
    "/api/movies": moviesRouter,
    "/api/movie": movieRouter,
    "/api/trailer": movieTrailerRouter,
    "/api/credits": movieCreditsRouter,
    "/status": pingRouter,
  };

  const paths = Object.keys(routes);

  paths.forEach((path) => {
    app.use(path, routes[path]);
  });
};

exports.applyApi = applyApi;
