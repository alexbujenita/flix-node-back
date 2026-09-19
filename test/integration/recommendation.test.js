const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

function recommendationRows(userId, count, movieRefIdStart = 1) {
  return Array.from({ length: count }, (_, index) => ({
    movieRefId: movieRefIdStart + index,
    movieTitle: `Recommended Movie ${movieRefIdStart + index}`,
    moviePosterPath: `/recommended-${movieRefIdStart + index}.jpg`,
    isRecommended: true,
    userId,
  }));
}

describe("recommendation routes", () => {
  test("GET /api/recommendation/own returns only the caller's recommended favourites", async () => {
    const caller = await makeUser({ firstName: "Caller", lastName: "One" });
    const otherUser = await makeUser({ firstName: "Other", lastName: "User" });
    const recommended = await makeFav(caller.id, {
      movieRefId: 11,
      movieTitle: "Caller's Recommendation",
      isRecommended: true,
    });
    await makeFav(caller.id, { movieRefId: 12, isRecommended: false });
    await makeFav(otherUser.id, { movieRefId: 13, isRecommended: true });

    const response = await request(createApp())
      .get("/api/recommendation/own")
      .set("Cookie", authCookie(caller.id));

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0]).toMatchObject({
      id: recommended.id,
      movieRefId: 11,
      movieTitle: "Caller's Recommendation",
      isRecommended: true,
      userId: caller.id,
      User: { firstName: "Caller", lastName: "One" },
    });
  });

  test("GET /api/recommendation/own returns 500 when its database query fails", async () => {
    const caller = await makeUser();
    jest
      .spyOn(db.UserFavourite, "findAndCountAll")
      .mockRejectedValueOnce(new Error("recommendation query failed"));

    const response = await request(createApp())
      .get("/api/recommendation/own")
      .set("Cookie", authCookie(caller.id));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "recommendation query failed" });
  });

  test("GET /api/recommendation/:userId returns that user's recommended favourites", async () => {
    const caller = await makeUser();
    const requestedUser = await makeUser({
      firstName: "Recommended",
      lastName: "User",
    });
    const recommended = await makeFav(requestedUser.id, {
      movieRefId: 21,
      isRecommended: true,
    });
    await makeFav(requestedUser.id, {
      movieRefId: 22,
      isRecommended: false,
    });

    const response = await request(createApp())
      .get(`/api/recommendation/${requestedUser.id}`)
      .set("Cookie", authCookie(caller.id));

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0]).toMatchObject({
      id: recommended.id,
      movieRefId: 21,
      isRecommended: true,
      userId: requestedUser.id,
      User: { firstName: "Recommended", lastName: "User" },
    });
  });

  test("GET /api/recommendation/:userId returns 500 when its database query fails", async () => {
    const caller = await makeUser();
    jest
      .spyOn(db.UserFavourite, "findAndCountAll")
      .mockRejectedValueOnce(new Error("user recommendation query failed"));

    const response = await request(createApp())
      .get(`/api/recommendation/${caller.id}`)
      .set("Cookie", authCookie(caller.id));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "user recommendation query failed",
    });
  });

  test("PATCH /api/recommendation/:originalIdFav updates the caller's favourite", async () => {
    const caller = await makeUser();
    const favourite = await makeFav(caller.id, {
      movieRefId: 31,
      isRecommended: false,
    });

    const response = await request(createApp())
      .patch(`/api/recommendation/${favourite.movieRefId}`)
      .set("Cookie", authCookie(caller.id))
      .send({ recommended: true });

    expect(response.status).toBe(204);
    await favourite.reload();
    expect(favourite.isRecommended).toBe(true);
  });

  test("PATCH /api/recommendation/:originalIdFav succeeds with 99 existing recommendations", async () => {
    const caller = await makeUser();
    await db.UserFavourite.bulkCreate(recommendationRows(caller.id, 99, 1000));
    const target = await makeFav(caller.id, {
      movieRefId: 1099,
      isRecommended: false,
    });

    const response = await request(createApp())
      .patch(`/api/recommendation/${target.movieRefId}`)
      .set("Cookie", authCookie(caller.id))
      .send({ recommended: true });

    expect(response.status).toBe(204);
    await target.reload();
    expect(target.isRecommended).toBe(true);
    expect(
      await db.UserFavourite.count({
        where: { userId: caller.id, isRecommended: true },
      }),
    ).toBe(100);
  });

  test("PATCH /api/recommendation/:originalIdFav rejects 100 existing recommendations", async () => {
    const caller = await makeUser();
    await db.UserFavourite.bulkCreate(recommendationRows(caller.id, 100, 2000));
    const target = await makeFav(caller.id, {
      movieRefId: 2100,
      isRecommended: false,
    });

    const response = await request(createApp())
      .patch(`/api/recommendation/${target.movieRefId}`)
      .set("Cookie", authCookie(caller.id))
      .send({ recommended: true });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Max recommendation reached: 100" });
    await target.reload();
    expect(target.isRecommended).toBe(false);
    expect(
      await db.UserFavourite.count({
        where: { userId: caller.id, isRecommended: true },
      }),
    ).toBe(100);
  });

  // B4: an update that matches no favourite should report a missing resource.
  test.failing(
    "PATCH /api/recommendation/:originalIdFav returns 404 for a favourite the caller does not own",
    async () => {
      const caller = await makeUser();
      const otherUser = await makeUser();
      const otherUsersFavourite = await makeFav(otherUser.id, {
        movieRefId: 41,
        isRecommended: false,
      });

      const response = await request(createApp())
        .patch(`/api/recommendation/${otherUsersFavourite.movieRefId}`)
        .set("Cookie", authCookie(caller.id))
        .send({ recommended: true });

      expect(response.status).toBe(404);
      await otherUsersFavourite.reload();
      expect(otherUsersFavourite.isRecommended).toBe(false);
    },
  );
});
