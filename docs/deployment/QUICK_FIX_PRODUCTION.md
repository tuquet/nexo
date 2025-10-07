# Quick Fix Script - Production Issues

## 🚀 Immediate Fix Commands

### 1. Disable PWA (Fix manifest 401)

```bash
# Navigate to nexo-web
cd apps/nexo-web

# Create production environment file with PWA disabled
echo "VITE_PWA=false" > .env.production

# Commit and push
git add .env.production
git commit -m "fix: disable PWA to resolve manifest 401 error in production"
git push origin development
```

### 2. Set Supabase Environment Variables

**Go to Vercel Dashboard**: https://vercel.com/dashboard

**Navigate to**: nexo-web project → Settings → Environment Variables

**Add these variables**:

```bash
# Variable 1
Name: VITE_SUPABASE_URL
Value: https://xfdtssutjguzbpkrapkw.supabase.co
Environment: Production, Preview

# Variable 2
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZHRzc3V0amd1emJwa3JhcGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Mzk0MzgsImV4cCI6MjA3NTMxNTQzOH0.P-yc9uWkFmoucP6-1DKpdFWHMM-39NUtG7nNsaePtI0
Environment: Production, Preview
```

### 3. Verify Deployment

After Vercel auto-redeploys (should happen within 1-2 minutes):

1. **Open browser dev tools** (F12)
2. **Navigate to**: https://nexo-web-git-development-tuquets-projects.vercel.app/
3. **Check console** - should see:
   - ✅ No manifest 401 errors
   - ✅ No Supabase retry warnings
   - ✅ Clean console output

### 4. Test Authentication

1. **Try login/register**
2. **Should work without** "Retry attempt" messages
3. **Supabase features** should be fully functional

---

## ⏱️ Expected Timeline

- **Fix implementation**: 5 minutes
- **Vercel deployment**: 1-2 minutes
- **Verification**: 2 minutes
- **Total**: ~10 minutes for complete resolution

## 🎯 Success Criteria

- [ ] No 401 manifest errors in console
- [ ] No Supabase initialization warnings
- [ ] Authentication works properly
- [ ] App fully functional

**Both critical production issues should be resolved after these steps.**
