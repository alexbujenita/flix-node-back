const logoutRouter = require("express").Router();

logoutRouter.delete("/", (_, res) => {
  res.clearCookie("JWT_TOKEN");
  res.sendStatus(204);
});

exports.logoutRouter = logoutRouter;
