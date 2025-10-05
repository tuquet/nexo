# TypeScript Configuration Migration Plan

## 🎯 Objective
Migrate away from deprecated `baseUrl` to future-proof TypeScript 7.0+ compatibility

## 📊 Current Status
- ✅ Phase 1: Immediate fix (`ignoreDeprecations: "6.0"`)
- 🔄 Phase 2: Analysis complete
- ⏳ Phase 3: Migration planning
- ⏳ Phase 4: Implementation
- ⏳ Phase 5: Testing & Validation

## 🔍 Analysis Results

### Import Patterns Found:
1. **✅ Already Compatible**: Imports using `#/*` prefix (majority)
2. **✅ Standard Libs**: Node modules and npm packages (no change needed)
3. **✅ Relative Imports**: `./` and `../` patterns (no change needed)

### Files to Update:
- `apps/nexo-web/tsconfig.json` - Remove baseUrl, keep paths
- Verify all `#/*` imports work without baseUrl

## 🚀 Implementation Plan

### Step 1: Backup Current Config
```bash
cp apps/nexo-web/tsconfig.json apps/nexo-web/tsconfig.json.backup
```

### Step 2: Update tsconfig.json
```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vben/tsconfig/web-app.json",
  "compilerOptions": {
    // Remove baseUrl entirely
    // Remove ignoreDeprecations
    "paths": {
      "#/*": ["./src/*"]  // Keep this - works without baseUrl
    }
  },
  "references": [{ "path": "./tsconfig.node.json" }],
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

### Step 3: Test & Validate
```bash
# Test TypeScript compilation
cd apps/nexo-web
pnpm run typecheck

# Test development server
pnpm run dev

# Test build process  
pnpm run build:native
```

### Step 4: Update CI/CD
- Ensure all workflows pass
- Test on all platforms (Windows, macOS, Ubuntu)

## 🎖️ Benefits
- ✅ Future-proof for TypeScript 7.0+
- ✅ Remove deprecation warnings
- ✅ Cleaner configuration
- ✅ No breaking changes (imports already compatible)

## ⚠️ Risks & Mitigation
- **Risk**: Path resolution might break
- **Mitigation**: Current `#/*` pattern already tested and working
- **Rollback**: Keep backup of original tsconfig.json

## 📅 Timeline
- **Phase 1**: ✅ Completed (ignoreDeprecations fix)
- **Phase 2**: ✅ Completed (analysis)
- **Phase 3**: ✅ Completed (planning)
- **Phase 4**: Ready to implement (after CI passes)
- **Phase 5**: Validate on all environments

## 🔄 Next Steps
1. Wait for current CI/CD to pass with ignoreDeprecations fix
2. Implement Phase 4 when ready
3. Monitor for any path resolution issues
4. Update documentation if needed
