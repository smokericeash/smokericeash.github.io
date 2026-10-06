# Aidan Chen portfolio — persistent handoff

Updated: October 5, 2026 (America/Los_Angeles).

## Current state

**The redesign, self-service Markdown authoring workflow, contact refinements and final motion pass are implemented and locally verified.** No implementation task is currently in progress and no local check is failing. All three browser suites pass in Chrome, Firefox and WebKit. Nothing has been pushed, merged or deployed.

- Active repository: `C:/Users/super/Documents/ChatGPT/portfolio website remodel/portfolio-v2`.
- Branch: `codex/portfolio-v2`, based on `da50b14` (`main`).
- Origin: `https://github.com/smokericeash/smokericeash.github.io.git`.
- Original source checkout: `C:/Users/super/Desktop/git2026/smokericeash.github.io/`, unchanged.
- Local preview: `http://127.0.0.1:4173/`, serving production `_site` output.
- Parent workspace `PROJECT_STATUS.md` points here. This is the canonical handoff.

## Completed final refinement session

- The visible contact address and every Email social link now keep a direct `mailto:aidanchenn1@gmail.com` fallback and, when JavaScript is available, open a compact chooser for the default email app, Gmail or copying the address.
- “Request résumé” opens the same chooser with a prefilled subject/body. The dialog explains that the résumé is shared directly by email; no private document was added to the public site.
- Removed the large duplicate footer name and its unused CSS. The footer retains only `© 2026 Aidan Chen` plus social and archive links.
- Replaced the Archive's fixed post count with “Every entry, in order. Moments of learning documented so far.” The Home journal link also says “All entries,” so neither label needs manual count maintenance.
- Strengthened cross-page motion with a 760ms curved top-to-bottom reveal and a restrained outgoing drift. Chrome/WebKit use native document transitions; Firefox uses the equivalent entrance fallback.
- Direct homepage visits introduce the two factual profile columns from opposite sides. Below-fold journal items alternate side/image-mask entrances once as they scroll into view. Content remains visible without JavaScript, and reduced-motion removes all of these effects.
- Added regression coverage for both email entry points, the prefilled résumé request, focus restoration, single footer identity, count-free copy and the new transition names.
- Reviewed the Home, contact, résumé and footer states in the local browser. The final preview has no console warnings or errors.
- Commit: `ed61f6b` — `feat: refine contact flows and page motion`.

## Post authoring follow-up

- Posts remain ordinary Markdown in `_posts/`, optionally grouped by year. No layout or manual timeline edits are needed to add one.
- Added `docs/post-template.md` and `docs/POSTING.txt`, linked from README, covering front matter, images, drafts, preview and publication.
- New JPG/PNG files go directly in `assets/img/`; run `python tools/optimize_images.py` to generate responsive files and dimension metadata, then commit those generated changes with the post.
- Text-only posts now omit the cover/thumbnail correctly; the default social image remains SEO metadata rather than becoming a dimensionless article image.
- Removed fixed nine-post counts, last-entry assumptions, fixed latest-year indices and fixed search/category result counts from browser tests. New posts and years no longer require editing those tests.
- Verified two temporary 2027 posts in an isolated build (one with a cover, one without; description fallback also tested): 11 post routes, 49 pages, 1,656 references. All three browser suites pass in Chrome, Firefox and WebKit against that build. Evidence: `docs/authoring-results.json`.
- Removed both temporary source posts and rebuilt the normal preview: original nine posts, 47 pages, 1,598 references and all 26 preserved files pass. No sample posts were published.
- No authoring work remains in progress. Use the template for the next real post; the existing publication checks below still apply.

## Completed editorial session

- Removed Work from primary navigation. The four destinations are Home, Journal (`/research/`), Journey and About. Existing Work/case-study URLs remain valid for compatibility.
- Replaced the sprawling homepage with a factual introduction, the three latest original posts and a full-width timeline displaying all nine original entries.
- Removed the field-notes hero, motivational headings, focus band, selected-work section and repeated capability/credential sections. Kept the established palette, typography, header and light/dark system.
- Added each post's actual original image as a responsive preview on Home and Journal; shared post rows also improve taxonomy and related-entry views. Images use existing WebP derivatives and keep the full image visible.
- Replaced the contact slogan with “Have a question, a project, or a perspective to share? I'd like to hear it.” Simplified Journey, Journal, About and footer copy.
- Added one-time image-mask reveals with staggered text movement and a short line draw as sections enter the viewport. Homepage images move a few pixels with native scroll timelines where supported.
- Added native document transitions between pages, with a stable header and brief content movement. Firefox receives a short incoming-page fallback. Links, history and scrolling remain native.
- Preserved reduced-motion behavior, no-JS readability, touch/keyboard/drag timeline controls and article reading progress. No persistent hidden reveal classes or text-opacity scroll animations.
- Added an editorial/motion regression suite and refreshed README plus measured validation evidence.

## Previously completed and retained

- Replaced Chirpy with custom Jekyll/Liquid layouts and vanilla JavaScript; audit in `docs/AUDIT.txt`.
- Original nine posts, four tabs, twelve images and placeholder preserved (26 inventoried files). Post URLs, front matter, taxonomy, contacts, biography and infrastructure retained.
- Article TOC, semantic headings, image captions/dimensions, responsive tables, syntax highlighting, code copying, search/filtering, related articles, feeds and SEO metadata.
- Responsive WebP derivatives; original files unchanged. Case-only taxonomy variants merge safely.
- Scoped retirement of the old Chirpy worker, preserving unrelated registrations/caches.
- GitHub Actions build/check/review artifacts, with deploy permissions restricted to main/master only after validation. Ruby 3.4 / Jekyll 4.4.1; locked Windows/Linux dependencies.
- Delayed article cover sizing fixed in the previous iteration, with regression coverage retained.

## Tests performed on this implementation

- Production and `/preview` baseurl builds pass: **47 HTML pages, nine original post routes, 26 preserved-file hashes, 1,598 internal references**, metadata and XML checks.
- Nine article-rendering/taxonomy fixture checks pass.
- Chrome 153, Playwright Firefox 155 and WebKit 26.6: **282 route checks, 396 responsive checks, 78 axe scans**, zero reported violations or browser/network errors.
- Six responsive widths: 360, 430, 768, 1920, 2560, 3440 CSS pixels; dark/light coverage.
- Existing navigation, search, storage, theme, code-copy, no-JS and reduced-motion tests pass.
- Timeline suite: 11 groups in Chrome, 10 each in Firefox/WebKit. Includes drag, year/step/range/keyboard controls, accessible values, endpoint visibility, no-JS, delayed image response, reading progress and Chrome native touch swipes.
- Editorial/motion suite: 11 groups in each engine. Confirms all nine preview images match article covers, four navigation destinations, full-width timeline, contact/résumé behavior, footer/archive wording, actual scroll animation start/completion/non-repetition, native river transitions (Chrome/WebKit), fallback entrances (Firefox), history navigation and reduced-motion suppression.
- Lighthouse: **99–100 performance; 100 accessibility, best practices and SEO** on Home, Journal, ITC article and Journey, mobile/desktop (eight runs). Mobile home performance is 99; the other seven are 100. CLS 0 throughout, mobile LCP 1.7s, TBT 0–90ms. These are local lab measurements, not live performance claims.
- Desktop dark and mobile light Home/Journal reviewed visually; screenshots load original preview images before capture. Earlier article/About/social-image review remains relevant.
- JavaScript syntax and Git whitespace checks pass.

Evidence: `docs/VALIDATION.txt`, `docs/browser-results.json`, `docs/experience-results.json`, `docs/editorial-results.json`, `docs/lighthouse-results.json`. Full reports and screenshots are in ignored `test-results/`.

## Important decisions

- This is a personal, informative portfolio. Use actual posts and outcomes; avoid motivational slogans, sales language, invented research, jobs, credentials or metrics.
- Home is intentionally concise. Do not restore the old orbital graphic, field-notes panel, Work navigation, focus slogans, capability sections or duplicate content bands.
- `_includes/post-preview.html` is the homepage preview; `_includes/post-row.html` is the shared illustrated list; `_includes/chronicle.html` is the shared timeline.
- `_data/journey.yml` supplies optional short titles and summaries keyed by post URL. Timeline dates/order come from original post publication metadata. Milestones are evenly spaced for reading, not proportional to elapsed time. New posts appear automatically.
- Motion and new presentation rules live in `assets/css/experience.css` and `assets/js/experience.js`. The curved page reveal and alternating side entrances are progressive enhancement; no framework/router, scroll interception, forced loading delays or looping animations.
- Contact enhancement lives in `_includes/email-dialog.html` and `assets/js/contact.js`. Mailto links remain the no-JavaScript fallback. Resume delivery stays private until an actual public document is intentionally configured.
- Full content is visible by default. Motion preferences cancel JS animations and disable CSS/native transitions. Initial above-fold content is not hidden for a reveal.
- Preserve source content and public URLs even where a destination is no longer promoted in navigation.
- No third-party browser scripts, web fonts, analytics or runtime Node dependency. Original MIT notice retained.
- Actual custom domain and résumé file were not supplied or found in history. Keep the current GitHub Pages URL and the verified email-based “Request résumé” flow.

## Known limits and remaining publication work

- GitHub-hosted Linux CI has not run: nothing has been pushed. Local checks do not establish remote CI success.
- Actual Cloudflare DNS/TLS, Pages domain settings and live cache/canonical behavior remain unverified because the custom domain is unknown. No infrastructure settings changed.
- Windows WebKit is not native Safari/iOS device coverage. Manual screen-reader/device review has not been performed; automated checks are not WCAG certification.
- Native cross-document transitions differ by engine: Chrome/WebKit use them; tested Firefox uses the entrance fallback. Reduced motion removes both.
- Docker/devcontainer execution remains untested; the native Ruby workflow is verified.
- No requested implementation work remains. Review and publication checks are the next step.
- Currently in progress: none.

## Logical commits

The earlier architecture, design, asset and validation commits remain intact (`8c8a888` through `56d4e84`). This session adds:

- `38fda61` — illustrated posts, concise profile and smoother page/scroll motion.
- `eb94653` — editorial previews, actual animation behavior and navigation tests.
- `d3733e3` — factual site metadata in place of the old learning tagline; rebuilt and verified afterward.
- `1e9e5b0` — verified editorial redesign and motion behavior handoff/evidence.
- `0d1d833` — self-service post authoring guide, template and growing-journal tests.
- `ed61f6b` — email/résumé chooser, footer/archive cleanup, curved page transitions, alternating scroll entrances and refreshed validation evidence.

## Exact recommended next task

**Review the email/résumé chooser, footer and curved transitions at `http://127.0.0.1:4173/`. The requested implementation is complete and verified; do not rebuild it. Once the design is approved for publication, push only `codex/portfolio-v2` and open a review PR so GitHub Actions can verify the Linux build. Verify actual custom-domain settings before a production merge, and configure a résumé URL only if Aidan intentionally wants a public download. Never push or merge directly into main.**

## Reproducible local commands

```powershell
Set-Location 'C:\Users\super\Documents\ChatGPT\portfolio website remodel\portfolio-v2'
$env:JEKYLL_ENV='production'
bundle exec jekyll build
bundle exec ruby tests/verify_site.rb
bundle exec ruby tests/article_markup.rb
python -m http.server 4173 --bind 127.0.0.1 --directory _site
```

In another shell:

```powershell
$env:CHROME_CHANNEL='chrome'
npm.cmd test
node tests/performance.mjs
```

Other engines:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path (Get-Location) '.browser-cache'
$env:TEST_BROWSER='webkit' # or firefox
npm.cmd test
```

Firefox's tab subprocess is blocked by this Windows execution sandbox. Successful Firefox runs used narrowly scoped elevated execution; do not disable browser security preferences. Test browsers are isolated in ignored `.browser-cache`.
