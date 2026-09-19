const nock = require("nock");
const generateFavPages = require("../../src/utils/generateFavPages");

const API_ORIGIN = "https://api.themoviedb.org";
const IMAGE_ORIGIN = "https://image.tmdb.org";
const POSTER_PATH = "/synthetic-poster.png";
const IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

function createDoc() {
  const doc = {};

  for (const method of [
    "font",
    "fontSize",
    "text",
    "image",
    "addPage",
    "moveDown",
  ]) {
    doc[method] = jest.fn(function returnDoc() {
      return this;
    });
  }

  return doc;
}

function favourite(movieRefId) {
  return { toJSON: jest.fn(() => ({ movieRefId })) };
}

function movieDetails(movieRefId, overrides = {}) {
  return {
    id: movieRefId,
    title: `Synthetic Movie ${movieRefId}`,
    tagline: "A synthetic TMDB fixture",
    runtime: 120,
    overview: "Synthetic movie-details data for PDF generation.",
    original_title: `Synthetic Original ${movieRefId}`,
    poster_path: POSTER_PATH,
    release_date: "2026-09-19",
    credits: { cast: [] },
    ...overrides,
  };
}

function mockDetails(movieRefId, overrides) {
  return nock(API_ORIGIN)
    .get(`/3/movie/${movieRefId}`)
    .query({
      api_key: process.env.TMDB_API_KEY,
      append_to_response: "credits",
    })
    .reply(200, movieDetails(movieRefId, overrides));
}

function mockImage(size, path) {
  return nock(IMAGE_ORIGIN)
    .get(`/t/p/${size}${path}`)
    .reply(200, IMAGE, { "Content-Type": "image/png" });
}

function expectNoDocCalls(doc) {
  for (const method of Object.keys(doc)) {
    expect(doc[method]).not.toHaveBeenCalled();
  }
}

describe("generateFavPages", () => {
  test("adds one page per favourite and skips cast pages and images when includeCast is false", async () => {
    const doc = createDoc();
    const favourites = [favourite(101), favourite(202)];
    const cast = [
      {
        id: 1,
        name: "Synthetic Performer",
        character: "Synthetic Character",
        profile_path: "/unused-profile.png",
      },
    ];
    const firstDetails = mockDetails(101, {
      poster_path: null,
      credits: { cast },
    });
    const secondDetails = mockDetails(202, {
      poster_path: null,
      credits: { cast },
    });

    await generateFavPages(
      favourites,
      doc,
      false,
      new AbortController().signal,
    );

    expect(doc.addPage).toHaveBeenCalledTimes(2);
    expect(doc.image).not.toHaveBeenCalled();
    expect(firstDetails.isDone()).toBe(true);
    expect(secondDetails.isDone()).toBe(true);
  });

  test("adds an extra cast page and fetches no more than five profile images", async () => {
    const doc = createDoc();
    const cast = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      name: `Synthetic Performer ${index + 1}`,
      character: `Synthetic Character ${index + 1}`,
      profile_path: `/synthetic-profile-${index + 1}.png`,
    }));
    const details = mockDetails(303, { credits: { cast } });
    const poster = mockImage("w342", POSTER_PATH);
    const profiles = cast
      .slice(0, 5)
      .map(({ profile_path }) => mockImage("w185", profile_path));

    await generateFavPages(
      [favourite(303)],
      doc,
      true,
      new AbortController().signal,
    );

    expect(doc.addPage).toHaveBeenCalledTimes(2);
    expect(doc.image).toHaveBeenCalledTimes(6);
    expect(details.isDone()).toBe(true);
    expect(poster.isDone()).toBe(true);
    expect(profiles.every((profile) => profile.isDone())).toBe(true);
  });

  test("renders a cast member without a profile as text and makes no image request when the poster is absent", async () => {
    const doc = createDoc();
    const details = mockDetails(404, {
      poster_path: null,
      credits: {
        cast: [
          {
            id: 1,
            name: "Text Only Performer",
            character: "Text Only Character",
            profile_path: null,
          },
        ],
      },
    });

    await generateFavPages(
      [favourite(404)],
      doc,
      true,
      new AbortController().signal,
    );

    expect(doc.addPage).toHaveBeenCalledTimes(2);
    expect(doc.image).not.toHaveBeenCalled();
    expect(doc.text).toHaveBeenCalledWith(
      "Text Only Performer as Text Only Character",
      50,
      150,
      { align: "center" },
    );
    expect(details.isDone()).toBe(true);
  });

  test("heads each page with the title and release year, falling back to the original title and omitting a missing year", async () => {
    const doc = createDoc();
    const complete = mockDetails(808, { poster_path: null });
    const incomplete = mockDetails(909, {
      title: null,
      release_date: null,
      poster_path: null,
    });

    await generateFavPages(
      [favourite(808), favourite(909)],
      doc,
      false,
      new AbortController().signal,
    );

    expect(doc.text).toHaveBeenCalledWith("Synthetic Movie 808 (2026)");
    expect(doc.text).toHaveBeenCalledWith("Synthetic Original 909");
    expect(complete.isDone()).toBe(true);
    expect(incomplete.isDone()).toBe(true);
  });

  test("returns immediately without document or TMDB work when already aborted", async () => {
    const controller = new AbortController();
    const doc = createDoc();
    const fav = favourite(505);
    controller.abort();

    await generateFavPages([fav], doc, true, controller.signal);

    expect(fav.toJSON).not.toHaveBeenCalled();
    expectNoDocCalls(doc);
  });

  test("returns early when the signal aborts between cast members", async () => {
    const controller = new AbortController();
    const doc = createDoc();
    const cast = [
      {
        id: 1,
        name: "First Performer",
        character: "First Character",
        profile_path: "/first-profile.png",
      },
      {
        id: 2,
        name: "Second Performer",
        character: "Second Character",
        profile_path: "/second-profile.png",
      },
    ];
    const details = mockDetails(606, {
      poster_path: null,
      credits: { cast },
    });
    const firstProfile = mockImage("w185", cast[0].profile_path);
    doc.text.mockImplementation(function abortAfterFirstCastText(value) {
      if (value === "First Performer as First Character") {
        controller.abort();
      }
      return this;
    });

    await generateFavPages([favourite(606)], doc, true, controller.signal);

    expect(doc.addPage).toHaveBeenCalledTimes(1);
    expect(doc.image).toHaveBeenCalledTimes(1);
    expect(doc.text).not.toHaveBeenCalledWith(
      "Second Performer as Second Character",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(details.isDone()).toBe(true);
    expect(firstProfile.isDone()).toBe(true);
  });

  test("propagates a rejected detail request and leaves later favourites unprocessed", async () => {
    const doc = createDoc();
    const first = favourite(707);
    const later = favourite(808);
    const rejectedDetails = nock(API_ORIGIN)
      .get("/3/movie/707")
      .query({
        api_key: process.env.TMDB_API_KEY,
        append_to_response: "credits",
      })
      .reply(500, { status_message: "Synthetic TMDB failure" });

    await expect(
      generateFavPages(
        [first, later],
        doc,
        false,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ response: { status: 500 } });

    expect(first.toJSON).toHaveBeenCalledTimes(1);
    expect(later.toJSON).not.toHaveBeenCalled();
    expect(doc.addPage).toHaveBeenCalledTimes(0);
    expect(rejectedDetails.isDone()).toBe(true);
  });
});
