const nock = require("nock");
const request = require("supertest");
const { createApp } = require("../../src/app");

const app = createApp();
const tmdb = "https://api.themoviedb.org";
const apiKey = process.env.TMDB_API_KEY;

const movieDiscoverResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: "/synthetic-movie-backdrop.jpg",
      genre_ids: [18],
      id: 550,
      original_language: "en",
      original_title: "Synthetic Movie",
      overview: "A synthetic TMDB discover movie result.",
      popularity: 42.5,
      poster_path: "/synthetic-movie-poster.jpg",
      release_date: "1999-10-15",
      title: "Synthetic Movie",
      video: false,
      vote_average: 8.4,
      vote_count: 100,
    },
  ],
  total_pages: 500,
  total_results: 10000,
};

const tvDiscoverResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: "/synthetic-tv-backdrop.jpg",
      genre_ids: [18],
      id: 1399,
      origin_country: ["US"],
      original_language: "en",
      original_name: "Synthetic Series",
      overview: "A synthetic TMDB discover TV result.",
      popularity: 38.2,
      poster_path: "/synthetic-tv-poster.jpg",
      first_air_date: "2011-04-17",
      name: "Synthetic Series",
      vote_average: 8.3,
      vote_count: 200,
    },
  ],
  total_pages: 500,
  total_results: 10000,
};

const tvDetailsResponse = {
  adult: false,
  backdrop_path: "/synthetic-tv-backdrop.jpg",
  first_air_date: "2011-04-17",
  genres: [{ id: 18, name: "Drama" }],
  id: 1399,
  name: "Synthetic Series",
  number_of_episodes: 10,
  number_of_seasons: 1,
  original_language: "en",
  original_name: "Synthetic Series",
  overview: "Synthetic TMDB TV details.",
  poster_path: "/synthetic-tv-poster.jpg",
  seasons: [{ air_date: "2011-04-17", episode_count: 10, id: 1, name: "Season 1", season_number: 1 }],
  status: "Ended",
};

const tvSeasonResponse = {
  _id: "synthetic-season",
  air_date: "2011-04-17",
  episodes: [
    {
      air_date: "2011-04-17",
      episode_number: 1,
      id: 101,
      name: "Synthetic Premiere",
      overview: "A synthetic TMDB season episode.",
      season_number: 1,
      still_path: "/synthetic-still.jpg",
    },
  ],
  id: 1,
  name: "Season 1",
  overview: "Synthetic TMDB season details.",
  poster_path: "/synthetic-season-poster.jpg",
  season_number: 1,
};

describe("movies-and-tv discover and details routes", () => {
  describe("GET /api/movies", () => {
    test.each([0, 501])("rejects out-of-range page %i", async (page) => {
      const response = await request(app).get(`/api/movies?page=${page}`);

      expect(response.status).toBe(400);
      expect(response.text).toBe("Page must be between 1 and 500");
    });

    test("accepts page 1 and forwards certification, date, and adult query parameters", async () => {
      const movieRequest = nock(tmdb)
        .get("/3/discover/movie")
        .query({
          api_key: apiKey,
          sort_by: "popularity.desc",
          include_adult: "true",
          include_video: "false",
          page: "1",
          certification_country: "US",
          certification: "R",
          "primary_release_date.gte": "1999-01-01",
          "primary_release_date.lte": "1999-12-31",
        })
        .reply(200, movieDiscoverResponse);

      const response = await request(app).get("/api/movies").query({
        page: 1,
        certification: "R",
        certificationCountry: "US",
        primaryReleaseDateGTE: "1999-01-01",
        primaryReleaseDateLTE: "1999-12-31",
        adult: true,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(movieDiscoverResponse);
      expect(movieRequest.isDone()).toBe(true);
    });

    test("accepts page 500 and forwards primaryReleaseYear with builder precedence", async () => {
      const movieRequest = nock(tmdb)
        .get("/3/discover/movie")
        .query({
          api_key: apiKey,
          sort_by: "popularity.desc",
          include_adult: "false",
          include_video: "false",
          page: "500",
          primary_release_year: "2024",
        })
        .reply(200, { ...movieDiscoverResponse, page: 500 });

      const response = await request(app).get("/api/movies").query({
        page: 500,
        primaryReleaseYear: 2024,
        year: 2023,
        adult: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(500);
      expect(movieRequest.isDone()).toBe(true);
    });

    test("forwards year when no primary release filter is supplied", async () => {
      const movieRequest = nock(tmdb)
        .get("/3/discover/movie")
        .query({
          api_key: apiKey,
          sort_by: "popularity.desc",
          include_adult: "false",
          include_video: "false",
          page: "2",
          year: "1985",
        })
        .reply(200, { ...movieDiscoverResponse, page: 2 });

      const response = await request(app).get("/api/movies?page=2&year=1985");

      expect(response.status).toBe(200);
      expect(movieRequest.isDone()).toBe(true);
    });

    test("returns 501 when TMDB fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      nock(tmdb).get("/3/discover/movie").query(true).reply(503, { status_message: "Unavailable" });

      const response = await request(app).get("/api/movies?page=1");

      expect(response.status).toBe(501);
      expect(response.text).toBe("Internal server error");
    });
  });

  describe("GET /api/tv", () => {
    test.each([0, 501])("rejects out-of-range page %i", async (page) => {
      const response = await request(app).get(`/api/tv?page=${page}`);

      expect(response.status).toBe(400);
      expect(response.text).toBe("Page must be between 1 and 500");
    });

    test.each([1, 500])("accepts boundary page %i", async (page) => {
      const tvRequest = nock(tmdb)
        .get("/3/discover/tv")
        .query({
          api_key: apiKey,
          sort_by: "popularity.desc",
          include_adult: "true",
          include_video: "false",
          page: String(page),
        })
        .reply(200, { ...tvDiscoverResponse, page });

      const response = await request(app).get(`/api/tv?page=${page}&adult=true`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(page);
      expect(tvRequest.isDone()).toBe(true);
    });

    test("returns 501 when TMDB fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      nock(tmdb).get("/3/discover/tv").query(true).reply(503, { status_message: "Unavailable" });

      const response = await request(app).get("/api/tv?page=1");

      expect(response.status).toBe(501);
      expect(response.text).toBe("Internal server error");
    });
  });

  describe("GET /api/tv/:tvSeriesId", () => {
    test("returns TV details from TMDB", async () => {
      const tvRequest = nock(tmdb)
        .get("/3/tv/1399")
        .query({ api_key: apiKey })
        .reply(200, tvDetailsResponse);

      const response = await request(app).get("/api/tv/1399");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(tvDetailsResponse);
      expect(tvRequest.isDone()).toBe(true);
    });

    test("returns 404 when TMDB fails", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      nock(tmdb).get("/3/tv/1399").query({ api_key: apiKey }).reply(404, { status_message: "Not found" });

      const response = await request(app).get("/api/tv/1399");

      expect(response.status).toBe(404);
      expect(response.text).toBe("TV Series not found");
    });
  });

  describe("GET /api/tv/:tvSeriesId/season/:seasonNumber", () => {
    test("returns season details from TMDB", async () => {
      const seasonRequest = nock(tmdb)
        .get("/3/tv/1399/season/1")
        .query({ api_key: apiKey })
        .reply(200, tvSeasonResponse);

      const response = await request(app).get("/api/tv/1399/season/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(tvSeasonResponse);
      expect(seasonRequest.isDone()).toBe(true);
    });

    test("returns 404 when TMDB fails", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      nock(tmdb)
        .get("/3/tv/1399/season/1")
        .query({ api_key: apiKey })
        .reply(404, { status_message: "Not found" });

      const response = await request(app).get("/api/tv/1399/season/1");

      expect(response.status).toBe(404);
      expect(response.text).toBe("TV Series not found");
    });
  });
});
