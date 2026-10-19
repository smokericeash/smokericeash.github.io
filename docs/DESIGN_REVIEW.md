# Current design review

Reviewed October 18, 2026 against the user's twenty-item reference. This describes the current templates and active CSS, superseding the early layout sketches in `AUDIT.txt`. Preserve the approved mountain scene and climbing pace.

| Reference item | Current treatment |
| --- | --- |
| 1. Purple-to-blue gradient | Absent. Flat slate, ice and neutral surfaces. |
| 2. Gradient hero text | Absent. Solid, readable text. |
| 3. Emoji headings | Absent from the site UI. Original article writing is preserved. |
| 4. Inter everywhere | Removed. Local Segoe UI system fonts; no font downloads. |
| 5. Colored-border cards | No decorative accent frames. Quiet neutral rules separate actual entries. |
| 6. Glass cards | Absent. Header and content surfaces are opaque. The email modal alone dims/blurs its backdrop to distinguish the active dialog. |
| 7. Low-contrast dark mode | Light/dark appearances checked with axe and Lighthouse; readable primary and secondary text. |
| 8. Three icon boxes | Absent. The three recent entries use actual documentary images and article summaries. |
| 9. Badge over headline | No marketing pills. Plain section labels describe subject and hierarchy. An existing competition result remains factual article content. |
| 10. Lucide everywhere | No Lucide dependency. Small local icons serve navigation and real social links. |
| 11. Default shadcn | No shadcn dependency or component theme. Custom Liquid/CSS components. |
| 12. Fade-in on scroll | Removed. Text and cards are immediately visible. Page-to-page transitions and the specifically requested climbing animation remain; reduced motion is supported. |
| 13. Cursor beam | Absent. Native pointer and focus behavior. |
| 14. Fading hover buttons | Absent. Controls retain opacity, with restrained movement or border feedback. |
| 15. Inconsistent spacing | Shared shell, section, row and typography rules; verified at six responsive widths. |
| 16. Excessive em dashes | No repeated rhetorical dash copy pattern in UI. Original posts and compact date/counter separators remain unchanged. |
| 17. Generic buzzwords | UI describes actual work, dates, entries and education. No invented claims or generic feature pitch. |
| 18. Serif italic accents | Absent. Code-comment italics are syntax highlighting, not decorative typography. |
| 19. Space Grotesk + Instrument Serif | Neither font is used. |
| 20. Grain over gradients | No grain/noise overlay. Scenic masks blend the mountain into its page, and sparse dots in the small mountain map represent snow. |

The scenic gradients, snow and page transitions serve the existing mountain composition; they do not add generic card or headline effects. Existing posts are kept as authored rather than rewritten to satisfy a visual checklist.

## Content stays separate from presentation

`_posts/` is the source for Home highlights, Work/search, chronological archives, taxonomy, feeds, sitemap and both Ascent views. Shared includes render entry previews; the Ascent solver takes its stage count from the rendered checkpoints and extends its wall automatically. `_data/journey.yml` contains optional editorial overrides, not a required post registry. The legacy case-study routes under `/work/` are independently curated; new ordinary posts belong in the primary Work archive at `/research/`.

Use `docs/post-template.md` and `docs/POSTING.txt`. Adding a post requires Markdown and optional image preparation, followed by a normal build/publication. It does not require HTML, CSS, animation or milestone-list changes. `ascent: false` excludes an entry from both Ascent views while keeping it elsewhere. Number formatting pads single digits without truncating counts beyond 99.

`npm run test:posts` proves propagation using an isolated build with two temporary posts, a new year/category/tag, a text-only article with inferred description, and an Ascent opt-out. It also searches the new entries and reaches the summit of the longer live climb. The normal preview is untouched, and fixture sources are removed in cleanup.

Local automated checks cannot substitute for an actual phone review or remote Linux CI. Those remain release checks; this review does not authorize deployment.

Production builds compress the published CSS without combining or changing the editable source modules. `prototypes/production-style-review.cjs` compares Home, Work, an article and The Ascent at desktop/mobile widths in both appearances. Photo sources, dimensions and appearance styles are checked separately from screenshot comparison to avoid Chromium's image-resampling differences. UI comparison allows at most one RGB channel level of rounding.
