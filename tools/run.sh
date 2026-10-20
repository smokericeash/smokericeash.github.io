#!/usr/bin/env bash
set -euo pipefail
bundle exec jekyll serve --host 127.0.0.1 --port "${PORT:-4000}" "$@"
