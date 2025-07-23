// Fixed Tab Switching Logic with proper error handling
class TabManager {
  constructor() {
    this.currentTab = 'home-tab';
    this.isTransitioning = false;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Use event delegation for better performance
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
    const buttons = document.querySelectorAll('.nav-btn');
    const buttonIndex = Array.from(buttons).indexOf(button);
    const tabIds = ['home-tab', 'search-tab', 'library-tab', 'settings-tab'];
    return tabIds[buttonIndex];
  }

  async showTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Validate tab exists
    const targetTab = document.getElementById(tabId);
    if (!targetTab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    // Remove active states
    this.clearActiveStates();
    
    // Add active states
    targetTab.classList.add('active');
    this.updateNavButton(tabId);
    
    // Handle tab-specific initialization
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
    const tabIndex = ['home-tab', 'search-tab', 'library-tab', 'settings-tab'].indexOf(tabId);
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons[tabIndex]) {
      navButtons[tabIndex].classList.add('active');
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
      if (playerSelect) playerSelect.value = this.getPlayerChoice();
      
      const debridConfig = this.getDebridConfig();
      if (debridService) debridService.value = debridConfig.service;
      if (debridApiKey) debridApiKey.value = debridConfig.apiKey;

      this.clearStatusMessages();
      this.renderAddonList();
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
    if (apiKey && typeof loadHomeCatalogs === 'function') {
      try {
        await loadHomeCatalogs();
      } catch (error) {
        console.error('Error loading home content:', error);
      }
    }
  }

  getPlayerChoice() {
    return localStorage.getItem('preferred_player') || 'internal';
  }

  getDebridConfig() {
    const config = localStorage.getItem('debrid_config');
    return config ? JSON.parse(config) : { service: 'none', apiKey: '' };
  }

  clearStatusMessages() {
    ['api-key-status', 'player-status', 'debrid-status'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = '';
    });
  }

  renderAddonList() {
    if (typeof renderAddonList === 'function') {
      renderAddonList();
    }
  }

  showErrorMessage(message) {
    // Create or update error notification
    let errorDiv = document.getElementById('error-notification');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'error-notification';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
        font-size: 14px;
      `;
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

// Enhanced API Helper with caching and better error handling
class APIHelper {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async cachedFetch(url, options = {}) {
    const cacheKey = url + JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

// Initialize the enhanced tab manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing enhanced tab manager...');
  
  // Initialize tab manager
  window.tabManager = new TabManager();
  window.apiHelper = new APIHelper();
  
  // Remove the old showTab function and replace with new one
  window.showTab = function(tabId) {
    return window.tabManager.showTab(tabId);
  };

  console.log('Enhanced tab manager initialized successfully');
});

// Fixed debrid configuration saving
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
    
    // Provide user feedback
    if (service === 'none') {
      statusDiv.textContent = 'Debrid service disabled. External players will receive magnet links.';
      statusDiv.style.color = '#ffaa00';
    } else if (apiKey) {
      statusDiv.textContent = `${service} configuration saved! External players will get HTTP streams.`;
      statusDiv.style.color = '#88ff88';
    } else {
      statusDiv.textContent = 'Please enter your debrid API key.';
      statusDiv.style.color = '#ff8888';
      return;
    }
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 3000);
    
  } catch (error) {
    console.error('Error saving debrid config:', error);
    const statusDiv = document.getElementById('debrid-status');
    if (statusDiv) {
      statusDiv.textContent = 'Error saving configuration';
      statusDiv.style.color = '#ff8888';
    }
  }
}

// Make the function globally available
window.saveDebridConfig = saveDebridConfig;