const authJWT = require("../../middleware/auth/authJWT");
const userFavsRouter = require("express").Router();
const db = require("../../../models/index");
const PDFDocument = require("pdfkit");
const generateFavPages = require("../../utils/generateFavPages");

userFavsRouter.get("/user-favs", authJWT, async (req, res) => {
  try {
    const userFavs = await db.User.findByPk(req.loggedUser, {
      order: [[db.UserFavourite, "movieTitle", "ASC"]],
      include: {
        model: db.UserFavourite,
        attributes: [
          "movieRefId",
          "movieTitle",
          "moviePosterPath",
          "seen",
          "watchlist",
          "rating",
          "description",
        ],
      },
      attributes: ["firstName", "lastName"],
    });
    if (!userFavs) throw new Error("User not found.");
    res.send(userFavs);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

userFavsRouter.get("/user-favs/:originalId", authJWT, async (req, res) => {
  try {
    const fav = await db.UserFavourite.findOne({
      where: {
        movieRefId: parseInt(req.params.originalId),
        userId: req.loggedUser,
      },
    });
    res.send(fav);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

userFavsRouter.get("/pdf", authJWT, async (req, res) => {
  try {
    const userFavs = await db.UserFavourite.findAll({
      where: { userId: req.loggedUser },
    });

    if (!userFavs) throw new Error("User not found.");

    const doc = new PDFDocument({ size: "A4", pdfVersion: "1.7" });
    doc.pipe(res);
    await generateFavPages(userFavs, doc);
    doc
      .font("Helvetica")
      .fontSize(25)
      .text("Thank you for using MyFlix!\nAlex Bujenita", 50, 400, {
        align: "center",
      });
    doc.end();
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
