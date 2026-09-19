const express = require("express");
const nock = require("nock");
const request = require("supertest");

const TMDB_ORIGIN = "https://api.themoviedb.org";
const API_KEY = "test-tmdb-key";

function loadRouter(modulePath, exportName) {
  jest.resetModules();
  const router = require(modulePath)[exportName];
  const app = express();
  app.use(router);
  return app;
}

function tmdbGet(path, query, body) {
  return nock(TMDB_ORIGIN).get(path).query(query).reply(200, body);
}

async function expectCacheMissHitAndModuleIsolation({
  modulePath,
  exportName,
  requestPath,
  responseBody,
  intercept,
}) {
  const app = loadRouter(modulePath, exportName);
  const firstInterceptor = intercept(responseBody);

  const firstResponse = await request(app).get(requestPath);

  expect(firstResponse.status).toBe(200);
  expect(firstResponse.body).toEqual(responseBody);
  expect(firstInterceptor.isDone()).toBe(true);

  const secondResponse = await request(app).get(requestPath);

  expect(secondResponse.status).toBe(200);
  expect(secondResponse.body).toEqual(firstResponse.body);
  expect(firstInterceptor.isDone()).toBe(true);

  const isolatedApp = loadRouter(modulePath, exportName);
  const postResetInterceptor = intercept(responseBody);

  const thirdResponse = await request(isolatedApp).get(requestPath);

  expect(thirdResponse.status).toBe(200);
  expect(thirdResponse.body).toEqual(responseBody);
  expect(postResetInterceptor.isDone()).toBe(true);
}

describe("router Map caches", () => {
  test("movie cache misses once, hits for an identical include-all request, and is module-isolated", async () => {
    const responseBody = {
      id: 5,
      title: "Synthetic movie",
      credits: { cast: [] },
      videos: { results: [] },
    };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/movie",
      exportName: "movieRouter",
      requestPath: "/5/include-all",
      responseBody,
      intercept: (body) =>
        tmdbGet(
          "/3/movie/5",
          { api_key: API_KEY, append_to_response: "credits,videos" },
          body
        ),
    });
  });

  test("movie include-all documents the leading-zero cache-key quirk", async () => {
    const app = loadRouter("../../src/routes/movie", "movieRouter");
    const responseBody = { id: 5, title: "Synthetic leading-zero movie" };
    const firstInterceptor = tmdbGet(
      "/3/movie/005",
      { api_key: API_KEY, append_to_response: "credits,videos" },
      responseBody
    );

    const firstResponse = await request(app).get("/005/include-all");

    expect(firstResponse.status).toBe(200);
    expect(firstInterceptor.isDone()).toBe(true);

    // Verified quirk: the lookup key is "005includes", but response id 5 is stored as "5includes".
    const secondInterceptor = tmdbGet(
      "/3/movie/005",
      { api_key: API_KEY, append_to_response: "credits,videos" },
      responseBody
    );
    const secondResponse = await request(app).get("/005/include-all");

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(secondInterceptor.isDone()).toBe(true);
  });

  test("movie credits cache misses once, hits, and is module-isolated", async () => {
    const responseBody = { id: 11, cast: [{ id: 101, name: "Synthetic actor" }] };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/movieCredits",
      exportName: "movieCreditsRouter",
      requestPath: "/11",
      responseBody,
      intercept: (body) =>
        tmdbGet("/3/movie/11/credits", { api_key: API_KEY }, body),
    });
  });

  test("movie trailer cache misses once, hits, and is module-isolated", async () => {
    const responseBody = {
      id: 12,
      results: [{ id: "trailer-1", key: "synthetic-key" }],
    };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/movieTrailer",
      exportName: "movieTrailerRouter",
      requestPath: "/12",
      responseBody,
      intercept: (body) =>
        tmdbGet("/3/movie/12/videos", { api_key: API_KEY }, body),
    });
  });

  test("actor info cache misses once, hits, and is module-isolated", async () => {
    const responseBody = { id: 21, name: "Synthetic actor", images: { profiles: [] } };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/actorInfo",
      exportName: "actorInfo",
      requestPath: "/21",
      responseBody,
      intercept: (body) =>
        tmdbGet(
          "/3/person/21",
          {
            api_key: API_KEY,
            language: "en-US",
            append_to_response: "images",
          },
          body
        ),
    });
  });

  test("actor movies cache misses once, hits, and is module-isolated", async () => {
    const upstreamBody = {
      page: 1,
      total_pages: 1,
      results: [
        { id: 301, title: "Synthetic first movie" },
        { id: 302, title: "Synthetic second movie" },
      ],
    };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/actorMovies",
      exportName: "actorMoviesRouter",
      requestPath: "/22",
      responseBody: upstreamBody.results,
      intercept: () =>
        tmdbGet(
          "/3/discover/movie",
          {
            api_key: API_KEY,
            language: "en-US",
            sort_by: "popularity_desc",
            include_adult: "true",
            include_video: "false",
            page: "1",
            with_cast: "22",
          },
          upstreamBody
        ),
    });
  });

  test("search cache misses once, hits, and is module-isolated", async () => {
    const responseBody = {
      page: 2,
      results: [{ id: 401, title: "Synthetic search result" }],
    };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/search",
      exportName: "searchRouter",
      requestPath: "/movie?searchTerm=synthetic%20query&pageNum=2&includeAdult=true",
      responseBody,
      intercept: (body) =>
        tmdbGet(
          "/3/search/movie",
          {
            api_key: API_KEY,
            query: "synthetic query",
            page: "2",
            include_adult: "true",
          },
          body
        ),
    });
  });

  test("certifications cache misses once, hits, and is module-isolated", async () => {
    const responseBody = {
      certifications: { US: [{ certification: "PG", meaning: "Synthetic" }] },
    };

    await expectCacheMissHitAndModuleIsolation({
      modulePath: "../../src/routes/certifications",
      exportName: "certificationsRouter",
      requestPath: "/",
      responseBody,
      intercept: (body) =>
        tmdbGet(
          "/3/certification/movie/list",
          { api_key: API_KEY },
          body
        ),
    });
  });
});
