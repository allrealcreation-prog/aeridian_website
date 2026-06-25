/**
 * AERIDIAN Collection Filters Engine
 * Handles Real-Time Ajax Filtering, Sorting, and Load More Pagination.
 */

class AeridianCollectionFilters {
  constructor() {
    this.form = document.getElementById('CollectionFilterForm');
    this.gridContainer = document.getElementById('ProductGridContainer');
    this.activeFiltersContainer = document.getElementById('ActiveFiltersContainer');
    this.sortSelect = document.getElementById('CollectionSort');
    
    if (!this.form || !this.gridContainer) return;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Checkbox changes
    this.form.addEventListener('change', (e) => {
      if(e.target.classList.contains('js-filter-checkbox')) {
        this.submitFilters();
      }
    });

    // 2. Price Input changes (Debounced)
    let timeout;
    this.form.addEventListener('input', (e) => {
      if(e.target.type === 'number') {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.submitFilters(), 500);
      }
    });

    // 3. Sorting changes
    if(this.sortSelect) {
      this.sortSelect.addEventListener('change', () => this.submitFilters());
    }

    // 4. Remove active filters / Clear all
    if(this.activeFiltersContainer) {
      this.activeFiltersContainer.addEventListener('click', (e) => {
        if(e.target.classList.contains('js-remove-filter') || e.target.classList.contains('js-clear-filters')) {
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
    if(this.sortSelect) {
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
    if(grid && window.gsap) {
      gsap.to(grid, { opacity: 0.5, duration: 0.2 });
    } else if (grid) {
      grid.classList.add('is-loading');
    }

    fetch(url)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Update Grid
        const newGridContainer = doc.getElementById('ProductGridContainer');
        if(newGridContainer) {
          this.gridContainer.innerHTML = newGridContainer.innerHTML;
        }

        // Update Sidebar Form (to get new product counts)
        const newForm = doc.getElementById('CollectionFilterForm');
        if(newForm) {
          this.form.innerHTML = newForm.innerHTML;
        }

        // Update Active Filters
        const newActive = doc.getElementById('ActiveFiltersContainer');
        if(newActive && this.activeFiltersContainer) {
          this.activeFiltersContainer.innerHTML = newActive.innerHTML;
        }

        // Re-bind Load More and Scroll Reveals
        this.bindLoadMore();
        if(window.MotionEngine) {
          window.MotionEngine.initScrollReveal();
          window.MotionEngine.initMagneticElements(); // Rebind magnetic classes to new buttons
        }

        // Fade in grid
        const updatedGrid = document.getElementById('CollectionGrid');
        if(updatedGrid && window.gsap) {
          gsap.fromTo(updatedGrid, { opacity: 0.5, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        } else if (updatedGrid) {
          updatedGrid.classList.remove('is-loading');
        }
      })
      .catch(err => console.error('AERIDIAN Filter Error:', err));
  }

  // --- Load More Logic ---
  bindLoadMore() {
    const loadBtn = document.querySelector('.js-load-more');
    if(!loadBtn) return;

    loadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nextUrl = loadBtn.getAttribute('data-next-url');
      if(!nextUrl) return;

      loadBtn.classList.add('is-loading');

      fetch(nextUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const newGrid = doc.getElementById('CollectionGrid');
          const newPagination = doc.querySelector('.cg-pagination');

          if(newGrid) {
            // Append new items
            const currentGrid = document.getElementById('CollectionGrid');
            const newItems = Array.from(newGrid.children);
            
            newItems.forEach((item, index) => {
              currentGrid.appendChild(item);
              // Staggered reveal for new items
              if(window.gsap) {
                gsap.fromTo(item, 
                  { opacity: 0, y: 30 }, 
                  { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: index * 0.05 }
                );
              }
            });
          }

          // Replace pagination container
          const currentPagination = document.querySelector('.cg-pagination');
          if(newPagination) {
            currentPagination.innerHTML = newPagination.innerHTML;
            this.bindLoadMore(); // Rebind new button
            if(window.MotionEngine) window.MotionEngine.initMagneticElements();
          } else {
            currentPagination.remove(); // No more pages
          }
        })
        .catch(err => console.error('AERIDIAN Load More Error:', err));
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new AeridianCollectionFilters();
});
