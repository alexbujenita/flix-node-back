const bcrypt = require("bcrypt");
const db = require("../../models");

const DEFAULT_PASSWORD = "test-password";
const BCRYPT_COST_FACTOR = 4;
let userNumber = 0;

async function makeUser(overrides = {}) {
  userNumber += 1;
  const passwordDigest = await bcrypt.hash(
    DEFAULT_PASSWORD,
    BCRYPT_COST_FACTOR,
  );

  return db.User.create({
    firstName: "Test",
    email: `test-user-${userNumber}@example.test`,
    passwordDigest,
    ...overrides,
  });
}

function makeFav(userId, overrides = {}) {
  return db.UserFavourite.create({
    movieRefId: 1,
    movieTitle: "Test Movie",
    moviePosterPath: "/test-movie.jpg",
    userId,
    ...overrides,
  });
}

exports.DEFAULT_PASSWORD = DEFAULT_PASSWORD;
exports.makeUser = makeUser;
exports.makeFav = makeFav;
