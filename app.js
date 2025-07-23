// Complete Crumble App - Fixed Button Responsiveness Issues

// === INITIALIZATION ===
console.log('Loading Crumble app...');

// === SETTINGS FUNCTIONS ===
function saveApiKey() {
  console.log('saveApiKey called');
  try {
    const input = document.getElementById('api-key-input');
    const statusDiv = document.getElementById('api-key-status');
    console.log('Found elements:', { input: !!input, statusDiv: !!statusDiv });
    if (!input) {
      console.error('API key input not found');
      alert('Error: API key input field not found');
      return;
    }
    if (!statusDiv) {
      console.error('API key status div not found');
      alert('Error: Status display not found');
      return;
    }
    const apiKey = input.value.trim();
    console.log('API key length:', apiKey.length);
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
    console.log('API key saved successfully');
    // Load catalogs after saving
    setTimeout(() => {
      loadHomeCatalogs().catch(error => {
        console.error('Error loading catalogs after API key save:', error);
      });
    }, 500);
  } catch (error) {
    console.error('Error in saveApiKey:', error);
    alert(`Error saving API key: ${error.message}`);
  }
}
window.saveApiKey = saveApiKey;

function savePlayerChoice() {
  console.log('savePlayerChoice called');
  try {
    const playerSelect = document.getElementById('player-select');
    const statusDiv = document.getElementById('player-status');
    console.log('Found elements:', { playerSelect: !!playerSelect, statusDiv: !!statusDiv });
    if (!playerSelect) {
      console.error('Player select not found');
      alert('Error: Player selection not found');
      return;
    }
    if (!statusDiv) {
      console.error('Player status div not found');
      alert('Error: Status display not found');
      return;
    }
    const choice = playerSelect.value;
    console.log('Selected player:', choice);
    localStorage.setItem('preferred_player', choice);
    showStatus(statusDiv, 'Player preference saved!', 'success');
    console.log('Player preference saved successfully');
  } catch (error) {
    console.error('Error in savePlayerChoice:', error);
    alert(`Error saving player choice: ${error.message}`);
  }
}
window.savePlayerChoice = savePlayerChoice;

function saveDebridConfig() {
  console.log('saveDebridConfig called');
  try {
    const serviceSelect = document.getElementById('debrid-service');
    const apiKeyInput = document.getElementById('debrid-api-key');
    const statusDiv = document.getElementById('debrid-status');
    console.log('Found elements:', { 
      serviceSelect: !!serviceSelect, 
      apiKeyInput: !!apiKeyInput, 
      statusDiv: !!statusDiv 
    });
    if (!serviceSelect || !apiKeyInput || !statusDiv) {
      console.error('Debrid form elements not found');
      alert('Error: Debrid form elements not found');
      return;
    }
    const service = serviceSelect.value;
    const apiKey = apiKeyInput.value.trim();
    console.log('Debrid config:', { service, apiKeyLength: apiKey.length });
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
    console.log('Debrid config saved successfully');
  } catch (error) {
    console.error('Error in saveDebridConfig:', error);
    alert(`Error saving debrid config: ${error.message}`);
  }
}
window.saveDebridConfig = saveDebridConfig;

// === ADDON FUNCTIONS ===
function showAddonModal() {
  console.log('showAddonModal called');
  try {
    const modal = document.getElementById('addon-modal');
    if (!modal) {
      console.error('Addon modal not found');
      alert('Error: Addon modal not found');
      return;
    }
    modal.style.display = 'block';
    console.log('Addon modal shown');
  } catch (error) {
    console.error('Error in showAddonModal:', error);
    alert(`Error showing addon modal: ${error.message}`);
  }
}
window.showAddonModal = showAddonModal;

function closeAddonModal() {
  console.log('closeAddonModal called');
  try {
    const modal = document.getElementById('addon-modal');
    if (modal) {
      modal.style.display = 'none';
      console.log('Addon modal closed');
    }
  } catch (error) {
    console.error('Error in closeAddonModal:', error);
  }
}
window.closeAddonModal = closeAddonModal;

async function saveAddon() {
  console.log('saveAddon called');
  try {
    const urlInput = document.getElementById('addon-url');
    const submitBtn = document.querySelector('#addon-form button[type="button"]');
    
    if (!urlInput) {
      console.error('Addon URL input not found');
      showAddonStatus('Addon URL input not found', 'error');
      return;
    }

    if (!urlInput.value.trim()) {
      showAddonStatus('Please enter a valid addon URL', 'error');
      return;
    }
    
    let addonUrl = urlInput.value.trim();
    console.log('Processing addon URL:', addonUrl);
    
    // Ensure URL ends with manifest.json
    if (!addonUrl.endsWith('/manifest.json')) {
      if (addonUrl.endsWith('/')) {
        addonUrl += 'manifest.json';
      } else if (addonUrl.endsWith('.json')) {
        addonUrl = addonUrl.replace('.json', '/manifest.json');
      } else {
        addonUrl += '/manifest.json';
      }
    }
    
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Fetching...';
    }
    showAddonStatus('Fetching addon manifest...', 'loading');
    
    try {
      console.log('Fetching manifest from:', addonUrl);
      
      const response = await fetch(addonUrl, {
        headers: { 'Accept': 'application/json' },
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }
      
      const manifest = await response.json();
      console.log('Received manifest:', manifest);
      
      if (!manifest.id || !manifest.name) {
        throw new Error('Invalid manifest format - missing required fields (id, name)');
      }

      // Normalize resources array
      let resources = [];
      if (manifest.resources) {
        if (Array.isArray(manifest.resources)) {
          resources = manifest.resources.map(r => {
            // Handle object-style resources (like Torrentio)
            if (typeof r === 'object') {
              return r.name || r.type || r.id || r;
            }
            return r;
          });
        } else if (typeof manifest.resources === 'object') {
          // Handle object format resources
          resources = Object.keys(manifest.resources);
        }
      }
      
      // Normalize types array
      let types = new Set();
      
      // Add types from manifest.types
      if (manifest.types) {
        if (Array.isArray(manifest.types)) {
          manifest.types.forEach(t => types.add(t));
        } else if (typeof manifest.types === 'object') {
          Object.keys(manifest.types).forEach(t => types.add(t));
        }
      }

      // Add types from resources
      if (Array.isArray(manifest.resources)) {
        manifest.resources.forEach(r => {
          if (r.types && Array.isArray(r.types)) {
            r.types.forEach(t => types.add(t));
          }
        });
      }

      // Add types from catalogs
      if (Array.isArray(manifest.catalogs)) {
        manifest.catalogs.forEach(c => {
          if (c.type) types.add(c.type);
        });
      }

      // Convert Set back to array
      types = Array.from(types);

      // Collect all supported ID prefixes
      let idPrefixes = new Set();
      if (Array.isArray(manifest.resources)) {
        manifest.resources.forEach(r => {
          if (r.idPrefixes && Array.isArray(r.idPrefixes)) {
            r.idPrefixes.forEach(p => idPrefixes.add(p));
          }
        });
      }
      
      // Determine streaming capabilities
      const hasStreamingCapability = 
        manifest.stream || 
        manifest.streaming || 
        manifest.torrent ||
        types.includes('movie') || 
        types.includes('series') ||
        types.includes('anime') ||
        resources.includes('stream') ||
        (manifest.catalogs && manifest.catalogs.some(cat => 
          cat.type === 'movie' || cat.type === 'series' || cat.type === 'anime'
        ));

      // Force stream resource if streaming capable
      if (hasStreamingCapability && !resources.includes('stream')) {
        resources.push('stream');
      }

      // Collect all endpoints
      const endpoints = {
        stream: manifest.stream?.endpoint || manifest.streaming?.endpoint,
        catalog: manifest.catalog?.endpoint,
        meta: manifest.meta?.endpoint,
        subtitle: manifest.subtitle?.endpoint || manifest.subtitles?.endpoint,
        ...Object.fromEntries(
          Object.entries(manifest)
            .filter(([key, value]) => 
              typeof value === 'object' && 
              value !== null && 
              'endpoint' in value
            )
            .map(([key, value]) => [key, value.endpoint])
        )
      };
      
      const addonInfo = {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description || '',
        version: manifest.version || '1.0.0',
        url: addonUrl.replace('/manifest.json', ''),
        manifestUrl: addonUrl,
        resources: resources,
        types: types,
        catalogs: manifest.catalogs || [],
        type: determineAddonType(resources, types),
        behaviorHints: manifest.behaviorHints || {},
        idPrefixes: Array.from(idPrefixes),
        endpoints: endpoints,
        config: {
          stream: manifest.stream || null,
          streaming: manifest.streaming || null,
          torrent: manifest.torrent || null
        },
        dateAdded: new Date().toISOString()
      };

      console.log('Processed addon info:', addonInfo);
      
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
      
      console.log('Addon saved successfully:', addonInfo.name);
      
      setTimeout(() => {
        urlInput.value = '';
        closeAddonModal();
      }, 1500);
      
    } catch (fetchError) {
      console.error('Error fetching addon manifest:', fetchError);
      showAddonStatus(`Error: ${fetchError.message}`, 'error');
    }
  } catch (error) {
    console.error('Error in saveAddon:', error);
    showAddonStatus(`Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    const submitBtn = document.querySelector('#addon-form button[type="button"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Addon';
    }
  }
}
window.saveAddon = saveAddon;

function editAddon(idx) {
  console.log('editAddon called with index:', idx);
  try {
    const addons = getAddons();
    const addon = addons[idx];
    if (!addon) {
      console.error('Addon not found at index:', idx);
      return;
    }
    const urlInput = document.getElementById('addon-url');
    if (urlInput) {
      urlInput.value = addon.manifestUrl || addon.url;
    }
    showAddonModal();
    console.log('Editing addon:', addon.name);
  } catch (error) {
    console.error('Error in editAddon:', error);
    alert(`Error editing addon: ${error.message}`);
  }
}
window.editAddon = editAddon;

function removeAddon(idx) {
  console.log('removeAddon called with index:', idx);
  try {
    const addons = getAddons();
    const addon = addons[idx];
    if (!addon) {
      console.error('Addon not found at index:', idx);
      return;
    }
    if (confirm(`Are you sure you want to remove ${addon.name}?`)) {
      addons.splice(idx, 1);
      setAddons(addons);
      renderAddonList();
      console.log('Addon removed:', addon.name);
    }
  } catch (error) {
    console.error('Error in removeAddon:', error);
    alert(`Error removing addon: ${error.message}`);
  }
}
window.removeAddon = removeAddon;

// === MEDIA FUNCTIONS ===
async function handlePlayButton(movieId, movieTitle) {
  console.log('=== Stream Request Started ===');
  console.log('Input:', { movieId, movieTitle });
  try {
    // Get all addons that have stream capability
    const allAddons = getAddons();
    console.log('Loaded addons:', allAddons);
    
    if (!allAddons || allAddons.length === 0) {
      console.error('No addons found in storage');
      alert('No addons configured. Please add at least one streaming addon in Settings.');
      return;
    }
    
    const streamingAddons = allAddons.filter(addon => {
      console.log('\nAnalyzing addon:', addon.name);
      // Check both resources array and type for streaming capability
      const hasStreamResource = addon.resources && Array.isArray(addon.resources) && addon.resources.includes('stream');
      const isTorrentType = addon.type === 'torrent';
      const isStreamingType = hasStreamResource || isTorrentType;
      console.log(`Addon ${addon.name}:`, {
        hasStreamResource,
        isTorrentType,
        isStreamingType,
        resources: addon.resources,
        type: addon.type,
        idPrefixes: addon.idPrefixes
      });
      return isStreamingType;
    });
    
    console.log('\nFiltered streaming addons:', streamingAddons.map(a => a.name));

    if (!streamingAddons || streamingAddons.length === 0) {
      console.error('No streaming addons found');
      alert('No streaming addons configured. Please add at least one streaming addon in Settings.');
      return;
    }

    showStreamModal('Loading streams...', []);
    
    // Format movieId for different addon types
    const formatMovieId = (addon, id) => {
      console.log(`\nFormatting ID for ${addon.name}:`, { originalId: id });
      
      // Special case for Torrentio
      if (addon.url.includes('torrentio') || addon.name.toLowerCase().includes('torrentio')) {
        // If it's already a valid IMDb ID, return as is
        if (id.startsWith('tt')) {
          console.log('Using existing IMDb ID:', id);
          return id;
        }
        // If it's a numeric ID, convert to IMDb format
        const numericId = id.toString().replace(/\D/g, ''); // Remove any non-digits
        if (numericId) {
          const formattedId = `tt${numericId.padStart(7, '0')}`;
          console.log('Converted to IMDb ID:', { original: id, formatted: formattedId });
          return formattedId;
        }
        console.warn('Unable to format ID for Torrentio:', id);
        throw new Error('Invalid ID format for Torrentio - requires IMDb ID');
      }

      // For other addons that require specific ID prefixes
      if (addon.idPrefixes && addon.idPrefixes.length > 0) {
        // Check if the ID already has a valid prefix
        const currentPrefix = id.split(':')[0] || id.substring(0, 2);
        if (addon.idPrefixes.includes(currentPrefix)) {
          console.log('ID already has valid prefix:', id);
          return id;
        }

        // Try to convert to a supported format
        if (addon.idPrefixes.includes('tt')) {
          // Convert to IMDb format
          const numericId = id.toString().replace(/\D/g, '');
          if (numericId) {
            const formattedId = `tt${numericId.padStart(7, '0')}`;
            console.log('Converted to IMDb format:', { original: id, formatted: formattedId });
            return formattedId;
          }
        } else if (addon.idPrefixes.includes('kitsu') && !id.startsWith('kitsu:')) {
          const formattedId = `kitsu:${id}`;
          console.log('Converted to Kitsu format:', { original: id, formatted: formattedId });
          return formattedId;
        }

        console.warn('Unable to convert ID to supported format:', {
          id,
          supportedPrefixes: addon.idPrefixes
        });
        throw new Error(`Unsupported ID format. Expected one of: ${addon.idPrefixes.join(', ')}`);
      }

      // For addons without specific ID requirements
      console.log('Using original ID (no format requirements):', id);
      return id;
    };

    const streamPromises = streamingAddons.map(async (addon) => {
      console.log(`\n=== Processing Addon: ${addon.name} ===`);
      try {
        // Format the ID appropriately for this addon
        const formattedId = formatMovieId(addon, movieId.toString());
        console.log('ID Formatting:', { 
          addon: addon.name,
          original: movieId,
          formatted: formattedId,
          idPrefixes: addon.idPrefixes
        });

        // Skip this addon if we couldn't format the ID properly
        if (!formattedId) {
          console.warn(`Skipping ${addon.name} due to ID format issues`);
          return { 
            success: false, 
            error: 'Invalid ID format', 
            addon: addon.name 
          };
        }

        // Construct the URL for stream request
        const streamUrl = buildAddonUrl(addon, 'stream', 'movie', formattedId);
        console.log('Stream URL:', {
          addon: addon.name,
          url: typeof streamUrl === 'string' ? streamUrl : streamUrl.url,
          headers: typeof streamUrl === 'object' ? streamUrl.headers : undefined
        });
        
        // Handle URL object with headers
        const requestOptions = {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Crumble/1.0'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        };

        // If streamUrl is an object with headers, merge them
        if (typeof streamUrl === 'object' && streamUrl.headers) {
          Object.assign(requestOptions.headers, streamUrl.headers);
          console.log('Final request headers:', requestOptions.headers);
        }

        console.log('Fetching streams...');
        const response = await fetch(
          typeof streamUrl === 'string' ? streamUrl : streamUrl.url,
          requestOptions
        );
        
        if (!response.ok) {
          console.error('Failed response:', {
            addon: addon.name,
            status: response.status,
            statusText: response.statusText,
            url: typeof streamUrl === 'string' ? streamUrl : streamUrl.url
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Raw response:', {
          addon: addon.name,
          result
        });

        // Enhanced stream response validation and normalization
        if (!result) {
          console.error('Empty response from addon:', addon.name);
          throw new Error('Empty response');
        }

        // Handle different response formats
        let streamData = result;
        if (result.streams) {
          streamData = result;
          console.log('Found streams array in response');
        } else if (Array.isArray(result)) {
          streamData = { streams: result };
          console.log('Converted array response to streams object');
        } else if (typeof result === 'object' && !result.streams) {
          // Some addons might return a single stream object
          streamData = { streams: [result] };
          console.log('Converted single stream to streams array');
        }

        // Validate and normalize streams
        if (!streamData.streams || !Array.isArray(streamData.streams)) {
          console.error('Invalid stream data format:', {
            addon: addon.name,
            data: streamData
          });
          throw new Error('Invalid stream data format');
        }

        // Filter out invalid streams and normalize stream objects
        const validStreams = streamData.streams
          .filter(s => {
            const isValid = s && (s.url || s.magnet) && !s.broken && !s.dead;
            if (!isValid) {
              console.log('Filtered out invalid stream:', {
                addon: addon.name,
                stream: s,
                reason: !s ? 'null stream' :
                        !s.url && !s.magnet ? 'no url or magnet' :
                        s.broken ? 'marked as broken' :
                        s.dead ? 'marked as dead' : 'unknown'
              });
            }
            return isValid;
          })
          .map(s => ({
            ...s,
            title: s.title || s.name || 'Stream',
            quality: s.quality || 'unknown',
            size: s.size || '',
            addon: addon.name
          }));

        console.log('Stream processing complete:', {
          addon: addon.name,
          totalStreams: streamData.streams.length,
          validStreams: validStreams.length
        });
        
        return { success: true, data: { streams: validStreams }, addon: addon.name };
      } catch (error) {
        console.error('Addon error:', {
          addon: addon.name,
          error: error.message,
          stack: error.stack,
          movieId
        });
        return { success: false, error: error.message, addon: addon.name };
      }
    });
    
    console.log('\nWaiting for all stream requests to complete...');
    const results = await Promise.all(streamPromises);
    console.log('All stream requests completed:', results);
    
    let streams = [];
    results.forEach(result => {
      if (result.success && result.data && Array.isArray(result.data.streams)) {
        const validStreams = result.data.streams.filter(s => 
          s && (s.url || s.magnet) && // Must have either URL or magnet
          (!s.broken) && // Skip streams marked as broken
          (!s.dead) // Skip streams marked as dead
        );
        if (validStreams.length > 0) {
          streams = streams.concat(validStreams);
          console.log(`Added ${validStreams.length} streams from ${result.addon}`);
        } else {
          console.warn(`No valid streams from ${result.addon} after filtering`);
        }
      } else {
        console.warn(`No valid streams from ${result.addon}:`, result);
      }
    });

    console.log(`Total streams found: ${streams.length}`);

    if (streams.length === 0) {
      console.log('No streams found, showing empty state');
      showStreamModal('No streams found for this movie.', []);
      return;
    }

    // Sort streams by quality (if available)
    streams.sort((a, b) => {
      const qualityOrder = { '4K': 4, '1080p': 3, '720p': 2, '480p': 1 };
      const aQuality = qualityOrder[a.quality] || 0;
      const bQuality = qualityOrder[b.quality] || 0;
      return bQuality - aQuality;
    });

    console.log('=== Stream Request Completed ===');
    showStreamModal(`${streams.length} streams found for "${movieTitle}"`, streams);
  } catch (error) {
    console.error('Fatal error in stream handling:', error);
    showStreamModal('Error loading streams: ' + error.message, []);
  }
}
window.handlePlayButton = handlePlayButton;

function handleTrailerButton(movieId, movieTitle) {
  console.log('handleTrailerButton called:', { movieId, movieTitle });
  try {
    getTrailer(movieId).then(trailer => {
      if (trailer) {
        window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
      } else {
        alert(`No trailer available for ${movieTitle}`);
      }
    }).catch(error => {
      console.error('Error getting trailer:', error);
      alert(`Error loading trailer for ${movieTitle}: ${error.message}`);
    });
  } catch (error) {
    console.error('Error in handleTrailerButton:', error);
    alert(`Error: ${error.message}`);
  }
}
window.handleTrailerButton = handleTrailerButton;

function showMovieDetails(movieId) {
  console.log('showMovieDetails called with ID:', movieId);
  try {
    const modal = document.getElementById('movie-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) {
      console.error('Movie modal elements not found');
      return;
    }
    
    modalBody.innerHTML = '<div class="loading-placeholder">Loading movie details...</div>';
    modal.style.display = 'block';

    getMovieDetails(movieId).then(movie => {
      if (!movie) {
        modalBody.innerHTML = '<p class="error-message">Failed to load movie details.</p>';
        return;
      }

      const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
        : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';

      modalBody.innerHTML = `
        <div class="movie-details">
          <div class="movie-poster">
            <img src="${posterUrl}" alt="${escapeHtml(movie.title)}" />
          </div>
          <div class="movie-info">
            <h2>${escapeHtml(movie.title)} ${movie.release_date ? `(${movie.release_date.split('-')[0]})` : ''}</h2>
            <div class="movie-meta">
              ${movie.vote_average ? `<span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>` : ''}
              ${movie.runtime ? `<span class="runtime">${movie.runtime} min</span>` : ''}
              ${movie.genres ? `<span class="genres">${movie.genres.map(g => g.name).join(', ')}</span>` : ''}
            </div>
            <p class="overview">${escapeHtml(movie.overview || 'No description available.')}</p>
            <div class="action-buttons">
              <button class="btn btn-primary" onclick="handlePlayButton(${movie.id}, '${escapeHtml(movie.title).replace(/'/g, "\\'")}')">▶️ Play</button>
              <button class="btn btn-secondary" onclick="handleTrailerButton(${movie.id}, '${escapeHtml(movie.title).replace(/'/g, "\\'")}')">🎬 Trailer</button>
            </div>
          </div>
        </div>
      `;
    }).catch(error => {
      console.error('Error loading movie details:', error);
      modalBody.innerHTML = `<p class="error-message">Error loading movie details: ${error.message}</p>`;
    });
  } catch (error) {
    console.error('Error in showMovieDetails:', error);
  }
}
window.showMovieDetails = showMovieDetails;

// === MODAL FUNCTIONS ===
function closeModal() {
  console.log('closeModal called');
  try {
    const modals = document.querySelectorAll('.modal[style*="block"]');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
    console.log('Closed', modals.length, 'modals');
  } catch (error) {
    console.error('Error in closeModal:', error);
  }
}
window.closeModal = closeModal;

function closeAddonMetaModal() {
  console.log('closeAddonMetaModal called');
  try {
    const modal = document.getElementById('addon-meta-modal');
    if (modal) {
      modal.style.display = 'none';
      console.log('Addon meta modal closed');
    }
  } catch (error) {
    console.error('Error in closeAddonMetaModal:', error);
  }
}
window.closeAddonMetaModal = closeAddonMetaModal;

// === STREAM FUNCTIONS ===
function showStreamModal(title, streams) {
  let modal = document.getElementById('stream-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stream-modal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content stream-modal-content">
      <span class="close" onclick="closeStreamModal()">&times;</span>
      <h3 id="stream-modal-title"></h3>
      <div id="stream-list"></div>
    </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('stream-modal-title').textContent = title;
  const list = document.getElementById('stream-list');
  if (!streams || streams.length === 0) {
    list.innerHTML = '<p class="empty-state">No streams available.</p>';
  } else {
    list.innerHTML = streams.map((s, i) =>
      `<div class="stream-item">
        <div class="stream-info">
          <div class="stream-title">${escapeHtml(s.title || s.name || 'Stream')}</div>
          <div class="stream-details">
            ${s.quality ? `<span>${escapeHtml(s.quality)}</span>` : ''}
            ${s.size ? `<span>${escapeHtml(s.size)}</span>` : ''}
            ${s.addon ? `<span>via ${escapeHtml(s.addon)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-primary" onclick="selectStream(${i})">Play</button>
      </div>`
    ).join('');
  }
  modal.style.display = 'block';
  window._currentStreams = streams;
}
window.showStreamModal = showStreamModal;

function closeStreamModal() {
  const modal = document.getElementById('stream-modal');
  if (modal) modal.style.display = 'none';
  window._currentStreams = null;
}
window.closeStreamModal = closeStreamModal;

function selectStream(index) {
  const streams = window._currentStreams;
  if (!streams || !streams[index]) return;
  const stream = streams[index];
  // For demo: open magnet/HTTP link in new tab
  if (stream.url) {
    window.open(stream.url, '_blank');
  } else if (stream.magnet) {
    window.open(stream.magnet, '_blank');
  } else {
    alert('No playable URL for this stream.');
  }
  closeStreamModal();
}
window.selectStream = selectStream;

// === UTILITY FUNCTIONS ===
function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status-message status-${type}`;
  element.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }
}

function showAddonStatus(message, type) {
  const statusDiv = document.getElementById('addon-status');
  if (statusDiv) {
    showStatus(statusDiv, message, type);
  }
}

function getPlayerChoice() {
  return localStorage.getItem('preferred_player') || 'internal';
}

function getDebridConfig() {
  try {
    return JSON.parse(localStorage.getItem('debrid_config')) || { service: 'none', apiKey: '' };
  } catch {
    return { service: 'none', apiKey: '' };
  }
}

function getOfflineMode() {
  return localStorage.getItem('offline_mode') === 'true';
}

function setOfflineMode(enabled) {
  localStorage.setItem('offline_mode', enabled ? 'true' : 'false');
  showStatus(document.getElementById('offline-status'), 
    `Offline mode ${enabled ? 'enabled' : 'disabled'}. ${enabled ? 'TMDB API calls will be skipped.' : 'TMDB API calls will be made normally.'}`, 
    enabled ? 'warning' : 'success'
  );
  if (!enabled) {
    // Reload content when going back online
    loadHomeCatalogs().catch(error => {
      console.error('Error reloading catalogs:', error);
    });
  }
}
window.setOfflineMode = setOfflineMode;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getAddons() {
  try {
    const addons = JSON.parse(localStorage.getItem('addons')) || [];
    console.log('Loaded addons from storage:', addons);
    return addons;
  } catch (error) {
    console.error('Error loading addons:', error);
    return [];
  }
}

function setAddons(addons) {
  try {
    console.log('Saving addons to storage:', addons);
    localStorage.setItem('addons', JSON.stringify(addons));
  } catch (error) {
    console.error('Error saving addons:', error);
  }
}

function determineAddonType(resources, types) {
  if (!resources || !Array.isArray(resources)) return 'unknown';
  if (resources.includes('catalog')) return 'catalog';
  if (resources.includes('meta')) return 'meta';
  if (resources.includes('subtitles')) return 'subtitles';
  if (types.includes('movie') || types.includes('series')) return 'movie';
  return 'other';
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

// === DISPLAY FUNCTIONS ===
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
    container.insertAdjacentHTML('beforeend', renderMovieCard(movie));
  });
}
window.displayMovies = displayMovies;

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
window.renderMovieCard = renderMovieCard;

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
window.displayTVShows = displayTVShows;

// === LOADING FUNCTIONS ===
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
window.loadHomeCatalogs = loadHomeCatalogs;

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
window.loadTrendingMovies = loadTrendingMovies;

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
window.loadPopularMovies = loadPopularMovies;

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
window.loadLatestMovies = loadLatestMovies;

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
window.loadTrendingTV = loadTrendingTV;

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
window.loadPopularTV = loadPopularTV;

// === TAB MANAGEMENT ===
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
    } finally {
      this.isTransitioning = false;
    }
  }

  getTabIdFromButton(button) {
    const listItem = button.closest('li[data-tab]');
    if (listItem) {
      return listItem.getAttribute('data-tab');
    }
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
      const offlineMode = document.getElementById('offline-mode');

      if (apiKeyInput) apiKeyInput.value = getApiKey();
      if (playerSelect) playerSelect.value = getPlayerChoice();
      if (offlineMode) offlineMode.checked = getOfflineMode();
      
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
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }

  async loadHomeContent() {
    try {
      await loadHomeCatalogs();
    } catch (error) {
      console.error('Error loading home content:', error);
    }
  }

  clearStatusMessages() {
    document.querySelectorAll('.status-message').forEach(msg => {
      msg.style.display = 'none';
    });
  }
}

// === SEARCH MANAGEMENT ===
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

// === INITIALIZATION ===
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
    // Setup addon management with direct event listener
    const addonAddBtn = document.getElementById('add-addon-btn');
    if (addonAddBtn) {
      console.log('Setting up addon button listener');
      addonAddBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Addon button clicked via event listener');
        showAddonModal();
      });
      console.log('Addon button listener setup complete');
    } else {
      console.error('Addon button not found during initialization');
    }
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error during app initialization:', error);
    alert(`Initialization error: ${error.message}`);
  }
});