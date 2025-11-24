# CI/CD Setup

This repository uses GitHub Actions for continuous integration and deployment with **automated version bumping** using [semantic-release](https://semantic-release.gitbook.io/).

## Workflow: Publish to npm

The `publish.yml` workflow automatically:
1. Runs tests on Node.js 18.x and 20.x when code is pushed to `main`
2. Analyzes commit messages to determine version bump (patch/minor/major)
3. Updates `package.json` version and creates a git tag
4. Publishes the package to npm
5. Creates a GitHub release with changelog

## Setup Instructions

### 1. Create an npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to your account settings → Access Tokens
3. Click "Generate New Token" → "Automation" (for CI/CD)
4. Copy the token (you won't be able to see it again)

### 2. Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm access token
6. Click **Add secret**

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions, so you don't need to create it manually.

## Automated Version Bumping

Version bumping is **fully automated** based on your commit messages using [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

Use conventional commit messages to trigger automatic version bumps:

```bash
# Patch version (1.0.2 -> 1.0.3) - Bug fixes
git commit -m "fix: resolve memory leak in metrics collection"

# Minor version (1.0.2 -> 1.1.0) - New features
git commit -m "feat: add support for custom exporters"

# Major version (1.0.2 -> 2.0.0) - Breaking changes
git commit -m "feat!: change API signature for configureTracing"
# or
git commit -m "feat: add new API

BREAKING CHANGE: configureTracing now requires options parameter"
```

### Commit Types

- `fix:` - Bug fixes → **PATCH** version bump
- `feat:` - New features → **MINOR** version bump
- `feat!:` or `BREAKING CHANGE:` - Breaking changes → **MAJOR** version bump
- `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:` - No version bump (unless breaking)

### Examples

```bash
# Bug fix - will release 1.0.3
git commit -m "fix: handle null errors in error handler"

# New feature - will release 1.1.0
git commit -m "feat: add Prometheus metrics endpoint"

# Breaking change - will release 2.0.0
git commit -m "feat!: rename crashless() to createCrashless()"

# Multiple commits - semantic-release analyzes all commits since last release
git commit -m "fix: memory leak"
git commit -m "feat: add tracing"
# Will release 1.1.0 (minor bump for the feature)
```

### What Happens Automatically

When you merge to `main`:
1. ✅ Tests run on multiple Node.js versions
2. ✅ Commit messages are analyzed
3. ✅ Version is bumped in `package.json` (if changes detected)
4. ✅ `CHANGELOG.md` is generated/updated
5. ✅ Git tag is created (e.g., `v1.1.0`)
6. ✅ Package is published to npm
7. ✅ GitHub release is created with changelog
8. ✅ Changes are committed back to `main` branch

**No manual version bumping needed!** Just use conventional commit messages.

## Workflow Behavior

- **Triggers**: Push to `main` branch (including PR merges)
- **Test Job**: Runs tests on multiple Node.js versions (18.x, 20.x)
- **Release Job**: Only runs if:
  - All tests pass
  - The push is to `main` branch
  - `NPM_TOKEN` secret is configured
  - There are commits that warrant a release (based on commit messages)

### PR Merge vs Direct Push

✅ **Both work!** The workflow triggers on **push events** to `main` branch, which includes:
- Direct pushes to `main`
- Merged pull requests (when a PR is merged, GitHub creates a push event to `main`)

So whether you:
- Merge a PR → ✅ Triggers workflow
- Push directly to `main` → ✅ Triggers workflow

The workflow will run in both cases.

### Non-Conventional Commits

**Question: What if I don't use conventional commits?**

By default, semantic-release will **skip the release** if there are no conventional commits (`fix:`, `feat:`, or breaking changes).

**Option 1: Always Bump Patch Version (Recommended)**

If you want to always release when merging to `main` (even without conventional commits), you can use the alternative configuration:

1. Rename `.releaserc.json` to `.releaserc-conventional.json` (backup)
2. Rename `.releaserc-always-bump.json` to `.releaserc.json`

This configuration will:
- Still respect `feat:` → minor, `fix:` → patch, breaking → major
- **But also release patch version for any other commits**

**Option 2: Keep Current Behavior**

Keep the current setup and use conventional commits. If you commit without conventional format:
- Tests will still run ✅
- But release will be skipped (no npm publish)

**Option 3: Manual Version Bump**

You can always manually bump version in `package.json` before merging, and semantic-release will publish that version.

### Skipping Releases

If your commits don't include `fix:`, `feat:`, or breaking changes, semantic-release will skip the release:

```bash
# These won't trigger a release (with default config):
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
git commit -m "test: add unit tests"
git commit -m "regular commit message"  # No conventional format
```

## Troubleshooting

- **No release created**: 
  - With default config: Check that your commit messages follow conventional commit format (`fix:`, `feat:`, etc.)
  - If you want to always release, switch to `.releaserc-always-bump.json` config
- **Publish fails**: Check that `NPM_TOKEN` is set correctly in repository secrets
- **Tests fail**: Fix test failures before merging to `main`
- **Version conflict**: Semantic-release handles this automatically - it won't publish if the version already exists
- **Workflow doesn't trigger on PR merge**: This shouldn't happen - PR merges create push events. If it does, check GitHub Actions logs

## Manual Release (if needed)

If you need to manually trigger a release:

```bash
npm run release
```

This will analyze commits and release if appropriate.

