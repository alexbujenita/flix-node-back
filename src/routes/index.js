const { pingRouter } = require("./ping");
const { movieRouter } = require("./movie");
const { moviesRouter } = require("./movies");
const { actorInfo } = require("./actorInfo");
const { searchRouter } = require("./search");
const { randomRouter } = require("./random");
const { userFavsRouter } = require("./userFavs");
const { signUpRouter } = require("./auth/signUp");
const { signInRouter } = require("./auth/signIn");
const { logoutRouter } = require("./auth/logout");
const { actorMoviesRouter } = require("./actorMovies");
const { movieCreditsRouter } = require("./movieCredits");
const { movieTrailerRouter } = require("./movieTrailer");
const { recommendationRouter } = require("./recommendation");

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
    "/api/auth/logout": logoutRouter,
    "/api/favs": userFavsRouter,
    "/api/recommendation": recommendationRouter,
    "/api/actor-info": actorInfo,
    "/status": pingRouter,
  };

  for (const [path, router] of Object.entries(routes)) {
    app.use(path, router);
  }
};

exports.applyApi = applyApi;
