const jwt = require("jsonwebtoken");

const tokenPayloadFor = (userId) => ({ userId, role: "user" });

function signTokenFor(userId) {
  return jwt.sign(tokenPayloadFor(userId), process.env.JWT_PRIVATE_KEY, {
    expiresIn: "2 days",
  });
}

function authCookie(userId) {
  return `JWT_TOKEN_MY_FLIX=${signTokenFor(userId)}`;
}

function expiredTokenFor(userId) {
  return jwt.sign(tokenPayloadFor(userId), process.env.JWT_PRIVATE_KEY, {
    expiresIn: "-1s",
  });
}

function tokenWithWrongKey(userId) {
  return jwt.sign(tokenPayloadFor(userId), "wrong-jwt-private-key", {
    expiresIn: "2 days",
  });
}

module.exports = {
  signTokenFor,
  authCookie,
  expiredTokenFor,
  tokenWithWrongKey,
};
