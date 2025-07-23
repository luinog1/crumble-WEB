// Enhanced Addon Loader with improved error handling and security

// Utility to call an addon provider (scraper/catalog/debrid/torrent)
async function callAddon(addon, params = {}) {
  if (!addon || !addon.url) {
    throw new Error('Invalid addon configuration: missing URL');
  }

  let url = addon.url;
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Crumble/1.0'
  };

  try {
    // If API key is needed, add it securely
    if (addon.apiKey) {
      if (addon.type === "debrid") {
        headers["Authorization"] = `Bearer ${addon.apiKey}`;
      } else {
        url += (url.indexOf("?") > -1 ? "&" : "?") + "apikey=" + encodeURIComponent(addon.apiKey);
      }
    }

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    let requestOptions = {
      headers,
      signal: controller.signal
    };

    // Enhanced request handling for streaming addons
    if (params.resource === 'stream') {
      // Some streaming addons require POST requests
      if (addon.streaming?.method === 'POST' || addon.type === 'torrent') {
        requestOptions.method = 'POST';
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(params);
      } else {
        // For GET requests: append params as query string
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url += `${url.indexOf("?") > -1 ? "&" : "?"}${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
          }
        });
      }
    }
    // For GET requests: append params as query string
    else if (addon.type === "scraper" || addon.type === "catalog" || addon.type === "torrent") {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url += `${url.indexOf("?") > -1 ? "&" : "?"}${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
        }
      });
    }
    // For debrid, use POST with JSON body
    else if (addon.type === "debrid") {
      requestOptions.method = "POST";
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(params);
    }

    response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Invalid response type: expected JSON, got ${contentType}`);
    }

    const data = await response.json();
    
    // Enhanced response validation for streams
    if (params.resource === 'stream') {
      if (!data) {
        throw new Error('Empty response from addon');
      }

      // Normalize stream response
      let streams = [];
      if (Array.isArray(data)) {
        streams = data;
      } else if (data.streams && Array.isArray(data.streams)) {
        streams = data.streams;
      } else if (typeof data === 'object') {
        // Single stream object
        streams = [data];
      }

      // Validate and clean streams
      streams = streams.filter(stream => 
        stream && 
        (stream.url || stream.magnet) && 
        !stream.broken && 
        !stream.dead
      ).map(stream => ({
        ...stream,
        title: stream.title || stream.name || 'Stream',
        quality: stream.quality || 'unknown',
        size: stream.size || '',
        type: stream.type || (stream.magnet ? 'torrent' : 'direct')
      }));

      return { streams };
    }

    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${addon.name || 'Unknown addon'} took too long to respond`);
    }
    
    console.error(`Addon call failed for ${addon.name || 'Unknown addon'}:`, error);
    throw new Error(`Addon request failed: ${error.message}`);
  }
}

// Enhanced addon validation
function validateAddon(addon) {
  const errors = [];

  if (!addon) {
    errors.push('Addon is null or undefined');
    return errors;
  }

  // Required fields
  if (!addon.id) errors.push('Missing addon ID');
  if (!addon.name) errors.push('Missing addon name');
  if (!addon.url) errors.push('Missing addon URL');

  // URL validation
  if (addon.url) {
    try {
      new URL(addon.url);
      if (!addon.url.endsWith('/manifest.json')) {
        errors.push('Addon URL must end with /manifest.json');
      }
    } catch (e) {
      errors.push('Invalid addon URL format');
    }
  }

  // Resources validation
  if (addon.resources) {
    if (!Array.isArray(addon.resources)) {
      errors.push('Resources must be an array');
    } else {
      const validResources = ['stream', 'catalog', 'meta', 'subtitles', 'other'];
      addon.resources.forEach(resource => {
        if (!validResources.includes(resource)) {
          errors.push(`Invalid resource type: ${resource}`);
        }
      });
    }
  }

  // Types validation
  if (addon.types) {
    if (!Array.isArray(addon.types)) {
      errors.push('Types must be an array');
    } else {
      const validTypes = ['movie', 'series', 'anime', 'channel', 'tv', 'other'];
      addon.types.forEach(type => {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid content type: ${type}`);
        }
      });
    }
  }

  // Endpoints validation
  if (addon.endpoints) {
    Object.entries(addon.endpoints).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        try {
          new URL(value);
        } catch (e) {
          errors.push(`Invalid endpoint URL for ${key}`);
        }
      }
    });
  }

  return errors;
}

// Test addon connectivity
async function testAddon(addon) {
  try {
    const errors = validateAddon(addon);
    if (errors.length > 0) {
      throw new Error(`Addon validation failed: ${errors.join(', ')}`);
    }

    // Try to fetch the addon's manifest
    const manifestUrl = addon.url.endsWith('/') ? 
      `${addon.url}manifest.json` : 
      `${addon.url}/manifest.json`;

    const response = await fetch(manifestUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Crumble/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Manifest not accessible: HTTP ${response.status}`);
    }

    const manifest = await response.json();

    return {
      success: true,
      manifest: manifest,
      message: `Successfully connected to ${addon.name}`
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to connect to ${addon.name}: ${error.message}`
    };
  }
}

// Get addon capabilities
function getAddonCapabilities(addon) {
  const capabilities = {
    canStream: false,
    canSearch: false,
    canProvideMetadata: false,
    canProvideSubtitles: false,
    supportedTypes: []
  };

  if (!addon.resources) {
    return capabilities;
  }

  capabilities.canStream = addon.resources.includes('stream');
  capabilities.canSearch = addon.resources.includes('catalog');
  capabilities.canProvideMetadata = addon.resources.includes('meta');
  capabilities.canProvideSubtitles = addon.resources.includes('subtitles');

  if (addon.types) {
    capabilities.supportedTypes = addon.types;
  }

  return capabilities;
}

// Safe addon URL construction
function buildAddonUrl(addon, resource, type, id, extra = {}) {
  try {
    if (!addon || !addon.url) {
      throw new Error('Invalid addon configuration');
    }

    // Get the appropriate base URL
    let baseUrl = addon.url.replace('/manifest.json', '');
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    // Handle different addon types
    if (addon.type === 'stremio' || addon.id === 'stremio') {
      // Standard Stremio addon format
      if (resource === 'meta') {
        return `${baseUrl}meta/${type}/${id}.json`;
      } else if (resource === 'catalog') {
        return `${baseUrl}catalog/${type}/${id || 'top'}.json`;
      } else if (resource === 'stream') {
        return `${baseUrl}stream/${type}/${id}.json`;
      }
    } 
    // Handle Torrentio specifically
    else if (addon.url.includes('torrentio') || addon.name.toLowerCase().includes('torrentio')) {
      if (resource === 'stream') {
        // Ensure ID is in correct format for Torrentio
        const imdbId = id.toString().startsWith('tt') ? id : `tt${id.toString().padStart(7, '0')}`;
        return `${baseUrl}stream/${type}/${imdbId}.json`;
      }
    }
    // Handle generic addons
    else {
      // Check for custom endpoints
      if (addon.endpoints?.[resource]) {
        const endpoint = addon.endpoints[resource].replace('/manifest.json', '');
        return `${endpoint}/${type}/${id}.json`;
      }
      // Default fallback for other addons
      return `${baseUrl}${resource}/${type}/${id}.json`;
    }

    throw new Error(`Unsupported resource type: ${resource} for addon: ${addon.name}`);

  } catch (error) {
    console.error('Error building addon URL:', error);
    throw new Error(`Failed to build addon URL: ${error.message}`);
  }
}

// Batch addon calls with error handling
async function callMultipleAddons(addons, params = {}) {
  const results = [];
  const errors = [];

  const promises = addons.map(async (addon, index) => {
    try {
      const result = await callAddon(addon, params);
      return { index, success: true, data: result, addon: addon.name };
    } catch (error) {
      return { index, success: false, error: error.message, addon: addon.name };
    }
  });

  const responses = await Promise.allSettled(promises);

  responses.forEach((response, index) => {
    if (response.status === 'fulfilled') {
      const result = response.value;
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    } else {
      errors.push({
        index,
        success: false,
        error: response.reason?.message || 'Unknown error',
        addon: addons[index]?.name || 'Unknown addon'
      });
    }
  });

  return {
    results,
    errors,
    totalAddons: addons.length,
    successCount: results.length,
    errorCount: errors.length
  };
}

// Export all functions to window
window.callAddon = callAddon;
window.validateAddon = validateAddon;
window.testAddon = testAddon;
window.getAddonCapabilities = getAddonCapabilities;
window.buildAddonUrl = buildAddonUrl;
window.callMultipleAddons = callMultipleAddons;