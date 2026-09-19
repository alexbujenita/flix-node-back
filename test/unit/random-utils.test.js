const {
  random: { randomInt, randomQueryString, sample },
} = require("../../src/routes/random/utils");

const FIXED_CURRENT_YEAR = 2026;

describe("random utilities", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("randomInt", () => {
    it("returns inclusive custom bounds at the random endpoints", () => {
      const random = jest.spyOn(Math, "random");

      random.mockReturnValueOnce(0);
      expect(randomInt(5, 10)).toBe(5);

      random.mockReturnValueOnce(0.999999);
      expect(randomInt(5, 10)).toBe(10);
    });

    it("uses documented inclusive defaults from 1 through 500", () => {
      const random = jest.spyOn(Math, "random");

      random.mockReturnValueOnce(0);
      expect(randomInt()).toBe(1);

      random.mockReturnValueOnce(0.999999);
      expect(randomInt()).toBe(500);
    });
  });

  describe("sample", () => {
    it("returns the selected item and index by default", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      expect(sample(["first", "second", "third"])).toEqual(["second", 1]);
    });

    it("returns only the selected item when andIndex is false", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.75);

      expect(sample(["first", "second", "third", "fourth"], false)).toBe(
        "fourth",
      );
    });

    it("selects the only item in a single-element array", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.999999);

      expect(sample(["only"])).toEqual(["only", 0]);
      expect(sample(["only"], false)).toBe("only");
    });
  });

  describe("randomQueryString", () => {
    beforeEach(() => {
      jest
        .spyOn(global, "Date")
        .mockImplementation(() => ({ getFullYear: () => FIXED_CURRENT_YEAR }));
    });

    it.each([
      [
        "first standard discovery entry",
        0,
        (params) => {
          expect(params.get("include_adult")).toBe("true");
          expect(params.get("include_video")).toBe("false");
          expect(params.get("page")).toBe("1");
          expect(params.get("sort_by")).toBeNull();
        },
      ],
      [
        "second standard discovery entry",
        0.2,
        (params) => {
          expect(params.get("include_adult")).toBe("true");
          expect(params.get("include_video")).toBe("false");
          expect(params.get("page")).toBe("1");
          expect(params.get("sort_by")).toBeNull();
        },
      ],
      [
        "genre and vote-average discovery entry",
        0.4,
        (params) => {
          expect(params.get("page")).toBe("1");
          expect(params.get("with_genres")).toBe("28");
          expect(params.get("sort_by")).toBe("vote_average.desc");
          expect(params.get("vote_count.gte")).toBe("100");
          expect(params.get("include_adult")).toBeNull();
        },
      ],
      [
        "alphabetical-title discovery entry",
        0.6,
        (params) => {
          expect(params.get("sort_by")).toBe("original_title.asc");
          expect(params.get("include_adult")).toBe("false");
          expect(params.get("include_video")).toBe("false");
          expect(params.get("page")).toBe("1");
        },
      ],
      [
        "release-year and vote-average discovery entry",
        0.8,
        (params) => {
          const releaseYear = Number(params.get("primary_release_year"));

          expect(releaseYear).toBeGreaterThanOrEqual(1957);
          expect(releaseYear).toBeLessThanOrEqual(FIXED_CURRENT_YEAR - 2);
          expect(params.get("vote_count.gte")).toBe("100");
          expect(params.get("sort_by")).toBe("vote_average.desc");
          expect(params.get("page")).toBeNull();
        },
      ],
    ])("returns the %s", (_, querySelector, assertShape) => {
      jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(querySelector);

      const query = new URL(randomQueryString());

      expect(query.origin).toBe("https://api.themoviedb.org");
      expect(query.pathname).toBe("/3/discover/movie");
      expect(query.searchParams.get("api_key")).toBe("test-tmdb-key");
      expect(query.searchParams.get("language")).toBe("en-US");
      assertShape(query.searchParams);
    });
  });
});
