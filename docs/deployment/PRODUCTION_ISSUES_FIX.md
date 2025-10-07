# Production Deployment Issues - Complete Troubleshooting

## 🚨 Current Issues (After Deployment)

### 1. PWA Manifest 401 Error

```
GET https://nexo-web-git-development-tuquets-projects.vercel.app/manifest.webmanifest 401 (Unauthorized)
Manifest fetch failed, code 401
```

### 2. Supabase Environment Variables Missing

```
Missing Supabase environment variables. Supabase features will be disabled.
Supabase client not available. Auth state change listener disabled.
Retry attempt 1/3 for operation failed: Supabase client not initialized.
```

## 🔍 Root Cause Analysis

### PWA Manifest Issue

**Status**: ⚠️ Partially Fixed

- ✅ **Vercel rewrites updated** - Correct configuration in vercel.json
- ❌ **Manifest file missing** - Not generated during build
- ❌ **Build process failing** - Jiti compatibility issues prevent complete build

### Supabase Environment Variables

**Status**: ❌ **Not Fixed**

- ❌ **Environment variables not set** in Vercel dashboard
- ✅ **Graceful degradation working** - App doesn't crash
- ✅ **Warning messages clear** - Developers know what's missing

## 🎯 Immediate Action Plan

### PRIORITY 1: Fix PWA Manifest Generation

#### Option A: Disable PWA (Quick Fix)

Update `apps/nexo-web/.env.production`:

```bash
# Temporarily disable PWA to fix manifest 401
VITE_PWA=false
```

#### Option B: Fix Build Process (Complete Fix)

The jiti compatibility issue needs investigation:

```bash
# Check if manifest generates with different build approach
cd apps/nexo-web
VITE_PWA=true pnpm build --mode production
ls dist/manifest.webmanifest  # Should exist after successful build
```

### PRIORITY 2: Set Supabase Environment Variables

#### In Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select: nexo-web project
3. Settings → Environment Variables
4. Add:

```bash
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZHRzc3V0amd1emJwa3JhcGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Mzk0MzgsImV4cCI6MjA3NTMxNTQzOH0.P-yc9uWkFmoucP6-1DKpdFWHMM-39NUtG7nNsaePtI0
```

#### Environment Scopes:

- **Production**: ✅ Set for live site
- **Preview**: ✅ Set for development branch
- **Development**: ❌ Not needed (uses .env.local)

## 🔧 Comprehensive Fix Strategy

### Step 1: Quick PWA Fix (5 minutes)

```bash
# Disable PWA temporarily
echo "VITE_PWA=false" >> apps/nexo-web/.env.production
git add apps/nexo-web/.env.production
git commit -m "fix: temporarily disable PWA to resolve manifest 401"
git push origin development
```

### Step 2: Set Environment Variables (10 minutes)

1. **Open Vercel Dashboard**
2. **Navigate to Project Settings**
3. **Add Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Trigger Redeploy** (automatic after env var changes)

### Step 3: Verify Fixes (5 minutes)

After deployment:

```bash
# Check Supabase vars loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

# Check no manifest requests (PWA disabled)
# Network tab should not show manifest.webmanifest requests
```

### Step 4: Re-enable PWA (Optional - Later)

```bash
# After investigating build issues
echo "VITE_PWA=true" > apps/nexo-web/.env.production
# Ensure build process works completely
# Redeploy and test
```

## 🛡️ Build Process Investigation

### Current Build Issue

```
[vite-plugin-pwa:build] There was an error during the build:
jiti/lib/jiti.mjs (1:9): "createRequire" is not exported by "__vite-browser-external"
```

### Potential Solutions

#### Solution A: Update Dependencies

```bash
# Update problematic dependencies
pnpm update jiti vite-plugin-pwa
```

#### Solution B: Vite Configuration

```typescript
// vite.config.mts - Add build compatibility
export default defineConfig({
  build: {
    target: 'es2020', // More compatible target
    rollupOptions: {
      external: ['jiti'], // Externalize problematic dependency
    },
  },
});
```

#### Solution C: Alternative PWA Configuration

```typescript
// Use simpler PWA config without problematic features
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  },
  manifest: false, // Disable manifest generation temporarily
});
```

## 📊 Expected Results After Fixes

### Immediate (After Priority 1 & 2)

- ✅ **No more 401 errors** (PWA disabled)
- ✅ **Supabase authentication works** (env vars set)
- ✅ **Clean console logs** (warnings resolved)
- ✅ **App fully functional** (no missing features)

### Long-term (After build process fix)

- ✅ **PWA functionality restored** (manifest + service worker)
- ✅ **Install prompts work** (proper PWA behavior)
- ✅ **Offline support** (if configured)
- ✅ **Complete feature set** (all functionality enabled)

## 🔄 Monitoring & Validation

### Production Health Check

```bash
# 1. Check environment variables
curl -s https://nexo-web-git-development-tuquets-projects.vercel.app/ | grep -o 'VITE_SUPABASE_URL'

# 2. Check console errors
# Open browser dev tools, should see:
# - No manifest 401 errors
# - No Supabase initialization errors
# - Clean console output

# 3. Check authentication
# Test login/register functionality
# Should work without retry warnings
```

### Deployment Verification

```bash
# After each deployment, verify:
# 1. App loads without console errors
# 2. Authentication works (if env vars set)
# 3. No 401 network errors
# 4. All features functional
```

## 📋 Deployment Checklist

### Before Deploy

- [ ] Environment variables configured in Vercel
- [ ] Build process tested locally
- [ ] PWA configuration validated
- [ ] Error handling tested

### After Deploy

- [ ] Console errors checked
- [ ] Authentication tested
- [ ] Network requests verified
- [ ] User functionality confirmed

### If Issues Persist

- [ ] Check Vercel deployment logs
- [ ] Verify environment variable values
- [ ] Test with PWA disabled
- [ ] Contact Vercel support if needed

---

## 🎯 Immediate Next Steps

1. **Disable PWA** (quick fix for manifest 401)
2. **Set environment variables** in Vercel dashboard
3. **Deploy and test** both fixes
4. **Investigate build process** for PWA re-enablement

**Expected timeline**: 20 minutes for immediate fixes, additional time for complete PWA restoration.

**Both critical issues should be resolved with Priority 1 & 2 actions.**
