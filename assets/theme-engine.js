/**
 * AERIDIAN Theme Engine
 * Controls state mutation, OS tracking, and event dispatching.
 */

class AeridianThemeEngine {
  constructor() {
    this.html = document.documentElement;
    this.storageKey = 'aeridian_theme';
    this.activeTheme = this.html.getAttribute('data-theme') || 'dark';
    
    // Read Shopify Admin settings passed via window object in layout
    this.autoSwitchEnabled = window.AeridianSettings?.autoSwitch || false;
    
    this.init();
  }

  init() {
    this.bindOSListener();
    this.bindUIControls();
  }

  setTheme(theme, isManual = false) {
    if (this.activeTheme === theme) return;
    
    this.activeTheme = theme;
    this.html.setAttribute('data-theme', theme);
    
    if (isManual) {
      localStorage.setItem(this.storageKey, theme);
      this.autoSwitchEnabled = false; // Disable auto if user manually picks
    }

    // Dispatch global event for WebGL/Canvas listeners (like Three.js)
    window.dispatchEvent(new CustomEvent('AeridianThemeChange', {
      detail: { theme: this.activeTheme }
    }));

    this.updateToggleUI();
  }

  setSystemPreference() {
    localStorage.removeItem(this.storageKey);
    const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    this.setTheme(isLight ? 'light' : 'dark');
    this.autoSwitchEnabled = false;
  }

  bindOSListener() {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      // Only react if user hasn't explicitly set a preference
      if (!localStorage.getItem(this.storageKey) && !this.autoSwitchEnabled) {
        this.setTheme(e.matches ? 'light' : 'dark');
      }
    });
  }

  bindUIControls() {
    // Wait for DOM to be fully interactive before binding buttons
    document.addEventListener('DOMContentLoaded', () => {
      const toggleBtn = document.getElementById('ThemeToggle');
      
      if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const newTheme = this.activeTheme === 'dark' ? 'light' : 'dark';
          this.setTheme(newTheme, true);
        });
      }
      
      this.updateToggleUI();
    });
  }

  updateToggleUI() {
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    if (!sunIcon || !moonIcon) return;
    
    // Show Sun icon in Light mode, Moon icon in Dark mode
    if (this.activeTheme === 'light') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }
}

// Initialize immediately so methods are available
window.ThemeEngine = new AeridianThemeEngine();
