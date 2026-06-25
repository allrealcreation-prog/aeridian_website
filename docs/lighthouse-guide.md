# AERIDIAN Lighthouse Optimization Guide

This document outlines the strict performance requirements for the AERIDIAN storefront to maintain a premium, fast user experience.

## 1. Performance Targets
Our goal is to sustain a Mobile Lighthouse Score of **90+** across all primary templates.
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **INP (Interaction to Next Paint):** < 200ms

## 2. Image Optimization Rules
- **Above the Fold (`loading="eager"`):** The LCP element (typically the Hero image or Main Product image) must be loaded eagerly to ensure it paints as fast as possible.
- **Below the Fold (`loading="lazy"`):** All other images must have the `loading="lazy"` attribute.
- **Explicit Dimensions:** Every single `<img>` tag must declare `width` and `height` attributes to prevent CLS.
- **Responsive Sizing:** Use `srcset` and `sizes` attributes for responsive images to avoid serving desktop-sized images to mobile devices. Ensure `image_url: width: X` is utilized correctly.

## 3. JavaScript Execution
- **Defer Non-Critical JS:** All custom script tags and third-party libraries (GSAP, Three.js) must use the `defer` attribute so they do not block the HTML parser.
- **Lazy Initialization:** WebGL instances and complex GSAP ScrollTriggers should ideally initialize only when they approach the viewport (via `IntersectionObserver`), or be deferred until after `window.onload`.
- **Avoid Long Tasks:** Break up expensive initialization logic in `theme-engine.js` into chunks using `requestAnimationFrame` or `setTimeout` to yield the main thread back to the browser.

## 4. CSS Delivery
- **Critical CSS:** Inject essential CSS required for first paint inline within `<head>`, specifically layout structure and above-the-fold typography.
- **Preload Web Fonts:** Use `<link rel="preload" href="..." as="font" type="..." crossorigin>` for custom AERIDIAN fonts to prevent FOIT (Flash of Invisible Text) or FOUT (Flash of Unstyled Text).
- **Limit CSS Complexity:** Avoid deeply nested CSS selectors and wildcards. Keep specificity low and classes utility-driven where possible to accelerate style recalculation times.

## 5. Third-Party App Management
- **Audit App Scripts:** Third-party Shopify apps frequently inject render-blocking scripts via `content_for_header`. Regularly monitor the network tab.
- **Push Back on jQuery:** The AERIDIAN architecture is 100% Vanilla JS. Reject third-party apps that mandate injecting jQuery.
