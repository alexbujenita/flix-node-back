const certificationsRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const certCache = new Map();

certificationsRouter.get("/", async (_, res) => {
  if (certCache.has("certs")) {
    console.log(colours.FgCyan, "Certifications Cache HIT!!!");
    res.send(certCache.get("certs"));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/certification/movie/list?api_key=${API_KEY}`
      );
      certCache.set("certs", data);
      res.send(data);
    } catch (error) {
      console.error(error);
      res.status(501).send("Internal server error");
    }
  }
});

exports.certificationsRouter = certificationsRouter;
