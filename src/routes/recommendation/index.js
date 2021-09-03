const authJWT = require("../../middleware/auth/authJWT");
const recommendationRouter = require("express").Router();
const db = require("../../../models/index");

recommendationRouter.get("/own", authJWT, async (req, res) => {
  try {
    const ownRecommended = await db.UserFavourite.findAndCountAll({
      where: { userId: req.loggedUser, isRecommended: true },
      include: { model: db.User, attributes: ["firstName", "lastName"] },
    });

    res.send(ownRecommended);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

recommendationRouter.get("/:userId", authJWT, async (req, res) => {
  const { userId } = req.params;
  try {
    const userRec = Number(userId);
    const recommended = await db.UserFavourite.findAndCountAll({
      where: { userId: userRec, isRecommended: true },
      include: { model: db.User, attributes: ["firstName", "lastName"] },
    });

    res.send(recommended);
  } catch (error) {
    res.status(500).send({ error: error?.message ?? "Internal server error" });
  }
});

recommendationRouter.patch("/:originalIdFav", authJWT, async (req, res) => {
  let statusCode = 500;
  try {
    const { recommended } = req.body;
    const { originalIdFav } = req.params;

    const count = await db.UserFavourite.count({
      where: { userId: req.loggedUser, isRecommended: true },
    });

    if (count >= 100) {
      statusCode = 403;
      throw new Error("Max recommendation reached: 100");
    }

    await db.UserFavourite.update(
      { isRecommended: recommended },
      {
        where: { userId: req.loggedUser, movieRefId: originalIdFav },
      }
    );

    res.sendStatus(204);
  } catch (error) {
    res
      .status(statusCode)
      .send({ error: error?.message ?? "Internal server error" });
  }
});

exports.recommendationRouter = recommendationRouter;
