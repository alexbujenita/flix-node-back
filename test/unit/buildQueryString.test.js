const {
  buildQueryString,
} = require("../../src/routes/movies/buildQueryString");

function buildSearchParams(searchParams) {
  return new URL(buildQueryString(searchParams)).searchParams;
}

describe("buildQueryString", () => {
  test("uses default page and adult values", () => {
    // Given: no optional discovery filters
    const searchParams = {};

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: default pagination and adult filtering are included
    expect(query.get("page")).toBe("1");
    expect(query.get("include_adult")).toBe("false");
  });

  test("adds certification filters only when country and certification are both supplied", () => {
    // Given: the complete certification filter pair
    const searchParams = { certification: "PG-13", certificationCountry: "US" };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: both certification fields are included
    expect(query.get("certification")).toBe("PG-13");
    expect(query.get("certification_country")).toBe("US");
  });

  test.each([[{ certification: "PG-13" }], [{ certificationCountry: "US" }]])(
    "omits certification filters when only one member of the pair is supplied",
    (searchParams) => {
      // Given: an incomplete certification filter pair

      // When: the movie discover URL is built
      const query = buildSearchParams(searchParams);

      // Then: neither certification field is included
      expect(query.has("certification")).toBe(false);
      expect(query.has("certification_country")).toBe(false);
    },
  );

  test.each([
    [
      { primaryReleaseDateGTE: "2020-01-01" },
      "primary_release_date.gte",
      "2020-01-01",
    ],
    [
      { primaryReleaseDateLTE: "2020-12-31" },
      "primary_release_date.lte",
      "2020-12-31",
    ],
  ])(
    "adds each primary release date bound independently",
    (searchParams, key, value) => {
      // Given: one primary-release date bound

      // When: the movie discover URL is built
      const query = buildSearchParams(searchParams);

      // Then: that bound is included
      expect(query.get(key)).toBe(value);
    },
  );

  test("adds both primary release date bounds together", () => {
    // Given: lower and upper primary-release date bounds
    const searchParams = {
      primaryReleaseDateGTE: "2020-01-01",
      primaryReleaseDateLTE: "2020-12-31",
    };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: both bounds are included
    expect(query.get("primary_release_date.gte")).toBe("2020-01-01");
    expect(query.get("primary_release_date.lte")).toBe("2020-12-31");
  });

  test("suppresses both year filters whenever a primary release date is supplied", () => {
    // Given: a primary-release date and both competing year filters
    const searchParams = {
      primaryReleaseDateGTE: "2020-01-01",
      primaryReleaseYear: 2020,
      year: 2019,
    };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: only the date filter is used for release filtering
    expect(query.get("primary_release_date.gte")).toBe("2020-01-01");
    expect(query.has("primary_release_year")).toBe(false);
    expect(query.has("year")).toBe(false);
  });

  test("uses primary release year instead of year when both are supplied without primary dates", () => {
    // Given: competing year filters without primary-release dates
    const searchParams = { primaryReleaseYear: 2020, year: 2019 };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: primary release year takes precedence
    expect(query.get("primary_release_year")).toBe("2020");
    expect(query.has("year")).toBe(false);
  });

  test("uses year when no primary release filter is supplied", () => {
    // Given: only the all-release-dates year filter
    const searchParams = { year: 2019 };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: year is included
    expect(query.get("year")).toBe("2019");
    expect(query.has("primary_release_year")).toBe(false);
  });

  test("includes adult movies when requested", () => {
    // Given: adult content is explicitly enabled
    const searchParams = { adult: true };

    // When: the movie discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: the adult query parameter is true
    expect(query.get("include_adult")).toBe("true");
  });
});
