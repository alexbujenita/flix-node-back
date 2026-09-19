const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

const API_ROOT = "https://api.themoviedb.org/3";
const IMAGE_ROOT = "https://image.tmdb.org/t/p";
const FIXTURE_ROOT = __dirname;
const TMDB_DIRECTORY = path.join(FIXTURE_ROOT, "tmdb");
const IMAGE_DIRECTORY = path.join(FIXTURE_ROOT, "images");

function loadApiKey() {
  if (process.env.TMDB_API_KEY?.trim()) {
    return process.env.TMDB_API_KEY.trim();
  }

  try {
    const secrets = require(path.resolve(__dirname, "../../secrets.js"));
    return typeof secrets.API_KEY === "string" ? secrets.API_KEY.trim() : "";
  } catch {
    return "";
  }
}

async function getJson(apiKey, pathname, query = {}) {
  const response = await axios.get(`${API_ROOT}/${pathname}`, {
    params: { api_key: apiKey, ...query },
    timeout: 30_000,
  });
  return response.data;
}

function hasSharedMovie(firstPage, secondPage) {
  const firstIds = new Set(firstPage.results.map(({ id }) => id));
  return secondPage.results.some(({ id }) => firstIds.has(id));
}

async function getActorMoviePages(apiKey, actorId) {
  const query = {
    language: "en-US",
    sort_by: "popularity_desc",
    include_adult: true,
    include_video: false,
    with_cast: actorId,
  };
  const firstPage = await getJson(apiKey, "discover/movie", {
    ...query,
    page: 1,
  });

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const nextPage = await getJson(apiKey, "discover/movie", {
      ...query,
      page,
    });
    if (hasSharedMovie(firstPage, nextPage) && page === 2) {
      return [firstPage, nextPage];
    }
    if (page === 2) {
      throw new Error(
        `Actor ${actorId} discover pages 1 and 2 do not share a movie id; choose fixture IDs with a real overlapping consecutive pair.`,
      );
    }
  }

  throw new Error(`Actor ${actorId} does not have two discover pages.`);
}

function serializeJson(value, apiKey) {
  return `${JSON.stringify(value, null, 2).split(apiKey).join("[REDACTED]")}\n`;
}

async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30_000,
  });
  return Buffer.from(response.data);
}

async function recordFixtures(apiKey) {
  const movieId = 550;
  const actorId = 287;
  const tvId = 1399;
  const seasonNumber = 1;

  const movie = await getJson(apiKey, `movie/${movieId}`);
  const movieWithCreditsAndVideos = await getJson(apiKey, `movie/${movieId}`, {
    append_to_response: "credits,videos",
  });
  const movieWithCredits = await getJson(apiKey, `movie/${movieId}`, {
    append_to_response: "credits",
  });
  const [actorMoviesPage1, actorMoviesPage2] = await getActorMoviePages(
    apiKey,
    actorId,
  );
  const fixtures = {
    "movie.json": movie,
    "movie-with-credits-and-videos.json": movieWithCreditsAndVideos,
    "movie-with-credits.json": movieWithCredits,
    "movie-similar.json": await getJson(apiKey, `movie/${movieId}/similar`, {
      page: 1,
    }),
    "discover-movie.json": await getJson(apiKey, "discover/movie", {
      sort_by: "popularity.desc",
      include_adult: false,
      include_video: false,
      page: 1,
    }),
    "random-discover-movie.json": await getJson(apiKey, "discover/movie", {
      language: "en-US",
      include_adult: true,
      include_video: false,
      page: 1,
    }),
    "actor-movies-page-1.json": actorMoviesPage1,
    "actor-movies-page-2.json": actorMoviesPage2,
    "discover-tv.json": await getJson(apiKey, "discover/tv", {
      sort_by: "popularity.desc",
      include_adult: false,
      include_video: false,
      page: 1,
    }),
    "tv-series.json": await getJson(apiKey, `tv/${tvId}`),
    "tv-season.json": await getJson(
      apiKey,
      `tv/${tvId}/season/${seasonNumber}`,
    ),
    "search-multi.json": await getJson(apiKey, "search/multi", {
      query: "Fight Club",
      page: 1,
      include_adult: false,
    }),
    "person.json": await getJson(apiKey, `person/${actorId}`, {
      language: "en-US",
      append_to_response: "images",
    }),
    "movie-credits.json": await getJson(apiKey, `movie/${movieId}/credits`),
    "movie-videos.json": await getJson(apiKey, `movie/${movieId}/videos`),
    "movie-certifications.json": await getJson(
      apiKey,
      "certification/movie/list",
    ),
  };

  const posterPath = movieWithCredits.poster_path;
  const profilePath = movieWithCredits.credits.cast.find(
    ({ profile_path: candidate }) => candidate,
  )?.profile_path;
  if (!posterPath || !profilePath) {
    throw new Error("Chosen movie does not provide both required image paths.");
  }

  const poster = await downloadImage(`${IMAGE_ROOT}/w342${posterPath}`);
  const profile = await downloadImage(`${IMAGE_ROOT}/w185${profilePath}`);
  await fs.mkdir(TMDB_DIRECTORY, { recursive: true });
  await fs.mkdir(IMAGE_DIRECTORY, { recursive: true });
  await Promise.all(
    Object.entries(fixtures).map(([name, data]) =>
      fs.writeFile(
        path.join(TMDB_DIRECTORY, name),
        serializeJson(data, apiKey),
      ),
    ),
  );
  await fs.writeFile(path.join(IMAGE_DIRECTORY, "poster.jpg"), poster);
  await fs.writeFile(path.join(IMAGE_DIRECTORY, "profile.jpg"), profile);

  return [...Object.keys(fixtures), "poster.jpg", "profile.jpg"];
}

async function main() {
  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error(
      "TMDB API key is required. Set TMDB_API_KEY or add API_KEY to root secrets.js.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const files = await recordFixtures(apiKey);
    console.log(`Recorded ${files.length} TMDB fixtures.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Unable to record TMDB fixtures: ${message.split(apiKey).join("[REDACTED]")}`,
    );
    process.exitCode = 1;
  }
}

main();
