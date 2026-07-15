#!/usr/bin/env bash
set -euo pipefail

hugo_args=(--minify)

if [[ -n "${CF_PAGES_URL:-}" ]]; then
    hugo_args+=(-b "$CF_PAGES_URL")
fi

hugo "${hugo_args[@]}"
pagefind --site public
