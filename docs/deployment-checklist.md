# AERIDIAN Deployment Checklist

Execute this checklist before merging code to `main` and deploying to the live Shopify theme environment.

## Pre-Flight Requirements
- [ ] **Branch Sync:** Ensure your working branch is perfectly synchronized with `main` and contains no merge conflicts.
- [ ] **Local QA Workflow:** Complete the `local-qa-workflow.md` verification. You must have visual, console, network, accessibility, and responsive validation approvals.
- [ ] **Theme Check:** Run `shopify theme check` and confirm the output is exactly **0 Errors, 0 Warnings**.
- [ ] **Console Cleanliness:** Search the repository for `console.log` and ensure all debugging output has been migrated to `AERIDIAN.Utils.log()`.
- [ ] **Memory Leak Check:** Stress test the AJAX Cart Drawer, Collection Filters, and WebGL Hero by rapidly triggering them locally to ensure `AbortController` and `destroy()` lifecycles are operating flawlessly.

## Staging Deployment
- [ ] **Push to Staging Theme:** Use `shopify theme push --theme="Staging Environment"` or push to your corresponding GitHub staging branch.
- [ ] **Staging Verification:** Open the Staging preview URL on both desktop and mobile devices. Verify that the production build of Shopify's CDN delivers assets without failure.
- [ ] **App Integration Check:** Verify that third-party Shopify apps installed on the live store (which might not run locally via CLI) do not conflict with the AERIDIAN Global Namespace or GSAP ScrollTrigger.

## Production Deployment
- [ ] **Merge to Main:** Merge your Pull Request into `main`. If you are using the Shopify GitHub integration, this will trigger an automatic build and deploy to the live theme.
- [ ] **Manual Push (Alternative):** If deploying manually, run `shopify theme push --live`.
- [ ] **Post-Launch Smoke Test:** Immediately load the live URL in an incognito window. Perform a dummy checkout flow to ensure payments, cart state, and analytics are functioning.

## Rollback Readiness
- [ ] **Duplicate Live Theme:** Before hitting publish, duplicate the existing live theme and rename it `[Backup YYYY-MM-DD] Pre-Launch`.
- [ ] **Monitor Error Rates:** Watch analytics and customer support channels for the first 24 hours post-deployment to quickly detect regressions.
