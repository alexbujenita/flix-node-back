const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

describe("dbBinding", () => {
  test("integration setup migrates the models singleton", () => {
    const integrationSequelize = db.sequelize;

    expect(require("../../models").sequelize).toBe(integrationSequelize);
  });

  test("factory writes are visible through the user favourites route", async () => {
    const user = await makeUser();
    const fav = await makeFav(user.id, {
      movieRefId: 8675309,
      movieTitle: "Shared Connection",
    });

    const response = await request(createApp())
      .get("/api/favs/user-favs")
      .set("Cookie", authCookie(user.id));

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0].UserFavourites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          movieRefId: fav.movieRefId,
          movieTitle: fav.movieTitle,
        }),
      ])
    );
  });
});
