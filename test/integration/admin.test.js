const request = require("supertest");
const { createApp } = require("../../src/app");
const db = require("../../models");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

const app = createApp();

describe("admin", () => {
  test("GET /admin/users rejects a non-superuser and exposes only public user attributes to user 1", async () => {
    await makeUser({ id: 1, firstName: "Admin", lastName: "User" });
    await makeUser({ id: 2, firstName: "Regular", lastName: "User" });

    const forbidden = await request(app)
      .get("/admin/users")
      .set("Cookie", authCookie(2));

    expect(forbidden.status).toBe(403);

    const response = await request(app)
      .get("/admin/users")
      .set("Cookie", authCookie(1));

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(2);
    expect(response.body.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          firstName: "Admin",
          lastName: "User",
          email: "test-user-1@example.test",
        }),
      ]),
    );

    for (const user of response.body.rows) {
      expect(Object.keys(user).sort()).toEqual([
        "email",
        "firstName",
        "id",
        "lastName",
      ]);
      expect(user).not.toHaveProperty("passwordDigest");
    }
  });

  test("GET /admin/users/:id/movies rejects a non-superuser and returns favourites ordered by title to user 1", async () => {
    await makeUser({ id: 1 });
    await makeUser({ id: 2 });
    const favouriteOwner = await makeUser({ id: 3, firstName: "Favourite" });
    await makeFav(favouriteOwner.id, { movieTitle: "Zulu" });
    await makeFav(favouriteOwner.id, { movieTitle: "Alpha" });

    const forbidden = await request(app)
      .get(`/admin/users/${favouriteOwner.id}/movies`)
      .set("Cookie", authCookie(2));

    expect(forbidden.status).toBe(403);

    const response = await request(app)
      .get(`/admin/users/${favouriteOwner.id}/movies`)
      .set("Cookie", authCookie(1));

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0]).toMatchObject({
      id: favouriteOwner.id,
      firstName: "Favourite",
    });
    expect(
      response.body.rows[0].UserFavourites.map((fav) => fav.movieTitle),
    ).toEqual(["Alpha", "Zulu"]);
  });

  test("DELETE /admin/users/:userId/movie/:movieId rejects a non-superuser and deletes only the matching favourite primary key for user 1", async () => {
    await makeUser({ id: 1 });
    await makeUser({ id: 2 });
    const favouriteOwner = await makeUser({ id: 3 });
    const anotherOwner = await makeUser({ id: 4 });
    const favourite = await makeFav(favouriteOwner.id, {
      movieRefId: 9001,
      movieTitle: "Delete me",
    });
    const otherFavourite = await makeFav(anotherOwner.id, {
      movieRefId: 9001,
      movieTitle: "Keep me",
    });

    const forbidden = await request(app)
      .delete(`/admin/users/${favouriteOwner.id}/movie/${favourite.id}`)
      .set("Cookie", authCookie(2));

    expect(forbidden.status).toBe(403);
    expect(await db.UserFavourite.findByPk(favourite.id)).not.toBeNull();

    const deleted = await request(app)
      .delete(`/admin/users/${favouriteOwner.id}/movie/${favourite.id}`)
      .set("Cookie", authCookie(1));

    expect(deleted.status).toBe(204);
    expect(await db.UserFavourite.findByPk(favourite.id)).toBeNull();

    const nonexistentPair = await request(app)
      .delete(`/admin/users/${favouriteOwner.id}/movie/${otherFavourite.id}`)
      .set("Cookie", authCookie(1));

    expect(nonexistentPair.status).toBe(400);
    expect(await db.UserFavourite.findByPk(otherFavourite.id)).not.toBeNull();
  });

  test("GET /admin/users returns 400 when the user query fails", async () => {
    jest
      .spyOn(db.User, "findAndCountAll")
      .mockRejectedValueOnce(new Error("synthetic user query failure"));

    const response = await request(app)
      .get("/admin/users")
      .set("Cookie", authCookie(1));

    expect(response.status).toBe(400);
  });

  test("GET /admin/users/:id/movies returns 400 when the favourites query fails", async () => {
    jest
      .spyOn(db.User, "findAndCountAll")
      .mockRejectedValueOnce(new Error("synthetic favourites query failure"));

    const response = await request(app)
      .get("/admin/users/3/movies")
      .set("Cookie", authCookie(1));

    expect(response.status).toBe(400);
  });
});
