const signUpRouter = require("express").Router();
const db = require("../../../models");
const bcrypt = require("bcrypt");
const saltRounds = 10;

signUpRouter.post("/", async (req, res) => {
  const {
    body: { firstName, lastName, email, password },
  } = req;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    await db.User.create({
      firstName,
      lastName,
      email,
      passwordDigest: hashedPassword,
    });
    res.status(201).send({ message: "User succesfully created" });
  } catch (e) {
    res.status(500).send({ error: "Cannot create user." });
  }
});

exports.signUpRouter = signUpRouter;
