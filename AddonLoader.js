// Utility to call an addon provider (scraper/catalog/debrid/torrent)
export async function callAddon(addon, params = {}) {
  let url = addon.url;
  let headers = {};

  // If API key is needed, add it as query param or header
  if (addon.apiKey) {
    if (addon.type === "debrid") {
      headers["Authorization"] = `Bearer ${addon.apiKey}`;
    } else {
      // Most scrapers/catalogs use apikey as query or header (customize as needed)
      url += (url.indexOf("?") > -1 ? "&" : "?") + "apikey=" + encodeURIComponent(addon.apiKey);
    }
  }

  // For GET requests: append params as query string
  if (addon.type === "scraper" || addon.type === "catalog" || addon.type === "torrent") {
    Object.keys(params).forEach(key => {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    });
    const response = await fetch(url, { headers });
    return await response.json();
  }

  // For debrid, use POST or GET as needed (example: Real-Debrid API)
  if (addon.type === "debrid") {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return await response.json();
  }
}// Utility to call an addon provider (scraper/catalog/debrid/torrent)
export async function callAddon(addon, params = {}) {
  let url = addon.url;
  let headers = {};

  // If API key is needed, add it as query param or header
  if (addon.apiKey) {
    if (addon.type === "debrid") {
      headers["Authorization"] = `Bearer ${addon.apiKey}`;
    } else {
      url += (url.indexOf("?") > -1 ? "&" : "?") + "apikey=" + encodeURIComponent(addon.apiKey);
    }
  }

  // For GET requests: append params as query string
  if (addon.type === "scraper" || addon.type === "catalog" || addon.type === "torrent") {
    Object.keys(params).forEach(key => {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    });
    const response = await fetch(url, { headers });
    return await response.json();
  }

  // For debrid, use POST or GET as needed (example: Real-Debrid API)
  if (addon.type === "debrid") {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return await response.json();
  }
}