# AERIDIAN Debug Guide

This document outlines the debugging protocol for the AERIDIAN storefront architecture.

## 1. The Global DEBUG Flag
The AERIDIAN architecture suppresses all wild console output to prevent memory leaks and maintain a pristine production environment. Debug logging is gated by a central flag.

**To enable debug mode in your local environment:**
```javascript
window.AERIDIAN.DEBUG = true;
```
*(Note: This flag is hardcoded to `false` in production. You can toggle it via the browser console for live debugging).*

## 2. Structured Logging (`AERIDIAN.Utils.log`)
Never use `console.log()` directly. Always use the built-in structured logger which respects the `DEBUG` flag:

```javascript
window.AERIDIAN.Utils.log('ComponentName', 'Action performed', { data: 123 });
```

**Output format:**
`[AERIDIAN:ComponentName] Action performed | { data: 123 }`

## 3. Grouped Console Output
For complex operations involving multiple steps (e.g., Cart AJAX lifecycle), wrap your logs in console groups:

```javascript
if (window.AERIDIAN.DEBUG) {
  console.groupCollapsed('[AERIDIAN:Cart] Updating Item');
  console.log('Key:', itemKey);
  console.log('Qty:', newQty);
  console.groupEnd();
}
```

## 4. Performance Marks
The theme engine injects performance markers to track boot times.
To measure execution time of a critical path:
```javascript
window.AERIDIAN.Utils.mark('Feature:Start');
// ... expensive operation ...
window.AERIDIAN.Utils.mark('Feature:End');

if (window.AERIDIAN.DEBUG) {
  performance.measure('Feature Execution', 'Feature:Start', 'Feature:End');
  console.log(performance.getEntriesByName('Feature Execution')[0].duration + 'ms');
}
```

## 5. Shopify Section Event Debugging
When editing the theme in the Shopify admin, the Theme Engine automatically listens for `shopify:section:load` and `shopify:section:unload`. If a component breaks upon hot-reload, verify the following:

1. Did the component implement `.destroy()` to unbind its previous event listeners?
2. Did the component implement `.reInit()` to mount onto the newly injected DOM nodes?

Enable `AERIDIAN.DEBUG = true` to see an automatic trace of all Shopify section lifecycle hooks firing in real-time.
