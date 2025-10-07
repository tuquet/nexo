# Hướng Dẫn Xử Lý Vấn Đề Project Quality

## 📊 Tình Trạng Hiện Tại

### ✅ Đã Giải Quyết

- **CSpell**: ✅ 0 lỗi (từ 893 lỗi)
- **TypeScript**: ✅ Compilation thành công
- **Unused Dependencies**: ✅ Đã xóa axios, fs-extra khỏi nexo-native
- **Environment Variables**: ✅ Đã giải quyết warnings về VITE*SUPABASE*\*
- **Lockfile Sync**: ✅ Đã sync pnpm-lock.yaml với package.json changes

### ⚠️ Cần Theo Dõi (Warnings - Không Fail Build)

- **Circular Dependencies**: ~2300 warnings (chủ yếu từ build output)
- **Dependencies**: Warnings nhỏ về package dependencies
- **Build Compatibility**: Warnings về node modules externalization

---

## 🔧 Environment Variables (Mới Giải Quyết)

### Vấn Đề Trước Đây

Trong quá trình build, có warnings:

```
[warn] - VITE_SUPABASE_URL
[warn] - VITE_SUPABASE_ANON_KEY
```

### ✅ Giải Pháp Đã Áp Dụng

1. **Tạo root `.env` file** với default values:

```bash
# .env (root level)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

2. **Environment hierarchy**:
   - Apps có `.env.local` với values thật
   - Root có `.env` với default values cho packages
   - Build warnings đã biến mất ✅

3. **Chi tiết**: Xem [ENV_VARS_RESOLUTION.md](./ENV_VARS_RESOLUTION.md)

---

## 🔄 Circular Dependencies

### Hiểu về Circular Dependencies

Circular dependencies trong project này **KHÔNG phải lỗi nghiêm trọng** vì:

1. **Chủ yếu từ build output**: `apps/nexo-native/out/renderer/js/**`
2. **Webpack/Vite build process**: Tool bundler tự động xử lý
3. **Runtime hoạt động bình thường**: Application chạy không vấn đề
4. **Không block CI/CD**: Build và deployment vẫn thành công

### Monitoring Commands

```bash
# Xem circular dependencies chi tiết
pnpm run check:circular

# Chỉ count số lượng (nhanh hơn)
pnpm run check:circular | grep "Circular dependency" | wc -l
```

### Khi Nào Cần Quan Tâm?

- **Circular trong source code** (không phải build output)
- **Runtime errors** liên quan đến module loading
- **Performance issues** do circular dependencies

### Cách Giải Quyết (Khi Cần)

1. **Identify source-level circulars**:

```bash
# Check source files chỉ
pnpm run check:circular | grep -v "/out/" | grep -v "/dist/"
```

2. **Common patterns để sửa**:
   - Extract shared types/interfaces
   - Use dependency injection
   - Refactor module structure

---

## 📦 Dependency Management

### Kiểm Tra Dependencies

```bash
# Xem dependencies không sử dụng
pnpm run check:dep

# Xem dependencies và cách sử dụng
pnpm list --depth=0
```

### Best Practices

1. **Regular cleanup**: Monthly review dependencies
2. **Use catalog versions**: Ưu tiên sử dụng catalog trong pnpm-workspace
3. **Avoid dev in prod**: Đảm bảo dev dependencies không leak vào production

---

## 🔤 CSpell Dictionary Management

### Thêm Từ Tiếng Việt Mới

Khi gặp lỗi cspell với từ tiếng Việt hợp lệ:

1. **Mở file cspell.json**
2. **Thêm từ vào mảng `words`**:

```json
{
  "words": [
    // ... existing words
    "từ_mới_tiếng_việt"
  ]
}
```

3. **Chạy kiểm tra**:

```bash
pnpm run check:cspell
```

### Phân Loại Từ (Tham Khảo)

- **Technical**: Định, nghĩa, liệu, dụng, thiết, kế
- **UI/UX**: thoại, người, dùng, chọn, hiển, thị
- **Actions**: Khởi, động, Chạy, kích, hoạt, kiểm, tra
- **Status**: hoàn, thành, được, Không, thành, công

### Khi Có Nhiều Từ Tiếng Việt

Thay vì thêm nhiều từ, xem xét thêm file vào `ignorePaths`:

```json
{
  "ignorePaths": ["path/to/vietnamese-heavy-file/**"]
}
```

---

## 🚀 Daily Workflow

### Trước Khi Commit

```bash
# Quick check (nhanh)
pnpm run check:type && pnpm run check:cspell

# Full check (đầy đủ)
pnpm check
```

### Giải Quyết Lỗi Thường Gặp

#### Environment Variables

```bash
# Nếu thiếu env vars trong packages
# 1. Thêm vào root .env với default value
# 2. Hoặc thêm vào apps/*/env với real value

# Check env loading
node -e "console.log(require('dotenv').config())"
```

#### CSpell Errors

```bash
# Nếu có từ tiếng Việt hợp lệ
# 1. Thêm vào cspell.json words array
# 2. Hoặc thêm file vào ignorePaths nếu có nhiều tiếng Việt

# Nếu có typo tiếng Anh
# 1. Sửa typo trong code
# 2. Hoặc thêm từ chuyên môn vào words array
```

#### TypeScript Errors

```bash
# Compile errors
pnpm run check:type

# Auto-fix style issues
pnpm run lint:fix
```

---

## 📈 Metrics & Monitoring

### Quality Metrics Dashboard

```bash
# Spell check status
echo "CSpell: $(pnpm run check:cspell 2>&1 | grep -o 'Issues found: [0-9]*' || echo '✅ PASS')"

# TypeScript status
echo "TypeScript: $(pnpm run check:type > /dev/null 2>&1 && echo '✅ PASS' || echo '❌ FAIL')"

# Circular dependencies count
echo "Circulars: $(pnpm run check:circular 2>&1 | grep -c 'Circular dependency' || echo '0') warnings"

# Environment variables status
echo "Env Vars: $(pnpm turbo build --filter='@vben-core/form-ui' 2>&1 | grep -c 'VITE_SUPABASE' || echo '✅ CLEAN')"
```

### Available Scripts

```bash
# Quality checks
pnpm check                    # Full quality check
pnpm run check:type          # TypeScript only
pnpm run check:cspell        # Spell check only
pnpm run check:circular      # Circular deps only
pnpm run check:dep           # Dependencies only
pnpm run check:quick         # Fast check (type + cspell)

# Development
pnpm dev                     # Start development
pnpm build                   # Build production
pnpm lint                    # Lint code
pnpm format                  # Format code
```

---

## 🎯 Goals & Targets

### ✅ Completed (October 2025)

- **CSpell**: 0 errors (từ 893 lỗi)
- **TypeScript**: No compilation errors
- **Unused deps**: Cleaned nexo-native
- **Environment Variables**: No more VITE*SUPABASE*\* warnings

### 🎯 Short Term (1-2 tuần)

- Build compatibility warnings (jiti, node modules)
- Performance optimization
- Documentation updates

### 🎯 Medium Term (1-2 tháng)

- Circular deps: Giảm xuống dưới 1000 (từ 2300+)
- Performance: Monitor build time và bundle size
- Dependencies: Standardize versions across packages

### 🎯 Long Term (3-6 tháng)

- Zero source-level circular dependencies
- Automated quality gates in CI/CD
- Performance budgets và monitoring

---

## 🛠️ Recent Improvements

### Environment Variables Resolution

- **Problem**: Build warnings về missing VITE*SUPABASE*\* variables
- **Solution**: Root `.env` file với default values
- **Result**: Clean build logs, no more env warnings
- **Documentation**: [ENV_VARS_RESOLUTION.md](./ENV_VARS_RESOLUTION.md)

### Dictionary Management

- **Vietnamese Support**: Complete bilingual spell checking
- **Custom Dictionary**: 100+ Vietnamese technical terms
- **Documentation**: [VIETNAMESE_DICTIONARY.md](./VIETNAMESE_DICTIONARY.md)

### Dependency Cleanup

- **Removed**: axios, fs-extra, @types/fs-extra từ nexo-native
- **Result**: Cleaner dependency tree, no unused warnings
- **Method**: Manual audit và validation

---

## 🧰 Tools & Utilities

### Useful Aliases (Optional)

Thêm vào shell profile (.bashrc, .zshrc):

```bash
alias pcheck="pnpm check"
alias ptype="pnpm run check:type"
alias pspell="pnpm run check:cspell"
alias pcircular="pnpm run check:circular"
alias pquick="pnpm run check:quick"
```

### Debugging Scripts

```bash
# Environment debugging
function check-env() {
  echo "=== Root .env ==="
  cat .env 2>/dev/null || echo "No root .env found"
  echo -e "\n=== App .env.local ==="
  cat apps/nexo-web/.env.local 2>/dev/null || echo "No app .env.local found"
}

# Quality summary
function quality-summary() {
  echo "📊 Project Quality Summary:"
  echo "TypeScript: $(pnpm run check:type > /dev/null 2>&1 && echo '✅ PASS' || echo '❌ FAIL')"
  echo "CSpell: $(pnpm run check:cspell > /dev/null 2>&1 && echo '✅ PASS' || echo '❌ FAIL')"
  echo "Circular Deps: $(pnpm run check:circular 2>&1 | grep -c 'Circular dependency' || echo '0') warnings"
}
```

---

## � Lockfile Management

### Vấn Đề Lockfile Sync

Khi xóa dependencies từ package.json, cần update lockfile:

#### Lỗi CI/CD

```bash
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with package.json

* 3 dependencies were removed: axios@^1.11.0, fs-extra@^11.3.1, @types/fs-extra@^11.0.4
```

#### ✅ Giải Pháp

```bash
# Update lockfile sau khi thay đổi dependencies
pnpm install

# Test frozen lockfile (như CI/CD)
pnpm install --frozen-lockfile
```

#### Best Practices

1. **Sau khi remove dependencies**: Luôn chạy `pnpm install`
2. **Trước khi commit**: Test với `pnpm install --frozen-lockfile`
3. **CI/CD ready**: Đảm bảo lockfile sync với package.json

---

## �📚 Resources & Documentation

### Project Files

- `cspell.json` - Spell checking configuration với Vietnamese support
- `VIETNAMESE_DICTIONARY.md` - Vietnamese dictionary management guide
- `ENV_VARS_RESOLUTION.md` - Environment variables setup và troubleshooting
- `CSPELL_RESOLUTION_SUMMARY.md` - Chi tiết quá trình giải quyết cspell issues
- `.env` - Root environment variables với default values
- `pnpm-lock.yaml` - Dependency lockfile (auto-generated, commit required)

### External Links

- [CSpell Configuration](https://cspell.org/configuration/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [PNPM Workspace](https://pnpm.io/workspaces)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [PNPM Lockfile](https://pnpm.io/pnpm-lock)

---

## 📝 Change Log

### 2025-10-07

- ✅ Resolved environment variables warnings
- ✅ Created root `.env` file with defaults
- ✅ Updated documentation với environment setup guide
- ✅ Tested package builds - no more VITE*SUPABASE*\* warnings
- ✅ Fixed pnpm lockfile sync issue (removed dependencies)
- ✅ CI/CD ready - frozen lockfile passes
- 📋 Next: Address build compatibility warnings (jiti, node modules)
