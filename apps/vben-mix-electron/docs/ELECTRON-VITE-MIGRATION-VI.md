# Hướng Dẫn Migration Electron-Vite

## Tổng Quan

Tài liệu này mô tả quá trình migration ứng dụng nexo-native từ setup Electron tiêu chuẩn sang framework electron-vite, và các cấu hình đặc biệt cần thiết để làm việc với hệ thống thiết kế Vben Admin.

## Những Thay Đổi Chính

### 1. Cấu Trúc Dự Án

Electron-vite yêu cầu một cấu trúc thư mục cụ thể cho cấu hình renderer process:

```
apps/nexo-native/
├── src/
│   ├── main/           # Code main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # Code renderer process
│       ├── tailwind.config.mjs  # Tailwind config cho renderer
│       └── postcss.config.mjs   # PostCSS config cho renderer
```

### 2. Thách Thức Cấu Hình

#### Vấn Đề: Xung Đột Môi Trường Electron

Thách thức chính là PostCSS configuration của Vben import `@electron-toolkit/utils`, gây lỗi runtime trong renderer process:

```
TypeError: Cannot read properties of undefined (reading 'isPackaged')
```

#### Giải Pháp: Chiến Lược Cấu Hình Riêng Biệt

Chúng ta đã implement một phương pháp cấu hình kép:

1. **Config Electron Tối Giản**: Đặt trong `src/renderer/` để tương thích với electron-vite
2. **Hệ Thống Màu Sắc Chia Sẻ**: Duy trì đồng bộ với hệ thống thiết kế Vben

### 3. Cấu Hình PostCSS

**File**: `src/renderer/postcss.config.mjs`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Điểm Quan Trọng**:
- Cấu hình tối giản để tránh xung đột Electron
- Không import từ `@electron-toolkit/utils`
- Tự động sử dụng Tailwind config local

### 4. Cấu Hình Tailwind

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

**Điểm Quan Trọng**:
- Import màu sắc chia sẻ từ Vben tailwind-config package
- Duy trì tính nhất quán của hệ thống thiết kế
- Cấu hình an toàn cho Electron

### 5. Hệ Thống Màu Sắc Chia Sẻ

Để duy trì đồng bộ với hệ thống thiết kế Vben mà tránh xung đột Electron, chúng ta tạo một color module chia sẻ:

**File**: `internal/tailwind-config/src/colors.ts`

```typescript
// Định nghĩa màu sắc Vben được trích xuất để chia sẻ an toàn
export const vbenColors = {
  // Bảng màu Vben hoàn chỉnh
  // Cho phép nexo-native đồng bộ với nexo-web
};
```

**Package Export**: Cập nhật `internal/tailwind-config/package.json`

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

### 6. Cấu Hình Build

**File**: `internal/tailwind-config/build.config.ts`

Thêm colors entry vào unbuild configuration:

```typescript
export default defineBuildConfig({
  entries: ['src/index', './src/postcss.config', './src/colors'],
  // ...
});
```

## Các Bước Migration

### Bước 1: Cài đặt electron-vite

```bash
pnpm add -D electron-vite
```

### Bước 2: Cập nhật package.json scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  }
}
```

### Bước 3: Tạo electron.vite.config.ts

```typescript
import { defineConfig } from 'electron-vite';
// Cấu hình cho main, preload, và renderer processes
```

### Bước 4: Tái cấu trúc source code

Di chuyển renderer code vào thư mục `src/renderer/` và cập nhật imports tương ứng.

### Bước 5: Tạo configs riêng cho renderer

Tạo PostCSS và Tailwind configs tối giản trong `src/renderer/` an toàn cho Electron.

### Bước 6: Thiết lập hệ thống màu sắc chia sẻ

1. Trích xuất Vben colors vào shared module
2. Cập nhật build configuration
3. Build tailwind-config package
4. Import shared colors trong renderer config

## Best Practices

### Nên Làm ✅

- Giữ renderer configs tối giản và an toàn cho Electron
- Sử dụng shared modules để nhất quán hệ thống thiết kế
- Tuân theo yêu cầu cấu trúc thư mục của electron-vite
- Test cả development và production builds

### Không Nên Làm ❌

- Đừng import Node.js-specific modules trong renderer configs
- Đừng sử dụng `@electron-toolkit/utils` trong PostCSS/Tailwind configs
- Đừng bỏ qua yêu cầu cấu trúc thư mục của electron-vite
- Đừng duplicate color definitions giữa nexo-web và nexo-native

## Troubleshooting

### Các Vấn Đề Thường Gặp

1. **Lỗi PostCSS Import**
   - **Triệu chứng**: `Cannot read properties of undefined (reading 'isPackaged')`
   - **Giải pháp**: Sử dụng configs tối giản không có imports có vấn đề

2. **Không Tìm Thấy Config**
   - **Triệu chứng**: Configs không được load bởi electron-vite
   - **Giải pháp**: Đảm bảo configs nằm trong thư mục `src/renderer/`

3. **Hệ Thống Thiết Kế Không Đồng Bộ**
   - **Triệu chứng**: Màu sắc/styles khác nhau giữa nexo-web và nexo-native
   - **Giải pháp**: Sử dụng shared color module và rebuild khi Vben thay đổi

## Quy Trình Phát Triển

1. Thực hiện thay đổi vào shared Vben configurations
2. Rebuild tailwind-config package: `cd internal/tailwind-config && pnpm unbuild`
3. Restart nexo-native dev server
4. Thay đổi tự động sync vào Electron app

## Phụ Thuộc File

```
nexo-native renderer configs
    ↓ imports
@vben/tailwind-config/colors
    ↓ built from
internal/tailwind-config/src/colors.ts
    ↓ contains
Extracted Vben design system colors
```

Setup này đảm bảo rằng nexo-native luôn đồng bộ với hệ thống thiết kế Vben trong khi vẫn duy trì tương thích Electron.

## Lưu Ý Quan Trọng

### Về Cấu Hình

- **Electron Environment**: Renderer process có môi trường khác với Node.js, một số modules không hoạt động
- **Config Location**: electron-vite bắt buộc configs phải ở `src/renderer/`
- **Shared Dependencies**: Cần cẩn thận khi share code giữa web và native apps

### Về Maintenance

- **Version Sync**: Khi Vben cập nhật, cần rebuild shared color module
- **Testing**: Luôn test cả development và production builds
- **Documentation**: Cập nhật docs khi có thay đổi về cấu hình

### Về Performance

- **Bundle Size**: Electron apps cần chú ý bundle size
- **Hot Reload**: electron-vite hỗ trợ hot reload cho development
- **Build Optimization**: Sử dụng production build để deploy

## Tài Liệu Tham Khảo

- [Electron-Vite Documentation](https://electron-vite.org/)
- [Vben Admin Documentation](https://doc.vben.pro/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [PostCSS Documentation](https://postcss.org/)
