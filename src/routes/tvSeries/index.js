const tvSeriesRouter = require("express").Router();
const axios = require("axios");
const { buildTvDiscoveryQuery } = require("./buildTvDiscoverQuery");

tvSeriesRouter.get("/", async (req, res) => {
  const { page = 1, adult = false } = req.query;

  const searchParams = {
    page,
    adult,
  };

if (page < 1 || page > 500) {
    res.status(400).send("Page must be between 1 and 500");
  }

  try {
    const { data } = await axios.get(buildTvDiscoveryQuery(searchParams));
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(501).send("Internal server error");
  }
});

exports.tvSeriesRouter = tvSeriesRouter;
