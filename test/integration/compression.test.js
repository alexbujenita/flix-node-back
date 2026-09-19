const nock = require("nock");
const request = require("supertest");
const { createApp } = require("../../src/app");

const app = createApp();
const tmdb = "https://api.themoviedb.org";

// compression() leaves bodies under its 1kb threshold alone, so the fixture has
// to be comfortably larger than that for the filter to be the deciding factor.
function largeMovie(movieId) {
  return {
    id: movieId,
    title: "Synthetic Compressible Movie",
    overview: "Synthetic TMDB overview padding. ".repeat(200),
  };
}

// The movie router memoises responses per id, so each test uses its own id to
// guarantee a real upstream request rather than a cache hit.
function mockMovie(movieId) {
  return nock(tmdb)
    .get(`/3/movie/${movieId}`)
    .query({ api_key: process.env.TMDB_API_KEY })
    .reply(200, largeMovie(movieId));
}

describe("response compression", () => {
  test("gzips a large response for a client that accepts it", async () => {
    const movieId = 8101;
    const upstream = mockMovie(movieId);

    const response = await request(app)
      .get(`/api/movie/${movieId}`)
      .set("Accept-Encoding", "gzip");

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(response.body).toEqual(largeMovie(movieId));
    expect(upstream.isDone()).toBe(true);
  });

  test("skips compression when the client sends x-no-compression", async () => {
    const movieId = 8102;
    const upstream = mockMovie(movieId);

    const response = await request(app)
      .get(`/api/movie/${movieId}`)
      .set("Accept-Encoding", "gzip")
      .set("x-no-compression", "1");

    expect(response.status).toBe(200);
    expect(response.headers).not.toHaveProperty("content-encoding");
    expect(response.body).toEqual(largeMovie(movieId));
    expect(upstream.isDone()).toBe(true);
  });
});
