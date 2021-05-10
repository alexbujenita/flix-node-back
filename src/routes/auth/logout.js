const logoutRouter = require("express").Router();

logoutRouter.delete("/", (_, res) => {
  res.clearCookie("JWT_TOKEN_MY_FLIX");
  res.sendStatus(204);
});

exports.logoutRouter = logoutRouter;
