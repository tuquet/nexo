# Hướng dẫn Publish Dự án Nexo

## Tổng quan

Dự án Nexo là một ứng dụng Electron được xây dựng với Vue.js và TypeScript, sử dụng monorepo structure với pnpm workspace. Dự án hỗ trợ publish cho các nền tảng Windows, macOS và Linux thông qua GitHub Releases.

## Yêu cầu hệ thống

- **Node.js**: >= 20.10.0
- **pnpm**: >= 9.12.0
- **Git**: Phiên bản mới nhất
- **GitHub Personal Access Token** (cho việc publish)

## Cấu hình trước khi publish

### 1. Tạo GitHub Personal Access Token

1. Truy cập [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Chọn các quyền cần thiết:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `write:packages` (Upload packages to GitHub Package Registry)
4. Copy token và lưu trữ an toàn

### 2. Cấu hình Environment Variables

#### Windows (PowerShell):

```powershell
# Thiết lập token tạm thời
$env:GH_TOKEN="your_github_token_here"

# Hoặc thiết lập vĩnh viễn
[Environment]::SetEnvironmentVariable("GH_TOKEN", "your_github_token_here", "User")
```

#### macOS/Linux:

```bash
# Thiết lập token tạm thời
export GH_TOKEN="your_github_token_here"

# Hoặc thêm vào ~/.bashrc hoặc ~/.zshrc
echo 'export GH_TOKEN="your_github_token_here"' >> ~/.bashrc
source ~/.bashrc
```

#### Sử dụng file .env.local:

```bash
# Tạo file .env.local trong thư mục apps/nexo-native/
GH_TOKEN=your_github_token_here
```

## Quy trình Publish

### 1. Chuẩn bị code

```bash
# Cài đặt dependencies
pnpm install

# Kiểm tra linting và type checking
pnpm run check

# Build nexo-web trước (tạo renderer content)
cd apps/nexo-web
pnpm run build:native

# Build nexo-native (sẽ tự động chạy postbuild để copy renderer)
cd ../nexo-native
pnpm run build
```

**Lưu ý quan trọng:**

- Phải build `nexo-web` trước để tạo `dist/` folder
- Script `build.mjs` sẽ tự động copy từ `../nexo-web/dist` vào `out/renderer`
- Quy trình build hoàn chỉnh: `nexo-web` → `nexo-native` → `electron-builder`

### 2. Cập nhật phiên bản

```bash
# Cập nhật version trong package.json
# Thực hiện thay đổi trong apps/nexo-native/package.json
```

### 3. Publish theo nền tảng

#### Publish cho Windows:

```bash
# Bước 1: Thiết lập token
$env:GH_TOKEN="your_github_token_here"

# Bước 2: Chuyển vào thư mục nexo-native
cd apps/nexo-native

# Bước 3: Thực hiện publish
pnpm run publish:win

# Bước 4: Xóa token khỏi environment (tùy chọn)
$env:GH_TOKEN=$null
```

**Hoặc thực hiện tất cả trong một dòng:**

```bash
$env:GH_TOKEN="your_token"; cd apps/nexo-native; pnpm run publish:win; $env:GH_TOKEN=$null
```

#### Publish cho macOS:

```bash
# Bước 1: Thiết lập token
export GH_TOKEN="your_github_token_here"

# Bước 2: Chuyển vào thư mục nexo-native
cd apps/nexo-native

# Bước 3: Build cho macOS
pnpm run build:mac

# Bước 4: Publish
pnpm run publish

# Bước 5: Xóa token (tùy chọn)
unset GH_TOKEN
```

#### Publish cho Linux:

```bash
# Bước 1: Thiết lập token
export GH_TOKEN="your_github_token_here"

# Bước 2: Chuyển vào thư mục nexo-native
cd apps/nexo-native

# Bước 3: Build cho Linux
pnpm run build:linux

# Bước 4: Publish
pnpm run publish

# Bước 5: Xóa token (tùy chọn)
unset GH_TOKEN
```

#### Publish cho tất cả nền tảng:

```bash
# Bước 1: Thiết lập token
export GH_TOKEN="your_github_token_here"  # Linux/macOS
# hoặc
$env:GH_TOKEN="your_github_token_here"    # Windows

# Bước 2: Chuyển vào thư mục nexo-native
cd apps/nexo-native

# Bước 3: Publish cho tất cả platform
pnpm run publish
```

## Scripts có sẵn

### Root level (từ thư mục gốc):

- `pnpm run build:nexo` - Build ứng dụng Nexo
- `pnpm run dev` - Chạy development mode

### Nexo-native level (từ apps/nexo-native):

- `pnpm run dev` - Chạy ứng dụng ở development mode
- `pnpm run build` - Build ứng dụng
- `pnpm run build:unpack` - Build mà không đóng gói
- `pnpm run build:win` - Build cho Windows
- `pnpm run build:mac` - Build cho macOS
- `pnpm run build:linux` - Build cho Linux
- `pnpm run publish` - Publish cho tất cả nền tảng
- `pnpm run publish:win` - Publish chỉ cho Windows

## Cấu hình Electron Builder

File `electron-builder.yml` chứa cấu hình publish:

```yaml
publish:
  provider: github
  owner: tuquet
  repo: nexo
  releaseType: prerelease
  vPrefixedTagName: true
```

## Troubleshooting

### 1. Lỗi "Cannot find GitHub token"

- Kiểm tra biến môi trường `GH_TOKEN` đã được thiết lập
- Đảm bảo token có đủ quyền

### 2. Lỗi "Repository not found"

- Kiểm tra `owner` và `repo` trong `electron-builder.yml`
- Đảm bảo token có quyền truy cập repository

### 3. Lỗi build

```bash
# Xóa cache và reinstall
pnpm run clean
pnpm run reinstall
```

**Build từng bước để debug:**

```bash
# 1. Build web trước
cd apps/nexo-web
pnpm run build:native

# 2. Kiểm tra có file dist không
ls -la dist/

# 3. Build native
cd ../nexo-native
pnpm run build

# 4. Kiểm tra postbuild đã copy renderer chưa
ls -la out/renderer/

# 5. Test unpack
pnpm run build:unpack
```

### 4. Lỗi renderer không được copy

```bash
# Kiểm tra đường dẫn
cd apps/nexo-native
node scripts/build.mjs --renderer

# Kiểm tra config trong build.mjs
echo $RENDERER_FOLDER      # should be "nexo-web"
echo $RENDERER_DEST_FOLDER # should be "renderer"
```

### 4. Lỗi publish

```bash
# Kiểm tra network connection
# Kiểm tra GitHub status
# Thử publish với verbose output
DEBUG=electron-builder pnpm run publish
```

## Best Practices

1. **Version Management**: Sử dụng semantic versioning (x.y.z)
2. **Testing**: Luôn test build local trước khi publish
3. **Backup**: Backup code trước khi publish
4. **Release Notes**: Viết release notes chi tiết
5. **Security**: Không commit token vào git

## Automation với GitHub Actions

### Thiết lập GitHub Actions

#### 1. Tạo file workflow

Tạo file `.github/workflows/release.yml` trong thư mục gốc của repository:

```yaml
name: Build and Release Nexo

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., v1.0.0)'
        required: true
        default: 'v1.0.0'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '10.14.0'

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check and lint
        run: pnpm run check

      - name: Build Nexo application
        run: pnpm run build:nexo

      - name: Build and publish (Windows)
        if: matrix.os == 'windows-latest'
        run: |
          cd apps/nexo-native
          pnpm run publish:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and publish (macOS)
        if: matrix.os == 'macos-latest'
        run: |
          cd apps/nexo-native
          pnpm run build:mac
          pnpm run publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and publish (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: |
          cd apps/nexo-native
          pnpm run build:linux
          pnpm run publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### 2. Workflow chỉ build (không publish)

Tạo file `.github/workflows/build.yml` để test build trên mỗi PR:

```yaml
name: Build and Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '10.14.0'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check and lint
        run: pnpm run check

      - name: Build Nexo application
        run: pnpm run build:nexo

      - name: Test build (unpack only)
        run: |
          cd apps/nexo-native
          pnpm run build:unpack
```

### Cách sử dụng GitHub Actions

#### 1. Tự động publish khi tạo tag:

```bash
# Cập nhật version trong package.json trước
cd apps/nexo-native
# Sửa version trong package.json

# Tạo và push tag
git add .
git commit -m "chore: bump version to v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

#### 2. Trigger thủ công (Manual dispatch):

1. Vào tab **Actions** trên GitHub repository
2. Chọn workflow **"Build and Release Nexo"**
3. Click **"Run workflow"**
4. Chọn branch và nhập version muốn release
5. Click **"Run workflow"**

#### 3. Test build với Pull Request:

- Workflow **"Nexo Build and Test"** sẽ tự động chạy khi:
  - Tạo Pull Request vào branch `main`
  - Push code vào branch `main`
  - Có thay đổi trong thư mục `apps/nexo-native/`, `packages/`, `internal/`

### Files đã được tạo:

- `.github/workflows/release.yml` - Workflow chính cho release
- `.github/workflows/nexo-test.yml` - Workflow test build

### Cấu hình Secrets

Đảm bảo repository có các secrets cần thiết:

1. Vào **Settings** > **Secrets and variables** > **Actions**
2. `GITHUB_TOKEN` được tự động tạo (không cần thêm)
3. Nếu cần custom token, thêm `GH_TOKEN` với Personal Access Token

### Monitoring và Debug

#### Xem logs:

- Vào tab **Actions** trên GitHub
- Click vào workflow run cụ thể
- Xem logs của từng step và job

#### Debug workflow:

```yaml
# Thêm step debug nếu cần trong workflow
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "Pnpm version: $(pnpm --version)"
    echo "Working directory: $(pwd)"
    ls -la
```

#### Retry failed jobs:

- Click vào job bị failed
- Click **"Re-run jobs"** để chạy lại

### Version Management

#### Cập nhật version trước khi release:

1. **Manual update:**

```json
// apps/nexo-native/package.json
{
  "name": "@nexo/native",
  "version": "1.0.1", // Cập nhật version ở đây
  "description": "..."
}
```

2. **Sử dụng npm version:**

```bash
cd apps/nexo-native
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

#### Semantic Versioning:

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backwards compatible
- **PATCH** (0.0.x): Bug fixes, backwards compatible

### Troubleshooting GitHub Actions

#### 1. Build fails on specific OS:

```yaml
# Tạm thời skip OS bị lỗi
strategy:
  matrix:
    os: [windows-latest, macos-latest] # Bỏ ubuntu-latest
```

#### 2. Dependencies cache issues:

- Xóa cache trong Settings > Actions > Caches
- Hoặc update cache key trong workflow

#### 3. Electron build fails:

```bash
# Local test trước khi push
cd apps/nexo-native
pnpm run build:unpack
```

#### 4. GitHub token permission issues:

- Kiểm tra repository Settings > Actions > General
- Đảm bảo "Read and write permissions" được enable

## Liên hệ

Nếu gặp vấn đề trong quá trình publish, vui lòng tạo issue trên GitHub repository.
