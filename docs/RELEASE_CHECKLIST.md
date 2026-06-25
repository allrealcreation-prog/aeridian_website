# Release Checklist

Before tagging a new production release and deploying to the live Shopify theme, verify the following steps:

## 1. Quality Gates
- [ ] `npm run lint` yields 0 errors.
- [ ] `npm run theme-check` yields 0 errors and 0 warnings.
- [ ] GitHub Actions CI pipeline passes completely on the `main` branch.

## 2. Manual QA Pass
- [ ] Run through the complete Local QA Workflow defined in `docs/local-qa-workflow.md`.
- [ ] Verify Add to Cart, Cart Drawer, and Checkout redirect work flawlessly.
- [ ] Verify that Mobile Safari and Mobile Chrome layouts render without horizontal overflow.

## 3. Performance Verification
- [ ] Generate a production preview link (`shopify theme push --unpublished`).
- [ ] Run Lighthouse via Chrome DevTools (Incognito, Mobile, Throttled 4G) or PageSpeed Insights.
- [ ] Verify Performance Score is >= 95.
- [ ] Verify Accessibility, Best Practices, and SEO are 100.

## 4. Documentation & Versioning
- [ ] Update `package.json` version number using Semantic Versioning (`npm version patch/minor/major`).
- [ ] Document all user-facing changes in `CHANGELOG.md`.
- [ ] Update `ROADMAP.md` if any milestones were achieved.

## 5. Deployment
- [ ] Merge `develop` or `release/*` branch into `main`.
- [ ] Tag the release in Git (`git tag vX.Y.Z`).
- [ ] Push tags to GitHub (`git push origin --tags`).
- [ ] Deploy to Shopify Live via CLI: `shopify theme push --live`.
