const { PRIVATE_KEY } = require("../../../secrets");
const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  try {
    const decoded = jwt.verify(req.cookies.JWT_TOKEN_MY_FLIX, PRIVATE_KEY);
    req.loggedUser = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
};
