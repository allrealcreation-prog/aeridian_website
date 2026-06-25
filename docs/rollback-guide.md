# AERIDIAN Rollback Guide

In the event of a catastrophic failure in the live production environment, speed is critical. Follow this protocol to restore the storefront to a stable state.

## 1. Immediate Shopify Admin Reversion
The fastest way to fix a broken live site is via the Shopify Theme Library UI.
1. Log in to the Shopify Admin.
2. Navigate to **Online Store > Themes**.
3. Locate the backup theme created during the Deployment Checklist (e.g., `[Backup YYYY-MM-DD] Pre-Launch`).
4. Click **Publish** on the backup theme.
*This immediately restores the stable storefront architecture while you investigate the issue in development.*

## 2. Source Control Rollback (Git)
If the codebase in the `main` branch is corrupted, you must revert the problematic PR or commits.

**Option A: Revert a Merged PR via GitHub UI**
1. Navigate to the merged Pull Request in the GitHub repository.
2. Click the **Revert** button.
3. This will create a new PR containing the inverse of the broken changes. Merge this new PR immediately.

**Option B: CLI Hard Reset (Use with Caution)**
If the branch is thoroughly broken and you need to forcefully roll back the remote:
```bash
# Fetch the latest history
git fetch origin

# Find the last known good commit hash
git log --oneline

# Reset your local main branch to that commit
git reset --hard <COMMIT_HASH>

# Force push to origin (Warning: Rewrites history)
git push origin main --force
```

## 3. Post-Rollback Investigation
Once the site is stable:
1. Re-deploy the broken code to an isolated Staging theme via `shopify theme push --theme="Broken Staging"`.
2. Enable `AERIDIAN.DEBUG = true` in your browser console on the staging environment.
3. Use the `docs/debug-guide.md` and `docs/local-qa-workflow.md` protocols to reproduce the issue.
4. Verify if a newly installed Shopify App caused a conflict with the global namespace.
5. Create a root-cause analysis report before attempting a fix.
