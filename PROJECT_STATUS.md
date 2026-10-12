# Aidan Chen portfolio — persistent handoff

Updated: October 11, 2026 (America/Los_Angeles).

## Current state

**The Home identity section now carries a faint Everest backdrop, and the dedicated Ascent has a black-and-white alpine climber with a non-rebounding, alternating-limb scroll animation.** The self-service Markdown workflow, original content, four navigation destinations, existing links and approved page structure remain intact. The current implementation passes local Chrome, site-integrity and Lighthouse checks. Earlier Firefox/WebKit results predate this latest refinement; their executables are unavailable in this environment. Nothing has been pushed, merged or deployed.

- Active repository: `C:/Users/super/Documents/ChatGPT/portfolio website remodel/portfolio-v2`.
- Branch: `codex/portfolio-v2`, based on `da50b14` (`main`).
- Origin: `https://github.com/smokericeash/smokericeash.github.io.git`.
- Original source checkout: `C:/Users/super/Desktop/git2026/smokericeash.github.io/`, unchanged.
- Local preview: `http://127.0.0.1:4173/`, serving production `_site` output.
- Parent workspace `PROJECT_STATUS.md` points here. This is the canonical handoff.

## October 11 Home mountain and non-rebounding climb — latest handoff

- Added a subtle Everest image only behind the Home identity panel using the existing optimized illustration. Gradient overlays protect the heading and introduction in light and dark themes; desktop dark/light and mobile dark screenshots were inspected. The separate Home timeline and the rest of the layout stay unchanged.
- Replaced the dedicated Ascent's orange climber with an original transparent black-and-white technical alpine figure: white hardshell, black pack, helmet, black pants, gloves, two raised ice tools and crampon boots. The generated source, 30 KB alpha WebP and exact built-in imagegen prompts are documented in `docs/ASCENT_ART.md`. No brand logo or endorsement appears. The earlier orange art remains only for provenance.
- Split the new image into nine clipped layers so both shoulders/elbows and both hips/knees respond continuously to scroll. Opposing hand heights alternate; the torso remains planted at the contact point without a repeated bob. Camera and character now derive from the same eased progress and a monotonically rising screen path. Desktop wheel settling is constrained to the gesture direction, eliminating the scroll reversal that caused apparent drops. The illuminated route and Pacific day/night atmosphere remain.
- Removed the changing upper-left scene label (“ICE & ROCK” and related text); kept the numbered Ascent indicator on the right. Updated asset versions to avoid stale cached motion and styling.
- Baseline production build passed before edits. Baseline Chrome Ascent test passed using installed Chrome because this environment lacks Playwright's bundled executable. After edits, production build, source integrity (26 unchanged originals, nine routes, 47 pages, 1,688 local references/anchors/assets), complete Chrome browser suite (94 routes, 132 responsive pages, 22 axe scans, six general groups, 10 experience groups, 11 editorial groups, 10 expedition groups), and stronger Ascent assertions all pass. The focused test checks directional wheel travel, no downward figure rebound, continuous poses, alternating higher hands, articulated legs, responsiveness, reduced motion and no-JS links. Desktop/mobile screenshots were reviewed.
- Eight local Lighthouse runs: Home/Work/article/Ascent mobile performance **98 / 99 / 98 / 96**, desktop **100 / 100 / 100 / 99**. Accessibility, best practices and SEO score 100 throughout. Home mobile LCP 2.3 s and Ascent mobile LCP 2.7 s; CLS 0 on all runs. These are lab scores, not a guaranteed real-device frame rate.
- Current work in progress: none. Known limits: the generated figure and illustrated wall are visual storytelling, not a physically simulated or video-captured climb; frame pacing and hand-to-wall contact need human review on a real device. Current Firefox/WebKit binaries are missing, so cross-engine tests for this latest refinement remain to be rerun. Remote Linux CI and custom-domain checks remain pending; nothing has been pushed, merged or deployed.
- **Exact next task:** open the local Home and `/journey/` preview on a real desktop/mobile device, assess the two-handed climbing motion and wall contact while scrolling both directions, then restore/install Firefox and WebKit runners and rerun their full suites before a branch-only push for remote CI. Do not merge to `main` or publish until that review passes.

## Earlier October 11 integrated Ascent and continuous climb — superseded where noted above

- Removed the explicit sun/moon ornament. Local Pacific-time day/night lighting still subtly adjusts the mountain scene without location permission or a network request.
- Removed the four-image pose swap. One approved orange mountaineer image now supplies seven clipped SVG layers: torso, back arm, shoulder/forearm, front leg, thigh and shin. Shoulder, elbow, hip and knee transforms update continuously with scroll rather than switching raster frames; reduced motion holds a static, complete pose. The unused three WebP pose derivatives were removed, while the original four-panel source sheet remains for provenance.
- The climber responds faster to scroll than the camera, so a gesture visibly raises the body along the wall before the camera catches up. Repositioned the figure beside the wall's icy holds and lower foothold; inspected first, middle, last and in-between checkpoints. Removed expensive full-figure drop shadows. The climber remains decorative, while every real post is semantic and linked.
- Removed the title section's inherited 70vh minimum. The Everest art now extends behind the title under a dark indigo overlay and fades toward the expedition scene; removed its abrupt top border. Desktop and mobile screenshots in both light and dark site themes were reviewed. The introductory text stays legible.
- Baseline checks passed before edits. Final normal production build and preservation checks pass: 26 original files unchanged, nine post routes, 47 HTML pages, 1,688 local references, XML/metadata and nine article contracts. The growth fixture passes addition, exclusion, edits, reordering and removal; it left no temporary posts.
- Complete Chrome, Firefox and WebKit suites pass: per engine, 94 route checks, 132 responsive checks, 22 axe scans, six general interaction groups, 11 editorial groups and 10 Ascent groups; Home experience has 10 Chrome / nine Firefox / nine WebKit groups. A Chrome wheel test observed 189 distinct arm transforms within an 850 ms sample after tuning, demonstrating continuous rather than four-frame motion. Headless Firefox/WebKit deliver fewer samples in this sandbox; this is not a guaranteed hardware frame rate.
- Final eight-run local Lighthouse sweep: Home/Work/article/Ascent mobile performance **98 / 99 / 99 / 95**, desktop **100 / 100 / 100 / 99**. Accessibility, best practices and SEO score 100 throughout. Ascent mobile LCP 2.7 s, CLS 0 and TBT 110 ms. These are lab measurements, not field performance guarantees.
- Current work in progress: none. Remaining: Aidan's visual review of the new entrance and climb on the local preview, actual device frame pacing and screen-reader review where available, remote Linux CI after a branch-only push, and custom-domain verification before publication. No push, merge or deployment has occurred.

## Earlier October 11 full-color Ascent refinement — superseded by the continuous rig

- User rejected the preceding black geometric climber, flat mountain contact and abrupt snap. Replaced the dedicated `/journey/` figure with four transparent illustrated full-body poses: orange down parka, navy trousers, helmet, goggles, pack, harness/rope, tools, gloves and crampon boots. Poses alternate reaching/pulling and stepping; the first frame is available without JavaScript. The approved small Home climber remains untouched.
- Composited a separate original close ice-and-rock wall over the Everest panorama. The climber travels along the near wall rather than appearing to float over the distant mountain; wall and panorama move at different rates for depth. Source files and exact built-in imagegen prompts are in `docs/ASCENT_ART.md`. The imagery is illustrative and not a topographic claim.
- Removed forced CSS scroll snapping. Desktop wheel input now eases through measurable intermediate scroll positions and gently settles near a post after input pauses. Touch, keyboard, scrollbar dragging and reduced-motion scrolling remain native. Route, camera, wall and pose update continuously in either direction. Camera easing uses elapsed time, keeping it responsive at Firefox's lower headless frame rate. The closing **The route goes on** remains.
- Made About's credential separation structural with a literal line break and spacing, so Network+ and CRTO cannot collapse onto one line when a cached stylesheet is involved. Both certificate links are preserved. Versioned changed CSS/JS URLs to refresh cached assets.
- Added mobile AVIF panorama/wall sources and WebP fallbacks. The first climber frame loads immediately; extra poses defer until after load or wheel input. Tested the day/night illustration and real desktop/mobile screenshots. The Pacific sun/moon remains local-time driven; no network or location access.
- Tested the self-service posting lifecycle: adding, editing, excluding, reordering, shrinking and growing the shared Ascent record passes. Temporary fixtures were removed and the normal production site rebuilt.
- Final production build and source checks pass: 26 original files unchanged, nine preserved post routes, 47 HTML pages, 1,688 valid local references, XML and metadata, and nine article/taxonomy contracts. Full Chrome, Firefox and WebKit suites pass (per engine: 94 route checks, 132 responsive checks, 22 axe scans, six general interaction groups, 11 editorial groups and 10 dedicated expedition groups; 10 Chrome / nine Firefox / nine WebKit Home experience groups). New Ascent checks sample intermediate wheel positions, post settling, wall parallax, climbing pose changes, responsive art and credential spacing.
- Full local Lighthouse sweep across Home, Work, an article and The Ascent: mobile performance **99 / 99 / 98 / 96**, desktop **100 / 100 / 100 / 99**; accessibility, best practices and SEO 100 throughout. Ascent mobile LCP 2.7 s, CLS 0, TBT 0. These are lab results, not field guarantees. Evidence: `docs/VALIDATION.txt` and `docs/*-results.json`.
- Current work in progress: none. Remaining: Aidan's visual approval of the new scene, optional real-device and manual screen-reader checks, remote Linux CI after a branch-only push, and real custom-domain verification before publication. Nothing has been pushed or merged.

## Earlier October 11 Ascent motion and visual refinement — superseded by the above

- Separated the About sidebar's Network+ and CRTO credential links into distinct rows with a measured gap. Both existing destinations remain intact.
- Preserved the approved Home Ascent preview by moving its original small SVG mountaineer into `_includes/mountaineer-home.html`. The larger, dedicated `/journey/` climber was rebuilt independently with a hooded puffer jacket, helmet, pack, harness, rope, ice axe, gloves and crampon boots.
- Added an original Everest-inspired, illustrated mountain scene behind the scroll-driven route. Responsive WebP sources reduce the scene from 279 KB on desktop to 91 KB on small screens. The layered ice, snow, rock, atmospheric distance and contact shadow improve depth while retaining legible post panels. The image is an illustration, not a geographic/topographic claim; its exact built-in imagegen prompt and asset provenance are in `docs/ASCENT_ART.md`.
- Desktop post sections now settle at CSS scroll-snap points instead of leaving posts between reading positions. The mountain/camera/route continue moving smoothly between checkpoints. Mobile uses proximity snapping to keep tall posts readable; reduced-motion turns snapping and moving limbs off.
- Replaced lateral limb rotations with scroll-progress-driven joint positions: one hand reaches while the other pulls, and the boots alternate stepping and pushing. The pose reverses when scrolling upward and rests at checkpoints. The ending copy, **The route goes on**, remains intact.
- The scene chooses a restrained sun or moon using `America/Los_Angeles` local time (day is 06:00–18:59), refreshing every ten minutes. No weather API or location permission is used. Day/night treatments were visually inspected; the main site's chosen light/dark theme remains independent.
- Production Jekyll build, source and article integrity checks pass: 26 inventoried originals unchanged, nine preserved post routes, 47 HTML pages and 1,684 valid local references. The Markdown growth fixture still passes after adding, editing, excluding and removing posts, including 20 extra entries; all fixtures were removed.
- Complete Chrome, Firefox and WebKit suites pass. Per engine: 94 route checks, 132 responsive pages, 22 broad axe scans, six general interaction groups, 11 editorial groups and 10 Ascent groups; Home experience groups: 10 Chrome, nine Firefox, nine WebKit. New checks measure credential spacing, actual wheel-snap placement, day/night state, moving arm and boot geometry, responsive art, reduced motion and no-JavaScript access. Reviewed About, Home, desktop daytime/nighttime and mobile screenshots.
- Fresh local Lighthouse results across eight mobile/desktop pages: Home 98/100, Work 99/100, article 99/100, Ascent 95/100 performance (mobile/desktop); accessibility, best practices and SEO 100 throughout. Ascent mobile LCP is 2.9 s, CLS and TBT 0. The image initially reduced mobile performance to 87; responsive artwork restored it to 95. These are local lab results, not field performance guarantees. Evidence is in `docs/VALIDATION.txt` and `docs/*-results.json`.
- Current work in progress: none after this handoff is committed. Known limits: no actual iOS/Safari hardware or manual screen-reader review; remote Linux CI and actual custom-domain settings remain unverified. The supplied CRTO certificate URL is linked but its individual record was not independently authenticated by local tests.
- Exact next task: review the refined `/journey/` page in the local preview, including wheel and reverse scrolling, the final panel, and a real mobile device if available; review the separate credential links on About. If Aidan approves the design for publication, push only `codex/portfolio-v2` and open a review PR for Linux CI, then verify actual custom-domain settings before any production merge. Do not push or merge directly into `main`.

## Earlier October 11 vertical expedition and credential update

- Removed the single CompTIA Network+ credential callout from Home. About now lists both the existing Network+ link and CRTO · Zero Point Security with Aidan's supplied certificate URL. The Network+ post remains in the chronological record.
- Home keeps its compact horizontal timeline and original post cards. Its end labels now say **BASE CAMP** and **SUMMIT AWAITS**, with years derived from the first and last eligible posts. Added restrained snow/rock detail and replaced the stick figure with an original equipped SVG mountaineer.
- Dedicated `/journey/` is now a distinct vertical expedition: native page scroll drives a sticky, layered SVG mountain, camera position, route trace and alternating arm/leg movement. Each real post becomes a semantic, image-backed checkpoint and links to its unchanged article. The final panel says **The ascent continues** without claiming a summit was reached.
- Both views select the same `site.posts`, ordered by publication date, using optional `_data/journey.yml` summaries. Posts join by default; `ascent: false` in front matter omits ordinary posts from both views. Scene modules and route length derive from the number of rendered checkpoints. Updated `docs/POSTING.txt`, template and README.
- Testing: production Jekyll build and source-integrity checks pass (26 originals unchanged, nine preserved post routes, 47 HTML pages, 1,683 links/anchors/assets). The new fixture test verified additions, same-date entries, edits, reordering, exclusion, removal and 20 extra entries, then deleted every fixture and rebuilt the normal site.
- Complete Chrome, Firefox and WebKit browser suites pass. Per engine: 94 route checks, 132 responsive pages, 22 broad axe scans, six general interaction groups, 11 editorial/motion groups and eight dedicated expedition groups. Home experience groups: 10 Chrome, nine Firefox, nine WebKit. The new checks cover downward/upward scroll, scroll-synchronized limb pose, mobile widths, light/dark contrast, reduced motion and no-JavaScript access. Desktop dark and mobile light screenshots were visually inspected.
- Fresh local Lighthouse results: **99 mobile / 100 desktop performance** on Home, Work, article and Ascent; **100 accessibility, best practices and SEO** throughout. The Ascent mobile LCP is 2.0 s; CLS/TBT 0. Reports: `docs/*-results.json` and `docs/VALIDATION.txt`.
- Current work in progress: none. Known limitations: no real Safari/iOS device or manual screen-reader review; GitHub Linux CI, actual custom-domain settings, and Aidan's final visual review remain outstanding. The user-supplied CRTO verification page was linked as given; its individual record was not independently confirmed by the local test.
- Exact next task: review Home and `/journey/` in the local preview at `http://127.0.0.1:4173/`, including a full scroll through the expedition in both themes and on a real mobile device if available. If the visual direction is approved, push only `codex/portfolio-v2` and open a review PR to run Linux CI; verify the actual custom-domain setup before any production merge. Do not push or merge directly into `main`.

## Earlier October 11 handoff (before the vertical expedition)

- Confirmed `4911f14` contains the complete Ascent implementation. The only work left uncommitted from the previous session was its validation evidence and handoff documentation; this continuation records and commits those files. No implementation changes are in progress.
- Rebuilt the normal production site and reran preserved-content, metadata, feed, route and article checks: 26 inventoried source files unchanged, nine original post routes, 47 HTML pages, 1,645 internal references, nine article/taxonomy contracts.
- Reran the complete Chrome, Firefox and WebKit suites on October 11. Per engine: 94 route checks, 132 responsive page checks, 22 broad axe scans, six general interaction groups, 11 editorial/motion groups, and 15 Chrome / 14 Firefox / 14 WebKit experience groups. No browser errors or reported accessibility violations.
- Verified the post-authoring promise against the Ascent design with one temporary 2027 Markdown post in an isolated `--future` build: it appeared on Home, Work, The Ascent and its own route; the Ascent record grew to ten entries and the latest-year label changed to 2027. The isolated build passed preservation and link checks with 50 HTML pages and 1,712 references. Removed the fixture source afterward; the normal preview still contains only the original nine posts.
- Restarted the production `_site` preview at `http://127.0.0.1:4173/` in a persistent terminal session; Home, Work, The Ascent and About returned HTTP 200.
- Remaining: user design review, optional real-device and screen-reader review, Linux GitHub Actions after a branch-only push, and actual custom-domain verification before production publication. No source change is required for the tested posting workflow. Exact next task: review the live local design, then open a review PR from `codex/portfolio-v2` when ready; do not push or merge directly into `main`.

## Completed October 7 Ascent redesign

- Took typography, color temperature, negative space and restraint from the supplied screenshot, without copying its layout or imagery. Added `assets/css/ascent.css` as a scoped design layer: near-charcoal/midnight surfaces, glacier-blue accents, icy white text, snow/overcast light mode, tracked lightweight display headings and more editorial article typography. Uses a local/system font stack; no web-font request or new dependency.
- Renamed the visible Journey tab and page to **The Ascent** while preserving the established `/journey/` URL and `_data/journey.yml` authoring fallback. Home links to the same route.
- Added a lightweight decorative ridge and a small original SVG climber over the existing nine-entry timeline. Continuous native horizontal scroll drives the climber along a rising curve and reveals the travelled route. The dated post cards, year jumps, range scrubber, arrow/keyboard controls, touch swipe, direct drag and no-JS fallback remain the real navigation.
- Kept mountain visuals quiet: a faint homepage ridge and low-density drift only within the route. Mobile disables drift; reduced motion disables it and keeps milestone jumps immediate. The map is hidden from assistive technology; post titles and dates remain available in semantic HTML.
- Corrected a transient light-theme contrast issue by removing background-color interpolation. Corrected premature illumination ahead of the climber by clipping the travelled route to actual scroll progress. Softened the existing first-visit Home entrance to avoid cropped heading letters.
- Production and `/preview` baseurl builds, preserved-content checks (26 source files, nine original routes, 47 pages, 1,645 references), nine article/taxonomy checks and complete Chrome/Firefox/WebKit browser suites pass. Each engine checked 94 routes, 132 responsive pages, 22 broad axe scans and the focused timeline/accessibility checks. Visual review covered desktop dark Home/Ascent/article and light mobile Home/Ascent with no horizontal overflow.
- Fresh local Lighthouse results: performance **98–100**, accessibility/best practices/SEO **100** on eight mobile/desktop runs across Home, Work, article and Ascent; CLS 0 throughout. Reports in `docs/VALIDATION.txt` and `docs/*-results.json`.
- Known limits: GitHub Linux CI, actual Safari/iOS hardware, manual screen-reader review and unknown custom-domain settings are still unverified. Current recommended next task: review the new design in the local preview, then perform branch-only remote CI if approved for publication.

## Completed October 7 heading refinement

- Removed the trailing period from the Work and Journey main headings. Home already displayed “Aidan Chen” without a period; changed the About heading from “About Aidan.” to “About me”. No other page copy or visual styling changed.
- Updated the editorial browser regression to assert the exact main heading on Home, Work, Journey and About.
- Production Jekyll build, site integrity check (26 original files, nine post routes, 47 HTML pages, 1,598 references) and Chrome editorial/motion suite (11 check groups) pass. The local preview uses the rebuilt `_site` output.
- No work remains in progress from this request. Next task: review these four headings in the local preview; proceed with the existing publication review only if the site is ready.

## Completed October 7 refinement

- Home and Journey timelines now scroll freely by mouse drag, touch and horizontal wheel/trackpad input. Removed mandatory card snapping and the forced snap on mouse release.
- Arrow, year and keyboard destinations ease through intermediate positions in 420–640ms. The range slider stays directly responsive, and reduced-motion navigation remains instant. Animation stops when a viewer begins direct scrolling or dragging.
- Renamed the primary Journal tab and its page heading to **Work**. The original `/research/` URL remains stable; the older `/work/` case-study URL remains valid but is not the primary tab.
- Removed the trailing period when “Aidan Chen” stands alone in the header and Home hero. Footer copyright and article bylines remain unchanged.
- Reduced the Work list’s post entrance to a small side movement and partial image mask. Home previews retain their earlier treatment.
- Added a browser check that records intermediate arrow positions and confirms a small wheel gesture stays between entries on both timeline pages. Updated name/navigation assertions and posting documentation.
- Production build, source/route checks and the full Chrome, Firefox and WebKit suites pass. The local preview serves Home and Work with HTTP 200.

## Completed final refinement session

- The visible contact address and every Email social link now keep a direct `mailto:aidanchenn1@gmail.com` fallback and, when JavaScript is available, open a compact chooser for the default email app, Gmail or copying the address.
- “Request résumé” opens the same chooser with a prefilled subject/body. The dialog explains that the résumé is shared directly by email; no private document was added to the public site.
- Removed the large duplicate footer name and its unused CSS. The footer retains only `© 2026 Aidan Chen` plus social and archive links.
- Replaced the Archive's fixed post count with “Every entry, in order. Moments of learning documented so far.” The Home link to Work also says “All entries,” so neither label needs manual count maintenance.
- After visual feedback that the curved transition looked glitchy, replaced it with a sequenced fade. The old page clears in 140ms; the new page stays hidden through 26% of a 560ms animation, then eases in. Chrome/WebKit use native document transitions, while Firefox receives the calmer entrance fallback. The two readable pages no longer overlap.
- Direct homepage visits introduce the two factual profile columns from opposite sides. Below-fold post items enter once as they scroll into view; Work list rows now use a smaller side movement and mask. Content remains visible without JavaScript, and reduced-motion removes these effects.
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

- Primary navigation is Home, Work (`/research/`), Journey and About. The older Work/case-study URLs remain valid for compatibility.
- Replaced the sprawling homepage with a factual introduction, the three latest original posts and a full-width timeline displaying all nine original entries.
- Removed the field-notes hero, motivational headings, focus band, selected-work section and repeated capability/credential sections. Kept the established palette, typography, header and light/dark system.
- Added each post's actual original image as a responsive preview on Home and Work; shared post rows also improve taxonomy and related-entry views. Images use existing WebP derivatives and keep the full image visible.
- Replaced the contact slogan with “Have a question, a project, or a perspective to share? I'd like to hear it.” Simplified Journey, Work, About and footer copy.
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

## Earlier baseline tests performed on this implementation

- Current production and `/preview` baseurl builds pass: **47 HTML pages, nine original post routes, 26 preserved-file hashes, 1,645 internal references**, metadata and XML checks.
- Nine article-rendering/taxonomy fixture checks pass.
- Chrome 153, Playwright Firefox 155 and WebKit 26.6: **282 route checks, 396 responsive checks, 78 axe scans**, zero reported violations or browser/network errors.
- Six responsive widths: 360, 430, 768, 1920, 2560, 3440 CSS pixels; dark/light coverage.
- Existing navigation, search, storage, theme, code-copy, no-JS and reduced-motion tests pass.
- Timeline suite: 13 groups in Chrome, 12 each in Firefox/WebKit. Includes free wheel/drag scrolling, measured arrow movement, year/step/range/keyboard controls, accessible values, endpoint visibility, no-JS, delayed image response, reading progress and Chrome native touch swipes.
- Editorial/motion suite: 11 groups in each engine. Confirms all nine preview images match article covers, four navigation destinations, full-width timeline, contact/résumé behavior, footer/archive wording, actual scroll animation start/completion/non-repetition, sequenced native fades (Chrome/WebKit), fallback entrances (Firefox), history navigation and reduced-motion suppression. The test reads the live animation durations/keyframes and asserts the old page clears before the incoming fade begins.
- Lighthouse on October 7: **98–100 performance; 100 accessibility, best practices and SEO** on Home, Work, ITC article and The Ascent, mobile/desktop (eight local lab runs). CLS 0 throughout, mobile LCP 1.7–1.9s and TBT 0–120ms. These are local lab measurements, not live field performance claims.
- Earlier desktop dark and mobile light Home/post-list visual review remains relevant. The October 7 changes were verified through live routes and browser interaction tests; in-app visual inspection was unavailable because its helper failed.
- JavaScript syntax and Git whitespace checks pass.

Evidence: `docs/VALIDATION.txt`, `docs/browser-results.json`, `docs/experience-results.json`, `docs/editorial-results.json`, `docs/lighthouse-results.json`. Full reports and screenshots are in ignored `test-results/`.

## Important decisions

- This is a personal, informative portfolio. Use actual posts and outcomes; avoid motivational slogans, sales language, invented research, jobs, credentials or metrics.
- Home is intentionally concise. Do not restore the old orbital graphic, field-notes panel, focus slogans, capability sections or duplicate content bands.
- `_includes/post-preview.html` is the homepage preview; `_includes/post-row.html` is the shared illustrated list. `_includes/chronicle.html` powers only the Home preview; `_includes/expedition.html` powers the dedicated vertical page.
- `_data/journey.yml` supplies optional short titles and summaries keyed by post URL. Both views read the same original post metadata; `ascent: false` excludes a post from both. The route's distance is narrative, not literal elapsed time or altitude.
- Motion and new presentation rules live in `assets/css/experience.css` and `assets/js/experience.js`. The sequenced page fade and restrained side entrances are progressive enhancement; no framework/router, forced loading delays or looping animations. The timeline uses native direct scrolling and a small requestAnimationFrame animation only for deliberate control jumps.
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
- No currently requested implementation work remains after the new full-color Ascent scene. Final visual review and publication checks are the next step.
- Currently in progress: none.

## Logical commits

The earlier architecture, design, asset and validation commits remain intact (`8c8a888` through `56d4e84`). This session adds:

- `38fda61` — illustrated posts, concise profile and smoother page/scroll motion.
- `eb94653` — editorial previews, actual animation behavior and navigation tests.
- `d3733e3` — factual site metadata in place of the old learning tagline; rebuilt and verified afterward.
- `1e9e5b0` — verified editorial redesign and motion behavior handoff/evidence.
- `0d1d833` — self-service post authoring guide, template and growing-journal tests.
- `ed61f6b` — email/résumé chooser, footer/archive cleanup, curved page transitions, alternating scroll entrances and refreshed validation evidence.
- `42a0785` — replaces the overlapping curved transition with a verified sequenced fade.
- `4422f71` — free timeline scrolling, animated control jumps, Work navigation, period-free standalone name and calmer post reveals.
- `66ef075` — vertical Ascent expedition, shared post eligibility, geared climber, CRTO/About refinement and dedicated browser/content fixtures.
- `4ef52b6` — earlier Everest-inspired scene, geometric climber and desktop post snapping, since replaced by the latest refinement.
- `cffd097` — full-color mountaineer and foreground wall, elapsed-time camera easing, softened wheel settling, structural credential break, responsive art and focused regressions.
- `6f3e1c8` — continuous articulated climber, closer contact with the ice wall, removed sun/moon and unused pose files, integrated Everest introduction and browser regressions.
- This handoff and refreshed validation evidence are recorded in the following documentation commit.

## Exact recommended next task

**Review the new `/journey/` entrance and continuous climb at `http://127.0.0.1:4173/journey/`: check the title-to-mountain transition, scroll slowly and quickly through several checkpoints in both directions, inspect hand/boot contact and the final panel, and assess smoothness on a real mobile device if available. Address any visual feedback, then push only `codex/portfolio-v2` and open a review PR for Linux CI. Verify actual custom-domain settings before production merge; never push or merge directly into main.**

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
