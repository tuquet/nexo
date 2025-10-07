# PWA Manifest 401 Error Fix

## 🚨 Vấn đề
```
GET https://nexo-web-git-development-tuquets-projects.vercel.app/manifest.webmanifest 401 (Unauthorized)
Manifest fetch from https://nexo-web-git-development-tuquets-projects.vercel.app/manifest.webmanifest failed, code 401
```

## 🔍 Nguyên nhân
**Vercel Rewrite Rules** redirect tất cả requests về `/index.html`, bao gồm cả PWA manifest files, khiến chúng không accessible và trả về 401.

## ✅ Giải pháp - Vercel Configuration Fix

### vercel.json - BEFORE (Problematic)
```json
{
  "rewrites": [
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

### vercel.json - AFTER (Fixed)
```json
{
  "rewrites": [
    {
      "source": "/manifest.webmanifest",
      "destination": "/manifest.webmanifest"
    },
    { "source": "/sw.js", "destination": "/sw.js" },
    { "source": "/workbox-:hash.js", "destination": "/workbox-:hash.js" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

### Giải thích Fix
1. **Explicit PWA routes**: Manifest và service worker files được serve trực tiếp
2. **Workbox support**: Dynamic workbox files với hash pattern
3. **SPA fallback**: Các routes khác vẫn fallback về index.html
4. **Order matters**: Specific routes trước, wildcard route cuối

## 🔧 Additional Supabase Environment Fix

### Vấn đề đi kèm
```
Supabase client not initialized. Please check environment variables.
```

### Vercel Environment Variables Setup
Trong Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Production Environment
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Preview Environment (Optional)
VITE_SUPABASE_URL=https://staging-project.supabase.co  
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Environment Scopes
- **Production**: Live production deployments
- **Preview**: Branch deployments (development branch)
- **Development**: Local development (not needed, uses .env.local)

## 🎯 Deployment Process

### 1. Update vercel.json (✅ Completed)
```bash
git add vercel.json
git commit -m "fix: PWA manifest 401 error - update Vercel rewrites"
```

### 2. Set Environment Variables in Vercel
1. Go to Vercel Dashboard
2. Select nexo-web project  
3. Settings → Environment Variables
4. Add VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
5. Set appropriate scopes (Production/Preview)

### 3. Trigger Deployment
```bash
git push origin development
```

### 4. Verify Fix
After deployment:
```bash
# Check manifest accessibility
curl https://nexo-web-git-development-tuquets-projects.vercel.app/manifest.webmanifest

# Should return 200 OK with JSON content instead of 401
```

## 🔍 Testing & Verification

### Local Testing
```bash
# Build production version
cd apps/nexo-web
pnpm build

# Serve locally
pnpm preview

# Check manifest
curl http://localhost:4173/manifest.webmanifest
```

### Browser DevTools
1. **Console**: No more 401 manifest errors
2. **Network**: manifest.webmanifest returns 200 OK
3. **Application → Manifest**: PWA manifest loads correctly
4. **Service Workers**: SW registration successful

### PWA Functionality
- [ ] Manifest fetches successfully (200 OK)
- [ ] Service Worker registers
- [ ] Install banner appears (on supported devices)
- [ ] Offline functionality works
- [ ] App can be added to home screen

## 🛡️ Error Handling Improvements

### Enhanced PWA Error Handling
```typescript
// Check PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered'))
    .catch(error => console.warn('SW registration failed', error));
}

// Manifest error handling
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
});
```

### Supabase Error Handling
Auth service đã có graceful degradation:
```typescript
// From auth.ts
onAuthStateChange(callback) {
  if (!supabase) {
    console.warn('Supabase not available. Auth disabled.');
    callback(null, null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  // Normal flow...
}
```

## 📊 Impact Analysis

### Before Fix
- ❌ PWA manifest: 401 errors
- ❌ Service Worker: May fail to register
- ❌ PWA features: Broken install prompts
- ❌ User Experience: Console errors, broken PWA

### After Fix  
- ✅ PWA manifest: 200 OK responses
- ✅ Service Worker: Proper registration
- ✅ PWA features: Install prompts work
- ✅ User Experience: Clean console, working PWA

## 🔄 Monitoring & Maintenance

### Production Monitoring
```bash
# Check manifest status
curl -I https://nexo-web-git-development-tuquets-projects.vercel.app/manifest.webmanifest

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/manifest+json
```

### Regular Checks
- [ ] Monthly PWA functionality test
- [ ] Manifest validation
- [ ] Service Worker updates
- [ ] Environment variables rotation

## 📚 Related Documentation

### PWA Resources
- [Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

### Vercel Resources  
- [Vercel Rewrites](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Project Documentation
- [Environment Variables Guide](./ENV_VARS_RESOLUTION.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_FIX.md)

---

## 🎯 Quick Fix Summary

1. **✅ Fixed**: Updated `vercel.json` with proper PWA rewrites
2. **⏳ Pending**: Set Supabase environment variables in Vercel dashboard
3. **🔄 Next**: Deploy và verify both fixes work in production

**Expected Result**: Clean console, working PWA manifest, functional Supabase auth trong production environment.
