const {
  buildTvDiscoveryQuery,
} = require("../../src/routes/tvSeries/buildTvDiscoverQuery");

function buildSearchParams(searchParams) {
  return new URL(buildTvDiscoveryQuery(searchParams)).searchParams;
}

describe("buildTvDiscoverQuery", () => {
  // The builder has no conditional branches: it always emits these five parameters.
  test("builds the complete default TV discovery URL shape", () => {
    // Given: no optional TV discovery inputs
    const url = new URL(buildTvDiscoveryQuery({}));

    // When: the TV discover URL is built
    const query = url.searchParams;

    // Then: the endpoint and every emitted default parameter are present
    expect(url.origin).toBe("https://api.themoviedb.org");
    expect(url.pathname).toBe("/3/discover/tv");
    expect(query.get("api_key")).toBe("test-tmdb-key");
    expect(query.get("sort_by")).toBe("popularity.desc");
    expect(query.get("include_adult")).toBe("false");
    expect(query.get("include_video")).toBe("false");
    expect(query.get("page")).toBe("1");
  });

  test("uses the supplied page", () => {
    // Given: a requested TV discovery page
    const searchParams = { page: 42 };

    // When: the TV discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: the page parameter reflects the input
    expect(query.get("page")).toBe("42");
  });

  test("includes adult TV series when requested", () => {
    // Given: adult TV content is explicitly enabled
    const searchParams = { adult: true };

    // When: the TV discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: the adult-content parameter reflects the input
    expect(query.get("include_adult")).toBe("true");
  });

  test("omits unknown search inputs", () => {
    // Given: an unsupported TV discovery input
    const searchParams = { unsupportedFilter: "ignored" };

    // When: the TV discover URL is built
    const query = buildSearchParams(searchParams);

    // Then: no unsupported query parameter is emitted
    expect(query.has("unsupportedFilter")).toBe(false);
  });
});
