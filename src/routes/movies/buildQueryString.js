// certification_country
// Used in conjunction with the certification filter, use this to specify a country with a valid certification.

// certification
// Filter results with a valid certification from the 'certification_country' field.

// primary_release_year
// A filter to limit the results to a specific primary release year.

/**       https://developers.themoviedb.org/3/discover/movie-discover
 * primary_release_date.gte
Filter and only include movies that have a primary release date that is greater or equal to the specified value.

format: date YYYY-MM-DD
primary_release_date.lte
Filter and only include movies that have a primary release date that is less than or equal to the specified value.

release_date.gte NO
Filter and only include movies that have a release date (looking at all release dates) that is greater or equal to the specified value.

format: date
release_date.lte NO
Filter and only include movies that have a release date (looking at all release dates) that is less than or equal to the specified value.

year INT
A filter to limit the results to a specific year (looking at all release dates).

with_genres NOT_NOW
string
Comma separated value of genre ids that you want to include in the results.

optional
without_genres NOT_NOW
string
Comma separated value of genre ids that you want to exclude from the results.

 */
const API_KEY = require("../../../secrets").API_KEY;

/**
 * Concatenates various params
 * @param {Object} searchParams
 * @param {Number} searchParams.page
 * @param {string} searchParams.certification
 * @param {string} searchParams.certificationCountry
 * @param {Number} searchParams.primaryReleaseYear
 * @param {string} searchParams.primaryReleaseDateGTE
 * @param {string} searchParams.primaryReleaseDateLTE
 * @param {boolean} searchParams.adult
 * @returns {string} the complete URL for the query
 */
function buildQueryString({
  page = 1,
  certification,
  certificationCountry,
  primaryReleaseYear,
  primaryReleaseDateGTE,
  primaryReleaseDateLTE,
  year,
  adult = false,
}) {
  let base = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&include_adult=${adult}&include_video=false&page=${page}`;

  let primaryDateSet = false;
  let yearSet = false;

  if (certificationCountry && certification) {
    base += `&certification_country=${certificationCountry}&certification=${certification}`;
  }

  if (primaryReleaseDateGTE) {
    primaryDateSet = true;
    base += `&primary_release_date.gte=${primaryReleaseDateGTE}`;
  }

  if (primaryReleaseDateLTE) {
    primaryDateSet = true;
    base += `&primary_release_date.lte=${primaryReleaseDateLTE}`;
  }

  if (!primaryDateSet) {
    if (primaryReleaseYear) {
      yearSet = true;
      base += `&primary_release_year=${primaryReleaseYear}`;
    }
    if (!yearSet && year) {
      base += `&year=${year}`;
    }
  }
  return base;
}

exports.buildQueryString = buildQueryString;
