// TMDB API Constants and Helpers
const BASE_URL = "https://api.themoviedb.org/3";

function getApiKey() {
  return localStorage.getItem('tmdb_api_key') || '';
}

// Fetch trailer (YouTube link) for a movie
async function getTrailer(movieId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`);
  const data = await response.json();
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

// Export for use in app.js
window.getTrailer = getTrailer;
window.getApiKey = getApiKey;