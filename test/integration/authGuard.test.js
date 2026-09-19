const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const { createApp } = require("../../src/app");
const { expiredTokenFor } = require("../helpers/auth");

const guardedRoutes = [
  ["get", "/admin/users"],
  ["get", "/admin/users/1/movies"],
  ["delete", "/admin/users/1/movie/1"],
  ["get", "/api/favs/user-favs"],
  ["get", "/api/favs/user-favs/1"],
  ["get", "/api/favs/pdf"],
  ["post", "/api/favs/"],
  ["patch", "/api/favs/1"],
  ["delete", "/api/favs/1"],
  ["get", "/api/recommendation/own"],
  ["get", "/api/recommendation/1"],
  ["patch", "/api/recommendation/1"],
];

const invalidCookies = [
  ["no cookie", undefined],
  ["a malformed cookie", "not-a-jwt"],
  ["an expired token", expiredTokenFor(1)],
];

describe("authGuard", () => {
  test("covers exactly the 12 authJWT-guarded routes", () => {
    expect(guardedRoutes).toHaveLength(12);
  });

  test.each(
    guardedRoutes.flatMap(([method, path]) =>
      invalidCookies.map(([description, token]) => [
        method,
        path,
        description,
        token,
      ]),
    ),
  )("%s %s rejects %s", async (method, path, _description, token) => {
    let requestToProtectedRoute = request(createApp())[method](path);
    if (token !== undefined) {
      requestToProtectedRoute = requestToProtectedRoute.set(
        "Cookie",
        `JWT_TOKEN_MY_FLIX=${token}`,
      );
    }

    const response = await requestToProtectedRoute;

    expect(response.status).toBe(401);
    expect(response.text).toBe("Invalid token");
  });
});
