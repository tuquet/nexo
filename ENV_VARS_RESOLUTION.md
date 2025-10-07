# Environment Variables Warning Resolution

## 🚨 Vấn đề
Trong quá trình build, các packages `@vben-core/*` hiển thị warnings:
```
[warn] - VITE_SUPABASE_URL 
[warn] - VITE_SUPABASE_ANON_KEY
```

## 🔍 Nguyên nhân
1. **Packages build riêng biệt**: Các packages `@vben-core/*` được build độc lập
2. **Không access app env**: Packages không có quyền truy cập vào env của `apps/nexo-web`
3. **Vite warning behavior**: Vite warn khi gặp `import.meta.env.VITE_*` không được define

## ✅ Giải pháp

### 1. Tạo Root `.env` File
Tạo file `.env` ở root với default values:
```bash
# .env (root level)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 2. App-specific Environment Files
Mỗi app có file `.env` riêng với giá trị thật:
```bash
# apps/nexo-web/.env.local
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. Environment Hierarchy
Thứ tự ưu tiên của environment files:
1. `apps/nexo-web/.env.local` (cao nhất)
2. `apps/nexo-web/.env.development` 
3. `apps/nexo-web/.env.production`
4. `apps/nexo-web/.env`
5. `.env` (root - thấp nhất)

## 🎯 Kết quả
- ✅ **Build warnings giảm**: Không còn warning về missing env vars
- ✅ **Functionality không đổi**: App vẫn hoạt động bình thường
- ✅ **Security maintained**: Sensitive values vẫn trong app-level files
- ✅ **Build process cleaner**: Logs build sạch hơn

## 📋 Checklist Khi Thêm Env Vars Mới

### Cho App-specific Variables
1. Thêm vào `apps/nexo-web/.env.example` với placeholder
2. Thêm vào `apps/nexo-web/.env.local` với giá trị thật
3. Document trong README về cách setup

### Cho Shared Variables (được dùng trong packages)
1. Thêm vào `.env` (root) với default value
2. Thêm vào `apps/nexo-web/.env.local` với giá trị thật
3. Update `internal/vite-config/src/utils/env.ts` nếu cần convert

## 🔧 Environment Files Structure

```
nexo/
├── .env                          # Root defaults (cho packages)
├── apps/
│   └── nexo-web/
│       ├── .env.example         # Template với placeholders
│       ├── .env.local           # Local development (gitignored)
│       ├── .env.development     # Development environment
│       ├── .env.production      # Production environment
│       └── .env.native          # Native app specific
└── playground/
    ├── .env
    ├── .env.development
    └── .env.production
```

## 🚀 Best Practices

### 1. Security
- **Không commit** `.env.local` files
- **Sử dụng** `.env.example` để document required vars
- **Rotate keys** thường xuyên cho production

### 2. Development
```bash
# Copy example file khi setup project mới
cp apps/nexo-web/.env.example apps/nexo-web/.env.local

# Edit với values thật
code apps/nexo-web/.env.local
```

### 3. CI/CD
```yaml
# GitHub Actions example
env:
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 🛠️ Debugging Environment Issues

### Kiểm tra env loading
```typescript
// Trong component hoặc utils
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('All env vars:', import.meta.env);
```

### Kiểm tra build-time env
```bash
# Build với debug
VITE_DEBUG=* pnpm build

# Kiểm tra loaded env files
node -e "console.log(require('dotenv').config())"
```

### Common Issues & Solutions

#### Issue: "Environment variable not found"
```bash
# Check file exists và có đúng format
ls -la apps/nexo-web/.env*
cat apps/nexo-web/.env.local
```

#### Issue: "Old values still showing"
```bash
# Clear cache và rebuild
pnpm clean
rm -rf node_modules/.vite
pnpm install
pnpm dev
```

#### Issue: "Production build missing vars"
```bash
# Check production env file
cat apps/nexo-web/.env.production

# Hoặc set inline for build
VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=yyy pnpm build
```

---

## 📚 Related Documentation
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Project Quality Guide](./PROJECT_QUALITY_GUIDE.md)
- [Supabase Setup Guide](./apps/nexo-web/README.md)
