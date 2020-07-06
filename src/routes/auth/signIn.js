const { PRIVATE_KEY } = require("../../../secrets");
const signInRouter = require("express").Router();
const db = require("../../../models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

signInRouter.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.User.findOne({ where: { email } });
    const match = user && await bcrypt.compare(password, user.passwordDigest);
    if (match) {
      const payload = {
        userId: user.id,
        role: "user",
      };
      const token = jwt.sign(payload, PRIVATE_KEY);
      res.status(201).send({ jwt: token });
    } else {
      res.status(401).send({ error: "Failed credentials" });
    }
  } catch {
    res.status(404).send({ error: "Auth failed." });
  }
});

exports.signInRouter = signInRouter;
