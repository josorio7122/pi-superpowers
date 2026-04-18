#!/usr/bin/env bash
#
# sync-upstream.sh — snapshot obra/superpowers into vendor/superpowers/
#
# Usage:
#   scripts/sync-upstream.sh v5.0.7          # tag
#   scripts/sync-upstream.sh main            # branch (for dev only)
#
# Refuses to run with uncommitted changes unless FORCE=1.

set -euo pipefail

UPSTREAM="https://github.com/obra/superpowers.git"
REF="${1:-}"
if [[ -z "$REF" ]]; then
  echo "error: ref required (e.g. v5.0.7 or main)" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$REPO_ROOT/vendor/superpowers.staging"
FINAL="$REPO_ROOT/vendor/superpowers"

# Refuse to clobber uncommitted work
if [[ "${FORCE:-}" != "1" ]]; then
  if ! git -C "$REPO_ROOT" diff-index --quiet HEAD --; then
    echo "error: uncommitted changes in repo; commit or set FORCE=1" >&2
    exit 1
  fi
fi

# Fresh staging
rm -rf "$STAGING"
mkdir -p "$STAGING"

# Shallow clone at ref
git clone --depth 1 --branch "$REF" "$UPSTREAM" "$STAGING/clone"

# Rsync into staging content, excluding host-specific and infra dirs
mkdir -p "$STAGING/content"
rsync -a \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.claude' \
  --exclude='.claude-plugin' \
  --exclude='.cursor-plugin' \
  --exclude='.codex' \
  --exclude='.opencode' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  "$STAGING/clone/" "$STAGING/content/"

# Atomic swap: remove old vendor, move staging into place
rm -rf "$FINAL"
mv "$STAGING/content" "$FINAL"
rm -rf "$STAGING"

# Stamp the synced version
VERSION="${REF#v}"
if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "$REF" > "$FINAL/.synced-ref"
  # Bump package.json version only on tagged syncs
  node -e "const p=require('$REPO_ROOT/package.json'); p.version='$VERSION'; require('fs').writeFileSync('$REPO_ROOT/package.json', JSON.stringify(p, null, 2) + '\n');"
  echo "✓ Synced obra/superpowers@$REF to vendor/superpowers/"
  echo "✓ Bumped package.json version to $VERSION"
else
  echo "$REF" > "$FINAL/.synced-ref"
  echo "✓ Synced obra/superpowers@$REF (dev ref, package.json version not bumped)"
fi

echo ""
echo "Next steps:"
echo "  git diff vendor/superpowers/ package.json | head -80"
echo "  npm run check"
echo "  git add -A && git commit -m \"Sync superpowers to $REF\""
