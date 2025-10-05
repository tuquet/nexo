#!/usr/bin/env pwsh
# GitHub Actions Simulation Script for Nexo Project
# This script simulates the GitHub Actions pipeline locally

Write-Host "🚀 GitHub Actions Simulation - Nexo Build and Test" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Environment setup (simulate GitHub Actions environment)
$env:CI = "true"
$env:GITHUB_WORKFLOW = "Local Test"
$env:GITHUB_RUN_ID = "local-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$env:RUNNER_OS = "Windows"

Write-Host ""
Write-Host "📋 Step 1: Environment Debug" -ForegroundColor Yellow
Write-Host "Runner OS: $env:RUNNER_OS"
Write-Host "Node version: $(node --version)"
Write-Host "NPM version: $(npm --version)"
Write-Host "PNPM version: $(pnpm --version)"
Write-Host "Working directory: $(Get-Location)"
Write-Host "Disk space:"
Get-Volume | Where-Object { $_.DriveLetter -eq 'D' } | Format-Table DriveLetter, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="Free(GB)";Expression={[math]::Round($_.SizeRemaining/1GB,2)}}

Write-Host ""
Write-Host "📦 Step 2: Install Dependencies" -ForegroundColor Yellow
$installStart = Get-Date
try {
    pnpm install --frozen-lockfile --reporter=append-only
    if ($LASTEXITCODE -eq 0) {
        $installEnd = Get-Date
        $installDuration = ($installEnd - $installStart).TotalSeconds
        Write-Host "✅ Dependencies installed successfully in $([math]::Round($installDuration, 2)) seconds" -ForegroundColor Green
    } else {
        throw "pnpm install failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Step 3: Type Check" -ForegroundColor Yellow
$typecheckStart = Get-Date
try {
    pnpm run check:type
    if ($LASTEXITCODE -eq 0) {
        $typecheckEnd = Get-Date
        $typecheckDuration = ($typecheckEnd - $typecheckStart).TotalSeconds
        Write-Host "✅ Type check passed in $([math]::Round($typecheckDuration, 2)) seconds" -ForegroundColor Green
    } else {
        throw "Type check failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Type check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️ Step 4: Build Internal Packages" -ForegroundColor Yellow
$buildStart = Get-Date
try {
    pnpm run build
    if ($LASTEXITCODE -eq 0) {
        $buildEnd = Get-Date
        $buildDuration = ($buildEnd - $buildStart).TotalSeconds
        Write-Host "✅ Internal packages built successfully in $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor Green
    } else {
        throw "Build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Step 5: Build Nexo Web Application" -ForegroundColor Yellow
$webBuildStart = Get-Date
try {
    Set-Location "apps/nexo-web"
    pnpm run build:native
    if ($LASTEXITCODE -eq 0) {
        $webBuildEnd = Get-Date
        $webBuildDuration = ($webBuildEnd - $webBuildStart).TotalSeconds
        Write-Host "✅ Nexo Web built successfully in $([math]::Round($webBuildDuration, 2)) seconds" -ForegroundColor Green
    } else {
        throw "Nexo Web build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Nexo Web build failed: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
} finally {
    Set-Location "../.."
}

Write-Host ""
Write-Host "🖥️ Step 6: Build Nexo Native Application" -ForegroundColor Yellow
$nativeBuildStart = Get-Date
try {
    Set-Location "apps/nexo-native"
    $env:AUTO_OPEN = "0"
    pnpm run build
    if ($LASTEXITCODE -eq 0) {
        $nativeBuildEnd = Get-Date
        $nativeBuildDuration = ($nativeBuildEnd - $nativeBuildStart).TotalSeconds
        Write-Host "✅ Nexo Native built successfully in $([math]::Round($nativeBuildDuration, 2)) seconds" -ForegroundColor Green
    } else {
        throw "Nexo Native build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Nexo Native build failed: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
} finally {
    Set-Location "../.."
}

Write-Host ""
Write-Host "📊 Pipeline Summary" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
$totalEnd = Get-Date
$totalDuration = ($totalEnd - $installStart).TotalMinutes
Write-Host "✅ All steps completed successfully!" -ForegroundColor Green
Write-Host "Total pipeline duration: $([math]::Round($totalDuration, 2)) minutes" -ForegroundColor White
Write-Host ""
Write-Host "🎉 GitHub Actions simulation completed successfully!" -ForegroundColor Green
