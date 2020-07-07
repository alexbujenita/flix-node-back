const { pingRouter } = require("./ping");
const { moviesRouter } = require("./movies");
const { movieRouter } = require("./movie");
const { movieTrailerRouter } = require("./movieTrailer");
const { movieCreditsRouter } = require("./movieCredits");
const { actorMoviesRouter } = require("./actorMovies");
const { searchRouter } = require("./search");
const { randomRouter } = require("./random");
const { signUpRouter } = require("./auth/signUp");
const { signInRouter } = require("./auth/signIn");
const { userFavsRouter } = require("./userFavs");

const applyApi = (app) => {
  const routes = {
    "/api/movies": moviesRouter,
    "/api/movie": movieRouter,
    "/api/actor-movies": actorMoviesRouter,
    "/api/trailers": movieTrailerRouter,
    "/api/credits": movieCreditsRouter,
    "/api/search": searchRouter,
    "/api/random": randomRouter,
    "/api/auth/register": signUpRouter,
    "/api/auth/login": signInRouter,
    "/api/favs": userFavsRouter,
    "/status": pingRouter,
  };

  for (const path of Object.keys(routes)) {
    app.use(path, routes[path]);
  }
};

exports.applyApi = applyApi;
