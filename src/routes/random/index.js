const randomRouter = require("express").Router();
const axios = require("axios");
const {
  random: { randomQueryString, sample, randomInt },
} = require("./utils");

randomRouter.get("/", async (_, res) => {
  try {
    const randomMovies = [];
    let failSafe = 0;

    do {
      if (++failSafe > 10) break; // return what we have instead of erroring if there are too many requests
      const rndQuery = randomQueryString();
      const { data } = await axios.get(rndQuery);
      const iterations = randomInt(2, 7);
      for (let i = 0; i < iterations; i++) {
        const [movie, idx] = sample(data.results);
        randomMovies.push(movie);
        data.results.splice(idx, 1);
      }
    } while (randomMovies.length < 27);

    res.send(randomMovies);
  } catch (error) {
    console.log(error);
    res.status(501).send(error?.message ?? "Internal server error");
  }
});

exports.randomRouter = randomRouter;
