const randomRouter = require("express").Router();
const axios = require("axios");
const {
  random: { randomQueryString, sample, randomInt },
} = require("./utils");

randomRouter.get("/", async (_, res) => {
  try {
    const randomMovies = [];
    let failSafe = 0;
    while (randomMovies.length < 25) {
      if (++failSafe > 10) throw new Error("Too many requests");
      const { data } = await axios.get(randomQueryString());
      const iterations = randomInt(2, 7);
      for (let i = 0; i < iterations; i++) {
        const [movie, idx] = sample(data.results);
        randomMovies.push(movie);
        data.results.splice(idx, 1);
      }
    }
    res.send(randomMovies);
  } catch (error) {
    console.log(error);
    res.status(501).send(error?.message ?? "Internal server error");
  }
});

exports.randomRouter = randomRouter;
