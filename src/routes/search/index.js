const searchRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const searchCache = new Map();

searchRouter.get("/:entity", async (req, res) => {
  const {
    query: { searchTerm, pageNum = 1, includeAdult = false },
    // entity should be 'movie' or 'person' or better yet just 'multi'
    params: { entity },
  } = req;
  const qString = searchTerm.trim() + pageNum + includeAdult + entity;

  if (searchCache.has(qString)) {
    console.log(colours.FgCyan, "Search Movies Cache HIT!!!");
    res.send(searchCache.get(qString));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/search/${entity}?api_key=${API_KEY}&query=${searchTerm.trim()}&page=${pageNum}&include_adult=${includeAdult}`
      );
      searchCache.set(qString, data);
      res.send(data);
    } catch {
      res.status(501).send("Internal server error");
    }
  }
});

exports.searchRouter = searchRouter;
