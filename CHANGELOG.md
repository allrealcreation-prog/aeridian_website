# Changelog

All notable changes to the AERIDIAN storefront architecture will be documented in this file.

## [1.0.0] - Enterprise Excellence (Current)
### Added
- Complete JSDoc and standardized file headers across all JS assets.
- Comprehensive Markdown documentation suite in `/docs`.
- Automated Quality Gates (ESLint, Prettier, GitHub Actions CI).
- Strict DOMParser sanitization for AJAX Cart HTML injection.

### Changed
- Converted all active scroll and touch event listeners to `{ passive: true }` to unblock the main thread.
- Migrated hardcoded magic layout numbers into CSS variables managed by `theme-tokens.css`.
- Synchronous CSS `theme.css` now loads asynchronously with `<noscript>` fallback to protect First Contentful Paint.

### Fixed
- Prevented double execution of GSAP library and Shopify native tracking scripts.
- Eliminated memory leaks in Theme Editor by binding WebGL `destroy()` hooks to `shopify:section:unload`.

## [0.9.0] - Foundation Phase
- Initial implementation of the `window.AERIDIAN` global namespace.
- Rollout of the Shopify OS 2.0 component framework.
