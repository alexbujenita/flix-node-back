const moviesRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

moviesRouter.get("/", async (req, res) => {
  const {
    query: { page = 1 },
  } = req;
  if (page < 1 || page > 500) {
    res.status(404).send("Page must be between 1 and 500");
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&include_adult=false&include_video=false&page=${page}`
      );
      res.send(data);
    } catch (error) {
      console.error(error);
      res.status(501).send("Internal server error");
    }
  }
});

exports.moviesRouter = moviesRouter;
