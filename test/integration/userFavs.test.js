const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

const app = createApp();

function getFavourites(response) {
  return response.body.rows[0]?.UserFavourites ?? [];
}

async function makeFavPage(userId, count = 25) {
  return Promise.all(
    Array.from({ length: count }, (_value, index) =>
      makeFav(userId, {
        movieRefId: 10_000 + index,
        movieTitle: `Movie ${String(index + 1).padStart(2, "0")}`,
      }),
    ),
  );
}

describe("userFavs CRUD endpoints", () => {
  describe("GET /api/favs/user-favs", () => {
    test("returns only the caller's favourites ordered by movie title", async () => {
      const caller = await makeUser();
      const otherUser = await makeUser();
      await makeFav(caller.id, { movieRefId: 102, movieTitle: "Zulu" });
      await makeFav(otherUser.id, {
        movieRefId: 999,
        movieTitle: "Not the caller's movie",
      });
      await makeFav(caller.id, { movieRefId: 101, movieTitle: "Alpha" });

      const response = await request(app)
        .get("/api/favs/user-favs")
        .set("Cookie", authCookie(caller.id));

      expect(response.status).toBe(200);
      expect(
        getFavourites(response).map(({ movieRefId }) => movieRefId),
      ).toEqual([101, 102]);
    });

    test.each([
      ["true", [201]],
      ["false", [202]],
      ["anything-else", [201, 202]],
    ])("applies the current seen=%s filter", async (seen, expectedIds) => {
      const user = await makeUser();
      await makeFav(user.id, {
        movieRefId: 201,
        movieTitle: "Already Watched",
        seen: true,
      });
      await makeFav(user.id, {
        movieRefId: 202,
        movieTitle: "Still Unseen",
        seen: false,
      });

      const response = await request(app)
        .get("/api/favs/user-favs")
        .query({ seen })
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(200);
      expect(
        getFavourites(response).map(({ movieRefId }) => movieRefId),
      ).toEqual(expectedIds);
    });

    test("matches searchQuery case-insensitively and partially", async () => {
      const user = await makeUser();
      await makeFav(user.id, { movieRefId: 301, movieTitle: "The Matrix" });
      await makeFav(user.id, { movieRefId: 302, movieTitle: "Arrival" });
      await makeFav(user.id, {
        movieRefId: 303,
        movieTitle: "Matrix Reloaded",
      });

      const response = await request(app)
        .get("/api/favs/user-favs")
        .query({ searchQuery: "mAtRiX" })
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(200);
      expect(
        getFavourites(response).map(({ movieRefId }) => movieRefId),
      ).toEqual([303, 301]);
    });

    test("B5 characterises joined-row pagination across both pages", async () => {
      const user = await makeUser();
      await makeFavPage(user.id);

      const pageOne = await request(app)
        .get("/api/favs/user-favs")
        .set("Cookie", authCookie(user.id));
      const pageTwo = await request(app)
        .get("/api/favs/user-favs")
        .query({ page: 2 })
        .set("Cookie", authCookie(user.id));

      expect(pageOne.status).toBe(200);
      expect(getFavourites(pageOne)).toHaveLength(20);
      expect(pageOne.body.count).toBe(25);
      expect(pageOne.body.totalPages).toBe(Math.ceil(pageOne.body.count / 20));
      expect(pageTwo.status).toBe(200);
      expect(getFavourites(pageTwo)).toHaveLength(5);
      expect(pageTwo.body.count).toBe(25);
      expect(pageTwo.body.totalPages).toBe(Math.ceil(pageTwo.body.count / 20));
    });

    // B6: the query-string value "false" is truthy and incorrectly lifts the limit.
    test.failing("B6 applies the 20-row limit when all=false", async () => {
      const user = await makeUser();
      await makeFavPage(user.id);

      const response = await request(app)
        .get("/api/favs/user-favs")
        .query({ all: false })
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(200);
      expect(getFavourites(response)).toHaveLength(20);
    });

    test("returns 500 when the database query fails", async () => {
      const user = await makeUser();
      jest
        .spyOn(db.User, "findAndCountAll")
        .mockRejectedValueOnce(new Error("list failed"));

      const response = await request(app)
        .get("/api/favs/user-favs")
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "list failed" });
    });

    test("returns 500 User not found when the query yields nothing", async () => {
      const user = await makeUser();
      jest.spyOn(db.User, "findAndCountAll").mockResolvedValueOnce(null);

      const response = await request(app)
        .get("/api/favs/user-favs")
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "User not found." });
    });
  });

  describe("GET /api/favs/user-favs/:originalId", () => {
    test("returns the caller's matching favourite", async () => {
      const user = await makeUser();
      const fav = await makeFav(user.id, { movieRefId: 401 });

      const response = await request(app)
        .get(`/api/favs/user-favs/${fav.movieRefId}`)
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ movieRefId: 401, userId: user.id }),
      );
    });

    test("returns 200 with the current empty body when no favourite is found", async () => {
      const user = await makeUser();

      const response = await request(app)
        .get("/api/favs/user-favs/404404")
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(200);
      expect([response.body, response.text]).toEqual([{}, ""]);
    });

    test("returns 500 when the database query fails", async () => {
      const user = await makeUser();
      jest
        .spyOn(db.UserFavourite, "findOne")
        .mockRejectedValueOnce(new Error("lookup failed"));

      const response = await request(app)
        .get("/api/favs/user-favs/405")
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "lookup failed" });
    });
  });

  describe("POST /api/favs/", () => {
    test("creates the favourite for the token user and ignores body userId", async () => {
      const caller = await makeUser();
      const conflictingUser = await makeUser();

      const response = await request(app)
        .post("/api/favs/")
        .set("Cookie", authCookie(caller.id))
        .send({
          movieRefId: 501,
          movieTitle: "Token Owner",
          moviePosterPath: "/token-owner.jpg",
          userId: conflictingUser.id,
        });

      const created = await db.UserFavourite.findOne({
        where: { movieRefId: 501 },
      });
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(caller.id);
      expect(created.userId).toBe(caller.id);
    });

    test("returns 500 when a required field is missing", async () => {
      const user = await makeUser();

      const response = await request(app)
        .post("/api/favs/")
        .set("Cookie", authCookie(user.id))
        .send({ movieRefId: 502, moviePosterPath: "/missing-title.jpg" });

      expect(response.status).toBe(500);
      expect(await db.UserFavourite.count()).toBe(0);
    });
  });

  describe("PATCH /api/favs/:originalIdFav", () => {
    test("characterises truthy toggles, rating coercion, and description updates", async () => {
      const user = await makeUser();
      await makeFav(user.id, {
        movieRefId: 601,
        seen: false,
        watchlist: false,
        rating: 4,
        description: "Original description",
      });
      const patch = (body) =>
        request(app)
          .patch("/api/favs/601")
          .set("Cookie", authCookie(user.id))
          .send(body);

      const seenOnce = await patch({ seen: true });
      const seenTwice = await patch({ seen: true });
      const falseBooleans = await patch({ seen: false, watchlist: false });
      const falseStrings = await patch({ seen: "false", watchlist: "false" });
      const numericZero = await patch({ rating: 0 });
      const stringZero = await patch({ rating: "0" });
      const omittedDescription = await patch({ rating: "3" });
      const emptyDescription = await patch({ description: "" });

      expect(seenOnce.body.seen).toBe(true);
      expect(seenTwice.body.seen).toBe(false);
      expect(falseBooleans.body).toEqual(
        expect.objectContaining({ seen: false, watchlist: false }),
      );
      expect(falseStrings.body).toEqual(
        expect.objectContaining({ seen: true, watchlist: true }),
      );
      expect(numericZero.body.rating).toBe(4);
      expect(stringZero.body.rating).toBe(0);
      expect(omittedDescription.body.description).toBe("Original description");
      expect(emptyDescription.body.description).toBe("");
    });

    test("returns the current 500 error for an unknown movie id", async () => {
      const user = await makeUser();

      const response = await request(app)
        .patch("/api/favs/606606")
        .set("Cookie", authCookie(user.id))
        .send({ seen: true });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Resource not found." });
    });

    // B1: ownership must be checked before mutating another user's favourite.
    test.failing(
      "B1 rejects cross-user updates without changing the row",
      async () => {
        const userA = await makeUser();
        const userB = await makeUser();
        const fav = await makeFav(userB.id, {
          movieRefId: 602,
          seen: false,
          description: "Owned by B",
        });

        const response = await request(app)
          .patch(`/api/favs/${fav.movieRefId}`)
          .set("Cookie", authCookie(userA.id))
          .send({ seen: true, description: "Changed by A" });
        const rowAfterRequest = await db.UserFavourite.findByPk(fav.id);

        expect({
          protectedStatus: [403, 404].includes(response.status),
          row: rowAfterRequest?.toJSON(),
        }).toEqual({
          protectedStatus: true,
          row: expect.objectContaining({
            userId: userB.id,
            seen: false,
            description: "Owned by B",
          }),
        });
      },
    );
  });

  describe("DELETE /api/favs/:originalIdFav", () => {
    test("returns 204 and removes the favourite", async () => {
      const user = await makeUser();
      const fav = await makeFav(user.id, { movieRefId: 701 });

      const response = await request(app)
        .delete(`/api/favs/${fav.movieRefId}`)
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(204);
      expect(await db.UserFavourite.findByPk(fav.id)).toBeNull();
    });

    test("returns 500 for an unknown movie id", async () => {
      const user = await makeUser();

      const response = await request(app)
        .delete("/api/favs/707707")
        .set("Cookie", authCookie(user.id));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Resource not found." });
    });

    // B1: ownership must be checked before destroying another user's favourite.
    test.failing(
      "B1 rejects cross-user deletes and keeps the row",
      async () => {
        const userA = await makeUser();
        const userB = await makeUser();
        const fav = await makeFav(userB.id, { movieRefId: 702 });

        const response = await request(app)
          .delete(`/api/favs/${fav.movieRefId}`)
          .set("Cookie", authCookie(userA.id));
        const rowAfterRequest = await db.UserFavourite.findByPk(fav.id);

        expect({
          protectedStatus: [403, 404].includes(response.status),
          row: rowAfterRequest?.toJSON(),
        }).toEqual({
          protectedStatus: true,
          row: expect.objectContaining({
            id: fav.id,
            userId: userB.id,
            movieRefId: fav.movieRefId,
          }),
        });
      },
    );
  });
});
