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

  window.AERIDIAN = window.AERIDIAN || {};
  window.AERIDIAN.Modules = window.AERIDIAN.Modules || {};

  // Centralized RequestAnimationFrame Dispatcher
  window.AERIDIAN.RAF = {
    callbacks: new Map(),
    isRunning: false,
    add: function (id, callback) {
      this.callbacks.set(id, callback);
      this.start();
    },
    remove: function (id) {
      this.callbacks.delete(id);
    },
    start: function () {
      if (this.isRunning) {
        return;
      }
      this.isRunning = true;
      const loop = (time) => {
        if (this.callbacks.size === 0) {
          this.isRunning = false;
          return;
        }
        this.callbacks.forEach((cb) => cb(time));
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
  };

  if (window.AERIDIAN && window.AERIDIAN.Modules.MotionEngine) {
    return;
  }

  window.AERIDIAN.Utils.mark('MotionEngine:Start');

  // --- 1. STORYTELLING REGISTRY ---
  window.AERIDIAN.Utils.Storytelling = {
    registry: [],
    register: function (config) {
      if (config && config.selector && config.timeline) {
        this.registry.push(config);
      }
    },
  };

  // --- 2. TEXT SPLITTER UTILITY ---
  class TextSplitter {
    constructor(element, options = {}) {
      this.element = element;
      this.type = options.type || 'words';
      if (!this.element.dataset.originalHtml) {
        this.element.dataset.originalHtml = this.element.innerHTML;
      }
      this.isProcessed = false;
    }

    split() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      if (this.isProcessed) {
        return;
      }

      const text = this.element.textContent.trim();
      if (!text) {
        return;
      }

      this.element.setAttribute('aria-label', text);
      this.element.innerHTML = '';

      if (this.type === 'chars') {
        const words = text.split(' ');
        words.forEach((word, wordIdx) => {
          const wordSpan = document.createElement('span');
          wordSpan.style.display = 'inline-block';
          wordSpan.style.whiteSpace = 'nowrap';

          word.split('').forEach((char) => {
            const charWrapper = document.createElement('span');
            charWrapper.style.display = 'inline-block';
            charWrapper.style.overflow = 'hidden';

            const charInner = document.createElement('span');
            charInner.style.display = 'inline-block';
            charInner.textContent = char;
            charInner.setAttribute('aria-hidden', 'true');
            charInner.classList.add('split-char');

            charWrapper.appendChild(charInner);
            wordSpan.appendChild(charWrapper);
          });

          this.element.appendChild(wordSpan);
          if (wordIdx < words.length - 1) {
            this.element.appendChild(document.createTextNode(' '));
          }
        });
      } else {
        const words = text.split(' ');
        words.forEach((word, wordIdx) => {
          const wordWrapper = document.createElement('span');
          wordWrapper.style.display = 'inline-block';
          wordWrapper.style.overflow = 'hidden';
          wordWrapper.style.verticalAlign = 'bottom';

          const wordInner = document.createElement('span');
          wordInner.style.display = 'inline-block';
          wordInner.textContent = word;
          wordInner.setAttribute('aria-hidden', 'true');
          wordInner.classList.add('split-word');

          wordWrapper.appendChild(wordInner);
          this.element.appendChild(wordWrapper);

          if (wordIdx < words.length - 1) {
            this.element.appendChild(document.createTextNode(' '));
          }
        });
      }
      this.isProcessed = true;
    }

    restore() {
      if (this.element.dataset.originalHtml && this.isProcessed) {
        this.element.innerHTML = this.element.dataset.originalHtml;
        this.element.removeAttribute('aria-label');
        this.isProcessed = false;
      }
    }
  }
  window.AERIDIAN.Utils.TextSplitter = TextSplitter;

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
      this.initGSAPDefaults();
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

    initGSAPDefaults() {
      if (!window.gsap) {
        return;
      }

      // Extract raw CSS variable values for standard use
      const styles = getComputedStyle(document.documentElement);
      const standardDuration = parseFloat(styles.getPropertyValue('--motion-medium')) / 1000 || 0.6;

      // Global GSAP Defaults
      gsap.defaults({
        duration: standardDuration,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      // Expose AERIDIAN Motion Utility API
      window.AERIDIAN.Utils.Motion = {
        fadeIn: (targets, vars = {}) => gsap.to(targets, { opacity: 1, ...vars }),
        fadeOut: (targets, vars = {}) => gsap.to(targets, { opacity: 0, ...vars }),
        slideUp: (targets, vars = {}) =>
          gsap.fromTo(
            targets,
            { y: 'var(--motion-distance-lg)', opacity: 0 },
            { y: 0, opacity: 1, ...vars }
          ),
        slideDown: (targets, vars = {}) =>
          gsap.fromTo(
            targets,
            { y: 'calc(var(--motion-distance-lg) * -1)', opacity: 0 },
            { y: 0, opacity: 1, ...vars }
          ),
        scaleIn: (targets, vars = {}) =>
          gsap.fromTo(
            targets,
            { scale: 'var(--motion-scale-sm)', opacity: 0 },
            { scale: 1, opacity: 1, transformOrigin: 'center center', ...vars }
          ),
        scaleOut: (targets, vars = {}) =>
          gsap.fromTo(
            targets,
            { scale: 'var(--motion-scale-lg)', opacity: 1 },
            { scale: 1, opacity: 0, transformOrigin: 'center center', ...vars }
          ),
        staggerReveal: (targets, vars = {}) =>
          gsap.fromTo(
            targets,
            { y: 'var(--motion-distance-md)', opacity: 0 },
            { y: 0, opacity: 1, stagger: 'var(--stagger-md)', ...vars }
          ),
        parallax: (targets, speed = 0.5) => {
          if (window.ScrollTrigger) {
            return gsap.to(targets, {
              yPercent: 20 * speed,
              ease: 'none',
              scrollTrigger: {
                trigger: targets,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            });
          }
        },
        magnetic: (element, xMultiplier = 1, yMultiplier = 1) => {
          if (!element || !window.gsap) {
            return;
          }
          const bound = element.getBoundingClientRect();
          const centerX = bound.left + bound.width / 2;
          const centerY = bound.top + bound.height / 2;
          return (e) => {
            const x = (e.clientX - centerX) * xMultiplier;
            const y = (e.clientY - centerY) * yMultiplier;
            gsap.to(element, { x, y, duration: 0.3, ease: 'power2.out' });
          };
        },
      };

      // Typography Sub-Module
      window.AERIDIAN.Utils.Motion.Typography = {
        revealLevelA: (element, vars = {}) => {
          const splitter = new window.AERIDIAN.Utils.TextSplitter(element, { type: 'chars' });
          splitter.split();
          const chars = element.querySelectorAll('.split-char');
          return gsap.fromTo(
            chars,
            { y: '100%', opacity: 0 },
            { y: '0%', opacity: 1, stagger: 0.02, duration: 0.8, ease: 'power4.out', ...vars }
          );
        },
        revealLevelB: (element, vars = {}) => {
          const splitter = new window.AERIDIAN.Utils.TextSplitter(element, { type: 'words' });
          splitter.split();
          const words = element.querySelectorAll('.split-word');
          return gsap.fromTo(
            words,
            { y: '100%', opacity: 0 },
            { y: '0%', opacity: 1, stagger: 0.05, duration: 0.8, ease: 'power3.out', ...vars }
          );
        },
        revealLevelC: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { y: 'var(--motion-distance-sm)', opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', ...vars }
          );
        },
        revealLevelD: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: 'power2.out', ...vars }
          );
        },
      };

      // ImageReveals Sub-Module
      window.AERIDIAN.Utils.Motion.ImageReveals = {
        revealMask: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { clipPath: 'inset(100% 0 0 0)' },
            { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power3.inOut', ...vars }
          );
        },
        revealBlur: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { filter: 'blur(20px)', opacity: 0 },
            {
              filter: 'blur(0px)',
              opacity: 1,
              duration: 1.0,
              ease: 'power2.out',
              clearProps: 'filter',
              ...vars,
            }
          );
        },
        revealClipPath: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { clipPath: 'circle(0% at center)' },
            { clipPath: 'circle(100% at center)', duration: 1.5, ease: 'power4.inOut', ...vars }
          );
        },
        revealOpacity: (element, vars = {}) => {
          return gsap.fromTo(
            element,
            { opacity: 0 },
            { opacity: 1, duration: 1.2, ease: 'power2.out', ...vars }
          );
        },
      };

      // MatchMedia Accessibility Hook
      if (window.gsap.matchMedia) {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: reduce)', () => {
          gsap.ticker.fps(1); // Dramatically reduce ticker updates
          gsap.globalTimeline.timeScale(1000); // Instantly finish all timelines
        });
      }
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

    // --- 2. CUSTOM CURSOR (STATE MACHINE) ---
    initCustomCursor() {
      // Only apply on fine pointer devices (desktops)
      if (!window.matchMedia('(pointer: fine)').matches) {
        return;
      }

      const cursor = document.getElementById('CustomCursor');
      if (!cursor || !window.gsap) {
        return;
      }

      document.body.classList.add('has-custom-cursor');

      // Setup gsap.quickTo for high-performance momentum interpolation
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3.out' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3.out' });

      this.on(document, 'mousemove', (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
      });

      // Centralized Event Delegation for States
      let currentState = '';

      const setCursorState = (state) => {
        if (currentState === state) {
          return;
        }
        if (currentState) {
          cursor.classList.remove(`is-${currentState}`);
        }
        if (state) {
          cursor.classList.add(`is-${state}`);
        }
        currentState = state;
      };

      this.on(
        document,
        'pointerenter',
        (e) => {
          const target = e.target;
          if (target.nodeType !== 1) {
            return;
          } // Ignore text nodes

          // Find closest interactable element
          const el = target.closest('[data-cursor-state], a, button, input, textarea, .theme-card');
          if (!el) {
            return;
          }

          let state = 'link'; // default fallback for a/button

          if (el.hasAttribute('data-cursor-state')) {
            state = el.getAttribute('data-cursor-state');
          } else if (el.tagName === 'BUTTON' || el.classList.contains('btn')) {
            state = 'button';
          } else if (el.classList.contains('theme-card')) {
            state = 'card';
          } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            state = 'text';
            if (el.disabled) {
              state = 'disabled';
            }
          }

          setCursorState(state);
        },
        { capture: true }
      );

      this.on(
        document,
        'pointerleave',
        (e) => {
          const target = e.target;
          if (target.nodeType !== 1) {
            return;
          }
          const el = target.closest('[data-cursor-state], a, button, input, textarea, .theme-card');
          if (el) {
            // Verify we are actually leaving the bounds of the interactable
            if (!e.relatedTarget || !el.contains(e.relatedTarget)) {
              setCursorState('');
            }
          }
        },
        { capture: true }
      );
    }

    // --- 3. MAGNETIC ELEMENTS ---
    initMagneticElements() {
      // Touch devices explicitly blocked
      if (window.matchMedia('(hover: none)').matches || !window.gsap) {
        return;
      }

      const magnetics = document.querySelectorAll('.js-magnetic');

      magnetics.forEach((el) => {
        this.on(el, 'mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;

          // Bounded magnetic pull (subtle)
          const intensity = parseFloat(el.getAttribute('data-magnetic-intensity')) || 0.2;
          const maxPull = 12;

          const pullX = Math.max(-maxPull, Math.min(maxPull, x * intensity));
          const pullY = Math.max(-maxPull, Math.min(maxPull, y * intensity));

          gsap.to(el, { x: pullX, y: pullY, duration: 0.3, ease: 'power3.out' });
        });

        this.on(el, 'mouseleave', () => {
          // Soft and precise return utilizing Phase 20.1 standard ease
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

    // --- 5. SCROLL REVEAL & STORYTELLING TIMELINES ---
    initScrollReveal() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      // 5.1 Simple reveals
      const reveals = document.querySelectorAll('[data-scroll-reveal]');
      reveals.forEach((el) => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true, // Only reveal once for Phase 20.3
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        });
      });

      // 5.2 Storytelling Registry Sequences
      if (window.AERIDIAN.Utils.Storytelling && window.AERIDIAN.Utils.Storytelling.registry) {
        window.AERIDIAN.Utils.Storytelling.registry.forEach((config) => {
          const sections = document.querySelectorAll(config.selector);
          sections.forEach((section) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                once: true,
              },
            });

            // Standard Narrative Sequence Order
            const roles = ['eyebrow', 'headline', 'body', 'cta', 'media', 'background', 'card'];

            roles.forEach((role) => {
              const elements = section.querySelectorAll(`[data-reveal-role="${role}"]`);
              if (elements.length > 0) {
                // Special handling for editorial grid cards
                if (role === 'card') {
                  gsap.fromTo(
                    elements,
                    { y: 40, opacity: 0 },
                    {
                      y: 0,
                      opacity: 1,
                      duration: 0.8,
                      ease: 'power3.out',
                      stagger: {
                        amount: 0.8,
                        grid: 'auto',
                        from: 'start',
                      },
                      scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        once: true,
                      },
                    }
                  );
                  return; // skip individual timeline insertion
                }

                elements.forEach((el) => {
                  const level = el.getAttribute('data-reveal-level');
                  const effect = el.getAttribute('data-reveal-effect');

                  // Use specific typography level or fallback to simple reveal
                  let tween;
                  if (level === 'A' && window.AERIDIAN.Utils.Motion.Typography.revealLevelA) {
                    tween = window.AERIDIAN.Utils.Motion.Typography.revealLevelA(el);
                  } else if (
                    level === 'B' &&
                    window.AERIDIAN.Utils.Motion.Typography.revealLevelB
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.Typography.revealLevelB(el);
                  } else if (
                    level === 'C' &&
                    window.AERIDIAN.Utils.Motion.Typography.revealLevelC
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.Typography.revealLevelC(el);
                  } else if (
                    level === 'D' &&
                    window.AERIDIAN.Utils.Motion.Typography.revealLevelD
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.Typography.revealLevelD(el);
                  } else if (
                    effect === 'mask' &&
                    window.AERIDIAN.Utils.Motion.ImageReveals.revealMask
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.ImageReveals.revealMask(el);
                  } else if (
                    effect === 'blur' &&
                    window.AERIDIAN.Utils.Motion.ImageReveals.revealBlur
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.ImageReveals.revealBlur(el);
                  } else if (
                    effect === 'clip' &&
                    window.AERIDIAN.Utils.Motion.ImageReveals.revealClipPath
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.ImageReveals.revealClipPath(el);
                  } else if (
                    effect === 'opacity' &&
                    window.AERIDIAN.Utils.Motion.ImageReveals.revealOpacity
                  ) {
                    tween = window.AERIDIAN.Utils.Motion.ImageReveals.revealOpacity(el);
                  } else {
                    tween = gsap.fromTo(
                      el,
                      { y: 20, opacity: 0 },
                      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
                    );
                  }

                  // Add to timeline with overlap
                  tl.add(tween, '<0.2');
                });
              }
            });
          });
        });
      }

      // 5.3 Scroll Momentum Depth Shift (Phase 20.5)
      const momentumSections = document.querySelectorAll('[data-momentum="true"]');
      momentumSections.forEach((section) => {
        gsap.to(section, {
          yPercent: 15,
          opacity: 0.8,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
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
