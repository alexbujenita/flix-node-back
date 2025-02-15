const tvSeriesRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
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

tvSeriesRouter.get("/:tvSeriesId", async (req, res) => {
  const {
    params: { tvSeriesId },
  } = req;
  console.log({ tvSeriesId });
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/tv/${tvSeriesId}?api_key=${API_KEY}`
    );
    res.send(data);
  } catch (e) {
    console.log(e);
    res.status(404).send("TV Series not found");
  }
});

tvSeriesRouter.get("/:tvSeriesId/season/:seasonNumber", async (req, res) => {
  const {
    params: { tvSeriesId, seasonNumber },
  } = req;
  console.log({ tvSeriesId, seasonNumber });
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/tv/${tvSeriesId}/season/${seasonNumber}?api_key=${API_KEY}`
    );
    res.send(data);
  } catch (e) {
    console.log(e);
    res.status(404).send("TV Series not found");
  }
});

exports.tvSeriesRouter = tvSeriesRouter;
