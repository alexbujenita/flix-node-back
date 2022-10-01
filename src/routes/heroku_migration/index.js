const herokuMigrationRouter = require("express").Router();
const axios = require("axios");
const API_KEY = require("../../../secrets").API_KEY;
const db = require("../../../models/index");

const USER_ATTRB = ["id", "firstName", "lastName", "email"];

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function movieInfo(movie) {
  return {
    imdbID: movie.imdb_id,
    title: movie.original_title,
    relDate: movie.release_date,
    seen: movie.seen,
    rating: movie.rating,
  };
}

herokuMigrationRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userFavs = await db.User.findAndCountAll({
      where: { id: parseInt(userId) },
      subQuery: false,
      order: [[db.UserFavourite, "movieTitle", "ASC"]],
      include: [
        {
          model: db.UserFavourite,
          attributes: [
            "id",
            "movieRefId",
            "movieTitle",
            "moviePosterPath",
            "seen",
            "watchlist",
            "rating",
            "isRecommended",
            "description",
            "createdAt",
          ],
        },
      ],
      attributes: USER_ATTRB,
      benchmark: true,
    });

    const favs = userFavs.rows[0].UserFavourites;

    let cnt = 0;

    const fromProvider = [];

    for (const { movieRefId, seen, rating } of favs /*.slice(0, 3)*/) {
      if (cnt >= 20) {
        cnt = 0;
        await sleep(1000);
      }
      try {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieRefId}?api_key=${API_KEY}`
        );
        cnt++;
        data.seen = seen;
        data.rating = rating;
        fromProvider.push(data);
      } catch {
        console.log("couldn't process " + movieRefId);
      }
    }

    res.send(fromProvider.map(movieInfo));
  } catch (error) {
    res.status(400).send(error);
  }
});

exports.herokuMigrationRouter = herokuMigrationRouter;
