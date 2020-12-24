const actorInfo = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const { colours } = require("../../utils/colours");

const actorInfoCache = new Map();

actorInfo.get("/:actorId", async (req, res) => {
  const {
    params: { actorId },
  } = req;

  if (actorInfoCache.has(parseInt(actorId))) {
    console.log(colours.FgCyan, "Actor Info Cache HIT!!!");
    res.send(actorInfoCache.get(parseInt(actorId)));
  } else {
    try {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/person/${actorId}?api_key=${API_KEY}&language=en-US`
      );
      actorInfoCache.set(data.id, data);
      res.send(data);
    } catch {
      res.status(404).send("Actor not found");
    }
  }
});

exports.actorInfo = actorInfo;