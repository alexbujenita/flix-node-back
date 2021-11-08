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
const { certificationsRouter } = require("./certifications");

const applyApi = (app) => {
  const routes = {
    "/status": pingRouter,
    "/api/movie": movieRouter,
    "/api/movies": moviesRouter,
    "/api/favs": userFavsRouter,
    "/api/actor-info": actorInfo,
    "/api/search": searchRouter,
    "/api/random": randomRouter,
    "/api/auth/login": signInRouter,
    "/api/auth/logout": logoutRouter,
    "/api/auth/register": signUpRouter,
    "/api/credits": movieCreditsRouter,
    "/api/trailers": movieTrailerRouter,
    "/api/actor-movies": actorMoviesRouter,
    "/api/recommendation": recommendationRouter,
    "/api/certifications": certificationsRouter,
  };

  for (const [path, router] of Object.entries(routes)) {
    app.use(path, router);
  }
};

exports.applyApi = applyApi;
