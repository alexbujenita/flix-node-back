const nock = require("nock");
const request = require("supertest");
const { createApp } = require("../../src/app");

const app = createApp();
const tmdb = "https://api.themoviedb.org";

const movieFixture = {
  adult: false,
  backdrop_path: "/synthetic-backdrop.jpg",
  belongs_to_collection: null,
  budget: 63000000,
  genres: [
    { id: 18, name: "Drama" },
    { id: 53, name: "Thriller" },
  ],
  homepage: "https://example.test/synthetic-movie",
  id: 550,
  imdb_id: "tt0137523",
  original_language: "en",
  original_title: "Synthetic Fight Club",
  overview: "A synthetic response shaped like TMDB movie details.",
  popularity: 61.416,
  poster_path: "/synthetic-poster.jpg",
  production_companies: [
    {
      id: 508,
      logo_path: "/synthetic-logo.png",
      name: "Synthetic Pictures",
      origin_country: "US",
    },
  ],
  production_countries: [{ iso_3166_1: "US", name: "United States" }],
  release_date: "1999-10-15",
  revenue: 100853753,
  runtime: 139,
  spoken_languages: [
    { english_name: "English", iso_639_1: "en", name: "English" },
  ],
  status: "Released",
  tagline: "A synthetic fixture.",
  title: "Synthetic Fight Club",
  video: false,
  vote_average: 8.4,
  vote_count: 30000,
};

function movieQuery(extra = {}) {
  return { api_key: process.env.TMDB_API_KEY, ...extra };
}

describe("movie.test movie routes", () => {
  describe("GET /api/movie/:movieId", () => {
    test("returns the synthetic TMDB-shaped movie and sends the API key", async () => {
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/550")
        .query(movieQuery())
        .reply(200, movieFixture);

      const response = await request(app).get("/api/movie/550");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(movieFixture);
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("returns 404 Movie not found when TMDB returns 404", async () => {
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/404")
        .query(movieQuery())
        .reply(404, {
          status_message: "The resource you requested could not be found.",
        });

      const response = await request(app).get("/api/movie/404");

      expect(response.status).toBe(404);
      expect(response.text).toBe("Movie not found");
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("returns 404 Movie not found when TMDB returns a server error", async () => {
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/503")
        .query(movieQuery())
        .reply(503, { status_message: "Synthetic upstream failure" });

      const response = await request(app).get("/api/movie/503");

      expect(response.status).toBe(404);
      expect(response.text).toBe("Movie not found");
      expect(tmdbRequest.isDone()).toBe(true);
    });
  });

  describe("GET /api/movie/:movieId/include-all", () => {
    test("uses the dedicated handler and appends credits and videos", async () => {
      const fixture = {
        ...movieFixture,
        id: 5,
        credits: {
          cast: [
            { id: 287, name: "Synthetic Performer", character: "Narrator" },
          ],
          crew: [{ id: 7467, name: "Synthetic Director", job: "Director" }],
        },
        videos: {
          results: [
            {
              id: "synthetic-video",
              key: "fixture-key",
              site: "YouTube",
              type: "Trailer",
            },
          ],
        },
      };
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/5")
        .query(movieQuery({ append_to_response: "credits,videos" }))
        .reply(200, fixture);

      const response = await request(app).get("/api/movie/5/include-all");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fixture);
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("returns 404 Movie not found when TMDB fails", async () => {
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/6")
        .query(movieQuery({ append_to_response: "credits,videos" }))
        .reply(503, { status_message: "Synthetic upstream failure" });

      const response = await request(app).get("/api/movie/6/include-all");

      expect(response.status).toBe(404);
      expect(response.text).toBe("Movie not found");
      expect(tmdbRequest.isDone()).toBe(true);
    });
  });

  describe("GET /api/movie/:movieId/:movieResource", () => {
    test("includes a numeric movie id and defaults pageNum to 1", async () => {
      const fixture = {
        page: 1,
        results: [
          { ...movieFixture, id: 551, title: "Synthetic Similar Movie" },
        ],
        total_pages: 1,
        total_results: 1,
      };
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/550/similar")
        .query(movieQuery({ page: "1" }))
        .reply(200, fixture);

      const response = await request(app).get("/api/movie/550/similar");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fixture);
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("forwards a supplied pageNum", async () => {
      const fixture = {
        page: 3,
        results: [],
        total_pages: 3,
        total_results: 40,
      };
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/550/recommendations")
        .query(movieQuery({ page: "3" }))
        .reply(200, fixture);

      const response = await request(app).get(
        "/api/movie/550/recommendations?pageNum=3",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fixture);
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("omits a movie id that parseInt cannot parse", async () => {
      const fixture = {
        page: 2,
        results: [
          { ...movieFixture, id: 552, title: "Synthetic Popular Movie" },
        ],
        total_pages: 10,
        total_results: 200,
      };
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/popular")
        .query(movieQuery({ page: "2" }))
        .reply(200, fixture);

      const response = await request(app).get(
        "/api/movie/not-a-number/popular?pageNum=2",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fixture);
      expect(tmdbRequest.isDone()).toBe(true);
    });

    test("returns 404 Movie not found when TMDB fails", async () => {
      const tmdbRequest = nock(tmdb)
        .get("/3/movie/777/similar")
        .query(movieQuery({ page: "1" }))
        .reply(503, { status_message: "Synthetic upstream failure" });

      const response = await request(app).get("/api/movie/777/similar");

      expect(response.status).toBe(404);
      expect(response.text).toBe("Movie not found");
      expect(tmdbRequest.isDone()).toBe(true);
    });
  });
});
