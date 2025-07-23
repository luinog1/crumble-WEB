// Standalone version without ES6 modules - should work in any environment

// --- TMDB API Functions ---
const BASE_URL = "https://api.themoviedb.org/3";

// Get the user's TMDB API key from localStorage
function getApiKey() {
  return localStorage.getItem('tmdb_api_key') || '';
}

// Fetch popular movies
async function getPopularMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Fetch trending movies
async function getTrendingMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/trending/movie/day?api_key=${apiKey}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Fetch latest movies
async function getLatestMovies() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Fetch trending TV shows
async function getTrendingTV() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/trending/tv/day?api_key=${apiKey}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Fetch popular TV shows
async function getPopularTV() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/tv/popular?api_key=${apiKey}&language=en-US&page=1`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Search for movies
async function searchMovies(query) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

// Fetch trailer for a movie
async function getTrailer(movieId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  return trailer || null;
}

// --- Tab Switching Logic ---
window.showTab = function(tabId) {
  console.log('[DEBUG] showTab called with tabId:', tabId);
  
  if (!tabId) {
    console.error('[ERROR] showTab called without tabId');
    return;
  }
  
  // Log all tabs and their current active state
  console.log('[DEBUG] Current tabs:');
  document.querySelectorAll('.tab').forEach(tab => {
    console.log(`- ${tab.id}: active=${tab.classList.contains('active')}`);
  });
  
  // Remove active class from all tabs and nav buttons
  const tabs = document.querySelectorAll('.tab');
  console.log(`[DEBUG] Found ${tabs.length} tabs`);
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  const navButtons = document.querySelectorAll('.nav-btn');
  console.log(`[DEBUG] Found ${navButtons.length} nav buttons`);
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.add('active');
    console.log(`[DEBUG] Added active class to tab: ${tabId}`);
    
    // Add active class to corresponding nav button
    let buttonIndex = -1;
    if (tabId === 'home-tab') buttonIndex = 0;
    else if (tabId === 'search-tab') buttonIndex = 1;
    else if (tabId === 'library-tab') buttonIndex = 2;
    else if (tabId === 'settings-tab') buttonIndex = 3;
    
    if (buttonIndex >= 0 && buttonIndex < navButtons.length) {
      navButtons[buttonIndex].classList.add('active');
      console.log(`[DEBUG] Added active class to nav button at index ${buttonIndex}`);
    } else {
      console.warn(`[WARN] Could not find nav button for tab: ${tabId}`);
    }
    
    console.log(`[DEBUG] Tab switched to: ${tabId}`);

    if (tabId === 'settings-tab') {
      document.getElementById('api-key-input').value = localStorage.getItem('tmdb_api_key') || '';
      document.getElementById('player-select').value = getPlayerChoice();
      document.getElementById('api-key-status').textContent = '';
      document.getElementById('player-status').textContent = '';
      
      // Load debrid configuration
      const debridConfig = getDebridConfig();
      document.getElementById('debrid-service').value = debridConfig.service;
      document.getElementById('debrid-api-key').value = debridConfig.apiKey;
      document.getElementById('debrid-status').textContent = '';
      
      renderAddonList();
    }

    if(tabId === 'search-tab') {
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  } else {
    console.error('Tab not found:', tabId);
  }
};

// --- API Key Logic ---
window.saveApiKey = function() {
  const input = document.getElementById('api-key-input');
  const statusDiv = document.getElementById('api-key-status');

  if (!input || !statusDiv) {
    console.error('API key elements not found');
    return;
  }

  const apiKey = input.value.trim();
  if (!apiKey) {
    statusDiv.textContent = 'Please enter a valid API key';
    statusDiv.style.color = '#ff8888';
    return;
  }

  localStorage.setItem('tmdb_api_key', apiKey);
  statusDiv.textContent = 'API key saved successfully!';
  statusDiv.style.color = '#88ff88';

  // Try to load home catalogs if available
  if (typeof loadHomeCatalogs === 'function') {
    loadHomeCatalogs();
  }
};

// Save debrid service configuration
function saveDebridConfig() {
  const service = document.getElementById('debrid-service').value;
  const apiKey = document.getElementById('debrid-api-key').value.trim();
  
  const config = {
    service: service,
    apiKey: apiKey
  };
  
  localStorage.setItem('debrid_config', JSON.stringify(config));
  
  const statusDiv = document.getElementById('debrid-status');
  if (service === 'none') {
    statusDiv.textContent = 'Debrid service disabled. External players will receive magnet links.';
    statusDiv.style.color = '#ffaa00';
  } else if (apiKey) {
    statusDiv.textContent = `${service} configuration saved! External players will get HTTP streams.`;
    statusDiv.style.color = '#88ff88';
  } else {
    statusDiv.textContent = 'Please enter your debrid API key.';
    statusDiv.style.color = '#ff8888';
  }
}

// Get debrid configuration
function getDebridConfig() {
  const config = localStorage.getItem('debrid_config');
  return config ? JSON.parse(config) : { service: 'none', apiKey: '' };
}

// --- Player Preference Logic ---
function getPlayerChoice() {
  return localStorage.getItem('preferred_player') || 'internal';
}

window.savePlayerChoice = function() {
  const playerSelect = document.getElementById('player-select');
  const statusDiv = document.getElementById('player-status');

  if (!playerSelect || !statusDiv) {
    console.error('Player elements not found');
    return;
  }

  const choice = playerSelect.value;
  localStorage.setItem('preferred_player', choice);
  statusDiv.textContent = 'Player preference saved!';
  statusDiv.style.color = '#88ff88';
};

// --- Player Launch Logic ---
function launchPlayer(streamUrl) {
  const choice = getPlayerChoice();
  console.log('Launching player:', choice, 'with URL:', streamUrl);

  if (choice === 'infuse') {
    window.location.href = `infuse://x-callback-url/play?url=${encodeURIComponent(streamUrl)}`;
  } else if (choice === 'vlc') {
    window.location.href = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`;
  } else if (choice === 'outplayer') {
    window.location.href = `outplayer://play?url=${encodeURIComponent(streamUrl)}`;
  } else {
    playHLS(streamUrl);
  }
}

// --- Simple Internal HLS Player Placeholder ---
function playHLS(url) {
  alert(`Playing: ${url}\n\nInternal player would load here.`);
}

// --- Streaming Links & Play Button Functionality ---

// Fetch streaming links from Torrentio-style addons
async function fetchStreamingLinks(imdbId, type = 'movie', season = null, episode = null) {
  console.log('Fetching streaming links for IMDB ID:', imdbId);
  
  const allAddons = getAddons();
  console.log('All addons found:', allAddons);
  
  // Filter for streaming addons (more flexible filtering)
  const addons = allAddons.filter(addon => {
    const hasStreamResource = addon.resources && addon.resources.includes('stream');
    const isStreamingType = addon.type === 'torrent' || addon.type === 'scraper' || addon.type === 'other';
    return hasStreamResource || isStreamingType;
  });
  
  console.log('Filtered streaming addons:', addons);
  
  if (addons.length === 0) {
    const addonCount = allAddons.length;
    throw new Error(`No streaming addons found. Found ${addonCount} total addons. Please add Torrentio or similar streaming addons in Settings.`);
  }

  const allStreams = [];

  for (const addon of addons) {
    try {
      console.log(`Fetching from addon: ${addon.name}`);

      // Construct stream URL based on addon type
      let streamUrl;
      if (type === 'movie') {
        streamUrl = `${addon.url}/stream/movie/${imdbId}.json`;
      } else {
        streamUrl = `${addon.url}/stream/series/${imdbId}:${season}:${episode}.json`;
      }

      // Add API key if provided
      if (addon.apiKey) {
        streamUrl += `?api_key=${addon.apiKey}`;
      }

      const response = await fetch(streamUrl);
      if (!response.ok) {
        console.warn(`Addon ${addon.name} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`Raw stream data from ${addon.name}:`, data);
      
      // Parse streams from response
      if (data.streams && Array.isArray(data.streams)) {
        data.streams.forEach(stream => {
          console.log('Processing stream:', stream);
          allStreams.push({
            ...stream,
            addonName: addon.name,
            quality: extractQuality(stream.title || stream.name || ''),
            size: extractSize(stream.title || stream.name || ''),
            seeds: extractSeeds(stream.title || stream.name || '')
          });
        });
      } else {
        console.warn(`No streams found in response from ${addon.name}:`, data);
      }
    } catch (error) {
      console.error(`Error fetching from addon ${addon.name}:`, error);
    }
  }

  // Sort streams by quality and seeds
  return allStreams.sort((a, b) => {
    const qualityOrder = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };
    const aQuality = qualityOrder[a.quality] || 0;
    const bQuality = qualityOrder[b.quality] || 0;

    if (aQuality !== bQuality) return bQuality - aQuality;
    return (b.seeds || 0) - (a.seeds || 0);
  });
}

// Extract quality from stream title
function extractQuality(title) {
  const qualityMatch = title.match(/(2160p|1080p|720p|480p|4K|UHD)/i);
  if (qualityMatch) {
    const quality = qualityMatch[1].toLowerCase();
    if (quality === '4k' || quality === 'uhd') return '2160p';
    return quality;
  }
  return 'Unknown';
}

// Extract file size from stream title
function extractSize(title) {
  const sizeMatch = title.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
  return sizeMatch ? sizeMatch[1] : '';
}

// Extract seeds count from stream title
function extractSeeds(title) {
  const seedsMatch = title.match(/👥\s*(\d+)/i) || title.match(/seeds?:\s*(\d+)/i);
  return seedsMatch ? parseInt(seedsMatch[1]) : 0;
}

// Display streaming options modal
function displayStreamModal(streams, movieTitle, imdbId) {
  console.log('Displaying stream modal for:', movieTitle, 'with', streams.length, 'streams');

  // Create modal HTML
  const modalHtml = `
    <div id="stream-modal" class="modal" style="display: block;">
      <div class="modal-content stream-modal-content">
        <span class="close" onclick="closeStreamModal()">&times;</span>
        <h3>🎬 Select Stream for "${movieTitle}"</h3>
        <div class="stream-filters">
          <select id="quality-filter" onchange="filterStreams()">
            <option value="all">All Qualities</option>
            <option value="2160p">4K (2160p)</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
          <select id="addon-filter" onchange="filterStreams()">
            <option value="all">All Sources</option>
            ${[...new Set(streams.map(s => s.addonName))].map(addon => 
              `<option value="${addon}">${addon}</option>`
            ).join('')}
          </select>
        </div>
        <div id="stream-list" class="stream-list">
          ${renderStreamList(streams)}
        </div>
        <div class="stream-modal-footer">
          <button onclick="closeStreamModal()" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('stream-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Store streams data for filtering
  window.currentStreams = streams;
  window.currentMovieTitle = movieTitle;
  window.currentImdbId = imdbId;
}

// Render stream list HTML
function renderStreamList(streams) {
  if (streams.length === 0) {
    return '<div class="no-streams">No streams found. Try adding more addons in Settings.</div>';
  }
  
  const debridConfig = getDebridConfig();
  const hasDebrid = debridConfig.service !== 'none' && debridConfig.apiKey;
  
  return streams.map((stream, index) => {
    const streamType = getStreamType(stream);
    const isCompatible = streamType === 'http' || hasDebrid;
    const compatibilityIcon = isCompatible ? '✅' : '⚠️';
    const compatibilityText = streamType === 'http' ? 'HTTP Stream' : hasDebrid ? 'Torrent (Debrid)' : 'Torrent (Magnet)';
    
    return `
    <div class="stream-item ${!isCompatible ? 'stream-warning' : ''}" onclick="selectStream(${index})">
      <div class="stream-info">
        <div class="stream-title">${stream.title || stream.name || 'Unknown Stream'}</div>
        <div class="stream-details">
          <span class="stream-type">${compatibilityIcon} ${compatibilityText}</span>
          <span class="stream-quality">${stream.quality}</span>
          ${stream.size ? `<span class="stream-size">${stream.size}</span>` : ''}
          ${stream.seeds > 0 ? `<span class="stream-seeds">👥 ${stream.seeds}</span>` : ''}
          <span class="stream-source">${stream.addonName}</span>
        </div>
      </div>
      <div class="stream-action">
        <button class="btn-play">▶️ Play</button>
      </div>
    </div>
  `;
  }).join('');
}

// Determine stream type
function getStreamType(stream) {
  if (stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://'))) {
    return 'http';
  }
  return 'torrent';
}

// Filter streams based on quality and addon
function filterStreams() {
  const qualityFilter = document.getElementById('quality-filter').value;
  const addonFilter = document.getElementById('addon-filter').value;

  let filteredStreams = window.currentStreams || [];

  if (qualityFilter !== 'all') {
    filteredStreams = filteredStreams.filter(stream => stream.quality === qualityFilter);
  }

  if (addonFilter !== 'all') {
    filteredStreams = filteredStreams.filter(stream => stream.addonName === addonFilter);
  }

  const streamList = document.getElementById('stream-list');
  if (streamList) {
    streamList.innerHTML = renderStreamList(filteredStreams);
  }
}

// Handle stream selection
async function selectStream(streamIndex) {
  const streams = window.currentStreams || [];
  const selectedStream = streams[streamIndex];
  
  if (!selectedStream) {
    console.error('Stream not found at index:', streamIndex);
    return;
  }
  
  console.log('Selected stream:', selectedStream);
  
  // Close modal
  closeStreamModal();
  
  // Try to extract stream URL from different possible formats
  let streamUrl = null;
  const streamType = getStreamType(selectedStream);
  const debridConfig = getDebridConfig();
  const hasDebrid = debridConfig.service !== 'none' && debridConfig.apiKey;
  
  if (streamType === 'http') {
    // Direct HTTP/HTTPS stream - works with all players
    streamUrl = selectedStream.url;
    console.log('Using direct HTTP stream:', streamUrl);
  } else if (hasDebrid) {
    // Torrent stream with debrid service - convert to HTTP
    console.log('Converting torrent to HTTP stream via debrid...');
    try {
      streamUrl = await convertTorrentToHttp(selectedStream, debridConfig);
    } catch (error) {
      console.error('Debrid conversion failed:', error);
      alert(`Debrid conversion failed: ${error.message}. Falling back to magnet link.`);
      streamUrl = extractMagnetUrl(selectedStream);
    }
  } else {
    // Torrent stream without debrid - use magnet link
    streamUrl = extractMagnetUrl(selectedStream);
    const playerChoice = getPlayerChoice();
    if (playerChoice !== 'internal') {
      const useAnyway = confirm(
        'This is a torrent stream (magnet link) which may not work with external players like Infuse.\n\n' +
        'For best compatibility with external players, consider:\n' +
        '• Setting up a debrid service (Real-Debrid, AllDebrid) in Settings\n' +
        '• Using the Internal Player instead\n\n' +
        'Continue with external player anyway?'
      );
      if (!useAnyway) {
        return;
      }
    }
  }
  
  if (streamUrl) {
    console.log('Launching stream URL:', streamUrl);
    console.log('Stream type:', streamType, 'Has debrid:', hasDebrid);
    
    // Validate URL format before launching
    if (streamUrl.startsWith('http') || streamUrl.startsWith('magnet:')) {
      launchPlayer(streamUrl);
    } else {
      console.error('Invalid stream URL format:', streamUrl);
      alert('Invalid stream URL format. Please check the addon configuration.');
    }
  } else {
    console.error('No valid stream URL found in:', selectedStream);
    console.log('Available stream properties:', Object.keys(selectedStream));
    alert('Stream URL not available. Debug info logged to console.');
  }
}

// Extract magnet URL from stream data
function extractMagnetUrl(stream) {
  if (stream.infoHash) {
    // Torrent info hash - create magnet link
    let magnetUrl = `magnet:?xt=urn:btih:${stream.infoHash}`;
    if (stream.title) {
      magnetUrl += `&dn=${encodeURIComponent(stream.title)}`;
    }
    return magnetUrl;
  } else if (stream.magnetUrl) {
    // Direct magnet URL
    return stream.magnetUrl;
  } else if (stream.torrentUrl) {
    // Torrent file URL
    return stream.torrentUrl;
  } else {
    // Try to extract from title if it contains a magnet link
    const magnetMatch = stream.title && stream.title.match(/magnet:\?[^\s]+/);
    if (magnetMatch) {
      return magnetMatch[0];
    }
  }
  return null;
}

// Convert torrent to HTTP stream using debrid service
async function convertTorrentToHttp(stream, debridConfig) {
  const magnetUrl = extractMagnetUrl(stream);
  if (!magnetUrl) {
    throw new Error('No magnet link found in stream data');
  }
  
  console.log('Converting magnet to HTTP via', debridConfig.service, ':', magnetUrl);
  
  switch (debridConfig.service) {
    case 'realdebrid':
      return await convertViaRealDebrid(magnetUrl, debridConfig.apiKey);
    case 'alldebrid':
      return await convertViaAllDebrid(magnetUrl, debridConfig.apiKey);
    case 'premiumize':
      return await convertViaPremiumize(magnetUrl, debridConfig.apiKey);
    default:
      throw new Error(`Unsupported debrid service: ${debridConfig.service}`);
  }
}

// Real-Debrid API integration
async function convertViaRealDebrid(magnetUrl, apiKey) {
  try {
    // Step 1: Add magnet to Real-Debrid
    const addResponse = await fetch('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `magnet=${encodeURIComponent(magnetUrl)}`
    });
    
    if (!addResponse.ok) {
      throw new Error(`Real-Debrid add failed: ${addResponse.status}`);
    }
    
    const addData = await addResponse.json();
    const torrentId = addData.id;
    
    // Step 2: Select all files for download
    await fetch(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'files=all'
    });
    
    // Step 3: Get torrent info and download links
    const infoResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const infoData = await infoResponse.json();
    
    // Find the largest video file
    const videoFiles = infoData.files.filter(file => 
      file.path.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
    );
    
    if (videoFiles.length === 0) {
      throw new Error('No video files found in torrent');
    }
    
    // Get the largest video file
    const largestFile = videoFiles.reduce((prev, current) => 
      (current.bytes > prev.bytes) ? current : prev
    );
    
    // Step 4: Unrestrict the download link
    const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `link=${encodeURIComponent(largestFile.link)}`
    });
    
    const unrestrictData = await unrestrictResponse.json();
    return unrestrictData.download;
    
  } catch (error) {
    console.error('Real-Debrid conversion error:', error);
    throw new Error(`Real-Debrid conversion failed: ${error.message}`);
  }
}

// AllDebrid API integration
async function convertViaAllDebrid(magnetUrl, apiKey) {
  try {
    console.log('Starting AllDebrid conversion for magnet link');
    
    // 1. Upload the magnet to AllDebrid
    const uploadUrl = `https://api.alldebrid.com/v4/magnet/upload`;
    const params = new URLSearchParams({
      agent: 'crumble',
      apikey: apiKey,
      magnet: magnetUrl
    });
    
    const fullUrl = `${uploadUrl}?${params}`;
    console.log('Uploading magnet to AllDebrid:', fullUrl);
    
    // Log the request details (without the API key)
    console.log('Request details:', {
      method: 'GET',
      url: uploadUrl,
      params: {
        agent: 'crumble',
        apikey: '***REDACTED***',
        magnet: magnetUrl.length > 50 ? `${magnetUrl.substring(0, 50)}...` : magnetUrl
      }
    });
    
    const uploadResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const responseText = await uploadResponse.text();
    console.log('AllDebrid upload response status:', uploadResponse.status);
    console.log('AllDebrid upload response headers:', JSON.stringify([...uploadResponse.headers.entries()]));
    console.log('AllDebrid upload response body:', responseText);
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload magnet: ${uploadResponse.status} - ${responseText}`);
    }
    
    let uploadData;
    try {
      uploadData = JSON.parse(responseText);
      console.log('Parsed upload data:', JSON.stringify(uploadData, null, 2));
    } catch (e) {
      console.error('Failed to parse AllDebrid response as JSON:', e);
      throw new Error(`Invalid JSON response from AllDebrid: ${responseText}`);
    }
    
    // Log the complete response structure for debugging
    console.log('Complete AllDebrid response structure:', JSON.stringify({
      keys: Object.keys(uploadData),
      hasData: 'data' in uploadData,
      dataKeys: uploadData.data ? Object.keys(uploadData.data) : 'no data object',
      status: uploadData.status,
      error: uploadData.error
    }, null, 2));
    
    // Check for error responses
    if (uploadData.status === 'error' || uploadData.error) {
      const errorInfo = uploadData.error || {};
      const errorMsg = `AllDebrid API error (${errorInfo.code || 'unknown'}): ${errorInfo.message || 'Unknown error'}`;
      console.error('AllDebrid API error:', { 
        status: uploadData.status,
        error: errorInfo,
        fullResponse: uploadData 
      });
      throw new Error(errorMsg);
    }
    
    // Handle successful response
    if (!uploadData.data) {
      console.error('Unexpected AllDebrid response format (missing data):', uploadData);
      throw new Error('Invalid response format from AllDebrid: Missing data object');
    }
    
    // For AllDebrid v4 API, the magnet ID might be in different locations
    // Try to find the magnet ID in various possible locations
    let magnetId = null;
    
    // Check common locations for the magnet ID
    if (uploadData.data.id) {
      // Direct ID in data object
      magnetId = uploadData.data.id;
    } else if (uploadData.data.magnets && Array.isArray(uploadData.data.magnets) && uploadData.data.magnets[0]?.id) {
      // ID in first magnet object
      magnetId = uploadData.data.magnets[0].id;
    } else if (uploadData.data.magnet) {
      // Some endpoints return a magnet object with an ID
      magnetId = uploadData.data.magnet.id || uploadData.data.magnet.magnetId;
    } else if (uploadData.data.links && Array.isArray(uploadData.data.links) && uploadData.data.links[0]?.id) {
      // ID in first link object
      magnetId = uploadData.data.links[0].id;
    } else if (uploadData.id) {
      // Fallback to root ID
      magnetId = uploadData.id;
    }
    
    // If we still don't have an ID, log the full response for debugging
    if (!magnetId) {
      console.error('Could not find magnet ID in response. Full response:', JSON.stringify(uploadData, null, 2));
      throw new Error('Could not determine magnet ID from AllDebrid response. Check console for details.');
    }
    
    console.log('Found magnet ID:', magnetId);
    console.log('Magnet uploaded successfully, ID:', magnetId);
    
    // 2. Check magnet status until it's ready
    const maxAttempts = 30;
    const checkInterval = 2000; // 2 seconds
    let attempts = 0;
    
    const checkStatus = async () => {
      attempts++;
      console.log(`Checking magnet status (attempt ${attempts}/${maxAttempts})...`);
      
      const statusUrl = `https://api.alldebrid.com/v4/magnet/status`;
      const params = new URLSearchParams({
        agent: 'crumble',
        apikey: apiKey,
        id: magnetId
      });
      
      const fullUrl = `${statusUrl}?${params}`;
      console.log('Status check URL:', fullUrl);
      
      let statusResponse;
      let statusText;
      let statusData;
      
      try {
        // Make the API request
        statusResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Get the raw response text
        statusText = await statusResponse.text();
        
        // Check for HTTP errors
        if (!statusResponse.ok) {
          throw new Error(`HTTP ${statusResponse.status}: ${statusText}`);
        }
        
        // Parse the JSON response
        try {
          statusData = JSON.parse(statusText);
          console.log('Status check response:', JSON.stringify(statusData, null, 2));
        } catch (e) {
          console.error('Failed to parse status response as JSON:', e);
          throw new Error(`Invalid JSON response from AllDebrid: ${statusText}`);
        }
        
        // Check for API-level errors
        if (statusData.status === 'error' || statusData.error) {
          const errorInfo = statusData.error || {};
          throw new Error(`AllDebrid error (${errorInfo.code || 'unknown'}): ${errorInfo.message || 'Unknown error'}`);
        }
        
        // Handle different response formats
        if (!statusData.data) {
          console.error('Unexpected status response format (missing data):', statusData);
          throw new Error('Invalid response format from AllDebrid: Missing data object');
        }
        
        const magnetInfo = statusData.data.magnets[0];
        if (!magnetInfo) {
          console.error('No magnet info in response:', statusData);
          throw new Error('No magnet information available in response');
        }
        
        const status = magnetInfo.status;
        console.log(`Magnet status (${attempts}/${maxAttempts}):`, status);
        
        if (status === 'Ready') {
          console.log('Magnet is ready, getting download links');
          break;
        } else if (status === 'Error') {
          throw new Error('Magnet processing failed on AllDebrid');
        } else if (status === 'File unsupported') {
          throw new Error('This file type is not supported by AllDebrid');
        } else if (status === 'Downloading') {
          console.log('Magnet is still downloading, progress:', magnetInfo.progress ? `${magnetInfo.progress}%` : 'unknown');
        } else if (status === 'Queued') {
          console.log('Magnet is in queue, position:', magnetInfo.position || 'unknown');
        }
        
      } catch (error) {
        console.error('Error checking magnet status:', error);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to check magnet status after ${maxAttempts} attempts: ${error.message}`);
        }
        console.log('Retrying...');
        continue;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Magnet processing timed out on AllDebrid');
      }
    }
    
    // 3. Get the first available link
    const magnetInfo = statusData.data.magnets[0];
    if (!magnetInfo.links || !Array.isArray(magnetInfo.links) || magnetInfo.links.length === 0) {
      console.error('No download links in magnet info:', magnetInfo);
      throw new Error('No download links found in AllDebrid response');
    }
    
    const links = magnetInfo.links;
    console.log(`Found ${links.length} available links`);
    
    // 4. Get the direct download link for the first file
    const link = links[0];
    if (!link || !link.link) {
      console.error('Invalid link object in response:', link);
      throw new Error('Invalid link data in AllDebrid response');
    }
    
    console.log('Selected link for unlocking:', link);
    const downloadUrl = `https://api.alldebrid.com/v4/link/unlock?agent=crumble&apikey=${encodeURIComponent(apiKey)}&link=${encodeURIComponent(link.link)}`;
    console.log('Requesting direct download link from:', downloadUrl);
    
    let downloadResponse;
    let downloadResponseText;
    let downloadData;
    
    try {
      downloadResponse = await fetch(downloadUrl);
      downloadResponseText = await downloadResponse.text();
      console.log('Download link response status:', downloadResponse.status);
      console.log('Download link response:', downloadResponseText);
      
      if (!downloadResponse.ok) {
        throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponseText}`);
      }
      
      try {
        downloadData = JSON.parse(downloadResponseText);
      } catch (e) {
        console.error('Failed to parse download link response as JSON:', e);
        throw new Error(`Invalid JSON response from AllDebrid: ${downloadResponseText}`);
      }
      
      // Check for API errors
      if (downloadData.error) {
        const errorCode = downloadData.error.code || 'NO_CODE';
        const errorMessage = downloadData.error.message || 'Unknown error';
        console.error('AllDebrid download API error:', { 
          errorCode, 
          errorMessage, 
          fullError: downloadData.error 
        });
        throw new Error(`AllDebrid API error (${errorCode}): ${errorMessage}`);
      }
      
      if (!downloadData.data) {
        console.error('Unexpected download response format:', downloadData);
        throw new Error('Invalid response format from AllDebrid (missing data)');
      }
      
      const directLink = downloadData.data.link;
      if (!directLink) {
        console.error('No direct link in download data:', downloadData);
        throw new Error('No direct download link found in AllDebrid response');
      }
    
      console.log('Successfully got direct download link:', directLink);
      return directLink;
      
    } catch (error) {
      console.error('Error getting download link:', error);
      throw new Error(`Failed to get download link: ${error.message}`);
    }
    
  } catch (error) {
    console.error('AllDebrid conversion error:', error);
    throw new Error(`AllDebrid conversion failed: ${error.message}`);
  }
}

// Premiumize API integration (simplified)
async function convertViaPremiumize(magnetUrl, apiKey) {
  throw new Error('Premiumize integration not yet implemented. Please use Real-Debrid for now.');
}

// Close stream modal
function closeStreamModal() {
  const modal = document.getElementById('stream-modal');
  if (modal) {
    modal.remove();
  }

  // Clean up global variables
  delete window.currentStreams;
  delete window.currentMovieTitle;
  delete window.currentImdbId;
}

// Main Play button function - fetches IMDB ID and shows streams
async function handlePlayButton(movieId, movieTitle) {
  console.log('Play button clicked for movie:', movieTitle, 'ID:', movieId);

  try {
    // Show loading state
    const loadingModal = `
      <div id="stream-modal" class="modal" style="display: block;">
        <div class="modal-content">
          <h3>🔍 Finding Streams...</h3>
          <div class="loading-spinner">Loading streams for "${movieTitle}"...</div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingModal);

    // Get movie details to find IMDB ID
    const movieDetails = await getMovieDetails(movieId);
    const imdbId = movieDetails.imdb_id;

    if (!imdbId) {
      throw new Error('IMDB ID not found for this movie');
    }

    // Fetch streaming links
    const streams = await fetchStreamingLinks(imdbId, 'movie');

    // Remove loading modal
    const loadingModalEl = document.getElementById('stream-modal');
    if (loadingModalEl) {
      loadingModalEl.remove();
    }

    // Show streams
    if (streams.length > 0) {
      displayStreamModal(streams, movieTitle, imdbId);
    } else {
      alert('No streams found for this movie. Try adding more addons in Settings.');
    }

  } catch (error) {
    console.error('Error handling play button:', error);

    // Remove loading modal
    const loadingModalEl = document.getElementById('stream-modal');
    if (loadingModalEl) {
      loadingModalEl.remove();
    }

    alert(`Error finding streams: ${error.message}`);
  }
}

// Get movie details from TMDB
async function getMovieDetails(movieId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No TMDB API key set.");
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`);
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return data;
}

// Handle trailer button click
async function handleTrailerButton(movieId, movieTitle) {
  console.log('Trailer button clicked for movie:', movieTitle, 'ID:', movieId);

  try {
    const trailer = await getTrailer(movieId);
    if (trailer) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      window.open(youtubeUrl, '_blank');
    } else {
      alert(`No trailer available for ${movieTitle}`);
    }
  } catch (error) {
    console.error('Error getting trailer:', error);
    alert(`Error loading trailer for ${movieTitle}`);
  }
}

// --- Display Movies ---
function displayMovies(movies, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }

  container.innerHTML = '';

  if (!movies || movies.length === 0) {
    container.innerHTML = '<p>No movies to display.</p>';
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
  
  return `
    <div class="carousel-card" onclick="showMovieDetails(${movie.id})">
      <img src="${posterUrl}" alt="${movie.title}" loading="lazy" />
      <div class="card-content">
        <h4>${movie.title}</h4>
        <p>${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
        <div class="card-actions">
          <button class="btn-play" onclick="event.stopPropagation(); handlePlayButton(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">▶️ Play</button>
          <button class="btn-trailer" onclick="event.stopPropagation(); handleTrailerButton(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">🎬 Trailer</button>
        </div>
      </div>
    </div>
  `;
}

// --- Display TV Shows ---
function displayTVShows(shows, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }
  
  container.innerHTML = ''; // Clear existing content
  
  shows.forEach(show => {
    const showCard = document.createElement('div');
    showCard.className = 'carousel-card';
    
    const posterUrl = show.poster_path 
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}` 
      : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';
    
    showCard.innerHTML = `
      <img src="${posterUrl}" alt="${show.name}" loading="lazy">
      <div class="movie-info">
        <h3>${show.name}</h3>
        <p class="movie-year">${show.first_air_date ? show.first_air_date.split('-')[0] : 'N/A'}</p>
        <p class="movie-rating">⭐ ${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</p>
        <div class="movie-actions">
          <button class="btn-play" onclick="event.stopPropagation(); alert('TV show streaming coming soon!')">▶️ Play</button>
          <button class="btn-trailer" onclick="event.stopPropagation(); alert('TV show trailers coming soon!')">🎬 Trailer</button>
        </div>
      </div>
    `;
    
    // TV show card click handler (for general info/details)
    showCard.addEventListener('click', function(e) {
      // Only handle click if it's not on a button
      if (!e.target.closest('button')) {
        console.log('TV show card clicked:', show.name);
        alert(`TV Show Details for "${show.name}" - Coming soon!`);
      }
    });
    
    container.appendChild(showCard);
  });
}

// --- Load All Home Page Catalogs ---
async function loadHomeCatalogs() {
  console.log('Loading all home page catalogs...');
  
  // Load all catalogs in parallel for better performance
  await Promise.all([
    loadTrendingMovies(),
    loadPopularMovies(),
    loadLatestMovies(),
    loadTrendingTV(),
    loadPopularTV()
  ]);
  
  console.log('All home catalogs loaded successfully');
}

// --- Load Trending Movies ---
async function loadTrendingMovies() {
  const container = document.querySelector("#trending-movies");
  if (!container) {
    console.error('Trending movies container not found');
    return;
  }

  try {
    console.log('Loading trending movies from TMDB...');
    const trending = await getTrendingMovies();
    displayMovies(trending, "#trending-movies");
    console.log('Trending movies loaded successfully:', trending.length, 'movies');
  } catch (e) {
    console.error('Error loading trending movies:', e);
    container.innerHTML = `<p style="color:#ff8888;">Error loading trending movies</p>`;
  }
}

// --- Load Popular Movies ---
async function loadPopularMovies() {
  const container = document.querySelector("#popular-movies");
  if (!container) {
    console.error('Popular movies container not found');
    return;
  }

  try {
    console.log('Loading popular movies from TMDB...');
    const popular = await getPopularMovies();
    displayMovies(popular, "#popular-movies");
    console.log('Popular movies loaded successfully:', popular.length, 'movies');
  } catch (e) {
    console.error('Error loading popular movies:', e);
    container.innerHTML = `<p style="color:#ff8888;">Please enter your TMDB API key in Settings to view movies.</p>`;
  }
}

// --- Load Latest Movies ---
async function loadLatestMovies() {
  const container = document.querySelector("#latest-movies");
  if (!container) {
    console.error('Latest movies container not found');
    return;
  }

  try {
    console.log('Loading latest movies from TMDB...');
    const latest = await getLatestMovies();
    displayMovies(latest, "#latest-movies");
    console.log('Latest movies loaded successfully:', latest.length, 'movies');
  } catch (e) {
    console.error('Error loading latest movies:', e);
    container.innerHTML = `<p style="color:#ff8888;">Error loading latest movies</p>`;
  }
}

// --- Load Trending TV Shows ---
async function loadTrendingTV() {
  const container = document.querySelector("#trending-tv");
  if (!container) {
    console.error('Trending TV container not found');
    return;
  }

  try {
    console.log('Loading trending TV shows from TMDB...');
    const trending = await getTrendingTV();
    displayTVShows(trending, "#trending-tv");
    console.log('Trending TV shows loaded successfully:', trending.length, 'shows');
  } catch (e) {
    console.error('Error loading trending TV shows:', e);
    container.innerHTML = `<p style="color:#ff8888;">Error loading trending TV shows</p>`;
  }
}

// --- Load Popular TV Shows ---
async function loadPopularTV() {
  const container = document.querySelector("#popular-tv");
  if (!container) {
    console.error('Popular TV container not found');
    return;
  }

  try {
    console.log('Loading popular TV shows from TMDB...');
    const popular = await getPopularTV();
    displayTVShows(popular, "#popular-tv");
    console.log('Popular TV shows loaded successfully:', popular.length, 'shows');
  } catch (e) {
    console.error('Error loading popular TV shows:', e);
    container.innerHTML = `<p style="color:#ff8888;">Error loading popular TV shows</p>`;
  }
}

// --- Initialize everything when DOM is loaded ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');

  // Initialize sidebar navigation
  const navItems = document.querySelectorAll('.nav-menu li');
  console.log(`[DEBUG] Found ${navItems.length} sidebar navigation items`);
  
  // Add click handlers to each navigation item
  navItems.forEach(item => {
    const button = item.querySelector('.nav-btn');
    if (!button) return;
    
    // Store the tab ID on the button for easier access
    const tabId = item.getAttribute('data-tab');
    button.setAttribute('data-tab', tabId);
    
    // Remove any existing click handlers
    const newButton = button.cloneNode(true);
    item.replaceChild(newButton, button);
    
    // Add new click handler
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-tab');
      console.log('[DEBUG] Sidebar button clicked, switching to tab:', tabId);
      if (tabId) {
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        // Add active class to clicked button
        this.classList.add('active');
        // Show the selected tab
        showTab(tabId);
      }
    });
  });
  
  // Set initial active tab
  const initialTab = window.location.hash ? window.location.hash.substring(1) : 'home-tab';
  showTab(initialTab);

  // Load popular movies
  loadHomeCatalogs();

  // Setup search functionality
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      const resultsContainer = document.getElementById("search-results");

      if (query.length > 2) {
        console.log('Search query:', query);
        if (resultsContainer) {
          resultsContainer.innerHTML = '<p>Searching...</p>';
        }
        try {
          const results = await searchMovies(query);
          displayMovies(results, "#search-results");
          console.log('Search results:', results.length, 'movies found');
        } catch (error) {
          console.error('Search error:', error);
          if (resultsContainer) {
            resultsContainer.innerHTML = `<p style="color:#ff8888;">Search failed. Please check your API key in Settings.</p>`;
          }
        }
      } else {
        if (resultsContainer) {
          resultsContainer.innerHTML = '';
        }
      }
    });
    console.log('Search functionality setup');
  }

  // Setup addon modal
  const addonAddBtn = document.getElementById('add-addon-btn');
  if (addonAddBtn) {
    addonAddBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Add addon button clicked');
      if (typeof window.showAddonModal === 'function') {
        console.log('Calling showAddonModal()');
        window.showAddonModal();
      } else {
        console.error('showAddonModal is not a function');
        alert('Error: Addon functionality not available');
      }
    });
    console.log('Addon button setup complete');
  } else {
    console.error('Could not find add-addon-btn element');
  }

  console.log('App initialization complete');
});

// --- Modal Logic ---
function closeModal() {
  const modal = document.querySelector('.modal[style*="block"]');
  if (modal) modal.style.display = 'none';
}

// --- Addon Management Placeholders ---
function getAddons() {
  return JSON.parse(localStorage.getItem('addons') || '[]');
}

function setAddons(addons) {
  localStorage.setItem('addons', JSON.stringify(addons));
}

function renderAddonList() {
  const addons = getAddons();
  const list = document.getElementById('addon-list');
  if (!list) return;

  list.innerHTML = '';
  addons.forEach((addon, idx) => {
    const item = document.createElement('div');
    item.className = 'addon-item';
    item.innerHTML = `
      <span>${addon.name} (${addon.url})</span>
      <button onclick="editAddon(${idx})">Edit</button>
      <button onclick="removeAddon(${idx})">Remove</button>
    `;
    list.appendChild(item);
  });
}

function editAddon(idx) {
  console.log('Edit addon:', idx);
  // Placeholder
}

function removeAddon(idx) {
  const addons = getAddons();
  addons.splice(idx, 1);
  setAddons(addons);
  renderAddonList();
}

async function saveAddon() {
  console.log('Save addon called');
  
  const urlInput = document.getElementById('addon-url');
  const statusDiv = document.getElementById('addon-status');
  const submitBtn = document.querySelector('#addon-form button[type="submit"]');
  
  if (!urlInput || !urlInput.value.trim()) {
    showAddonStatus('Please enter a valid addon URL', 'error');
    return;
  }
  
  let addonUrl = urlInput.value.trim();
  
  // Ensure URL ends with manifest.json
  if (!addonUrl.endsWith('/manifest.json')) {
    if (addonUrl.endsWith('/')) {
      addonUrl += 'manifest.json';
    } else {
      addonUrl += '/manifest.json';
    }
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Fetching...';
  showAddonStatus('Fetching addon manifest...', 'loading');
  
  try {
    // Fetch manifest.json from the addon URL
    const response = await fetch(addonUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }
    
    const manifest = await response.json();
    
    // Validate manifest structure
    if (!manifest.id || !manifest.name || !manifest.resources) {
      throw new Error('Invalid manifest format - missing required fields (id, name, resources)');
    }
    
    // Extract addon information from manifest
    const addonInfo = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description || '',
      version: manifest.version || '1.0.0',
      url: addonUrl.replace('/manifest.json', ''), // Base URL without manifest.json
      manifestUrl: addonUrl,
      resources: manifest.resources,
      types: manifest.types || [],
      catalogs: manifest.catalogs || [],
      // Determine addon type based on resources
      type: determineAddonType(manifest.resources),
      dateAdded: new Date().toISOString()
    };
    
    // Get existing addons
    const existingAddons = getAddons();
    
    // Check if addon already exists
    const existingIndex = existingAddons.findIndex(addon => addon.id === addonInfo.id);
    
    if (existingIndex >= 0) {
      // Update existing addon
      existingAddons[existingIndex] = addonInfo;
      showAddonStatus(`Updated addon: ${addonInfo.name}`, 'success');
    } else {
      // Add new addon
      existingAddons.push(addonInfo);
      showAddonStatus(`Added addon: ${addonInfo.name}`, 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('addons', JSON.stringify(existingAddons));
    
    // Refresh addon list display
    renderAddonList();
    
    // Clear form and close modal after short delay
    setTimeout(() => {
      urlInput.value = '';
      closeAddonModal();
    }, 1500);
    
  } catch (error) {
    console.error('Error fetching addon manifest:', error);
    showAddonStatus(`Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Addon';
  }
}

// Helper function to determine addon type from resources
function determineAddonType(resources) {
  if (!resources || !Array.isArray(resources)) return 'unknown';
  
  if (resources.includes('stream')) return 'torrent';
  if (resources.includes('catalog')) return 'catalog';
  if (resources.includes('meta')) return 'meta';
  if (resources.includes('subtitles')) return 'subtitles';
  
  return 'other';
}

// Helper function to show addon status messages
function showAddonStatus(message, type) {
  const statusDiv = document.getElementById('addon-status');
  if (!statusDiv) return;
  
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide success/loading messages after 3 seconds
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

// Alias for HTML compatibility
function openAddonModal() {
  showAddonModal();
}

function showAddonMetadata(query) {
  console.log('Show addon metadata for:', query);
  // Placeholder
}

function closeAddonMetaModal() {
  const modal = document.getElementById('addon-meta-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Test function for AllDebrid integration (call from browser console)
async function testAllDebrid(apiKey, magnetUrl) {
  try {
    console.log('Starting AllDebrid test with magnet:', magnetUrl);
    const directLink = await convertViaAllDebrid(magnetUrl, apiKey);
    console.log('✅ AllDebrid test successful! Direct link:', directLink);
    return directLink;
  } catch (error) {
    console.error('❌ AllDebrid test failed:', error);
    throw error;
  }
}

// Make functions globally available
window.saveApiKey = saveApiKey;
window.savePlayerChoice = savePlayerChoice;
window.showAddonModal = showAddonModal;
window.showTab = showTab;  // Make sure showTab is globally available
window.openAddonModal = openAddonModal;
window.closeAddonModal = closeAddonModal;
window.saveAddon = saveAddon;
window.editAddon = editAddon;
window.showAddonMetadata = showAddonMetadata;
window.closeAddonMetaModal = closeAddonMetaModal;
window.closeModal = closeModal;
window.testAllDebrid = testAllDebrid;

console.log('Standalone app.js loaded successfully');
