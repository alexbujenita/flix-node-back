const moviesRouter = require("express").Router();
const axios = require("axios");
const { buildQueryString } = require("./buildQueryString");

moviesRouter.get("/", async (req, res) => {
  const {
    query: {
      page,
      certification,
      certificationCountry,
      primaryReleaseYear,
      primaryReleaseDateGTE,
      primaryReleaseDateLTE,
      year,
      adult,
    },
  } = req;

  const searchParams = {
    page,
    certification,
    certificationCountry,
    primaryReleaseYear,
    primaryReleaseDateGTE,
    primaryReleaseDateLTE,
    year,
    adult,
  };

  if (page < 1 || page > 500) {
    res.status(404).send("Page must be between 1 and 500");
  } else {
    try {
      const { data } = await axios.get(buildQueryString(searchParams));
      res.send(data);
    } catch (error) {
      console.error(error);
      res.status(501).send("Internal server error");
    }
  }
});

exports.moviesRouter = moviesRouter;
