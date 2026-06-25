# AERIDIAN Architecture

## Global Namespace Pattern
The core philosophy of this theme is to protect the global scope. Everything executes under a single object:
`window.AERIDIAN`

### Sub-objects
- `AERIDIAN.State`: Mutable data (e.g., current active variant, user cart state).
- `AERIDIAN.Modules`: Instantiated classes (e.g., `ThemeEngine`, `CartDrawer`).
- `AERIDIAN.Utils`: Pure functions (e.g., `formatMoney`, `log`, `mark`).

## Liquid to JS Handshake
We avoid polluting the DOM with endless `data-` attributes for complex JSON objects. Instead, Liquid renders state directly into `<script type="application/json">` islands, which are then parsed by the respective Module upon initialization.

## CSS Architecture
- **theme-tokens.css**: Holds all raw CSS variables (colors, spacing, animation curves). Loaded asynchronously.
- **Critical CSS**: Inline `<style id="AeridianCritical">` inside `theme.liquid` establishes layout skeleton instantly.
- **BEM Naming convention** is strictly followed for all module scoping (`.pdp-gallery`, `.pdp-gallery__item`).
