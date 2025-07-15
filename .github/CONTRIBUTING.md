# Contributing to AgentArea UI SDK

Thank you for your interest in contributing to AgentArea UI SDK!

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development: `pnpm dev`

## Scripts

- `pnpm build` - Build the library
- `pnpm dev` - Start development with watch mode
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean build artifacts
- `pnpm test` - Run tests (when available)

## Publishing

### Release Process

1. **Beta Release** (automatic):
   - Push to `develop` branch
   - Automatically publishes as `@agentarea/ui-sdk@x.x.x-beta.timestamp` to npm with `beta` tag

2. **Stable Release** (manual):
   - Create a version tag: `git tag v1.0.0`
   - Push the tag: `git push origin v1.0.0`
   - GitHub Actions will automatically build and publish to npm

### Manual Publishing

If you need to publish manually:

```bash
# Build the library
pnpm build

# Publish (requires NPM_TOKEN)
pnpm publish --access public
```

## GitHub Actions

We have three workflows:

1. **CI** (`.github/workflows/ci.yml`):
   - Runs on PR and push to main/develop
   - Tests multiple Node.js versions
   - Runs type checking and build

2. **Release** (`.github/workflows/release.yml`):
   - Runs on version tags (v*)
   - Publishes stable release to npm

3. **Publish Beta** (`.github/workflows/publish-beta.yml`):
   - Runs on push to develop branch
   - Publishes beta version to npm

## Secrets Required

Set these secrets in your GitHub repository:

- `NPM_TOKEN`: npm access token with publish permissions

## Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch for beta releases
- Feature branches: Create from `develop`, merge back to `develop`

## Release Workflow

1. Develop features in feature branches
2. Merge to `develop` for beta testing
3. When ready for release, merge `develop` to `main`
4. Tag the release: `git tag v1.0.0 && git push origin v1.0.0`