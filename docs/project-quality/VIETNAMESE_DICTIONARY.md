# Vietnamese Dictionary Management

## 📖 Tổng Quan

File này chứa hướng dẫn quản lý từ điển tiếng Việt cho CSpell trong dự án. Dự án hỗ trợ bilingual (English + Vietnamese) với custom dictionary cho các từ technical và domain-specific.

## 🎯 Mục Đích

1. **Spell checking accuracy** cho Vietnamese content
2. **Technical term consistency** across codebase
3. **Development efficiency** bằng cách giảm false positives
4. **Maintainability** của Vietnamese dictionary

## 📝 Từ Điển Hiện Tại

### Technical Terms (Thuật ngữ kỹ thuật)

```
định, nghĩa, liệu, dụng, thiết, kế, phát, triển, ứng,
mật, khẩu, nhập, truy, cập, xác, thực, minh, chứng,
khởi, động, kích, hoạt, cài, đặt, cấu, hình, cơ, sở,
liệu, quan, lý, xử, lý, kiểm, tra, thử, nghiệm
```

### UI/UX Terms (Thuật ngữ giao diện)

```
người, dùng, giao, diện, hiển, thị, chọn, lựa, nhấn,
nút, menu, thanh, công, cụ, danh, sách, bảng, biểu,
trang, chủ, đăng, nhập, đăng, ký, quên, khẩu
```

### Status & Actions (Trạng thái và hành động)

```
hoàn, thành, thành, công, thất, bại, đang, xử, lý,
chờ, chấp, nhận, từ, chối, hủy, bỏ, lưu, trữ, tải,
xuống, cập, nhật, xóa, sửa, thêm, mới
```

### Business Domain (Thuật ngữ nghiệp vụ)

```
tài, khoản, khách, hàng, đơn, hàng, sản, phẩm, dịch,
vụ, thanh, toán, giao, dịch, báo, cáo, thống, kê,
phân, tích, doanh, thu, lợi, nhuận
```

## 🔧 Cách Thêm Từ Mới

### 1. Identify Valid Terms

Khi gặp CSpell error với từ tiếng Việt:

```bash
# Run spell check để xem errors
pnpm run check:cspell

# Example error:
# Unknown word (từ_mới_hợp_lệ)
```

### 2. Add to CSpell Configuration

Mở `cspell.json` và thêm từ vào array `words`:

```json
{
  "words": [
    // ... existing words
    "từ_mới_hợp_lệ",
    "thuật_ngữ_technical"
  ]
}
```

### 3. Categorize and Document

Thêm từ vào category phù hợp trong file này để maintain organization.

### 4. Verify

```bash
# Test spell check pass
pnpm run check:cspell

# Should show: Issues found: 0 in 0 files
```

## 📋 Guidelines

### Valid Vietnamese Terms

✅ **Add these types**:

- Technical terms used consistently
- Business domain vocabulary
- UI/UX terminology
- Status và action words
- Proper nouns (product names, etc.)

❌ **Don't add these**:

- Typos hoặc misspellings
- Informal chat language
- Regional slang
- Extremely rare words

### Naming Convention

- **Lowercase**: `từ`, `nghĩa`, `liệu`
- **Compound words**: `người_dùng`, `cơ_sở_dữ_liệu`
- **Technical terms**: keep English if widely used

## 🔄 Maintenance Process

### Monthly Review

1. **Audit dictionary** cho unused terms
2. **Check consistency** across codebase
3. **Update categories** in this document
4. **Remove obsolete** terms

### When Adding Many Terms

Thay vì thêm nhiều từ riêng lẻ, consider:

1. **Ignore specific files** with heavy Vietnamese:

```json
{
  "ignorePaths": ["path/to/vietnamese-heavy-file/**"]
}
```

2. **Use regex patterns** cho common patterns:

```json
{
  "ignoreRegExpList": ["/\\b[a-zA-Z]+-vi-VN\\b/g"]
}
```

## 🛠️ Tools & Automation

### Dictionary Statistics

```bash
# Count total words in dictionary
jq '.words | length' cspell.json

# Find Vietnamese-specific words
jq '.words | map(select(test("[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]")))' cspell.json
```

### Validation Script

```javascript
// Check for potential duplicates hoặc similar words
const words = require('./cspell.json').words;
const vietnamese = words.filter((word) =>
  /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/.test(
    word,
  ),
);
console.log(`Vietnamese words: ${vietnamese.length}`);
```

## 📊 Current Statistics

- **Total dictionary size**: ~100+ words
- **Vietnamese terms**: ~70% of total
- **Technical terms**: ~40%
- **UI/UX terms**: ~30%
- **Business terms**: ~20%
- **Other**: ~10%

## 🔗 Related Files

- `cspell.json` - Main configuration file
- `docs/project-quality/CSPELL_RESOLUTION_SUMMARY.md` - Detailed resolution history
- `docs/project-quality/PROJECT_QUALITY_GUIDE.md` - Overall quality guidelines

## 📚 External Resources

- [CSpell Configuration](https://cspell.org/configuration/)
- [Vietnamese Language Support](https://cspell.org/configuration/language-settings/)
- [Custom Dictionaries](https://cspell.org/configuration/dictionaries/)

---

**Cuối cùng cập nhật**: October 7, 2025  
**Dictionary version**: 1.2  
**Total Vietnamese terms**: 70+
