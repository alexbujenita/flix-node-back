const API_KEY = require("../../../secrets").API_KEY;

/**
 * Concatenates various params
 * @param {Object} searchParams
 * @param {Number} searchParams.page
 * @param {boolean} searchParams.adult
 * @returns {string} the complete URL for the query
 */
function buildTvDiscoveryQuery({ page = 1, adult = false}) {

    let base = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&include_adult=${adult}&include_video=false&page=${page}`;

    return base;
}

exports.buildTvDiscoveryQuery = buildTvDiscoveryQuery;
