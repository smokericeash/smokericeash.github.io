# Aidan Chen portfolio redesign — persistent handoff

Updated: October 4, 2026 (America/Los_Angeles).

## Current state

**The redesign is implemented, locally validated, and ready for review.** No known failing local checks remain. No implementation task is currently running. Nothing has been pushed, merged, or deployed.

- Active repository: `C:/Users/super/Documents/ChatGPT/portfolio website remodel/portfolio-v2`.
- Branch: `codex/portfolio-v2`, based on `da50b14` (`main`).
- Original source checkout: `C:/Users/super/Desktop/git2026/smokericeash.github.io/`, untouched and clean.
- Origin: `https://github.com/smokericeash/smokericeash.github.io.git`. It was corrected from the temporary local-clone source to the original repository's verified remote. No fetch/push was performed.
- Local preview: `http://127.0.0.1:4173/`, serving the production `_site` output. Restart the server using the commands below if needed.
- Parent workspace `PROJECT_STATUS.md` points here. This is the canonical handoff.

## Completed

- Audited architecture, deployment, source content, URLs, assets, and theme dependencies in `docs/AUDIT.txt`.
- Replaced Chirpy with a custom Jekyll/Liquid design and minimal vanilla JavaScript.
- Custom home, selected work, four sourced case studies, journal, journey, About, posts, archives, categories/tags, 404, feed, and SEO/social metadata.
- Deliberate dark/light navy and indigo design, original topology motif, favicon, social preview, responsive horizontal navigation, system/light/dark preference control.
- Preserved all nine original Markdown posts, four tabs (including biography), twelve original images, original post URLs, front matter, taxonomy and professional contacts.
- Generated responsive WebP derivatives while preserving original files exactly.
- Added build-time TOC, semantic article heading treatment, responsive tables/images, captions, Rouge code styling, copy controls, related and adjacent articles.
- Added structured social/credential/focus/work/journey data, evidence-linked capabilities and truthful student positioning.
- Rebuilt taxonomy generation to merge case-only collisions without changing original tags.
- Retired the old Chirpy PWA through a scoped migration that leaves unrelated registrations intact.
- Fixed the 360px About overflow, journal heading hierarchy, accessible brand naming, WebKit keyboard link traversal, and layout movement when JS controls appear.
- Added automated content/link/metadata checks, article rendering fixtures, three-engine browser validation, axe scans, Lighthouse checks and worker migration tests.
- Updated GitHub Actions to validate PRs and generate review artifacts; production deployment remains restricted to main/master after validation.
- Added readable source formatting, updated local scripts/README/devcontainer, committed dependency lockfiles for reproducibility.

## Logical implementation commits

1. `8c8a888` — replace Chirpy with a content-preserving Jekyll architecture.
2. `5a36100` — custom portfolio layouts and accessible navy/indigo design system.
3. `1d9dcb3` — responsive WebP derivatives, original assets retained.
4. `45ca2f1` — content, browser, accessibility, performance and deployment validation.
5. The handoff documentation commit follows these. Use `git log` for its current hash.

## Testing performed

- Clean production Jekyll 4.4.1 build on Ruby 3.4 succeeds, with 47 HTML pages.
- 26 original-file hashes verified. Local bytes match exactly; CI accepts only Git's CRLF/LF normalization for text.
- Nine original post routes preserved; 1,155 internal links, anchors, assets and srcset references resolve.
- Every generated page has one h1, title, description, canonical, and Open Graph image. Feed/sitemap XML parses.
- `/preview` baseurl build passes the same route/reference/metadata checks.
- Nine article-rendering fixture checks pass: headings, TOC, Rouge, tables, callouts, image captions/dimensions, prefixed URLs and taxonomy slugs.
- Chrome 153, Playwright Firefox 155, and Playwright WebKit 26.6 pass all browser tests: **282 route checks, 396 responsive checks, 66 axe scans**, with zero reported violations or browser/network errors.
- Responsive widths: 360, 430, 768, 1920, 2560, 3440 CSS pixels; dark/light coverage.
- Keyboard menu/Tab/Escape/focus, search/category/empty results, system theme changes, persisted overrides, reduced motion, copy code, no-JS rendering and blocked localStorage all pass.
- Worker retirement and preservation of unrelated scopes pass in an isolated local fixture.
- Final Lighthouse: **100 performance / 100 accessibility / 100 best practices / 100 SEO** on home, journal and ITC article, for both mobile and desktop. Zero measured CLS; mobile LCP 1.2–1.5s. These are local lab results, not live deployment measurements.
- GitHub/Credly/X public HEAD requests return 200. LinkedIn returns 405 to HEAD; original URL retained but live profile content is not verified.
- Desktop and mobile screenshots plus article, About and social image visually inspected. Tests load lazy images before screenshots.
- `bundle check`, JavaScript syntax checks, and Git whitespace checks pass.

Evidence: `docs/VALIDATION.txt`, `docs/browser-results.json`, `docs/lighthouse-results.json`. Full local HTML/JSON Lighthouse reports and screenshots are in ignored `test-results/`.

## Important design and technical decisions

- The original site is a source of content/infrastructure, never the visual reference. Do not restore Chirpy's sidebar, typography, theme cards or theme components.
- Static Jekyll first; no client framework, runtime Node requirement, third-party browser scripts, analytics, or web fonts.
- Home / Work / Journal (`/research/`) / Journey / About; old archive, taxonomy and article destinations remain.
- Featured work is competition experience supported by original writing. No invented research papers, project repositories, jobs, graduation dates or certifications.
- Current-focus language is explicitly tied to the latest documented journal entries.
- Original MIT notice remains for retained starter material.
- Node dependencies are development/test tools only. Unused html-proofer/wdm dependencies were removed; custom checks cover source preservation and generated output.
- Ruby 3.4 in CI matches the local environment. Gemfile.lock includes Windows and Linux platforms.
- `PROJECT_STATUS.md`, docs, test reports, tools and development dependencies are excluded from the public site.
- The actual custom domain and a résumé document were not supplied and are absent from repository history inspected. The existing `https://smokericeash.github.io` URL remains. “Request résumé” accurately opens email; configure `_data/profile.yml` when a real URL is available.

## Known limits / remaining work before production

- The GitHub-hosted Linux workflow has not run because nothing was pushed. Passing local tests and Linux dependency resolution do not prove remote CI success.
- Cloudflare DNS/TLS, GitHub Pages custom-domain settings and live cache/canonical behavior cannot be verified without the actual domain. No infrastructure settings were changed.
- Actual Safari/iOS device testing and a manual screen-reader pass have not been performed. Windows WebKit is an engine test, not a claim of native Safari coverage.
- Automated accessibility and Lighthouse results are strong evidence, not a certification of full WCAG compliance or field performance.
- A résumé download is optional follow-up; do not invent its destination or replace the accurate email fallback with a broken link.
- The devcontainer configuration is updated but Docker was not available/tested; native Ruby/Jekyll workflow is verified.

## Exact recommended next task

**Review the local redesign at `http://127.0.0.1:4173/` in both themes. Then, when continuing toward publication, push only `codex/portfolio-v2` and open a review PR to run the committed GitHub Actions checks. Verify actual domain settings and any supplied résumé URL before considering a production merge. Do not push or merge directly into main.**

If visual/content changes are requested, preserve this design direction, edit the existing components/data, and rerun affected checks. Do not rebuild completed work or redo the audit without new evidence.

## Reproducible local commands

```powershell
Set-Location 'C:\Users\super\Documents\ChatGPT\portfolio website remodel\portfolio-v2'
$env:JEKYLL_ENV='production'
bundle exec jekyll build
bundle exec ruby tests/verify_site.rb
bundle exec ruby tests/article_markup.rb
python -m http.server 4173 --bind 127.0.0.1 --directory _site
```

In a separate shell:

```powershell
$env:CHROME_CHANNEL='chrome'
node tests/browser.cjs
node tests/worker-migration.cjs
node tests/performance.mjs
```

For other engines:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path (Get-Location) '.browser-cache'
$env:TEST_BROWSER='webkit' # or firefox
node tests/browser.cjs
```

Firefox's tab subprocess is blocked by this Windows execution sandbox. The successful Firefox runs used narrowly scoped elevated execution; do not disable browser security preferences. The downloaded test browsers are isolated in ignored `.browser-cache`.
