/**
 * @file collection-filters.js
 * @purpose Handles Real-Time Ajax Filtering, Sorting, and Load More Pagination.
 * @dependencies window.AERIDIAN namespace, Fetch API, DOMParser
 * @publicAPI init(), destroy(), reInit()
 * @lifecycle Managed by ThemeEngine during shopify:section:load and unload.
 * @author AERIDIAN Core Team
 * @lastUpdated 2026-06-25
 */

(function () {
  'use strict';

  if (window.AERIDIAN && window.AERIDIAN.Modules.CollectionFilters) {
    return;
  }

  window.AERIDIAN.Utils.mark('CollectionFilters:Start');

  class AeridianCollectionFilters {
    constructor() {
      this._events = [];
      this.abortController = null;
      this.init();
    }

    on(element, event, handler, options = false) {
      if (!element) {
        return;
      }
      element.addEventListener(event, handler, options);
      this._events.push({ element, event, handler, options });
    }

    init() {
      this.form = document.getElementById('CollectionFilterForm');
      this.gridContainer = document.getElementById('ProductGridContainer');
      this.activeFiltersContainer = document.getElementById('ActiveFiltersContainer');
      this.sortSelect = document.getElementById('CollectionSort');

      if (!this.form || !this.gridContainer) {
        return;
      }

      this.bindEvents();
    }

    destroy() {
      // 1. Unbind DOM Events
      this._events.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this._events = [];

      // 2. Abort pending fetches
      if (this.abortController) {
        this.abortController.abort();
      }

      if (this._debounceTimeout) {
        clearTimeout(this._debounceTimeout);
      }

      window.AERIDIAN.Utils.log('CollectionFilters', 'destroyed');
    }

    reInit() {
      this.destroy();
      this.init();
      window.AERIDIAN.Utils.log('CollectionFilters', 're-initialized');
    }

    bindEvents() {
      // 1. Checkbox changes
      this.on(this.form, 'change', (e) => {
        if (e.target.classList.contains('js-filter-checkbox')) {
          this.submitFilters();
        }
      });

      // 2. Price Input changes (Debounced)
      this.on(this.form, 'input', (e) => {
        if (e.target.type === 'number') {
          if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
          }
          this._debounceTimeout = setTimeout(() => this.submitFilters(), 500);
        }
      });

      // 3. Sorting changes
      if (this.sortSelect) {
        this.on(this.sortSelect, 'change', () => this.submitFilters());
      }

      // 4. Remove active filters / Clear all
      if (this.activeFiltersContainer) {
        this.on(this.activeFiltersContainer, 'click', (e) => {
          if (
            e.target.classList.contains('js-remove-filter') ||
            e.target.classList.contains('js-clear-filters')
          ) {
            e.preventDefault();
            this.fetchAndUpdate(e.target.getAttribute('href'));
          }
        });
      }

      // 5. Load More Pagination
      this.bindLoadMore();
    }

    submitFilters() {
      // Gather form data
      const formData = new FormData(this.form);
      const searchParams = new URLSearchParams(formData);

      // Add sorting
      if (this.sortSelect) {
        searchParams.set('sort_by', this.sortSelect.value);
      }

      // Construct URL
      const url = `${window.location.pathname}?${searchParams.toString()}`;
      this.fetchAndUpdate(url);
    }

    fetchAndUpdate(url) {
      // Update URL without reloading
      window.history.replaceState({ path: url }, '', url);

      // Fade out grid (GSAP if available)
      const grid = document.getElementById('CollectionGrid');
      if (grid && window.gsap) {
        gsap.to(grid, { opacity: 0.5, duration: 0.2 });
      } else if (grid) {
        grid.classList.add('is-loading');
      }

      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      fetch(url, { signal: this.abortController.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Update Grid
          const newGridContainer = doc.getElementById('ProductGridContainer');
          if (newGridContainer) {
            this.gridContainer.replaceChildren(...newGridContainer.childNodes);
          }

          // Update Sidebar Form (to get new product counts)
          const newForm = doc.getElementById('CollectionFilterForm');
          if (newForm) {
            this.form.replaceChildren(...newForm.childNodes);
          }

          // Update Active Filters
          const newActive = doc.getElementById('ActiveFiltersContainer');
          if (newActive && this.activeFiltersContainer) {
            this.activeFiltersContainer.replaceChildren(...newActive.childNodes);
          }

          // We destroyed old elements, so we must rebind
          this.reInit();

          if (window.AERIDIAN && window.AERIDIAN.Modules.MotionEngine) {
            window.AERIDIAN.Modules.MotionEngine.initScrollReveal();
            window.AERIDIAN.Modules.MotionEngine.initMagneticElements(); // Rebind magnetic classes to new buttons
          }

          // Fade in grid
          const updatedGrid = document.getElementById('CollectionGrid');
          if (updatedGrid && window.gsap) {
            gsap.fromTo(
              updatedGrid,
              { opacity: 0.5, y: 10 },
              { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
          } else if (updatedGrid) {
            updatedGrid.classList.remove('is-loading');
          }
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            return;
          }
          console.error('AERIDIAN Filter Error:', err);
        });
    }

    // --- Load More Logic ---
    bindLoadMore() {
      const loadBtn = document.querySelector('.js-load-more');
      if (!loadBtn) {
        return;
      }

      this.on(loadBtn, 'click', (e) => {
        e.preventDefault();
        const nextUrl = loadBtn.getAttribute('data-next-url');
        if (!nextUrl) {
          return;
        }

        loadBtn.classList.add('is-loading');

        if (this.abortController) {
          this.abortController.abort();
        }
        this.abortController = new AbortController();

        fetch(nextUrl, { signal: this.abortController.signal })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.text();
          })
          .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newGrid = doc.getElementById('CollectionGrid');
            const newPagination = doc.querySelector('.cg-pagination');

            if (newGrid) {
              // Append new items
              const currentGrid = document.getElementById('CollectionGrid');
              const newItems = Array.from(newGrid.children);
              const fragment = document.createDocumentFragment();

              newItems.forEach((item, _index) => {
                fragment.appendChild(item);
              });

              currentGrid.appendChild(fragment);

              newItems.forEach((item, index) => {
                // Staggered reveal for new items
                if (window.gsap) {
                  gsap.fromTo(
                    item,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: index * 0.05 }
                  );
                }
              });
            }

            // Replace pagination container
            const currentPagination = document.querySelector('.cg-pagination');
            if (newPagination) {
              currentPagination.replaceChildren(...newPagination.childNodes);
              // We replaced the button, so we need to rebind it
              this.reInit();
              if (window.AERIDIAN && window.AERIDIAN.Modules.MotionEngine) {
                window.AERIDIAN.Modules.MotionEngine.initMagneticElements();
              }
            } else {
              currentPagination.remove(); // No more pages
            }
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              return;
            }
            console.error('AERIDIAN Load More Error:', err);
          });
      });
    }
  }

  // Initialize
  const initEngine = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.AERIDIAN.Modules.CollectionFilters = new AeridianCollectionFilters();
        window.AERIDIAN.Utils.log('CollectionFilters', 'initialized');
        window.AERIDIAN.Utils.mark('CollectionFilters:End');
        window.AERIDIAN.Utils.measure(
          'CollectionFilters:Init',
          'CollectionFilters:Start',
          'CollectionFilters:End'
        );
      });
    } else {
      window.AERIDIAN.Modules.CollectionFilters = new AeridianCollectionFilters();
      window.AERIDIAN.Utils.log('CollectionFilters', 'initialized');
      window.AERIDIAN.Utils.mark('CollectionFilters:End');
      window.AERIDIAN.Utils.measure(
        'CollectionFilters:Init',
        'CollectionFilters:Start',
        'CollectionFilters:End'
      );
    }
  };

  initEngine();
})();
