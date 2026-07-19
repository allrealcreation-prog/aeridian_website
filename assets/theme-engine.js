/**
 * @file theme-engine.js
 * @purpose Core state mutation, OS tracking, and Shopify event dispatching.
 * @dependencies window.AERIDIAN namespace
 * @publicAPI init(), destroy(), setTheme()
 * @lifecycle Instantiated on load. Handles global DOMContentLoaded and shopify:section:load.
 * @author AERIDIAN Core Team
 * @lastUpdated 2026-06-25
 */

(function () {
  'use strict';

  if (window.AERIDIAN && window.AERIDIAN.Modules.ThemeEngine) {
    return;
  } // Singleton Guard

  window.AERIDIAN.Utils.mark('ThemeEngine:Start');

  class AeridianThemeEngine {
    constructor() {
      this.html = document.documentElement;
      this.storageKey = 'aeridian_theme';
      this.activeTheme = this.html.getAttribute('data-theme') || 'dark';

      this.autoSwitchEnabled = window.AERIDIAN.State.Settings?.autoSwitch || false;

      // Bound Handlers
      this._handleOSChange = this.handleOSChange.bind(this);
      this._handleToggleClick = this.handleToggleClick.bind(this);
      this._handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);

      this.init();
      window.AERIDIAN.Utils.log('ThemeEngine', 'initialized');
    }

    init() {
      this.bindOSListener();
      this.bindShopifySectionEvents();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this._handleDOMContentLoaded);
      } else {
        this.bindUIControls();
      }
    }

    destroy() {
      window
        .matchMedia('(prefers-color-scheme: light)')
        .removeEventListener('change', this._handleOSChange);
      document.removeEventListener('DOMContentLoaded', this._handleDOMContentLoaded);

      const toggleBtn = document.getElementById('ThemeToggle');
      if (toggleBtn) {
        toggleBtn.removeEventListener('click', this._handleToggleClick);
      }
      window.AERIDIAN.Utils.log('ThemeEngine', 'destroyed');
    }

    reInit() {
      this.destroy();
      this.init();
      window.AERIDIAN.Utils.log('ThemeEngine', 're-initialized');
    }

    setTheme(theme, isManual = false) {
      if (this.activeTheme === theme) {
        return;
      }

      this.activeTheme = theme;
      this.html.setAttribute('data-theme', theme);
      window.AERIDIAN.Utils.log('ThemeEngine', `switched to ${theme}`);

      if (isManual) {
        localStorage.setItem(this.storageKey, theme);
        this.autoSwitchEnabled = false; // Disable auto if user manually picks
      }

      // Dispatch global event for WebGL/Canvas listeners (like Three.js)
      window.dispatchEvent(
        new CustomEvent('AeridianThemeChange', {
          detail: { theme: this.activeTheme },
        })
      );

      this.updateToggleUI();
    }

    setSystemPreference() {
      localStorage.removeItem(this.storageKey);
      const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      this.setTheme(isLight ? 'light' : 'dark');
      this.autoSwitchEnabled = false;
    }

    handleOSChange(e) {
      // Only react if user hasn't explicitly set a preference
      if (!localStorage.getItem(this.storageKey) && !this.autoSwitchEnabled) {
        this.setTheme(e.matches ? 'light' : 'dark');
      }
    }

    bindOSListener() {
      window
        .matchMedia('(prefers-color-scheme: light)')
        .addEventListener('change', this._handleOSChange);
    }

    handleToggleClick() {
      const newTheme = this.activeTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme, true);
    }

    handleDOMContentLoaded() {
      this.bindUIControls();
    }

    bindUIControls() {
      const toggleBtn = document.getElementById('ThemeToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', this._handleToggleClick);
      }
      this.updateToggleUI();
    }

    updateToggleUI() {
      const sunIcon = document.querySelector('.theme-icon-sun');
      const moonIcon = document.querySelector('.theme-icon-moon');
      if (!sunIcon || !moonIcon) {
        return;
      }

      // Show Sun icon in Light mode, Moon icon in Dark mode
      if (this.activeTheme === 'light') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    }

    bindShopifySectionEvents() {
      document.addEventListener('shopify:section:unload', (e) => {
        const id = e.detail.sectionId;
        window.AERIDIAN.Utils.log('ThemeEngine', `Shopify Section Unloaded: ${id}`);
        // Handle Three.js cleanup if discovery section unloads
        if (
          e.target.querySelector('.cd-universe__sticky') &&
          window.AERIDIAN.Modules.Explorer &&
          window.AERIDIAN.Modules.Explorer.destroyThree
        ) {
          window.AERIDIAN.Modules.Explorer.destroyThree();
        }
        // If Product form unloads
        if (e.target.querySelector('#ProductForm') && window.AERIDIAN.Modules.ProductForm) {
          window.AERIDIAN.Modules.ProductForm.destroy();
        }
        if (
          e.target.querySelector('#CollectionFilterForm') &&
          window.AERIDIAN.Modules.CollectionFilters
        ) {
          window.AERIDIAN.Modules.CollectionFilters.destroy();
        }
      });

      document.addEventListener('shopify:section:load', (e) => {
        const id = e.detail.sectionId;
        window.AERIDIAN.Utils.log('ThemeEngine', `Shopify Section Loaded: ${id}`);
        // Re-init modules if they exist in the new DOM
        if (e.target.querySelector('#ProductForm') && window.AERIDIAN.Modules.ProductForm) {
          window.AERIDIAN.Modules.ProductForm.reInit();
        }
        if (
          e.target.querySelector('#CollectionFilterForm') &&
          window.AERIDIAN.Modules.CollectionFilters
        ) {
          window.AERIDIAN.Modules.CollectionFilters.reInit();
        }
        if (window.AERIDIAN.Modules.MotionEngine) {
          window.AERIDIAN.Modules.MotionEngine.reInit();
        }
      });

      document.addEventListener('shopify:section:select', (e) => {
        window.AERIDIAN.Utils.log('ThemeEngine', `Shopify Section Selected: ${e.detail.sectionId}`);
        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      });

      document.addEventListener('shopify:section:deselect', (e) => {
        window.AERIDIAN.Utils.log(
          'ThemeEngine',
          `Shopify Section Deselected: ${e.detail.sectionId}`
        );
        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      });
    }
  }

  // Initialize immediately so methods are available
  window.AERIDIAN.Modules.ThemeEngine = new AeridianThemeEngine();

  window.AERIDIAN.Utils.mark('ThemeEngine:End');
  window.AERIDIAN.Utils.measure('ThemeEngine:Init', 'ThemeEngine:Start', 'ThemeEngine:End');
})();
