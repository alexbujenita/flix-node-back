const axios = require("axios");
const nock = require("nock");
const request = require("supertest");
const { createApp } = require("../../src/app");

const app = createApp();
const tmdb = "https://api.themoviedb.org";
const apiKey = process.env.TMDB_API_KEY;

describe("tmdb-passthrough search", () => {
  test("GET /api/search/:entity trims the term in the URL and cache key", async () => {
    const payload = { page: 1, results: [{ id: 101, title: "The Matrix" }] };
    const upstream = nock(tmdb)
      .get("/3/search/movie")
      .query({
        api_key: apiKey,
        query: "matrix",
        page: "2",
        include_adult: "true",
      })
      .reply(200, payload);

    const first = await request(app).get("/api/search/movie").query({
      searchTerm: "  matrix  ",
      pageNum: 2,
      includeAdult: true,
    });
    const cached = await request(app).get("/api/search/movie").query({
      searchTerm: "matrix",
      pageNum: 2,
      includeAdult: true,
    });

    expect(first.status).toBe(200);
    expect(first.body).toEqual(payload);
    expect(cached.body).toEqual(payload);
    expect(upstream.isDone()).toBe(true);
  });

  test("GET /api/search/:entity returns 501 when TMDB fails", async () => {
    nock(tmdb).get("/3/search/person").query(true).reply(503);

    const response = await request(app)
      .get("/api/search/person")
      .query({ searchTerm: "upstream failure" });

    expect(response.status).toBe(501);
    expect(response.text).toBe("Internal server error");
  });

  // B3: omitting searchTerm should produce a controlled JSON client/upstream error.
  test.failing(
    "B3 returns a 4xx/501 JSON response when searchTerm is omitted",
    async () => {
      const response = await request(app).get("/api/search/movie");

      expect(
        (response.status >= 400 && response.status < 500) ||
          response.status === 501,
      ).toBe(true);
      expect(response.type).toBe("application/json");
    },
  );

  // B9: reserved query characters must remain part of searchTerm, not become parameters.
  test.failing(
    "B9 percent-encodes reserved characters in the outgoing search URL",
    async () => {
      let outgoingPath;
      nock(tmdb)
        .get("/3/search/movie")
        .query(true)
        .reply(function reply(uri) {
          outgoingPath = uri;
          return [200, { page: 1, results: [] }];
        });

      const response = await request(app)
        .get("/api/search/movie")
        .query({ searchTerm: "a&b=c" });

      expect(response.status).toBe(200);
      expect(outgoingPath).toContain("query=a%26b%3Dc");
    },
  );
});

describe("tmdb-passthrough random movies", () => {
  test("GET /api/random returns a deterministic list", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const movies = Array.from({ length: 30 }, (_, index) => ({
      id: 2000 + index,
      title: `Synthetic random movie ${index}`,
    }));
    nock(tmdb)
      .get("/3/discover/movie")
      .query({
        api_key: apiKey,
        language: "en-US",
        include_adult: "true",
        include_video: "false",
        page: "1",
      })
      .times(10)
      .reply(200, () => ({ results: [...movies] }));

    const response = await request(app).get("/api/random");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(20);
    expect(response.body.slice(0, 2)).toEqual(movies.slice(0, 2));
  });

  test("GET /api/random stops after ten empty pages and returns a partial list", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const upstream = nock(tmdb)
      .get("/3/discover/movie")
      .query({
        api_key: apiKey,
        language: "en-US",
        include_adult: "true",
        include_video: "false",
        page: "1",
      })
      .times(10)
      .reply(200, { results: [] });

    const response = await request(app).get("/api/random");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeLessThan(27);
    expect(upstream.isDone()).toBe(true);
  }, 3000);

  test("GET /api/random returns 501 when TMDB fails", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    nock(tmdb).get("/3/discover/movie").query(true).reply(503);

    const response = await request(app).get("/api/random");

    expect(response.status).toBe(501);
  });

  test("GET /api/random falls back to a generic message when the failure carries none", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(axios, "get").mockRejectedValueOnce(undefined);

    const response = await request(app).get("/api/random");

    expect(response.status).toBe(501);
    expect(response.text).toBe("Internal server error");
  });
});

describe("tmdb-passthrough actor movies", () => {
  test("GET /api/actor-movies/:actorId follows every page and deduplicates by id", async () => {
    const actorId = 3101;
    const sharedMovie = { id: 777, title: "Synthetic shared film" };
    // Synthetic pages intentionally repeat id 777 because task 14 found no
    // naturally overlapping consecutive TMDB discover pages to record.
    const firstPage = {
      page: 1,
      total_pages: 2,
      results: [{ id: 701, title: "Synthetic first page film" }, sharedMovie],
    };
    const secondPage = {
      page: 2,
      total_pages: 2,
      results: [sharedMovie, { id: 702, title: "Synthetic second page film" }],
    };
    const basePath = `/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity_desc&include_adult=true&include_video=false`;
    const pageOne = nock(tmdb)
      .get(`${basePath}&page=1&with_cast=${actorId}`)
      .reply(200, firstPage);
    const pageTwo = nock(tmdb)
      .get(`${basePath}&page=2&with_cast=${actorId}`)
      .reply(200, secondPage);

    const response = await request(app).get(`/api/actor-movies/${actorId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      firstPage.results[0],
      sharedMovie,
      secondPage.results[1],
    ]);
    expect(pageOne.isDone()).toBe(true);
    expect(pageTwo.isDone()).toBe(true);
  });

  test("GET /api/actor-movies/:actorId returns 501 when TMDB fails", async () => {
    nock(tmdb).get("/3/discover/movie").query(true).reply(503);

    const response = await request(app).get("/api/actor-movies/3102");

    expect(response.status).toBe(501);
    expect(response.text).toBe("Internal server error");
  });
});

describe("tmdb-passthrough actor info", () => {
  test("GET /api/actor-info/:actorId returns actor information", async () => {
    const payload = { id: 3201, name: "Synthetic Actor", images: {} };
    nock(tmdb)
      .get("/3/person/3201")
      .query({
        api_key: apiKey,
        language: "en-US",
        append_to_response: "images",
      })
      .reply(200, payload);

    const response = await request(app).get("/api/actor-info/3201");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
  });

  test("GET /api/actor-info/:actorId returns 404 when TMDB fails", async () => {
    nock(tmdb).get("/3/person/3202").query(true).reply(404);

    const response = await request(app).get("/api/actor-info/3202");

    expect(response.status).toBe(404);
    expect(response.text).toBe("Actor not found");
  });
});

describe("tmdb-passthrough movie credits", () => {
  test("GET /api/credits/:movieId returns credits", async () => {
    const payload = { id: 3301, cast: [{ id: 1, name: "Synthetic Actor" }] };
    nock(tmdb)
      .get("/3/movie/3301/credits")
      .query({ api_key: apiKey })
      .reply(200, payload);

    const response = await request(app).get("/api/credits/3301");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
  });

  test("GET /api/credits/:movieId returns 404 when TMDB fails", async () => {
    nock(tmdb).get("/3/movie/3302/credits").query(true).reply(404);

    const response = await request(app).get("/api/credits/3302");

    expect(response.status).toBe(404);
    expect(response.text).toBe("Credits not found");
  });
});

describe("tmdb-passthrough movie trailers", () => {
  test("GET /api/trailers/:movieId returns trailers", async () => {
    const payload = { id: 3401, results: [{ key: "synthetic-trailer" }] };
    nock(tmdb)
      .get("/3/movie/3401/videos")
      .query({ api_key: apiKey })
      .reply(200, payload);

    const response = await request(app).get("/api/trailers/3401");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
  });

  test("GET /api/trailers/:movieId returns 404 when TMDB fails", async () => {
    nock(tmdb).get("/3/movie/3402/videos").query(true).reply(404);

    const response = await request(app).get("/api/trailers/3402");

    expect(response.status).toBe(404);
    expect(response.text).toBe("Trailer not found");
  });
});

describe("tmdb-passthrough certifications", () => {
  test("GET /api/certifications returns 501 when TMDB fails", async () => {
    nock(tmdb).get("/3/certification/movie/list").query(true).reply(503);

    const response = await request(app).get("/api/certifications");

    expect(response.status).toBe(501);
    expect(response.text).toBe("Internal server error");
  });

  test("GET /api/certifications returns certifications", async () => {
    const payload = { certifications: { US: [{ certification: "PG" }] } };
    nock(tmdb)
      .get("/3/certification/movie/list")
      .query({ api_key: apiKey })
      .reply(200, payload);

    const response = await request(app).get("/api/certifications");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
  });
});
