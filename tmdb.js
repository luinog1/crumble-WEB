// TMDB API Constants and Helpers
const BASE_URL = "https://api.themoviedb.org/3";

function getApiKey() {
  return localStorage.getItem('tmdb_api_key') || '';
}

async function makeSecureTMDBRequest(endpoint, params = {}) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("No TMDB API key configured. Please add your API key in Settings.");
    }
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('language', 'en-US');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`TMDB API error for ${endpoint}:`, error);
    throw error;
  }
}

async function getPopularMovies() {
  const data = await makeSecureTMDBRequest('/movie/popular', { page: '1' });
  return data.results || [];
}

async function getTrendingMovies() {
  const data = await makeSecureTMDBRequest('/trending/movie/day');
  return data.results || [];
}

async function getLatestMovies() {
  const data = await makeSecureTMDBRequest('/movie/now_playing', { page: '1' });
  return data.results || [];
}

async function getTrendingTV() {
  const data = await makeSecureTMDBRequest('/trending/tv/day');
  return data.results || [];
}

async function getPopularTV() {
  const data = await makeSecureTMDBRequest('/tv/popular', { page: '1' });
  return data.results || [];
}

async function searchMovies(query) {
  if (!query || query.trim().length < 2) return [];
  const data = await makeSecureTMDBRequest('/search/movie', { query: query.trim() });
  return data.results || [];
}

async function getMovieDetails(movieId) {
  return await makeSecureTMDBRequest(`/movie/${movieId}`);
}

async function getTrailer(movieId) {
  try {
    const data = await makeSecureTMDBRequest(`/movie/${movieId}/videos`);
    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    return trailer || null;
  } catch (error) {
    console.error('Error fetching trailer:', error);
    return null;
  }
}

// Export all functions to window for use in app.js
window.getApiKey = getApiKey;
window.makeSecureTMDBRequest = makeSecureTMDBRequest;
window.getPopularMovies = getPopularMovies;
window.getTrendingMovies = getTrendingMovies;
window.getLatestMovies = getLatestMovies;
window.getTrendingTV = getTrendingTV;
window.getPopularTV = getPopularTV;
window.searchMovies = searchMovies;
window.getMovieDetails = getMovieDetails;
window.getTrailer = getTrailer;