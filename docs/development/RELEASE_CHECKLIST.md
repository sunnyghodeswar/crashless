# Release Readiness Checklist

Use this checklist before releasing a new version to ensure everything is ready.

## Pre-Release Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No linter errors
- [ ] Code follows project conventions
- [ ] No console.log or debug statements in production code

### Documentation
- [ ] README.md is up to date
- [ ] All documentation in `docs/` folder is current
- [ ] API changes documented in `docs/API_CHANGES.md`
- [ ] Examples work correctly
- [ ] Documentation site builds successfully (if applicable)

### Configuration
- [ ] `package.json` version is correct (will be auto-bumped by semantic-release)
- [ ] `package.json` has correct repository URL
- [ ] All dependencies are up to date
- [ ] `.npmignore` excludes development files correctly
- [ ] `package.json` `files` field includes only necessary files

### CI/CD
- [ ] GitHub Actions workflow is configured
- [ ] `NPM_TOKEN` secret is set in GitHub
- [ ] Semantic-release configuration is correct (`.releaserc.json`)
- [ ] Tests run successfully in CI

### Security
- [ ] No sensitive data in code
- [ ] No hardcoded secrets or API keys
- [ ] Security best practices followed
- [ ] Dependencies are secure (check for vulnerabilities)

### Testing
- [ ] Unit tests cover new features
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases handled
- [ ] Error scenarios tested

## Release Process

### Automatic Release (Recommended)

1. **Merge to main branch**
   - Push changes or merge PR to `main`
   - CI/CD will automatically:
     - Run tests
     - Analyze commit messages
     - Bump version
     - Publish to npm
     - Create GitHub release

2. **Verify Release**
   - Check npm: https://www.npmjs.com/package/crashless
   - Check GitHub releases: https://github.com/sunnyghodeswar/crashless/releases
   - Verify version in `package.json` was updated
   - Verify `CHANGELOG.md` was generated

### Manual Release (If Needed)

```bash
# Run tests
npm test

# Run semantic-release manually
npm run release
```

## Post-Release Checklist

- [ ] Version published to npm successfully
- [ ] GitHub release created with changelog
- [ ] `CHANGELOG.md` updated correctly
- [ ] Git tag created (e.g., `v1.0.3`)
- [ ] Documentation site updated (if applicable)
- [ ] Announce release (if needed)

## Troubleshooting

### Release Failed
- Check GitHub Actions logs
- Verify `NPM_TOKEN` is set correctly
- Check if version already exists on npm
- Ensure commit messages follow conventional format (if using conventional-only config)

### Version Not Bumped
- Check commit messages (must include `fix:`, `feat:`, or breaking changes)
- Verify semantic-release configuration
- Check if using always-bump config (should always release)

### Tests Failing
- Fix test failures before merging
- Run tests locally first
- Check Node.js version compatibility

## Related Documentation

- [CI/CD Setup](CI_CD.md) - Complete CI/CD workflow guide
- [Release Configuration](RELEASE_CONFIG.md) - Semantic-release setup
- [Testing Guide](../contributing/TESTING.md) - How to run tests

