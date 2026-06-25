# AERIDIAN Development Checklist

This checklist applies to all new feature development and refactoring within the AERIDIAN storefront. Before creating a PR or merging code, all items below must be satisfied.

## 1. Architectural Standards
- [ ] **Single Global Namespace**: No variables added to `window`. All state and modules must live within `window.AERIDIAN`.
- [ ] **Enterprise Lifecycle**: All new JS modules must export `init()`, `reInit()`, and `destroy()` methods.
- [ ] **Shopify Theme Editor Hooks**: Ensure components are integrated into `theme-engine.js` for `shopify:section:load` and `shopify:section:unload`.

## 2. Event and Memory Management
- [ ] **Event Unbinding**: All event listeners are registered in an internal tracking array (e.g., `this._events`) and properly removed in `destroy()`.
- [ ] **Network Abortion**: Rapid, repeated API calls (e.g. Add to Cart, Predictive Search, Filters) utilize `AbortController` to cancel stale requests.
- [ ] **WebGL / RequestAnimationFrame**: Any Three.js integration cleanly calls `renderer.dispose()`, disposes geometries/materials, and halts all `requestAnimationFrame` loops on section unload.
- [ ] **Observer Disconnection**: `IntersectionObserver`, `ResizeObserver`, and `MutationObserver` instances are explicitly disconnected when no longer needed.

## 3. Styling and Layout
- [ ] **No Overflow Leaks**: Horizontal scrolling is strictly prevented. Never use `width: 100vw`; use `width: 100%`. Ensure absolutely positioned elements do not push bounding boxes beyond viewport width.
- [ ] **Breakpoint Precision**: UI must be rigorously tested at 320px, 390px, 768px, 1024px, 1440px, and 1920px.
- [ ] **Touch Targets**: Minimum 44x44px tappable area on mobile interactions.

## 4. Shopify Native Compliance
- [ ] **Zero Theme Check Warnings**: Code changes yield 0 Errors and 0 Warnings when running `shopify theme check`.
- [ ] **Shopify Routes**: Hardcoded URLs (e.g., `/cart`, `/search`) are strictly forbidden. Always use `{{ routes.cart_url }}` object properties.
- [ ] **Asset Loading**: External libraries (GSAP, Three.js) are hosted in `assets/` and loaded via `{{ 'file.js' | asset_url }}`.

## 5. Console Hygiene
- [ ] **No Wild Console Logs**: No `console.log()` statements exist in production code. Use `window.AERIDIAN.Utils.log()` which obeys the `DEBUG` flag.
- [ ] **Grouped Traces**: Use `console.groupCollapsed()` when tracking complex state changes (e.g., AJAX cart updates) in Debug mode.
