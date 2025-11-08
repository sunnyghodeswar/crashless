# GitHub Pages Setup Guide

This guide will help you set up GitHub Pages for the Crashless documentation.

## Prerequisites

- GitHub repository with push access
- GitHub Pages enabled in repository settings

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Verify Workflow File

The workflow file `.github/workflows/pages.yml` should already be in place. It will:
- Build the Jekyll site from `docs-site/`
- Deploy to GitHub Pages automatically
- Trigger on pushes to `main` branch

### 3. Push Changes

Once you push changes to the `main` branch, the workflow will automatically:
1. Build the documentation site
2. Deploy it to GitHub Pages
3. Make it available at: `https://sunnyghodeswar.github.io/crashless/`

### 4. Verify Deployment

1. Go to **Actions** tab in your repository
2. Check the "Deploy Documentation to GitHub Pages" workflow
3. Once complete, visit your Pages URL

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to `docs-site/` with your domain
2. Configure DNS settings as per GitHub Pages instructions
3. Update the workflow if needed

## Local Testing

To test the documentation locally before deploying:

```bash
# Install Jekyll
gem install bundler jekyll

# Serve locally
cd docs-site
jekyll serve

# Visit http://localhost:4000
```

## Troubleshooting

### Build Fails

- Check Jekyll syntax in markdown files
- Verify `_config.yml` is valid YAML
- Check GitHub Actions logs for errors

### Pages Not Updating

- Wait a few minutes for deployment
- Check Actions tab for workflow status
- Clear browser cache

### Links Not Working

- Ensure all links use relative paths
- Check that all referenced files exist
- Verify Jekyll front matter is correct

## Next Steps

Once deployed, update your README.md to link to the documentation:

```markdown
**📚 [Full Documentation](https://sunnyghodeswar.github.io/crashless/)**
```

