const nock = require("nock");
const request = require("supertest");
const PDFDocument = require("pdfkit");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

const app = createApp();
const movieId = 550;
const posterPath = "/synthetic-poster.png";
const profilePath = "/synthetic-profile.png";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64"
);

function binaryParser(response, callback) {
  const chunks = [];

  response.on("data", (chunk) => chunks.push(chunk));
  response.on("end", () => callback(null, Buffer.concat(chunks)));
}

function mockMovieDetails({ poster = posterPath } = {}) {
  return nock("https://api.themoviedb.org")
    .get(`/3/movie/${movieId}`)
    .query({
      api_key: process.env.TMDB_API_KEY,
      append_to_response: "credits",
    })
    .reply(200, {
      id: movieId,
      title: "Synthetic Fight Club",
      tagline: "A synthetic fixture for the PDF endpoint",
      runtime: 139,
      overview: "Synthetic TMDB data shaped like a movie-details response.",
      original_title: "Synthetic Fight Club",
      poster_path: poster,
      release_date: "1999-10-15",
      credits: {
        cast: [
          {
            id: 1,
            name: "Synthetic Performer",
            character: "Synthetic Character",
            profile_path: profilePath,
          },
        ],
      },
    });
}

async function seedFavourite() {
  const user = await makeUser();
  await makeFav(user.id, {
    movieRefId: movieId,
    movieTitle: "Synthetic Fight Club",
    moviePosterPath: posterPath,
  });
  return user;
}

function getPdf(userId, includeCast) {
  return request(app)
    .get(`/api/favs/pdf?includeCast=${includeCast}`)
    .set("Cookie", authCookie(userId))
    .buffer(true)
    .parse(binaryParser);
}

describe("GET /api/favs/pdf", () => {
  test("streams a PDF and does not request cast images when includeCast=false", async () => {
    const user = await seedFavourite();
    const movieRequest = mockMovieDetails();
    const posterRequest = nock("https://image.tmdb.org")
      .get(`/t/p/w342${posterPath}`)
      .reply(200, onePixelPng, { "Content-Type": "image/png" });

    const response = await getPdf(user.id, false);

    expect(response.status).toBe(200);
    expect(response.body.subarray(0, 4)).toEqual(
      Buffer.from([0x25, 0x50, 0x44, 0x46])
    );
    expect(movieRequest.isDone()).toBe(true);
    expect(posterRequest.isDone()).toBe(true);
  });

  test("requests the additional cast image when includeCast=true", async () => {
    const user = await seedFavourite();
    const movieRequest = mockMovieDetails();
    const posterRequest = nock("https://image.tmdb.org")
      .get(`/t/p/w342${posterPath}`)
      .reply(200, onePixelPng, { "Content-Type": "image/png" });
    const castImageRequest = nock("https://image.tmdb.org")
      .get(`/t/p/w185${profilePath}`)
      .reply(200, onePixelPng, { "Content-Type": "image/png" });

    const response = await getPdf(user.id, true);

    expect(response.status).toBe(200);
    expect(movieRequest.isDone()).toBe(true);
    expect(posterRequest.isDone()).toBe(true);
    expect(castImageRequest.isDone()).toBe(true);
  });

  // B7: the PDF stream must identify its representation to clients.
  test.failing("B7 responds with application/pdf content type", async () => {
    const user = await seedFavourite();
    mockMovieDetails({ poster: null });

    const response = await getPdf(user.id, false);

    expect(response.headers["content-type"]).toMatch(/^application\/pdf\b/);
  });

  test("returns 500 JSON when the database fails before streaming starts", async () => {
    const user = await makeUser();
    jest
      .spyOn(db.UserFavourite, "findAll")
      .mockRejectedValueOnce(new Error("synthetic database failure"));

    const response = await request(app)
      .get("/api/favs/pdf")
      .set("Cookie", authCookie(user.id));

    expect(response.status).toBe(500);
    expect(response.type).toBe("application/json");
    expect(response.body).toEqual({ error: "synthetic database failure" });
  });

  test("destroys the PDF document without an unhandled rejection after a client abort", async () => {
    const user = await seedFavourite();
    mockMovieDetails();
    const posterRequest = nock("https://image.tmdb.org")
      .get(`/t/p/w342${posterPath}`)
      .delay(500)
      .reply(200, onePixelPng, { "Content-Type": "image/png" });
    const destroyDocument = jest.spyOn(PDFDocument.prototype, "destroy");
    const unhandledRejections = [];
    const recordUnhandledRejection = (reason) => unhandledRejections.push(reason);
    process.on("unhandledRejection", recordUnhandledRejection);

    try {
      const pdfRequest = getPdf(user.id, false);
      const posterRequestStarted = new Promise((resolve) =>
        posterRequest.once("request", resolve)
      );
      const requestResult = new Promise((resolve) =>
        pdfRequest.end((error, response) => resolve(error ?? response))
      );

      await posterRequestStarted;
      pdfRequest.abort();
      await requestResult;
      await new Promise((resolve) => setTimeout(resolve, 25));

      expect(destroyDocument).toHaveBeenCalled();
      expect(unhandledRejections).toEqual([]);
    } finally {
      process.off("unhandledRejection", recordUnhandledRejection);
    }
  });
});
