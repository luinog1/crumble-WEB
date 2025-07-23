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

  if (!addon.id) {
    errors.push('Missing addon ID');
  }

  if (!addon.name) {
    errors.push('Missing addon name');
  }

  if (!addon.url) {
    errors.push('Missing addon URL');
  } else {
    try {
      new URL(addon.url);
    } catch (e) {
      errors.push('Invalid addon URL format');
    }
  }

  if (!addon.type) {
    errors.push('Missing addon type');
  } else if (!['scraper', 'catalog', 'debrid', 'torrent', 'meta', 'subtitles', 'other'].includes(addon.type)) {
    errors.push('Invalid addon type');
  }

  if (addon.resources && !Array.isArray(addon.resources)) {
    errors.push('Resources must be an array');
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

    let baseUrl = addon.url;
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    // Handle special cases for streaming addons
    if (resource === 'stream' && addon.streaming?.endpoint) {
      baseUrl = addon.streaming.endpoint;
    } else if (resource === 'stream' && addon.stream?.endpoint) {
      baseUrl = addon.stream.endpoint;
    }

    let url = `${baseUrl}${resource}`;

    // Special handling for stream URLs
    if (resource === 'stream') {
      // Some addons expect different URL formats for streams
      if (addon.type === 'torrent' || addon.streaming?.type === 'torrent') {
        url = `${baseUrl}${type}/${id}/stream`;
      } else if (addon.streaming?.urlPattern) {
        url = addon.streaming.urlPattern
          .replace('{type}', type)
          .replace('{id}', id);
      }
    } else if (type && id) {
      url += `/${type}/${id}`;
    }

    // Add extra parameters
    const extraParams = Object.entries(extra)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join(':');

    if (extraParams) {
      url += `:${extraParams}`;
    }

    // Only add .json if URL doesn't already have an extension
    if (!url.match(/\.[a-z]+$/i)) {
      url += '.json';
    }

    // Add API key if present
    if (addon.apiKey && addon.type !== 'debrid') {
      url += `${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(addon.apiKey)}`;
    }

    return url;

  } catch (error) {
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