# Documentation Index

Chào mừng đến với tài liệu dự án Nexo! Dưới đây là tổng quan về tất cả tài liệu được tổ chức theo chủ đề.

## 📁 Cấu trúc Documentation

### 🔧 Project Quality

Tài liệu về chất lượng code, tools và processes:

- **[PROJECT_QUALITY_GUIDE.md](./project-quality/PROJECT_QUALITY_GUIDE.md)** - Hướng dẫn tổng quan về project quality
- **[CSPELL_RESOLUTION_SUMMARY.md](./project-quality/CSPELL_RESOLUTION_SUMMARY.md)** - Chi tiết về việc giải quyết spell checking
- **[VIETNAMESE_DICTIONARY.md](./project-quality/VIETNAMESE_DICTIONARY.md)** - Quản lý từ điển tiếng Việt

### 🚀 Deployment

Tài liệu về deployment và production setup:

- **[VERCEL_DEPLOYMENT_FIX.md](./deployment/VERCEL_DEPLOYMENT_FIX.md)** - Fix Supabase deployment issues trên Vercel
- **[ENV_VARS_RESOLUTION.md](./deployment/ENV_VARS_RESOLUTION.md)** - Environment variables setup và troubleshooting

### 🔄 Migration

Tài liệu về migration và project evolution:

- **[MIGRATION_PLAN.md](./migration/MIGRATION_PLAN.md)** - Kế hoạch migration cho project

### 📚 General

Tài liệu tổng quát:

- **[PUBLISH_README.md](./PUBLISH_README.md)** - Publishing guidelines
- **[README.md](../README.md)** - Project overview (root)
- **[README.vi-VN.md](../README.vi-VN.md)** - Vietnamese version

## 🎯 Quick Navigation

### Cho Developers

- **Setup Development**: [Project Quality Guide](./project-quality/PROJECT_QUALITY_GUIDE.md)
- **Environment Setup**: [Environment Variables](./deployment/ENV_VARS_RESOLUTION.md)
- **Code Quality**: [CSpell Resolution](./project-quality/CSPELL_RESOLUTION_SUMMARY.md)

### Cho DevOps

- **Production Deployment**: [Vercel Deployment Fix](./deployment/VERCEL_DEPLOYMENT_FIX.md)
- **Environment Configuration**: [ENV Vars Resolution](./deployment/ENV_VARS_RESOLUTION.md)

### Cho Project Managers

- **Project Status**: [Project Quality Guide](./project-quality/PROJECT_QUALITY_GUIDE.md)
- **Migration Planning**: [Migration Plan](./migration/MIGRATION_PLAN.md)

## 📋 Documentation Standards

### File Naming Convention

- **SCREAMING_SNAKE_CASE.md** - cho major documentation
- **kebab-case.md** - cho feature-specific docs
- **PascalCase.md** - cho component documentation

### Content Structure

1. **Purpose** - Tại sao document này tồn tại
2. **Problem** - Vấn đề được giải quyết
3. **Solution** - Giải pháp được áp dụng
4. **Implementation** - Chi tiết technical
5. **Verification** - Cách test/verify
6. **Maintenance** - Ongoing maintenance notes

### Language Policy

- **English** - Primary language cho code và technical docs
- **Vietnamese** - Acceptable cho internal docs và comments
- **Bilingual** - Preferred cho user-facing documentation

## 🔄 Document Lifecycle

### Creation

1. Tạo document trong appropriate folder
2. Update INDEX.md với link mới
3. Follow naming convention
4. Include proper metadata

### Updates

1. Update document content
2. Update modification date
3. Update related cross-references
4. Verify links still work

### Archival

1. Move to `/archived` subfolder
2. Update references
3. Add deprecation notice
4. Update INDEX.md

## 🛠️ Tools & Automation

### Spell Checking

- **CSpell** configuration supports Vietnamese
- **Custom dictionary** cho technical terms
- **Ignore patterns** cho generated content

### Link Checking

```bash
# Check all internal links
find docs -name "*.md" -exec grep -l "\]\(" {} \;

# Verify external links (manual process)
```

### Auto-formatting

```bash
# Format all markdown files
npx prettier docs/**/*.md --write
```

## 📈 Metrics & Quality

### Documentation Coverage

- [ ] All major features documented
- [ ] All APIs documented
- [ ] All deployment processes documented
- [ ] All troubleshooting guides current

### Quality Indicators

- ✅ **Spell Check**: 0 errors
- ✅ **Link Check**: All internal links working
- ✅ **Formatting**: Consistent style
- ✅ **Structure**: Logical organization

## 🤝 Contributing

### Adding New Documentation

1. Determine appropriate folder location
2. Follow naming convention
3. Include standard structure
4. Update this INDEX.md
5. Test all links

### Improving Existing Docs

1. Check current accuracy
2. Update technical details
3. Improve clarity và examples
4. Verify all links
5. Update modification dates

---

**Cuối cùng cập nhật**: October 7, 2025  
**Người maintain**: Development Team  
**Review cycle**: Monthly
