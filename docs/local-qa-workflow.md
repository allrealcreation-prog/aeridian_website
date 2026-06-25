# AERIDIAN Local QA Workflow

This document defines the strict verification procedures required before any code can be pushed to staging or production environments.

## 1. Prerequisites
Before beginning QA, ensure you are running the theme locally:
```bash
shopify theme dev
```
Do not rely exclusively on the Shopify Theme Editor for functionality tests. You must open the `localhost` or generated proxy URL in an incognito window.

## 2. Global Validation Matrix
For every single route listed below, you must validate against five core pillars:

- **Visual Validation:** Confirm 0 layout shifts, missing images, broken fonts, or horizontal overflow (`100vw` bugs). Check on 320px, 390px, 768px, 1024px, 1440px, and 1920px.
- **Console Validation:** Confirm exactly 0 errors and 0 warnings. `window.AERIDIAN.Utils.log` should only output grouped logs if `DEBUG=true`.
- **Network Validation:** Open the Network tab. Verify that image loading uses appropriate `srcset` scaling, and that duplicate API requests (e.g., rapid clicks on "Add to Cart") are instantly aborted via `AbortController`.
- **Accessibility Validation:** Run Axe DevTools or Lighthouse Accessibility check. Ensure tab-indexing works and ARIA states reflect dynamic changes.
- **Responsive Validation:** Ensure minimum touch target size (44x44) for all buttons and links, especially the mobile header and cart controls.

## 3. Required Route Verification Checklist

Use this checklist prior to generating a deployment PR:

- [ ] **Homepage** (Hero WebGL initialization, Best Sellers, Trending Carousel)
- [ ] **Collections** (`/collections` - List of Collections)
- [ ] **Collection** (`/collections/all` - Collection filtering, pagination, quick view triggers)
- [ ] **Product** (`/products/...` - Variant switching, Add to Cart logic, Image Galleries)
- [ ] **Search** (Predictive search overlay, search results page)
- [ ] **Cart** (`/cart` or Cart Drawer functionality, quantity mutations)
- [ ] **Account Login** (Forms, error states)
- [ ] **Register** (Forms, validation)
- [ ] **Reset Password** (`{{ email }}` replacement logic)
- [ ] **Orders** (Order history, image rendering)
- [ ] **Addresses** (Address mutations)
- [ ] **404** (Graceful fallback)
- [ ] **Policy Pages** (Privacy, Terms, Shipping)
- [ ] **Blog** (Article lists)
- [ ] **Article** (Content rendering, images)
- [ ] **Gift Card** (Fulfillment rendering)
- [ ] **Password Page** (Pre-launch gate)

## 4. Shopify Theme Editor Integration
In addition to checking the live proxy site, you must verify the Shopify Theme Editor runtime constraints:
1. Add, remove, and reorder sections.
2. Confirm that `shopify:section:load` triggers `reInit()` properly and resets memory state.
3. Confirm that removing a section containing Three.js triggers the `destroyThree()` cleanup pipeline and drops GPU memory.
