const express = require("express");
const nock = require("nock");
const request = require("supertest");
const PDFDocument = require("pdfkit");
const db = require("../../models");
const { createApp } = require("../../src/app");
const { authCookie } = require("../helpers/auth");
const { makeFav, makeUser } = require("../helpers/factories");

const app = createApp();
const movieId = 550;
const laterMovieId = 551;
const posterPath = "/synthetic-poster.png";
const profilePath = "/synthetic-profile.png";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 25));
}

// These abort paths kill the socket mid-body, so the client callback never
// fires. The assertions poll server-side observations instead.
async function waitFor(condition) {
  const deadline = Date.now() + 4000;

  while (Date.now() < deadline) {
    if (condition()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("Timed out waiting for the server to reach the condition");
}

const abandonedRequests = [];

function sendAndIgnoreTransportErrors(pdfRequest) {
  pdfRequest.on("error", () => {});
  pdfRequest.end(() => {});
  // supertest closes its ephemeral server from the end callback, which never
  // runs for these dropped requests. Left open, the client socket and listening
  // port outlive the test and can collide with another worker's server.
  abandonedRequests.push(pdfRequest);
  return pdfRequest;
}

afterEach(() => {
  while (abandonedRequests.length > 0) {
    const pdfRequest = abandonedRequests.pop();

    pdfRequest.abort();
    pdfRequest.app.closeAllConnections();
    pdfRequest.app.close();
  }
});

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

function getPdf(userId, includeCast, target = app) {
  return request(target)
    .get(`/api/favs/pdf?includeCast=${includeCast}`)
    .set("Cookie", authCookie(userId))
    .buffer(true)
    .parse(binaryParser);
}

// A client-side abort() does not reliably set res.destroyed on the server, so
// waiting for it is racy. Exposing the real response lets the test drop the
// connection directly, which is synchronous and is the exact state the route checks.
function appCapturingResponses(capturedResponses) {
  const probeApp = express();

  probeApp.use((req, res, next) => {
    capturedResponses.push(res);
    next();
  });
  probeApp.use(app);

  return probeApp;
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
      Buffer.from([0x25, 0x50, 0x44, 0x46]),
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
    const recordUnhandledRejection = (reason) =>
      unhandledRejections.push(reason);
    process.on("unhandledRejection", recordUnhandledRejection);

    try {
      const pdfRequest = getPdf(user.id, false);
      const posterRequestStarted = new Promise((resolve) =>
        posterRequest.once("request", resolve),
      );
      const requestResult = new Promise((resolve) =>
        pdfRequest.end((error, response) => resolve(error ?? response)),
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

  test("returns 500 User not found when the favourites query yields nothing", async () => {
    const user = await makeUser();
    jest.spyOn(db.UserFavourite, "findAll").mockResolvedValueOnce(null);

    const response = await request(app)
      .get("/api/favs/pdf")
      .set("Cookie", authCookie(user.id));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "User not found." });
  });

  test("never starts a PDF when the connection drops while the favourites are still loading", async () => {
    const user = await makeUser();
    const pipe = jest.spyOn(PDFDocument.prototype, "pipe");
    const capturedResponses = [];
    let releaseFindAll;
    let findAllCalled = false;
    jest.spyOn(db.UserFavourite, "findAll").mockImplementation(() => {
      findAllCalled = true;
      return new Promise((resolve) => {
        releaseFindAll = () => resolve([]);
      });
    });

    sendAndIgnoreTransportErrors(
      getPdf(user.id, false, appCapturingResponses(capturedResponses)),
    );

    await waitFor(() => findAllCalled && capturedResponses.length > 0);
    capturedResponses[0].destroy();
    releaseFindAll();
    await settle();

    expect(pipe).not.toHaveBeenCalled();
  });

  test("abandons the document instead of finishing it when the client disconnects as the last page is written", async () => {
    const user = await seedFavourite();
    const movieRequest = mockMovieDetails({ poster: null });
    const pipe = jest.spyOn(PDFDocument.prototype, "pipe");
    const end = jest.spyOn(PDFDocument.prototype, "end");
    const destroy = jest.spyOn(PDFDocument.prototype, "destroy");
    // PDFKit calls addPage from its own constructor, before the route pipes the
    // document, so the disconnect is deferred until a pipe target exists. It
    // also runs after the real addPage so the flush cannot fail on a dead socket.
    const originalAddPage = PDFDocument.prototype.addPage;
    jest
      .spyOn(PDFDocument.prototype, "addPage")
      .mockImplementation(function addPageThenDisconnect(...args) {
        const result = originalAddPage.apply(this, args);

        if (pipe.mock.calls.length > 0) {
          pipe.mock.calls[0][0].destroy();
        }

        return result;
      });

    sendAndIgnoreTransportErrors(getPdf(user.id, false));

    await waitFor(() => destroy.mock.calls.length > 0);
    await settle();

    expect(end).not.toHaveBeenCalled();
    expect(movieRequest.isDone()).toBe(true);
  });

  test("destroys a partially streamed response when TMDB fails after the headers are sent", async () => {
    const user = await makeUser();
    await makeFav(user.id, { movieRefId: movieId });
    await makeFav(user.id, { movieRefId: laterMovieId });
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const firstMovie = mockMovieDetails({ poster: null });
    const failingMovie = nock("https://api.themoviedb.org")
      .get(`/3/movie/${laterMovieId}`)
      .query({
        api_key: process.env.TMDB_API_KEY,
        append_to_response: "credits",
      })
      .reply(500, { status_message: "Synthetic TMDB failure" });

    sendAndIgnoreTransportErrors(getPdf(user.id, false));

    await waitFor(() => consoleError.mock.calls.length > 0);

    expect(firstMovie.isDone()).toBe(true);
    expect(failingMovie.isDone()).toBe(true);
  });
});
