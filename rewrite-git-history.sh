#!/bin/bash
# Script to rewrite Git history to change author from "Sunny" to "sunnyghodeswar"
# WARNING: This rewrites history. Only run if you're sure and have backups.

set -e

echo "⚠️  WARNING: This will rewrite Git history!"
echo "Make sure you have a backup and that no one else is working on this branch."
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Rewriting Git history to change author from 'Sunny' to 'sunnyghodeswar'..."
echo ""

# Use git filter-branch to rewrite history
git filter-branch --env-filter '
if [ "$GIT_AUTHOR_NAME" = "Sunny" ]; then
    export GIT_AUTHOR_NAME="sunnyghodeswar"
    export GIT_AUTHOR_EMAIL="sunny.gh.gm@gmail.com"
fi
if [ "$GIT_COMMITTER_NAME" = "Sunny" ]; then
    export GIT_COMMITTER_NAME="sunnyghodeswar"
    export GIT_COMMITTER_EMAIL="sunny.gh.gm@gmail.com"
fi
' --tag-name-filter cat -- --branches --tags

echo ""
echo "✅ History rewritten!"
echo ""
echo "⚠️  IMPORTANT: If you've already pushed to remote, you'll need to force push:"
echo "   git push --force-with-lease origin main"
echo ""
echo "⚠️  Make sure all collaborators are aware of this change!"

