const pingRouter = require("express").Router();

pingRouter.get("/", (req, res) => {
  res.status(200).send("OK");
});

exports.pingRouter = pingRouter;
