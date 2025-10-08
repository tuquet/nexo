# Electron-Vite Migration Guide

## Overview

This document outlines the migration process for the nexo-native app from a standard Electron setup to electron-vite framework, and the specific configurations required to work with the Vben Admin design system.

## Key Changes

### 1. Project Structure

Electron-vite requires a specific directory structure for renderer process configurations:

```
apps/nexo-native/
├── src/
│   ├── main/           # Main process code
│   ├── preload/        # Preload scripts
│   └── renderer/       # Renderer process code
│       ├── tailwind.config.mjs  # Renderer-specific Tailwind config
│       └── postcss.config.mjs   # Renderer-specific PostCSS config
```

### 2. Configuration Challenges

#### Problem: Electron Environment Conflicts

The main challenge was that Vben's PostCSS configuration imports `@electron-toolkit/utils`, which causes runtime errors in the renderer process:

```
TypeError: Cannot read properties of undefined (reading 'isPackaged')
```

#### Solution: Separate Configuration Strategy

We implemented a dual configuration approach:

1. **Minimal Electron Configs**: Located in `src/renderer/` for electron-vite compatibility
2. **Shared Color System**: Maintains synchronization with Vben design system

### 3. PostCSS Configuration

**File**: `src/renderer/postcss.config.mjs`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Key Points**:
- Minimal configuration to avoid Electron conflicts
- No imports from `@electron-toolkit/utils`
- Uses local Tailwind config automatically

### 4. Tailwind Configuration

**File**: `src/renderer/tailwind.config.mjs`

```javascript
import { vbenColors } from '@vben/tailwind-config/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,vue,html}',
    '../../packages/**/*.{js,ts,jsx,tsx,vue,html}',
  ],
  theme: {
    extend: {
      colors: vbenColors,
    },
  },
  plugins: [],
};
```

**Key Points**:
- Imports shared colors from Vben tailwind-config package
- Maintains design system consistency
- Electron-safe configuration

### 5. Shared Color System

To maintain synchronization with the Vben design system while avoiding Electron conflicts, we created a shared color module:

**File**: `internal/tailwind-config/src/colors.ts`

```typescript
// Extracted Vben color definitions for safe sharing
export const vbenColors = {
  // Complete Vben color palette
  // This allows nexo-native to stay in sync with nexo-web
};
```

**Package Export**: Updated `internal/tailwind-config/package.json`

```json
{
  "exports": {
    "./colors": {
      "types": "./src/colors.ts",
      "import": "./dist/colors.mjs",
      "require": "./dist/colors.cjs",
      "default": "./dist/colors.mjs"
    }
  }
}
```

### 6. Build Configuration

**File**: `internal/tailwind-config/build.config.ts`

Added colors entry to unbuild configuration:

```typescript
export default defineBuildConfig({
  entries: ['src/index', './src/postcss.config', './src/colors'],
  // ...
});
```

## Migration Steps

### Step 1: Install electron-vite

```bash
pnpm add -D electron-vite
```

### Step 2: Update package.json scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  }
}
```

### Step 3: Create electron.vite.config.ts

```typescript
import { defineConfig } from 'electron-vite';
// Configuration for main, preload, and renderer processes
```

### Step 4: Restructure source code

Move renderer code to `src/renderer/` directory and update imports accordingly.

### Step 5: Create renderer-specific configs

Create minimal PostCSS and Tailwind configs in `src/renderer/` that are Electron-safe.

### Step 6: Set up shared color system

1. Extract Vben colors to shared module
2. Update build configuration
3. Build the tailwind-config package
4. Import shared colors in renderer config

## Best Practices

### Do's ✅

- Keep renderer configs minimal and Electron-safe
- Use shared modules for design system consistency
- Follow electron-vite directory structure requirements
- Test both development and production builds

### Don'ts ❌

- Don't import Node.js-specific modules in renderer configs
- Don't use `@electron-toolkit/utils` in PostCSS/Tailwind configs
- Don't bypass electron-vite's directory structure requirements
- Don't duplicate color definitions between nexo-web and nexo-native

## Troubleshooting

### Common Issues

1. **PostCSS Import Errors**
   - **Symptom**: `Cannot read properties of undefined (reading 'isPackaged')`
   - **Solution**: Use minimal configs without problematic imports

2. **Config Not Found**
   - **Symptom**: Configs not being loaded by electron-vite
   - **Solution**: Ensure configs are in `src/renderer/` directory

3. **Design System Out of Sync**
   - **Symptom**: Colors/styles differ between nexo-web and nexo-native
   - **Solution**: Use shared color module and rebuild when Vben changes

## Development Workflow

1. Make changes to shared Vben configurations
2. Rebuild tailwind-config package: `cd internal/tailwind-config && pnpm unbuild`
3. Restart nexo-native dev server
4. Changes automatically sync to Electron app

## File Dependencies

```
nexo-native renderer configs
    ↓ imports
@vben/tailwind-config/colors
    ↓ built from
internal/tailwind-config/src/colors.ts
    ↓ contains
Extracted Vben design system colors
```

This setup ensures that nexo-native stays in sync with the Vben design system while maintaining Electron compatibility.
