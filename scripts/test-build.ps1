# Nexo Build Test Script for Windows
# Để test build pipeline trước khi push lên CI

param(
    [switch]$Clean,
    [switch]$SkipLint
)

Write-Host "🚀 Starting Nexo build test..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "apps/nexo-native")) {
    Write-Host "❌ Please run this script from the repository root" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repository structure check passed" -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check pnpm version
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm is not installed" -ForegroundColor Red
    exit 1
}

# Clean install if requested
if ($Clean) {
    Write-Host "⚠️ Cleaning workspace..." -ForegroundColor Yellow
    pnpm run clean
}

Write-Host "✅ Installing dependencies..." -ForegroundColor Green
pnpm install

if (-not $SkipLint) {
    Write-Host "✅ Running type check and lint..." -ForegroundColor Green
    pnpm run check
}

Write-Host "✅ Building internal packages..." -ForegroundColor Green
pnpm run build

Write-Host "✅ Building nexo-web..." -ForegroundColor Green
Set-Location apps/nexo-web
pnpm run build:native
Set-Location ../..

Write-Host "✅ Building nexo-native..." -ForegroundColor Green
Set-Location apps/nexo-native
$env:AUTO_OPEN = "0"
pnpm run build
$env:AUTO_OPEN = $null
Set-Location ../..

Write-Host "✅ Testing unpack build..." -ForegroundColor Green
Set-Location apps/nexo-native
pnpm run build:unpack
Set-Location ../..

Write-Host "🎉 All tests passed! Ready for CI/CD" -ForegroundColor Green

Write-Host ""
Write-Host "📁 Output directories created:" -ForegroundColor Cyan
Write-Host "  - apps/nexo-web/dist/"
Write-Host "  - apps/nexo-native/out/"
Write-Host "  - apps/nexo-native/dist/"
Write-Host ""
Write-Host "💡 You can now safely:" -ForegroundColor Cyan
Write-Host "  1. Commit your changes"
Write-Host "  2. Push to trigger CI"
Write-Host "  3. Create a release tag"
