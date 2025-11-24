# Semantic Release Configuration Guide

## Current Configuration: Always Bump

You're currently using `.releaserc.json` (always-bump version), which means **every merge to `main` will trigger a release**, even without conventional commits.

## How It Works

The configuration uses custom `releaseRules` that:

1. **Respect conventional commits** (if you use them):
   - `feat:` → **Minor** version bump (1.0.2 → 1.1.0)
   - `fix:` → **Patch** version bump (1.0.2 → 1.0.3)
   - `perf:` → **Patch** version bump
   - `revert:` → **Patch** version bump
   - Breaking changes (`feat!:` or `BREAKING CHANGE:`) → **Major** version bump (1.0.2 → 2.0.0)

2. **Skip releases for** (no version bump):
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `chore:` - Maintenance tasks
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `build:` - Build system changes
   - `ci:` - CI/CD changes

3. **Catch-all rule**: Any other commit → **Patch** version bump

## Examples

```bash
# Conventional commits (still work):
git commit -m "feat: add new feature"        # → 1.1.0 (minor)
git commit -m "fix: resolve bug"             # → 1.0.3 (patch)
git commit -m "feat!: breaking change"        # → 2.0.0 (major)

# Non-conventional commits (will also release):
git commit -m "update dependencies"           # → 1.0.3 (patch)
git commit -m "improve performance"          # → 1.0.3 (patch)
git commit -m "regular commit message"        # → 1.0.3 (patch)

# These won't release (explicitly skipped):
git commit -m "docs: update README"           # No release
git commit -m "chore: update config"          # No release
git commit -m "test: add unit tests"          # No release
```

## Switching Configurations

### To use Always-Bump (current):
```bash
cp .releaserc-always-bump.json .releaserc.json
```

### To use Conventional-Only:
```bash
cp .releaserc-conventional.json.backup .releaserc.json
```

Or restore from git:
```bash
git checkout .releaserc.json
```

## Files

- `.releaserc.json` - **Active configuration** (currently always-bump)
- `.releaserc-always-bump.json` - Always release version (backup)
- `.releaserc-conventional.json.backup` - Conventional commits only (backup)

**Note:** Configuration files are in the project root. See [CI/CD Setup](CI_CD.md) for complete workflow documentation.

## Benefits of Always-Bump

✅ **No need to remember conventional commit format** - regular commits still release
✅ **Still respects conventional commits** - `feat:` and `fix:` work as expected
✅ **More predictable** - Every meaningful change gets released
✅ **Less friction** - Don't worry about commit message format

## When to Use Conventional-Only

Use conventional-only if you want:
- More control over when releases happen
- To skip releases for documentation/refactoring commits
- Strict semantic versioning based only on conventional commits

