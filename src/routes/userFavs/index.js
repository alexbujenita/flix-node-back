const authJWT = require("../../middleware/auth/authJWT");
const userFavsRouter = require("express").Router();
const path = require("path");
const fs = require("fs");
const db = require("../../../models/index");
const { pipeline } = require("stream");

userFavsRouter.get("/user-favs", authJWT, async (req, res) => {
  try {
    const userFavs = await db.User.findByPk(req.loggedUser, {
      include: db.UserFavourite,
      attributes: { exclude: ["email", "passwordDigest"] },
    });
    if (!userFavs) throw new Error("User not found.");
    res.send(userFavs);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

userFavsRouter.get("/pdf", authJWT, async (req, res) => {
  try {
    const userFavs = await db.UserFavourite.findAll({
      where: { userId: req.loggedUser },
    });
    
    for (const fav of userFavs) {
      console.log(fav.toJSON())
    }

    if (!userFavs) throw new Error("User not found.");
    res.send(userFavs);
    // const file = fs.createReadStream(
    //   path.join(__dirname + "../../../../male.pdf")
    // );
    // const stat = fs.statSync(path.join(__dirname + "../../../../male.pdf"));

    // res.setHeader("Content-Length", stat.size);
    // res.setHeader("Content-Type", "application/pdf");
    // pipeline(file, res, (e) => {
    //   if(e) {
    //     console.log(e);
    //   } else {console.log('done')}
    // });
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

userFavsRouter.post("/", authJWT, async (req, res) => {
  const {
    body: { movieRefId, movieTitle, moviePosterPath },
  } = req;
  try {
    const fav = await db.UserFavourite.create({
      movieRefId: parseInt(movieRefId),
      movieTitle,
      moviePosterPath,
      userId: req.loggedUser,
    });
    res.send(fav);
  } catch (e) {
    res.status(500).send(e);
  }
});

userFavsRouter.patch("/:originalIdFav", authJWT, async (req, res) => {
  const {
    params: { originalIdFav },
    body: { seen, description, watchlist, rating },
  } = req;
  try {
    // ^^ Easier if the original ID is passed
    const fav = await db.UserFavourite.findOne({
      where: { movieRefId: parseInt(originalIdFav) },
    });
    if (seen) fav.seen = !fav.seen;
    if (watchlist) fav.watchlist = !fav.watchlist;
    if (rating) fav.rating = parseInt(rating);
    fav.description = description ?? fav.description;
    await fav.save();
    res.send(fav);
  } catch {
    res.status(500).send({ error: "Resource not found." });
  }
});

userFavsRouter.delete("/:originalIdFav", authJWT, async (req, res) => {
  const {
    params: { originalIdFav },
  } = req;
  try {
    // const fav = await db.UserFavourite.findByPk(parseInt(favId));
    // ^^ Easier if the original ID is passed
    const fav = await db.UserFavourite.findOne({
      where: { movieRefId: parseInt(originalIdFav) },
    });
    await fav.destroy();
    res.status(204).send();
  } catch {
    res.status(500).send({ error: "Resource not found." });
  }
});

exports.userFavsRouter = userFavsRouter;
