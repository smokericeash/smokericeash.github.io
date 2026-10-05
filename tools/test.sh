#!/usr/bin/env bash
set -euo pipefail
JEKYLL_ENV=production bundle exec jekyll build "$@"
bundle exec ruby tests/verify_site.rb
