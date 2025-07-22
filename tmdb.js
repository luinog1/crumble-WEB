const BASE_URL = "https://api.themoviedb.org/3";

// Get the user's TMDB API key from localStorage
export function getApiKey() {
  return localStorage.getItem('tmdb_api_key') || '';
}

// Fetch popular movies
export async function getPopularMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await response.json();
  return data.results;
}

// Search for movies
export async function searchMovies(query) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`);
  const data = await response.json();
  return data.results;
}

// Fetch details of a single movie
export async function getMovieDetails(movieId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`);
  const data = await response.json();
  return data;
}

// Fetch trailer (YouTube link) for a movie
export async function getTrailer(movieId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`);
  const data = await response.json();
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

// Utility: fetch 'now playing' (featured) movies
export async function getFeaturedMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
  const data = await response.json();
  return data.results;
}

// Utility: fetch upcoming (latest) movies
export async function getLatestMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/upcoming?api_key=${apiKey}&language=en-US&page=1`);
  const data = await response.json();
  return data.results;
}