#!/bin/bash

# Build Verification Script for AgentArea UI SDK
# This script verifies that all build processes work correctly

set -e

echo "🚀 Starting AgentArea UI SDK Build Verification"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Clean previous builds
print_info "Cleaning previous builds..."
pnpm clean
print_status $? "Clean completed"

# 2. Install dependencies
print_info "Installing dependencies..."
pnpm install --frozen-lockfile
print_status $? "Dependencies installed"

# 3. Type checking
print_info "Running type checks..."
pnpm type-check
print_status $? "Type checking passed"

# 4. Build packages
print_info "Building packages..."
pnpm build
print_status $? "Packages built successfully"

# 5. Verify build outputs exist
print_info "Verifying build outputs..."

# Check core package
if [ -f "packages/core/dist/index.js" ] && [ -f "packages/core/dist/index.d.ts" ]; then
    print_status 0 "Core package build output verified"
else
    print_status 1 "Core package build output missing"
fi

# Check react package
if [ -f "packages/react/dist/index.js" ] && [ -f "packages/react/dist/index.d.ts" ]; then
    print_status 0 "React package build output verified"
else
    print_status 1 "React package build output missing"
fi

# Check Block components specifically
if [ -f "packages/react/dist/components/blocks/block-message.js" ] && [ -f "packages/react/dist/components/blocks/index.js" ]; then
    print_status 0 "Block components build output verified"
else
    print_status 1 "Block components build output missing"
fi

# 6. Test publish (dry run)
print_info "Testing npm publish (dry run)..."
pnpm publish:dry-run --no-git-checks > /dev/null 2>&1
print_status $? "Publish dry run successful"

# 7. Build Storybook
print_info "Building Storybook documentation..."
pnpm build-storybook --quiet
print_status $? "Storybook built successfully"

# 8. Verify Storybook output
if [ -f "storybook-static/index.html" ] && [ -d "storybook-static/assets" ]; then
    print_status 0 "Storybook build output verified"
else
    print_status 1 "Storybook build output missing"
fi

# 9. Check package sizes
print_info "Checking package sizes..."
CORE_SIZE=$(du -sh packages/core/dist | cut -f1)
REACT_SIZE=$(du -sh packages/react/dist | cut -f1)
STORYBOOK_SIZE=$(du -sh storybook-static | cut -f1)

echo "📦 Package Sizes:"
echo "   Core: $CORE_SIZE"
echo "   React: $REACT_SIZE"
echo "   Storybook: $STORYBOOK_SIZE"

# 10. Verify Block components in build
print_info "Verifying Block components in React package..."
if grep -q "Block" packages/react/dist/index.d.ts; then
    print_status 0 "Block components exported in React package"
else
    print_status 1 "Block components not found in React package exports"
fi

# 11. Final verification
print_info "Running final build test..."
pnpm test:build > /dev/null 2>&1
print_status $? "Final build test passed"

echo ""
echo "🎉 All build verification checks passed!"
echo "================================================"
echo "✅ Packages build successfully"
echo "✅ TypeScript compilation works"
echo "✅ Block components implemented and exported"
echo "✅ NPM publishing configuration correct"
echo "✅ Storybook documentation builds"
echo "✅ All outputs verified"
echo ""
echo "Ready for:"
echo "  📦 NPM Publishing: pnpm publish:packages"
echo "  🚀 CI/CD Deployment: GitHub Actions workflows configured"
echo "  📚 Documentation: Storybook ready for deployment"