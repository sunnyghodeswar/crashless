# CI/CD Troubleshooting Guide

Common issues and solutions for the GitHub Actions workflow.

## Common Issues

### 1. Missing Semantic-Release Plugins

**Error:** `Cannot find module '@semantic-release/commit-analyzer'` or similar

**Solution:** All semantic-release plugins must be installed as devDependencies:

```json
{
  "devDependencies": {
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/commit-analyzer": "^11.1.0",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^9.2.6",
    "@semantic-release/npm": "^11.0.2",
    "@semantic-release/release-notes-generator": "^12.1.0",
    "semantic-release": "^23.0.0"
  }
}
```

**Fix:**
```bash
npm install --save-dev @semantic-release/commit-analyzer @semantic-release/github @semantic-release/npm @semantic-release/release-notes-generator
```

### 2. GitHub Permissions Error

**Error:** `Resource not accessible by integration` or `Permission denied`

**Solution:** Add permissions to the workflow:

```yaml
permissions:
  contents: write    # For creating tags and releases
  issues: write       # For creating issues
  pull-requests: write # For creating PRs
  id-token: write     # For OIDC
```

### 3. NPM Token Not Set

**Error:** `npm ERR! code E401` or `Unauthorized`

**Solution:**
1. Create npm automation token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to GitHub Secrets: `Settings → Secrets → Actions → New repository secret`
3. Name: `NPM_TOKEN`
4. Value: Your npm token

### 4. Tests Failing

**Error:** Test job fails before release

**Solution:**
- Fix test failures locally first: `npm test`
- Check Node.js version compatibility
- Ensure all dependencies are installed: `npm ci`

### 5. No Release Created

**Error:** Workflow succeeds but no release is created

**Possible Causes:**

1. **No conventional commits** - With default config, only `feat:`, `fix:`, or breaking changes trigger releases
2. **Already released** - Version already exists on npm
3. **Wrong branch** - Only releases from `main` branch

**Solution:**
- Check commit messages follow conventional format
- Use always-bump config if you want every commit to release
- Verify you're on `main` branch

### 6. Git Push Failed

**Error:** `fatal: could not read Username` or push permission denied

**Solution:** Ensure checkout has proper token:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}  # May be needed for protected branches
```

### 7. Package Already Published

**Error:** `You cannot publish over the previously published versions`

**Solution:** Semantic-release handles this automatically - it won't publish if version exists. Check:
- Current version in `package.json`
- Latest version on npm
- Git tags (should match npm versions)

### 8. CHANGELOG.md Not Created

**Error:** No CHANGELOG.md file created

**Solution:** Ensure `@semantic-release/changelog` plugin is:
- Installed: `npm install --save-dev @semantic-release/changelog`
- Configured in `.releaserc.json`

## Debugging Steps

### 1. Check Workflow Logs

1. Go to GitHub → Actions tab
2. Click on failed workflow run
3. Expand failed job
4. Check error messages

### 2. Test Locally

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Test semantic-release (dry-run)
npx semantic-release --dry-run
```

### 3. Verify Configuration

```bash
# Check semantic-release config
cat .releaserc.json

# Check package.json
cat package.json | grep semantic-release

# Verify npm token (if you have npm CLI configured)
npm whoami
```

### 4. Check Secrets

1. GitHub → Settings → Secrets and variables → Actions
2. Verify `NPM_TOKEN` exists
3. Verify token is valid (regenerate if needed)

## Quick Fixes Checklist

- [ ] All semantic-release plugins installed in `package.json`
- [ ] `NPM_TOKEN` secret set in GitHub
- [ ] Workflow has proper permissions
- [ ] Tests pass locally (`npm test`)
- [ ] Commit messages follow conventional format
- [ ] On `main` branch
- [ ] `.releaserc.json` is valid JSON

## Getting Help

If issues persist:

1. **Check GitHub Actions logs** - Most errors are visible there
2. **Test locally** - Run `npm run release` locally (will fail but shows errors)
3. **Verify setup** - Use the checklist above
4. **Check semantic-release docs** - https://semantic-release.gitbook.io/

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '@semantic-release/...'` | Missing plugin | Install missing plugin |
| `E401 Unauthorized` | Invalid npm token | Regenerate and update `NPM_TOKEN` |
| `Resource not accessible` | Missing permissions | Add permissions to workflow |
| `No release will be created` | No conventional commits | Use conventional commits or always-bump config |
| `Version already exists` | Version already published | Semantic-release skips automatically |

