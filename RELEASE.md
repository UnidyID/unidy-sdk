# Release Strategy

This document describes how releases are managed for `@unidy.io/sdk`.

## Branch Model

| Branch | Purpose | npm dist-tag | Example version |
|--------|---------|-------------|-----------------|
| `master` | Next minor/major release | `latest` | `1.4.0` |
| `X-Y-stable` (e.g. `1-3-stable`) | Patch releases for version X.Y | `latest` if >= current latest, otherwise `release-X.Y` | `1.3.1` |

## How Releases Work

We use [Release Please](https://github.com/googleapis/release-please) to automate versioning and changelog generation based on [Conventional Commits](https://www.conventionalcommits.org/).

### Stable releases (from `master`)

1. Merge PRs with conventional commit messages (`feat:`, `fix:`, etc.) into `master`
2. Release Please automatically creates/updates a release PR that bumps the version and updates `CHANGELOG.md`
3. When the release PR is merged, Release Please creates a GitHub release and git tag
4. The `publish-stable` job publishes to npm with the `latest` tag
5. A maintenance branch (`X-Y-stable`) is automatically created from the release tag

### Patch releases (from `X-Y-stable` branches)

1. Cherry-pick or merge **only `fix:` commits** into the `X-Y-stable` branch
2. Release Please creates a release PR that bumps the patch version (e.g. `1.3.0` -> `1.3.1`)
3. When merged, the package is published to npm. If the version is >= the current `latest` on npm, it gets the `latest` tag; otherwise it gets the `release-X.Y` tag

### Pre-releases (from `master`)

Pre-releases are triggered manually via the GitHub Actions "Run workflow" button:

1. Go to Actions > Release > Run workflow
2. Select the release type: `alpha`, `beta`, or `next`
3. The workflow publishes a timestamped version (e.g. `1.4.0-alpha.20260223120000`) with the corresponding npm tag

## Maintenance Branches

### Automatic creation

When a new minor or major version is released from `master`, the CI automatically creates a maintenance branch named `X-Y-stable` (e.g. `1-3-stable` for v1.3.0). This branch is the home for all patch releases of that version.

### Manual creation (for existing releases)

For releases that predate this automation, create the branch manually:

```bash
# Create maintenance branch from the release tag
git checkout -b 1-3-stable @unidy.io/sdk-v1.3.0
git push origin 1-3-stable
```

---

**IMPORTANT: Only `fix:` commits are allowed on stable branches.**

Merging `feat:` or other non-fix conventional commits onto a stable branch will cause Release Please to bump the minor or major version, which breaks the maintenance branch's purpose. A `1-3-stable` branch should only ever produce `1.3.x` versions.

**Before merging to a stable branch, verify:**
- The commit message starts with `fix:` or `fix(scope):`
- The PR does not contain breaking changes (`BREAKING CHANGE` footer or `!` suffix)
- The change is a genuine bug fix, not a new feature

---

## npm Dist-Tags

Install specific release channels:

```bash
# Latest stable release (highest published version)
npm install @unidy.io/sdk@latest

# Specific maintenance release (used when a newer version exists on latest)
npm install @unidy.io/sdk@release-1.3

# Pre-release channels
npm install @unidy.io/sdk@alpha
npm install @unidy.io/sdk@beta
npm install @unidy.io/sdk@next
```

## Common Tasks

### Ship a hotfix for an older version

```bash
# 1. Switch to the maintenance branch
git checkout 1-3-stable
git pull origin 1-3-stable

# 2. Create a fix branch
git checkout -b fix/issue-description

# 3. Make the fix, commit with fix: prefix
git commit -m "fix: resolve issue description"

# 4. Open a PR targeting the 1-3-stable branch
gh pr create --base 1-3-stable

# 5. After PR is merged, Release Please creates a release PR
# 6. Merge the release PR to publish 1.3.x to npm
```

### Release a new minor version

1. Merge feature PRs (`feat:` commits) into `master`
2. Release Please will create a release PR bumping the minor version
3. Merge the release PR — this publishes to npm and auto-creates the `X-Y-stable` branch

### Check what version is published

```bash
# Latest stable
npm view @unidy.io/sdk version

# All published dist-tags
npm view @unidy.io/sdk dist-tags

# Specific maintenance line
npm view @unidy.io/sdk@release-1.3 version
```

## Configuration Files

| File | Purpose |
|------|---------|
| `release-please-config.json` | Release Please package configuration |
| `.release-please-manifest.json` | Tracks current version per package |
| `.github/workflows/release-please.yml` | Release and publish workflow |
