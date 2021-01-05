const API_KEY = require("../../../secrets").API_KEY;

function randomInt(min = 1, max = 500) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sample(array) {
  const { length } = array;
  const index = Math.floor(Math.random() * length);
  return [array[index], index];
}

function randomQueryString() {
  const baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US`;
  const queryStrings = [
    `${baseUrl}&include_adult=true&include_video=false&page=${randomInt()}`,
    `${baseUrl}&sort_by=revenue.desc&include_adult=false&include_video=false&page=${randomInt()}`,
    `${baseUrl}&sort_by=original_title.asc&include_adult=false&include_video=false&page=${randomInt()}`,
    `${baseUrl}&sort_by=release_date.asc&include_adult=true&include_video=false&page=${randomInt()}`,
    `${baseUrl}&include_adult=true&include_video=false&page=${randomInt()}`,
  ];

  return sample(queryStrings)[0];
}

exports.random = { randomQueryString, sample, randomInt };
