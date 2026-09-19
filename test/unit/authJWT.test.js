const authJWT = require("../../src/middleware/auth/authJWT");
const {
  expiredTokenFor,
  signTokenFor,
  tokenWithWrongKey,
} = require("../helpers/auth");

function createResponse() {
  const res = {
    send: jest.fn(),
  };

  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe("authJWT", () => {
  test("sets the logged user and advances once for a valid JWT cookie", async () => {
    const userId = 7;
    const req = { cookies: { JWT_TOKEN_MY_FLIX: signTokenFor(userId) } };
    const res = createResponse();
    const next = jest.fn();

    await authJWT(req, res, next);

    expect(req.loggedUser).toBe(userId);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test.each([
    ["the cookie is missing", undefined],
    ["the cookie token is malformed", "not-a-jwt"],
    ["the cookie token is expired", expiredTokenFor(7)],
    ["the cookie token uses a wrong signing key", tokenWithWrongKey(7)],
  ])("returns 401 Invalid token when %s", async (_description, token) => {
    const req = { cookies: { JWT_TOKEN_MY_FLIX: token } };
    const res = createResponse();
    const next = jest.fn();

    await authJWT(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith("Invalid token");
    expect(next).not.toHaveBeenCalled();
  });
});
