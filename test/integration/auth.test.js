const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { DEFAULT_PASSWORD, makeUser } = require("../helpers/factories");

const registration = {
  firstName: "New",
  lastName: "User",
  email: "new-user@example.test",
  password: "register-password",
};

describe("auth", () => {
  describe("POST /api/auth/register", () => {
    test("registers a user with a bcrypt password digest", async () => {
      const response = await request(createApp())
        .post("/api/auth/register")
        .send(registration);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: "User succesfully created" });

      const user = await db.User.findOne({
        where: { email: registration.email },
      });
      expect(user.passwordDigest).not.toBe(registration.password);
      await expect(
        bcrypt.compare(registration.password, user.passwordDigest)
      ).resolves.toBe(true);
    });

    test("rejects a duplicate email with the unique-constraint message", async () => {
      await makeUser({ email: registration.email });

      const response = await request(createApp())
        .post("/api/auth/register")
        .send(registration);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "email must be unique" });
    });

    test("rejects a missing required field", async () => {
      const missingFirstName = {
        lastName: registration.lastName,
        email: registration.email,
        password: registration.password,
      };

      const response = await request(createApp())
        .post("/api/auth/register")
        .send(missingFirstName);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "User.firstName cannot be null",
      });
    });

    // B2: hashing failures should use the route's JSON error contract.
    test.failing("returns JSON when password hashing fails", async () => {
      const hashSpy = jest
        .spyOn(bcrypt, "hash")
        .mockRejectedValue(new Error("Hash failed"));

      try {
        const response = await request(createApp())
          .post("/api/auth/register")
          .send(registration);

        expect(response.status).toBe(500);
        expect(response.type).toBe("application/json");
        expect(response.body).toEqual({ error: "Hash failed" });
      } finally {
        hashSpy.mockRestore();
      }
    });
  });

  describe("POST /api/auth/login", () => {
    test("returns a signed JWT and sets the authentication cookie", async () => {
      const user = await makeUser({ firstName: "Signed In" });

      const response = await request(createApp())
        .post("/api/auth/login")
        .send({ email: user.email, password: DEFAULT_PASSWORD });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        jwt: expect.any(String),
        firstName: "Signed In",
      });
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            new RegExp(
              `^JWT_TOKEN_MY_FLIX=${response.body.jwt};.*Domain=localhost; Path=/`
            )
          ),
        ])
      );

      const { userId, role } = jwt.verify(
        response.body.jwt,
        process.env.JWT_PRIVATE_KEY
      );
      expect({ userId, role }).toEqual({ userId: user.id, role: "user" });
    });

    test("rejects a wrong password", async () => {
      const user = await makeUser();

      const response = await request(createApp())
        .post("/api/auth/login")
        .send({ email: user.email, password: "wrong-password" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Failed credentials" });
    });

    test("rejects an unknown email as failed credentials", async () => {
      const response = await request(createApp())
        .post("/api/auth/login")
        .send({
          email: "unknown@example.test",
          password: DEFAULT_PASSWORD,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Failed credentials" });
    });

    test("returns the route error response when the user lookup throws", async () => {
      jest.spyOn(db.User, "findOne").mockRejectedValue(new Error("DB failed"));

      const response = await request(createApp())
        .post("/api/auth/login")
        .send({ email: registration.email, password: DEFAULT_PASSWORD });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Auth failed." });
    });
  });

  describe("DELETE /api/auth/logout", () => {
    test("returns no content and emits a clearing cookie", async () => {
      const response = await request(createApp()).delete("/api/auth/logout");

      expect(response.status).toBe(204);
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^JWT_TOKEN_MY_FLIX=; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT/
          ),
        ])
      );
    });

    test("B8 characterises the missing logout cookie domain", async () => {
      const response = await request(createApp()).delete("/api/auth/logout");
      const clearingCookie = response.headers["set-cookie"].find((cookie) =>
        cookie.startsWith("JWT_TOKEN_MY_FLIX=")
      );

      // Login sets domain "localhost" and path "/", but logout clears with no
      // options. With no Domain attribute here, a browser-set cookie may not clear.
      expect(clearingCookie).toContain("Path=/");
      expect(clearingCookie).not.toMatch(/(?:^|;)\s*Domain=/i);
    });
  });
});
