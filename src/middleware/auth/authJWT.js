const { PRIVATE_KEY } = require("../../../secrets");
const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Missing JWT token");
  try {
    const headerToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(headerToken, PRIVATE_KEY);
    req.loggedUser = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
};
