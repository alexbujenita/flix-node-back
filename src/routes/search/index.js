const searchRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;

searchRouter.get("/", async (req, res) => {
  const {
    query: { searchTerm, pageNum = 1, includeAdult = false },
  } = req;
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${searchTerm.trim()}&page=${pageNum}&include_adult=${includeAdult}`
    );
    res.send(data);
  } catch {
    res.status(501).send("Internal server error");
  }
});

exports.searchRouter = searchRouter;
