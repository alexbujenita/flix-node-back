const pingRouter = require("express").Router();

pingRouter.get("/", (_, res) => {
  res.sendStatus(200);
});

exports.pingRouter = pingRouter;
