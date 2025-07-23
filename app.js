// Complete Streaming Implementation - Add to app.js

// --- Enhanced Play Button Handler ---
async function handlePlayButton(movieId, movieTitle) {
  console.log('Play button clicked for movie:', movieTitle, 'ID:', movieId);

  try {
    // Check if addons are configured
    const addons = getAddons();
    const streamingAddons = addons.filter(addon => 
      addon.resources && addon.resources.includes('stream')
    );

    if (streamingAddons.length === 0) {
      showErrorModal(
        'No Streaming Addons',
        'Please add streaming addons (like Torrentio) in Settings to enable playback.',
        [
          { text: 'Go to Settings', action: () => window.tabManager.showTab('settings-tab') },
          { text: 'Cancel', action: () => {} }
        ]
      );
      return;
    }

    // Show loading state
    const loadingModal = createLoadingModal(`Finding streams for "${movieTitle}"...`);
    document.body.appendChild(loadingModal);

    try {
      // Get movie details to find IMDB ID
      const movieDetails = await getMovieDetails(movieId);
      const imdbId = movieDetails.imdb_id;

      if (!imdbId) {
        throw new Error('IMDB ID not found for this movie');
      }

      // Fetch streaming links
      const streams = await fetchStreamingLinks(imdbId, 'movie');

      // Remove loading modal
      loadingModal.remove();

      // Show streams or error
      if (streams.length > 0) {
        displayStreamModal(streams, movieTitle, imdbId);
      } else {
        showErrorModal(
          'No Streams Found',
          `No streams available for "${movieTitle}". Try adding more streaming addons in Settings.`,
          [{ text: 'OK', action: () => {} }]
        );
      }

    } catch (error) {
      loadingModal.remove();
      console.error('Error fetching streams:', error);
      
      showErrorModal(
        'Stream Error',
        `Failed to find streams for "${movieTitle}": ${error.message}`,
        [{ text: 'OK', action: () => {} }]
      );
    }

  } catch (error) {
    console.error('Error in handlePlayButton:', error);
    alert(`Error: ${error.message}`);
  }
}

// --- Stream Fetching Implementation ---
async function fetchStreamingLinks(imdbId, type = 'movie', season = null, episode = null) {
  console.log('Fetching streaming links for IMDB ID:', imdbId);
  
  const addons = getAddons().filter(addon => 
    addon.resources && addon.resources.includes('stream')
  );
  
  if (addons.length === 0) {
    throw new Error('No streaming addons configured');
  }

  const allStreams = [];
  const errors = [];

  // Fetch from all addons in parallel with timeout
  const addonPromises = addons.map(async (addon) => {
    try {
      console.log(`Fetching from addon: ${addon.name}`);

      // Build stream URL
      let streamUrl;
      if (type === 'movie') {
        streamUrl = `${addon.url}/stream/movie/${imdbId}.json`;
      } else {
        streamUrl = `${addon.url}/stream/series/${imdbId}:${season}:${episode}.json`;
      }

      // Add API key if provided
      if (addon.apiKey) {
        streamUrl += `?api_key=${encodeURIComponent(addon.apiKey)}`;
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(streamUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crumble/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`Stream data from ${addon.name}:`, data);
      
      if (data.streams && Array.isArray(data.streams)) {
        const processedStreams = data.streams.map(stream => ({
          ...stream,
          addonName: addon.name,
          quality: extractQuality(stream.title || stream.name || ''),
          size: extractSize(stream.title || stream.name || ''),
          seeds: extractSeeds(stream.title || stream.name || ''),
          type: getStreamType(stream)
        }));
        
        allStreams.push(...processedStreams);
      }

    } catch (error) {
      console.error(`Error fetching from addon ${addon.name}:`, error);
      errors.push(`${addon.name}: ${error.message}`);
    }
  });

  await Promise.allSettled(addonPromises);

  // Sort streams by quality and seeds
  const sortedStreams = allStreams.sort((a, b) => {
    const qualityOrder = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };
    const aQuality = qualityOrder[a.quality] || 0;
    const bQuality = qualityOrder[b.quality] || 0;

    if (aQuality !== bQuality) return bQuality - aQuality;
    return (b.seeds || 0) - (a.seeds || 0);
  });

  console.log(`Found ${sortedStreams.length} streams from ${addons.length} addons`);
  return sortedStreams;
}

// --- Stream Processing Utilities ---
function extractQuality(title) {
  if (!title) return 'Unknown';
  const qualityMatch = title.match(/(2160p|1080p|720p|480p|4K|UHD)/i);
  if (qualityMatch) {
    const quality = qualityMatch[1].toLowerCase();
    return quality === '4k' || quality === 'uhd' ? '2160p' : quality;
  }
  return 'Unknown';
}

function extractSize(title) {
  if (!title) return '';
  const sizeMatch = title.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
  return sizeMatch ? sizeMatch[1] : '';
}

function extractSeeds(title) {
  if (!title) return 0;
  const seedsMatch = title.match(/👥\s*(\d+)/i) || title.match(/seeds?:\s*(\d+)/i);
  return seedsMatch ? parseInt(seedsMatch[1]) : 0;
}

function getStreamType(stream) {
  if (stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://'))) {
    return 'http';
  }
  return 'torrent';
}

// --- Stream Selection Modal ---
function displayStreamModal(streams, movieTitle, imdbId) {
  console.log('Displaying stream modal for:', movieTitle, 'with', streams.length, 'streams');

  const debridConfig = getDebridConfig();
  const hasDebrid = debridConfig.service !== 'none' && debridConfig.apiKey;

  const modalHtml = `
    <div id="stream-modal" class="modal" style="display: block;">
      <div class="modal-content stream-modal-content">
        <span class="close" onclick="closeStreamModal()">&times;</span>
        <h3>🎬 Select Stream for "${escapeHtml(movieTitle)}"</h3>
        
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
              `<option value="${escapeHtml(addon)}">${escapeHtml(addon)}</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="stream-info-bar">
          <span>Found ${streams.length} streams</span>
          ${!hasDebrid ? '<span class="warning">⚠️ Configure debrid service for better compatibility</span>' : ''}
        </div>
        
        <div id="stream-list" class="stream-list">
          ${renderStreamList(streams, hasDebrid)}
        </div>
        
        <div class="stream-modal-footer">
          <button onclick="closeStreamModal()" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal
  const existingModal = document.getElementById('stream-modal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Store data for filtering
  window.currentStreams = streams;
  window.currentMovieTitle = movieTitle;
  window.currentImdbId = imdbId;
}

function renderStreamList(streams, hasDebrid) {
  if (streams.length === 0) {
    return '<div class="no-streams">No streams found. Try adding more addons in Settings.</div>';
  }
  
  return streams.map((stream, index) => {
    const isCompatible = stream.type === 'http' || hasDebrid;
    const compatibilityIcon = isCompatible ? '✅' : '⚠️';
    const compatibilityText = stream.type === 'http' ? 'Direct Stream' : 
                             hasDebrid ? 'Torrent (Debrid)' : 'Torrent (Magnet)';
    
    return `
      <div class="stream-item ${!isCompatible ? 'stream-warning' : ''}" onclick="selectStream(${index})">
        <div class="stream-info">
          <div class="stream-title">${escapeHtml(stream.title || stream.name || 'Unknown Stream')}</div>
          <div class="stream-details">
            <span class="stream-type">${compatibilityIcon} ${compatibilityText}</span>
            <span class="stream-quality">${escapeHtml(stream.quality)}</span>
            ${stream.size ? `<span class="stream-size">${escapeHtml(stream.size)}</span>` : ''}
            ${stream.seeds > 0 ? `<span class="stream-seeds">👥 ${stream.seeds}</span>` : ''}
            <span class="stream-source">${escapeHtml(stream.addonName)}</span>
          </div>
        </div>
        <div class="stream-action">
          <button class="btn-play">▶️ Play</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- Stream Selection Handler ---
async function selectStream(streamIndex) {
  try {
    const streams = window.currentStreams || [];
    const selectedStream = streams[streamIndex];
    
    if (!selectedStream) {
      throw new Error('Stream not found');
    }
    
    console.log('Selected stream:', selectedStream);
    closeStreamModal();
    
    // Show processing modal
    const processingModal = createLoadingModal('Preparing stream...');
    document.body.appendChild(processingModal);
    
    let streamUrl = null;
    const debridConfig = getDebridConfig();
    const hasDebrid = debridConfig.service !== 'none' && debridConfig.apiKey;
    
    try {
      if (selectedStream.type === 'http') {
        // Direct HTTP stream
        streamUrl = selectedStream.url;
        console.log('Using direct HTTP stream:', streamUrl);
      } else if (hasDebrid) {
        // Convert torrent via debrid
        console.log('Converting torrent to HTTP via debrid...');
        streamUrl = await convertTorrentToHttp(selectedStream, debridConfig);
      } else {
        // Use magnet link
        streamUrl = extractMagnetUrl(selectedStream);
        
        const playerChoice = getPlayerChoice();
        if (playerChoice !== 'internal') {
          const proceed = confirm(
            'This is a torrent stream (magnet link) which may not work well with external players.\n\n' +
            'For better compatibility:\n' +
            '• Configure a debrid service in Settings\n' +
            '• Or use the Internal Player\n\n' +
            'Continue with external player anyway?'
          );
          if (!proceed) {
            processingModal.remove();
            return;
          }
        }
      }
      
      processingModal.remove();
      
      if (streamUrl && (streamUrl.startsWith('http') || streamUrl.startsWith('magnet:'))) {
        console.log('Launching stream:', streamUrl);
        launchPlayer(streamUrl);
      } else {
        throw new Error('Invalid stream URL format');
      }
      
    } catch (error) {
      processingModal.remove();
      console.error('Stream processing error:', error);
      
      showErrorModal(
        'Stream Error',
        `Failed to process stream: ${error.message}`,
        [{ text: 'OK', action: () => {} }]
      );
    }
    
  } catch (error) {
    console.error('Error selecting stream:', error);
    alert(`Stream selection error: ${error.message}`);
  }
}

// --- Player Launch Implementation ---
function launchPlayer(streamUrl) {
  const choice = getPlayerChoice();
  console.log('Launching player:', choice, 'with URL:', streamUrl);

  try {
    switch (choice) {
      case 'infuse':
        window.location.href = `infuse://x-callback-url/play?url=${encodeURIComponent(streamUrl)}`;
        break;
      case 'vlc':
        window.location.href = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`;
        break;
      case 'outplayer':
        window.location.href = `outplayer://play?url=${encodeURIComponent(streamUrl)}`;
        break;
      case 'mrmc':
        window.location.href = `mrmc://play/${encodeURIComponent(streamUrl)}`;
        break;
      default:
        playInternalPlayer(streamUrl);
        break;
    }
  } catch (error) {
    console.error('Error launching player:', error);
    alert(`Error launching player: ${error.message}`);
  }
}

function playInternalPlayer(url) {
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.innerHTML = `
    <div class="video-modal-content">
      <span class="close" onclick="this.closest('.video-modal').remove()">&times;</span>
      <video controls autoplay style="width: 100%; height: 400px; background: #000;">
        <source src="${url}" type="application/x-mpegURL">
        <p>Your browser does not support this video format.</p>
      </video>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Enhanced HLS support
  if (window.Hls && window.Hls.isSupported() && url.includes('.m3u8')) {
    const video = modal.querySelector('video');
    const hls = new window.Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    
    hls.on(window.Hls.Events.ERROR, (event, data) => {
      console.error('HLS Error:', data);
      if (data.fatal) {
        alert('Video playback error. Please try a different stream.');
        modal.remove();
      }
    });
  }
}

// --- Utility Functions ---
function extractMagnetUrl(stream) {
  if (stream.infoHash) {
    let magnetUrl = `magnet:?xt=urn:btih:${stream.infoHash}`;
    if (stream.title) {
      magnetUrl += `&dn=${encodeURIComponent(stream.title)}`;
    }
    return magnetUrl;
  }
  
  return stream.magnetUrl || stream.torrentUrl || null;
}

async function convertTorrentToHttp(stream, debridConfig) {
  const magnetUrl = extractMagnetUrl(stream);
  if (!magnetUrl) {
    throw new Error('No magnet link found in stream data');
  }
  
  // Placeholder for debrid conversion - implement based on service
  switch (debridConfig.service) {
    case 'realdebrid':
      return await convertViaRealDebrid(magnetUrl, debridConfig.apiKey);
    case 'alldebrid':
      return await convertViaAllDebrid(magnetUrl, debridConfig.apiKey);
    default:
      throw new Error(`Debrid service ${debridConfig.service} not implemented yet`);
  }
}

// --- UI Helper Functions ---
function createLoadingModal(message) {
  const modal = document.createElement('div');
  modal.className = 'loading-modal';
  modal.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  return modal;
}

function showErrorModal(title, message, buttons) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="modal-buttons">
        ${buttons.map(btn => 
          `<button class="btn-secondary" onclick="this.closest('.modal').remove(); (${btn.action.toString()})()">${escapeHtml(btn.text)}</button>`
        ).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function filterStreams() {
  const qualityFilter = document.getElementById('quality-filter')?.value || 'all';
  const addonFilter = document.getElementById('addon-filter')?.value || 'all';

  let filteredStreams = window.currentStreams || [];

  if (qualityFilter !== 'all') {
    filteredStreams = filteredStreams.filter(stream => stream.quality === qualityFilter);
  }

  if (addonFilter !== 'all') {
    filteredStreams = filteredStreams.filter(stream => stream.addonName === addonFilter);
  }

  const streamList = document.getElementById('stream-list');
  if (streamList) {
    const hasDebrid = getDebridConfig().service !== 'none' && getDebridConfig().apiKey;
    streamList.innerHTML = renderStreamList(filteredStreams, hasDebrid);
  }
}

function closeStreamModal() {
  const modal = document.getElementById('stream-modal');
  if (modal) modal.remove();
  
  // Clean up global variables
  delete window.currentStreams;
  delete window.currentMovieTitle;
  delete window.currentImdbId;
}

// --- Global Function Exports ---
window.selectStream = selectStream;
window.filterStreams = filterStreams;
window.closeStreamModal = closeStreamModal;

// --- Placeholder Debrid Functions (implement as needed) ---
async function convertViaRealDebrid(magnetUrl, apiKey) {
  throw new Error('Real-Debrid integration not implemented yet. Please add this functionality.');
}

async function convertViaAllDebrid(magnetUrl, apiKey) {
  throw new Error('AllDebrid integration not implemented yet. Please add this functionality.');
}