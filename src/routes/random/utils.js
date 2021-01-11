const API_KEY = require("../../../secrets").API_KEY;
const { GENRES } = require("./constants");

/**
 * Returns a random number between the specified min and max (inclusive)
 * @param {Number} min limit
 * @param {Number} max limit
 * @returns {Number}
 */
function randomInt(min = 1, max = 500) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Return a random item from the array and its index (optional)
 * @param {Array<*>} array
 * @param {Boolean} andIndex
 */
function sample(array, andIndex = true) {
  const { length } = array;
  const index = Math.floor(Math.random() * length);
  return andIndex ? [array[index], index] : array[index];
}

function randomQueryString() {
  const rndGenre = sample(GENRES, false).id;
  const currentYear = new Date().getFullYear();
  const baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US`;
  const queryStrings = [
    `${baseUrl}&include_adult=true&include_video=false&page=${randomInt()}`,
    `${baseUrl}&include_adult=true&include_video=false&page=${randomInt()}`,
    `${baseUrl}&page=${randomInt(
      1,
      5
    )}&with_genres=${rndGenre}&sort_by=vote_average.desc&vote_count.gte=100`,
    `${baseUrl}&sort_by=original_title.asc&include_adult=false&include_video=false&page=${randomInt()}`,
    `${baseUrl}&primary_release_year=${randomInt(
      1957,
      currentYear - 2
    )}&vote_count.gte=100&sort_by=vote_average.desc`,
  ];

  return sample(queryStrings)[0];
}

exports.random = { randomQueryString, sample, randomInt };
