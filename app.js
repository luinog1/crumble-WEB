// Complete Crumble App Implementation with Fixed Button Handlers

// --- TMDB API Functions ---
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

async function getMovieDetails(movieId) {
  return await makeSecureTMDBRequest(`/movie/${movieId}`);
}

// --- Enhanced Tab Management ---
class TabManager {
  constructor() {
    this.currentTab = 'home-tab';
    this.isTransitioning = false;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-btn');
      if (navBtn) {
        e.preventDefault();
        this.handleNavClick(navBtn);
      }
    });
  }

  async handleNavClick(button) {
    if (this.isTransitioning) {
      console.log('Tab transition in progress, ignoring click');
      return;
    }

    const tabId = this.getTabIdFromButton(button);
    if (!tabId || tabId === this.currentTab) {
      return;
    }

    try {
      this.isTransitioning = true;
      await this.showTab(tabId);
    } catch (error) {
      console.error('Error switching tabs:', error);
      this.showErrorMessage('Failed to switch tabs. Please try again.');
    } finally {
      this.isTransitioning = false;
    }
  }

  getTabIdFromButton(button) {
    // Find the parent li element with data-tab attribute
    const listItem = button.closest('li[data-tab]');
    if (listItem) {
      return listItem.getAttribute('data-tab');
    }
    
    // Fallback: use button index
    const buttons = document.querySelectorAll('.nav-btn');
    const buttonIndex = Array.from(buttons).indexOf(button);
    const tabIds = ['home-tab', 'search-tab', 'library-tab', 'settings-tab'];
    return tabIds[buttonIndex];
  }

  async showTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    const targetTab = document.getElementById(tabId);
    if (!targetTab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    this.clearActiveStates();
    targetTab.classList.add('active');
    this.updateNavButton(tabId);
    await this.handleTabSpecificLogic(tabId);
    
    this.currentTab = tabId;
    console.log('Successfully switched to tab:', tabId);
  }

  clearActiveStates() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  updateNavButton(tabId) {
    const targetListItem = document.querySelector(`li[data-tab="${tabId}"]`);
    if (targetListItem) {
      const button = targetListItem.querySelector('.nav-btn');
      if (button) {
        button.classList.add('active');
      }
    }
  }

  async handleTabSpecificLogic(tabId) {
    switch(tabId) {
      case 'settings-tab':
        this.initializeSettings();
        break;
      case 'search-tab':
        this.focusSearchInput();
        break;
      case 'home-tab':
        await this.loadHomeContent();
        break;
    }
  }

  initializeSettings() {
    try {
      const apiKeyInput = document.getElementById('api-key-input');
      const playerSelect = document.getElementById('player-select');
      const debridService = document.getElementById('debrid-service');
      const debridApiKey = document.getElementById('debrid-api-key');

      if (apiKeyInput) apiKeyInput.value = localStorage.getItem('tmdb_api_key') || '';
      if (playerSelect) playerSelect.value = getPlayerChoice();
      
      const debridConfig = getDebridConfig();
      if (debridService) debridService.value = debridConfig.service;
      if (debridApiKey) debridApiKey.value = debridConfig.apiKey;

      this.clearStatusMessages();
      renderAddonList();
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  focusSearchInput() {
    setTimeout(() => {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }

  async loadHomeContent() {
    const apiKey = localStorage.getItem('tmdb_api_key');
    if (apiKey) {
      try {
        await loadHomeCatalogs();
      } catch (error) {
        console.error('Error loading home content:', error);
      }
    }
  }

  clearStatusMessages() {
    ['api-key-status', 'player-status', 'debrid-status'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = '';
    });
  }

  showErrorMessage(message) {
    let errorDiv = document.getElementById('error-notification');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'error-notification';
      errorDiv.className = 'error-notification';
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

// --- Settings Functions ---
function saveApiKey() {
  try {
    const input = document.getElementById('api-key-input');
    const statusDiv = document.getElementById('api-key-status');

    if (!input || !statusDiv) {
      throw new Error('API key form elements not found');
    }

    const apiKey = input.value.trim();
    if (!apiKey) {
      showStatus(statusDiv, 'Please enter a valid API key', 'error');
      return;
    }

    if (apiKey.length !== 32) {
      showStatus(statusDiv, 'Invalid API key format. TMDB API keys should be 32 characters long.', 'error');
      return;
    }

    localStorage.setItem('tmdb_api_key', apiKey);
    showStatus(statusDiv, 'API key saved successfully!', 'success');

    setTimeout(() => {
      loadHomeCatalogs().catch(error => {
        console.error('Error loading catalogs after API key save:', error);
      });
    }, 500);

  } catch (error) {
    console.error('Error saving API key:', error);
    const statusDiv = document.getElementById('api-key-status');
    if (statusDiv) {
      showStatus(statusDiv, 'Error saving API key', 'error');
    }
  }
}

function savePlayerChoice() {
  try {
    const playerSelect = document.getElementById('player-select');
    const statusDiv = document.getElementById('player-status');

    if (!playerSelect || !statusDiv) {
      throw new Error('Player form elements not found');
    }

    const choice = playerSelect.value;
    localStorage.setItem('preferred_player', choice);
    showStatus(statusDiv, 'Player preference saved!', 'success');
    
  } catch (error) {
    console.error('Error saving player choice:', error);
    const statusDiv = document.getElementById('player-status');
    if (statusDiv) {
      showStatus(statusDiv, 'Error saving player preference', 'error');
    }
  }
}

function saveDebridConfig() {
  try {
    const serviceSelect = document.getElementById('debrid-service');
    const apiKeyInput = document.getElementById('debrid-api-key');
    const statusDiv = document.getElementById('debrid-status');
    
    if (!serviceSelect || !apiKeyInput || !statusDiv) {
      throw new Error('Debrid form elements not found');
    }
    
    const service = serviceSelect.value;
    const apiKey = apiKeyInput.value.trim();
    
    const config = { service, apiKey };
    localStorage.setItem('debrid_config', JSON.stringify(config));
    
    if (service === 'none') {
      showStatus(statusDiv, 'Debrid service disabled. External players will receive magnet links.', 'warning');
    } else if (apiKey) {
      showStatus(statusDiv, `${service} configuration saved! External players will get HTTP streams.`, 'success');
    } else {
      showStatus(statusDiv, 'Please enter your debrid API key.', 'error');
      return;
    }
    
  } catch (error) {
    console.error('Error saving debrid config:', error);
    const statusDiv = document.getElementById('debrid-status');
    if (statusDiv) {
      showStatus(statusDiv, 'Error saving configuration', 'error');
    }
  }
}

function showStatus(element, message, type) {
  if (!element) return;
  
  element.textContent = message;
  element.className = `status-message status-${type}`;
  element.style.display = 'block';
  
  if (type === 'success' || type === 'warning') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }
}

// --- Utility Functions ---
function getPlayerChoice() {
  return localStorage.getItem('preferred_player') || 'internal';
}

function getDebridConfig() {
  try {
    const config = localStorage.getItem('debrid_config');
    return config ? JSON.parse(config) : { service: 'none', apiKey: '' };
  } catch (error) {
    console.error('Error parsing debrid config:', error);
    return { service: 'none', apiKey: '' };
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Display Functions ---
function displayMovies(movies, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }

  container.innerHTML = '';

  if (!movies || movies.length === 0) {
    container.innerHTML = '<p class="empty-state">No movies to display.</p>';
    return;
  }

  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.innerHTML = renderMovieCard(movie);
    container.appendChild(movieCard);
  });
}

function renderMovieCard(movie) {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` 
    : 'https://via.placeholder.com/300x450/333/fff?text=No+Image';
  
  const title = escapeHtml(movie.title || 'Unknown Title');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  
  return `
    <div class="carousel-card" onclick="showMovieDetails(${movie.id})">
      <img src="${posterUrl}" alt="${title}" loading="lazy" />
      <div class="card-content">
        <h4>${title}</h4>
        <p>${year}</p>
        <div class="card-actions">
          <button class="btn-play" onclick="event.stopPropagation(); handlePlayButton(${movie.id}, '${title.replace(/'/g, "\\'")}')">▶️ Play</button>
          <button class="btn-trailer" onclick="event.stopPropagation(); handleTrailerButton(${movie.id}, '${title.replace(/'/g, "\\'")}')">🎬 Trailer</button>
        </div>
      </div>
    </div>
  `;
}

function displayTVShows(shows, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }
  
  container.innerHTML = '';
  
  if (!shows || shows.length === 0) {
    container.innerHTML = '<p class="empty-state">No TV shows to display.</p>';
    return;
  }
  
  shows.forEach(show => {
    const showCard = document.createElement('div');
    showCard.className = 'carousel-card';
    
    const posterUrl = show.poster_path 
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}` 
      : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';
    
    const name = escapeHtml(show.name || 'Unknown Show');
    const year = show.first_air_date ? show.first_air_date.split('-')[0] : 'N/A';
    const rating = show.vote_average ? show.vote_average.toFixed(1) : 'N/A';
    
    showCard.innerHTML = `
      <img src="${posterUrl}" alt="${name}" loading="lazy">
      <div class="card-content">
        <h4>${name}</h4>
        <p>${year} • ⭐ ${rating}</p>
        <div class="card-actions">
          <button class="btn-play" onclick="event.stopPropagation(); alert('TV show streaming coming soon!')">▶️ Play</button>
          <button class="btn-trailer" onclick="event.stopPropagation(); alert('TV show trailers coming soon!')">🎬 Trailer</button>
        </div>
      </div>
    `;
    
    showCard.addEventListener('click', function(e) {
      if (!e.target.closest('button')) {
        console.log('TV show card clicked:', show.name);
        alert(`TV Show Details for "${name}" - Coming soon!`);
      }
    });
    
    container.appendChild(showCard);
  });
}

// --- Catalog Loading Functions ---
async function loadHomeCatalogs() {
  console.log('Loading all home page catalogs...');
  
  const catalogFunctions = [
    { fn: loadTrendingMovies, name: 'trending movies' },
    { fn: loadPopularMovies, name: 'popular movies' },
    { fn: loadLatestMovies, name: 'latest movies' },
    { fn: loadTrendingTV, name: 'trending TV' },
    { fn: loadPopularTV, name: 'popular TV' }
  ];
  
  const results = await Promise.allSettled(
    catalogFunctions.map(async ({ fn, name }) => {
      try {
        await fn();
        console.log(`✅ Loaded ${name}`);
      } catch (error) {
        console.error(`❌ Failed to load ${name}:`, error);
        throw error;
      }
    })
  );
  
  const failures = results.filter(result => result.status === 'rejected').length;
  const successes = results.length - failures;
  
  console.log(`Home catalogs loading complete: ${successes}/${results.length} successful`);
}

async function loadTrendingMovies() {
  const container = document.querySelector("#trending-movies");
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-placeholder">Loading trending movies...</div>';
    const trending = await getTrendingMovies();
    displayMovies(trending, "#trending-movies");
  } catch (error) {
    console.error('Error loading trending movies:', error);
    container.innerHTML = `<p class="error-message">Error loading trending movies: ${error.message}</p>`;
  }
}

async function loadPopularMovies() {
  const container = document.querySelector("#popular-movies");
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-placeholder">Loading popular movies...</div>';
    const popular = await getPopularMovies();
    displayMovies(popular, "#popular-movies");
  } catch (error) {
    console.error('Error loading popular movies:', error);
    container.innerHTML = `<p class="error-message">Error loading popular movies. Please check your TMDB API key in Settings.</p>`;
  }
}

async function loadLatestMovies() {
  const container = document.querySelector("#latest-movies");
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-placeholder">Loading latest movies...</div>';
    const latest = await getLatestMovies();
    displayMovies(latest, "#latest-movies");
  } catch (error) {
    console.error('Error loading latest movies:', error);
    container.innerHTML = `<p class="error-message">Error loading latest movies: ${error.message}</p>`;
  }
}

async function loadTrendingTV() {
  const container = document.querySelector("#trending-tv");
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-placeholder">Loading trending TV...</div>';
    const trending = await getTrendingTV();
    displayTVShows(trending, "#trending-tv");
  } catch (error) {
    console.error('Error loading trending TV shows:', error);
    container.innerHTML = `<p class="error-message">Error loading trending TV shows: ${error.message}</p>`;
  }
}

async function loadPopularTV() {
  const container = document.querySelector("#popular-tv");
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-placeholder">Loading popular TV...</div>';
    const popular = await getPopularTV();
    displayTVShows(popular, "#popular-tv");
  } catch (error) {
    console.error('Error loading popular TV shows:', error);
    container.innerHTML = `<p class="error-message">Error loading popular TV shows: ${error.message}</p>`;
  }
}

// --- Search Management ---
class SearchManager {
  constructor() {
    this.searchTimeout = null;
    this.lastQuery = '';
  }

  setupSearch() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });
  }

  async performSearch(query) {
    const resultsContainer = document.getElementById("search-results");
    if (!resultsContainer) return;

    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      this.lastQuery = '';
      return;
    }

    if (query === this.lastQuery) {
      return;
    }

    this.lastQuery = query;
    console.log('Search query:', query);
    
    try {
      resultsContainer.innerHTML = '<div class="loading-placeholder">Searching...</div>';
      const results = await searchMovies(query);
      displayMovies(results, "#search-results");
      console.log('Search results:', results.length, 'movies found');
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="empty-state">No movies found for your search.</p>';
      }
    } catch (error) {
      console.error('Search error:', error);
      resultsContainer.innerHTML = `<p class="error-message">Search failed: ${error.message}</p>`;
    }
  }
}

// --- Addon Management ---
function getAddons() {
  try {
    return JSON.parse(localStorage.getItem('addons') || '[]');
  } catch (error) {
    console.error('Error parsing addons from localStorage:', error);
    return [];
  }
}

function setAddons(addons) {
  try {
    localStorage.setItem('addons', JSON.stringify(addons));
  } catch (error) {
    console.error('Error saving addons to localStorage:', error);
  }
}

function renderAddonList() {
  const addons = getAddons();
  const list = document.getElementById('addon-list');
  if (!list) return;

  list.innerHTML = '';
  
  if (addons.length === 0) {
    list.innerHTML = '<p class="empty-state">No addons configured. Add streaming addons to enable content playback.</p>';
    return;
  }

  addons.forEach((addon, idx) => {
    const item = document.createElement('div');
    item.className = 'addon-item';
    item.innerHTML = `
      <div class="addon-info">
        <strong>${escapeHtml(addon.name)}</strong>
        <div class="addon-details">
          <span class="addon-url">${escapeHtml(addon.url)}</span>
          <span class="addon-type">${escapeHtml(addon.type || 'unknown')}</span>
          ${addon.resources ? `<span class="addon-resources">${escapeHtml(addon.resources.join(', '))}</span>` : ''}
        </div>
      </div>
      <div class="addon-actions">
        <button onclick="editAddon(${idx})" class="btn-secondary">Edit</button>
        <button onclick="removeAddon(${idx})" class="btn-danger">Remove</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function editAddon(idx) {
  const addons = getAddons();
  const addon = addons[idx];
  if (!addon) return;

  const urlInput = document.getElementById('addon-url');
  if (urlInput) {
    urlInput.value = addon.manifestUrl || addon.url;
  }

  showAddonModal();
  console.log('Editing addon:', addon.name);
}

function removeAddon(idx) {
  const addons = getAddons();
  const addon = addons[idx];
  if (!addon) return;

  if (confirm(`Remove addon "${addon.name}"?`)) {
    addons.splice(idx, 1);
    setAddons(addons);
    renderAddonList();
    console.log('Removed addon:', addon.name);
  }
}

async function saveAddon() {
  console.log('Save addon called');
  
  const urlInput = document.getElementById('addon-url');
  const submitBtn = document.querySelector('#addon-form button[type="submit"]');
  
  if (!urlInput || !urlInput.value.trim()) {
    showAddonStatus('Please enter a valid addon URL', 'error');
    return;
  }
  
  let addonUrl = urlInput.value.trim();
  
  if (!addonUrl.endsWith('/manifest.json')) {
    if (addonUrl.endsWith('/')) {
      addonUrl += 'manifest.json';
    } else {
      addonUrl += '/manifest.json';
    }
  }
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Fetching...';
  }
  showAddonStatus('Fetching addon manifest...', 'loading');
  
  try {
    const response = await fetch(addonUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }
    
    const manifest = await response.json();
    
    if (!manifest.id || !manifest.name) {
      throw new Error('Invalid manifest format - missing required fields (id, name)');
    }
    
    const addonInfo = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description || '',
      version: manifest.version || '1.0.0',
      url: addonUrl.replace('/manifest.json', ''),
      manifestUrl: addonUrl,
      resources: manifest.resources || [],
      types: manifest.types || [],
      catalogs: manifest.catalogs || [],
      type: determineAddonType(manifest.resources || []),
      dateAdded: new Date().toISOString()
    };
    
    const existingAddons = getAddons();
    const existingIndex = existingAddons.findIndex(addon => addon.id === addonInfo.id);
    
    if (existingIndex >= 0) {
      existingAddons[existingIndex] = addonInfo;
      showAddonStatus(`Updated addon: ${addonInfo.name}`, 'success');
    } else {
      existingAddons.push(addonInfo);
      showAddonStatus(`Added addon: ${addonInfo.name}`, 'success');
    }
    
    setAddons(existingAddons);
    renderAddonList();
    
    setTimeout(() => {
      urlInput.value = '';
      closeAddonModal();
    }, 1500);
    
  } catch (error) {
    console.error('Error fetching addon manifest:', error);
    showAddonStatus(`Error: ${error.message}`, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Addon';
    }
  }
}

function determineAddonType(resources) {
  if (!resources || !Array.isArray(resources)) return 'unknown';
  
  if (resources.includes('stream')) return 'torrent';
  if (resources.includes('catalog')) return 'catalog';
  if (resources.includes('meta')) return 'meta';
  if (resources.includes('subtitles')) return 'subtitles';
  
  return 'other';
}

function showAddonStatus(message, type) {
  const statusDiv = document.getElementById('addon-status');
  if (!statusDiv) return;
  
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success' || type === 'loading') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function showAddonModal() {
  const modal = document.getElementById('addon-modal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeAddonModal() {
  const modal = document.getElementById('addon-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// --- Placeholder Functions ---
function handlePlayButton(movieId, movieTitle) {
  console.log('Play button clicked for movie:', movieTitle, 'ID:', movieId);
  alert(`Play functionality for "${movieTitle}" coming soon! Add streaming addons in Settings to enable playback.`);
}

function handleTrailerButton(movieId, movieTitle) {
  console.log('Trailer button clicked for movie:', movieTitle, 'ID:', movieId);
  
  getTrailer(movieId).then(trailer => {
    if (trailer) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      window.open(youtubeUrl, '_blank');
    } else {
      alert(`No trailer available for ${movieTitle}`);
    }
  }).catch(error => {
    console.error('Error getting trailer:', error);
    alert(`Error loading trailer for ${movieTitle}`);
  });
}

function showMovieDetails(movieId) {
  console.log('Show movie details for ID:', movieId);
  alert('Movie details coming soon!');
}

function closeModal() {
  const modals = document.querySelectorAll('.modal[style*="block"]');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

function closeAddonMetaModal() {
  const modal = document.getElementById('addon-meta-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');

  try {
    // Initialize managers
    window.tabManager = new TabManager();
    window.searchManager = new SearchManager();
    
    // Setup search functionality
    window.searchManager.setupSearch();
    
    // Load initial content
    loadHomeCatalogs().catch(error => {
      console.error('Initial catalog loading failed:', error);
    });

    // Setup addon management
    const addonAddBtn = document.getElementById('add-addon-btn');
    if (addonAddBtn) {
      addonAddBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showAddonModal();
      });
    }

    console.log('App initialization complete');

  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

// --- Global Function Exports ---
window.saveApiKey = saveApiKey;
window.savePlayerChoice = savePlayerChoice;
window.saveDebridConfig = saveDebridConfig;
window.saveAddon = saveAddon;
window.editAddon = editAddon;
window.removeAddon = removeAddon;
window.showAddonModal = showAddonModal;
window.closeAddonModal = closeAddonModal;
window.closeAddonMetaModal = closeAddonMetaModal;
window.closeModal = closeModal;
window.handlePlayButton = handlePlayButton;
window.handleTrailerButton = handleTrailerButton;
window.showMovieDetails = showMovieDetails;

console.log('Crumble app loaded successfully');