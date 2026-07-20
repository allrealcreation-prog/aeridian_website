# AERIDIAN Core Theme Architecture

AERIDIAN is a luxury Shopify Online Store 2.0 theme built for extreme performance, cinematic motion, and uncompromising code quality.

## Project Philosophy
1. **Vanilla Excellence:** No jQuery. No bloated reactive frameworks. 100% Vanilla JS leveraging modern browser APIs.
2. **Memory Safety:** Aggressive garbage collection through strict `destroy()` lifecycles via Shopify Section events.
3. **Lighthouse Dominance:** Strict rules for LCP, CLS, and TBT through deferred asset loading and prioritized image hints.

## Documentation
Please refer to the `docs/` directory for exhaustive technical implementation details:
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Global state and design patterns.
- [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) - Folder hierarchy and liquid mapping.
- [MODULE_REFERENCE.md](./docs/MODULE_REFERENCE.md) - Public APIs for all JavaScript modules.
- [EVENT_FLOW.md](./docs/EVENT_FLOW.md) - Custom event payloads and pub/sub architecture.
- [STATE_MANAGEMENT.md](./docs/STATE_MANAGEMENT.md) - Managing `window.AERIDIAN.State`.
- [PERFORMANCE_GUIDE.md](./docs/PERFORMANCE_GUIDE.md) - Strict Lighthouse optimization thresholds.
- [SHOPIFY_THEME_EDITOR.md](./docs/SHOPIFY_THEME_EDITOR.md) - Handling hot-reload events.

## Local Development
1. Clone this repository.
2. Ensure you are running Node `v22.12.0+` (see `.nvmrc`).
3. Run `shopify theme dev` via the Shopify CLI.
4. Access your local preview URL.
5. Refer to [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a Pull Request.
