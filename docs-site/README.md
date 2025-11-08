# Crashless Documentation Site

This directory contains the documentation site for GitHub Pages.

## Structure

- `index.md` - Main documentation page
- `getting-started.md` - Installation and setup guide
- `api-reference.md` - Complete API documentation
- `configuration.md` - Configuration options
- `performance.md` - Benchmarks and optimization
- `examples.md` - Code examples
- `security.md` - Security best practices
- `architecture.md` - Internal architecture
- `limitations.md` - Known limitations
- `_config.yml` - Jekyll configuration

## Local Development

To preview the documentation locally:

```bash
# Install Jekyll (if not already installed)
gem install bundler jekyll

# Serve locally
cd docs-site
jekyll serve

# Access at http://localhost:4000
```

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

The site will be available at: `https://sunnyghodeswar.github.io/crashless/`

## Updating Documentation

1. Edit markdown files in `docs-site/`
2. Commit and push to `main` branch
3. GitHub Actions will automatically deploy to Pages

