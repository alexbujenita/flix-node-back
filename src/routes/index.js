const { pingRouter } = require("./ping");
const { moviesRouter } = require("./movies");
const { movieRouter } = require("./movie");

const applyApi = (app) => {
  const routes = {
    "/api/movies": moviesRouter,
    "/api/movie": movieRouter,
    "/status": pingRouter,
  };

  const paths = Object.keys(routes);

  paths.forEach((path) => {
    app.use(path, routes[path]);
  });
};

exports.applyApi = applyApi;
