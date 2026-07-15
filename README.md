# Corentin Mors - PixelSwap Blog

This repo contains the PixelSwap Blog.

Available at [pixelswap.fr](https://pixelswap.fr/)

## Cloudflare Pages

Production search depends on Pagefind running after Hugo. In **Workers & Pages → your project → Settings → Builds & deployments**, use:

| Setting                | Value                     |
| ---------------------- | ------------------------- |
| Build command          | `npm ci && npm run build` |
| Build output directory | `public`                  |

Also set environment variables (Production and Preview):

- `HUGO_VERSION`: Hugo Extended version used locally (for example `0.145.0`)
- `NODE_VERSION`: `22` (or your local Node major version)

If you prefer not to install Node dependencies in CI, this also works:

```sh
hugo --minify && npx -y pagefind --site public
```

## Development

Build the site and generate the [Pagefind](https://pagefind.app/) search index:

```sh
npm install
npm run build
```

Preview the production build locally (includes search):

```sh
npm run preview
```

For Hugo live reload without search, use:

```sh
npm run serve
```

To create a new post:

```sh
hugo new content posts/2024/title-of-post/index.md
```

## On Windows

```powershell
winget install Hugo.Hugo.Extended

$hugo = $env:APPDATA,'\..\Local\Microsoft\WinGet\Links\hugo.exe' -join ''

& $hugo serve
```

---

[![Website](https://img.shields.io/website-up-down-green-red/https/pixelswap.fr.svg?label=PixelSwap.fr)](https://pixelswap.fr/)
[![Twitter Follow](https://img.shields.io/twitter/follow/mikescops.svg?style=social&label=Follow&style=flat-square)](https://twitter.com/mikescops)

---

_All rights reserved. Code may be partially reproduced, content is property of his owner._
