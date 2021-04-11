const authJWT = require("../../middleware/auth/authJWT");
const API_KEY = require("../../../secrets").API_KEY;
const userFavsRouter = require("express").Router();
const db = require("../../../models/index");
const PDFDocument = require("pdfkit");
const axios = require("axios");

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

    if (!userFavs) throw new Error("User not found.");

    const doc = new PDFDocument({ size: "A4" });

    doc.pipe(res);

    for (const fav of userFavs) {
      const { movieRefId } = fav.toJSON();
      const {
        data: {
          title,
          tagline,
          runtime,
          overview,
          original_title,
          poster_path,
        },
      } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieRefId}?api_key=${API_KEY}`
      );
      doc
        .font("Helvetica")
        .fontSize(25)
        .text(title || original_title);
      tagline && doc.font("Helvetica").fontSize(18).text(tagline);

      if (poster_path) {
        const {
          data,
        } = await axios(`https://image.tmdb.org/t/p/w342${poster_path}`, {
          responseType: "arraybuffer",
        });
        const img = Buffer.from(data, "base64");
        doc.image(img);
      }

      overview && doc.font("Helvetica").fontSize(14).text(overview);
      doc.addPage();
    }

    doc.font("Helvetica").fontSize(25).text("Some text with an embedded font!");

    doc
      .addPage()
      .fontSize(25)
      .text("Here is some vector graphics...", 100, 100);

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
