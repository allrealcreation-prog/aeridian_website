# Contributing to AERIDIAN

Thank you for contributing to the AERIDIAN storefront architecture.

## Branching Strategy
We follow a strict Git Flow paradigm:
- `main`: Represents the currently deployed live production theme. Never commit directly to `main`.
- `develop`: The primary integration branch. All features merge here before release to `main`.
- `feature/*`: Branched off `develop` for new capabilities (e.g., `feature/quick-view`).
- `hotfix/*`: Branched directly off `main` for critical production bug fixes, then merged back into both `main` and `develop`.
2. **Quality Gates:** Before submitting a Pull Request, you must run our automated suite:
   - `npm run lint` (ESLint validation)
   - `npm run format` (Prettier formatting)
   - `npm run theme-check` (Shopify Theme CLI validation)
3. **Commit Messages:** Use Conventional Commits (e.g., `feat: added lazy loading to quick view`, `fix: memory leak in PDP gallery`).

## Architecture Constraints
- **No Global Scope Pollution:** All new features must exist within `window.AERIDIAN`.
- **Vanilla JS Only:** jQuery and Vue/React are strictly forbidden. Use Vanilla DOM APIs.
- **Lifecycle Implementation:** Any new module must implement `.init()` and `.destroy()` to prevent memory leaks during Shopify Theme Editor hot-reloading.

## Theme Editor (Hot Reloads)
When building sections, test them extensively in the Shopify Theme Editor. Ensure that adding, removing, and re-ordering your section does not break JavaScript execution or leave orphaned event listeners.
