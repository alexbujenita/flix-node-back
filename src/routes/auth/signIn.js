const { PRIVATE_KEY } = require("../../../secrets");
const signInRouter = require("express").Router();
const db = require("../../../models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

signInRouter.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.User.findOne({ where: { email } });
    const match = user && (await bcrypt.compare(password, user.passwordDigest));
    if (match) {
      const payload = {
        userId: user.id,
        role: "user",
      };
      const token = jwt.sign(payload, PRIVATE_KEY, {
        expiresIn: "2 days",
      });
      res.cookie("JWT_TOKEN", token, {
        maxAge: 2 * 24 * 60 * 60 * 1000, // days hours minutes secs ms (2 DAYS)
        // You can't access these tokens in the client's javascript if true
        httpOnly: true,
        domain: "localhost",
        path: "/",
        signed: false,
        // Forces to use https in production
        secure: false,
      });
      res.status(201).send({ jwt: token, firstName: user.firstName });
    } else {
      res.status(401).send({ error: "Failed credentials" });
    }
  } catch {
    res.status(404).send({ error: "Auth failed." });
  }
});

exports.signInRouter = signInRouter;
