# electron-app

An Electron application with Vue and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### Publish

[Personal access tokens (classic)](https://github.com/settings/tokens)

```bash
# Navigate to the electron directory
cd mmo/electron
```

```powershell
# For windows
$env:GH_TOKEN="ghp_your_actual_token_here"; pnpm run publish:win; $env:GH_TOKEN=$null
```

```bash
# For macOS/Linux
export GH_TOKEN="ghp_your_actual_token_here" && pnpm run publish:win && unset GH_TOKEN
```
