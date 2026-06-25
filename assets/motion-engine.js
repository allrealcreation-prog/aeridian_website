/**
 * @file motion-engine.js
 * @purpose Handles complex GSAP animations, magnetic buttons, and ScrollTrigger logic.
 * @dependencies window.AERIDIAN namespace, GSAP, ScrollTrigger
 * @publicAPI init(), destroy(), reInit()
 * @lifecycle Managed by ThemeEngine during shopify:section:load and unload.
 * @author AERIDIAN Core Team
 * @lastUpdated 2026-06-25
 */

(function () {
  'use strict';

  if (window.AERIDIAN && window.AERIDIAN.Modules.MotionEngine) {
    return;
  }

  window.AERIDIAN.Utils.mark('MotionEngine:Start');

  class AeridianMotionEngine {
    constructor() {
      this.settings = window.AERIDIAN.State.Settings || {};
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._events = []; // Registry for all event listeners
      this._gsapTickers = []; // Registry for GSAP ticker functions

      // Default config fallbacks
      this.config = {
        enableCursor: this.settings.enableCursor !== false, // default true
        enableMagnetic: this.settings.enableMagnetic !== false,
        enablePageTransitions: this.settings.enablePageTransitions !== false,
        enableScrollProgress: this.settings.enableScrollProgress !== false,
      };

      this._handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);

      if (this.reducedMotion) {
        return;
      }

      this.init();
    }

    // Event Registration Helper
    on(element, event, handler, options = false) {
      if (!element) {
        return;
      }
      element.addEventListener(event, handler, options);
      this._events.push({ element, event, handler, options });
    }

    init() {
      if (document.readyState === 'loading') {
        this.on(document, 'DOMContentLoaded', this._handleDOMContentLoaded);
      } else {
        this.handleDOMContentLoaded();
      }
    }

    handleDOMContentLoaded() {
      this.initPageTransitionEnter();

      if (this.config.enableCursor) {
        this.initCustomCursor();
      }
      if (this.config.enableMagnetic) {
        this.initMagneticElements();
      }
      if (this.config.enableScrollProgress) {
        this.initScrollProgress();
      }
      if (this.config.enablePageTransitions) {
        this.initPseudoSPA();
      }

      this.initScrollReveal();
    }

    destroy() {
      // 1. Unbind all DOM Events
      this._events.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this._events = [];

      // 2. Unbind GSAP Tickers
      if (window.gsap && window.gsap.ticker) {
        this._gsapTickers.forEach((ticker) => {
          gsap.ticker.remove(ticker);
        });
      }
      this._gsapTickers = [];

      // 3. Kill GSAP ScrollTriggers
      if (window.ScrollTrigger) {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      }

      window.AERIDIAN.Utils.log('MotionEngine', 'destroyed');
    }

    reInit() {
      this.destroy();
      this.init();
      window.AERIDIAN.Utils.log('MotionEngine', 're-initialized');
    }

    // --- 1. PSEUDO SPA ROUTING ---
    initPseudoSPA() {
      const overlay = document.getElementById('GlobalTransitionOverlay');
      if (!overlay) {
        return;
      }

      this.on(document, 'click', (e) => {
        // Find closest anchor
        const link = e.target.closest('a');
        if (!link) {
          return;
        }

        const href = link.getAttribute('href');

        // Exclusions
        if (
          !href ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          link.target === '_blank' ||
          link.hasAttribute('download') ||
          href.includes('/cart/add') || // Add to cart
          link.classList.contains('no-transition') ||
          e.ctrlKey ||
          e.metaKey // Let user open new tabs
        ) {
          return;
        }

        // Check if same origin
        if (link.hostname !== window.location.hostname) {
          return;
        }

        e.preventDefault();
        this.executePageExit(href, overlay);
      });

      // Prefetch on hover
      this.on(
        document,
        'mouseover',
        (e) => {
          const link = e.target.closest('a');
          if (!link) {
            return;
          }

          const href = link.getAttribute('href');
          if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('mailto') ||
            link.hostname !== window.location.hostname
          ) {
            return;
          }

          // Ensure we only prefetch once per link
          if (!link.dataset.prefetched) {
            link.dataset.prefetched = 'true';
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
          }
        },
        { passive: true }
      );
    }

    executePageExit(href, overlay) {
      overlay.classList.add('is-active');

      // Cinematic Exit Animation (Softened)
      gsap.to('main', {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          window.location.href = href;
        },
      });
    }

    initPageTransitionEnter() {
      const overlay = document.getElementById('GlobalTransitionOverlay');
      if (overlay) {
        // If navigating normally, the overlay might flash.
        // We ensure it starts active, then fades out on load.
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';

        gsap.to(overlay, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            overlay.classList.remove('is-active');
            overlay.style.visibility = 'hidden';
          },
        });
      }

      // Main content cascades in
      gsap.from('main', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
      });
    }

    // --- 2. CUSTOM CURSOR ---
    initCustomCursor() {
      // Only apply on fine pointer devices (desktops)
      if (!window.matchMedia('(pointer: fine)').matches) {
        return;
      }

      const cursor = document.getElementById('CustomCursor');
      if (!cursor) {
        return;
      }

      document.body.classList.add('has-custom-cursor');

      let mouseX = 0,
        mouseY = 0;
      let cursorX = 0,
        cursorY = 0;

      this.on(document, 'mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      // Smooth follow loop using GSAP ticker
      const tickerFn = () => {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        gsap.set(cursor, { x: cursorX, y: cursorY });
      };

      gsap.ticker.add(tickerFn);
      this._gsapTickers.push(tickerFn);

      // Hover states for links and buttons
      const interactables = document.querySelectorAll('a, button, .js-magnetic, .theme-card');
      interactables.forEach((el) => {
        this.on(el, 'mouseenter', () => cursor.classList.add('is-hovering'));
        this.on(el, 'mouseleave', () => cursor.classList.remove('is-hovering'));
      });
    }

    // --- 3. MAGNETIC ELEMENTS ---
    initMagneticElements() {
      const magnetics = document.querySelectorAll('.js-magnetic');

      magnetics.forEach((el) => {
        this.on(el, 'mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;

          // Intensity scaling - Refined for luxury
          const intensity = el.getAttribute('data-magnetic-intensity') || 0.3;
          const maxPull = 8;

          const pullX = Math.max(-maxPull, Math.min(maxPull, x * intensity));
          const pullY = Math.max(-maxPull, Math.min(maxPull, y * intensity));

          gsap.to(el, { x: pullX, y: pullY, duration: 0.3, ease: 'power3.out' });
        });

        this.on(el, 'mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        });
      });
    }

    // --- 4. SCROLL PROGRESS BAR ---
    initScrollProgress() {
      const bar = document.getElementById('ScrollProgressBar');
      if (!bar) {
        return;
      }

      this.on(
        window,
        'scroll',
        () => {
          const scrollPx = document.documentElement.scrollTop;
          const winHeightPx =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;
          bar.style.width = `${scrolled}%`;
        },
        { passive: true }
      );
    }

    // --- 5. SCROLL REVEAL (GSAP SCROLLTRIGGER) ---
    initScrollReveal() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const reveals = document.querySelectorAll('[data-scroll-reveal]');

      reveals.forEach((el) => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%', // Reveal when element is 85% down viewport
            toggleActions: 'play none none reverse',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        });
      });
    }
  }

  // Initialize immediately so methods are available
  window.AERIDIAN.Modules.MotionEngine = new AeridianMotionEngine();

  window.AERIDIAN.Utils.log('MotionEngine', 'initialized');
  window.AERIDIAN.Utils.mark('MotionEngine:End');
  window.AERIDIAN.Utils.measure('MotionEngine:Init', 'MotionEngine:Start', 'MotionEngine:End');
})();
