#!/bin/bash

# Nexo Build Test Script
# Để test build pipeline trước khi push lên CI

set -e  # Exit on any error

echo "🚀 Starting Nexo build test..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/nexo-native" ]; then
    print_error "Please run this script from the repository root"
    exit 1
fi

print_status "Repository structure check passed"

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check pnpm version
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status "pnpm version: $PNPM_VERSION"
else
    print_error "pnpm is not installed"
    exit 1
fi

# Clean install
print_warning "Cleaning workspace..."
pnpm run clean

print_status "Installing dependencies..."
pnpm install

print_status "Running type check and lint..."
pnpm run check

print_status "Building internal packages..."
pnpm run build

print_status "Building nexo-web..."
cd apps/nexo-web
pnpm run build:native
cd ../..

print_status "Building nexo-native..."
cd apps/nexo-native
AUTO_OPEN=0 pnpm run build
cd ../..

print_status "Testing unpack build..."
cd apps/nexo-native
pnpm run build:unpack
cd ../..

print_status "🎉 All tests passed! Ready for CI/CD"

echo ""
echo "📁 Output directories created:"
echo "  - apps/nexo-web/dist/"
echo "  - apps/nexo-native/out/"
echo "  - apps/nexo-native/dist/"
echo ""
echo "💡 You can now safely:"
echo "  1. Commit your changes"
echo "  2. Push to trigger CI"
echo "  3. Create a release tag"
