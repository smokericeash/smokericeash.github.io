# Contact-anchored Ascent rig study — not shipped

The October 18 request in `C:/Users/super/.codex/attachments/f4553b7e-97ca-4674-be87-1aa1d59e5977/Pasted text.txt` calls for a complete Ascent motion/physics replacement while preserving the approved site and mountaineer design. The live `/journey/` page still uses the fourteen full-body raster poses. This directory is excluded from Jekyll output; nothing here is loaded by the site.

## Root cause found

`assets/js/expedition.js` swaps fourteen complete character images while moving the wall and SVG route separately. A swap changes the apparent anatomical side and foot/tool positions. Because the character image has no tracked joints or wall-space contact anchors, interpolation of scroll position cannot prevent sliding, contradictory knees, or detached tool strikes. The existing scene also has no real ledge state for the ending.

## Study

`ice-climber-rig.js` is a deterministic SVG rig study. It preserves permanent `left`/`right` parts, solves fixed-length arm/leg links to wall-space targets, alternates hand and foot placement, keeps the supporting contacts stationary during each step, shares the wall's SVG coordinate system, and draws small localized contact marks. The final stage blends in a separate snowy ledge study and places a flag. The number of steps derives from the supplied milestone count. Reversing scroll re-evaluates the same state without time-based randomness.

`ascent-summit-ledge-study.png` is an original built-in ImageGen transparent study. Prompt: “Create a transparent summit extension from the existing glacier-and-rock wall illustration, preserving the close wall's snowy ice and dark rock, with a natural upper snow ridge/ledge on the right and transparent open mountain vista on the left; no person, no flag.” It is referenced by the preview script as a data URL and is **not** part of the live site.

Run the study against a running local production preview at `http://127.0.0.1:4173/`:

```powershell
bundle exec jekyll build
python -m http.server 4173 --directory _site
node prototypes/rig-physics.cjs
node prototypes/rig-preview.cjs
```

`rig-preview.cjs` writes twenty-five individual renders and a contact sheet under ignored `test-results/`. `rig-physics.cjs` checks fixed link lengths, planted-support drift, and side identity over 1,001 progress samples.

`scan-wall.cjs` samples the actual wall cutout's alpha edge (Chrome, local preview required). Its measured left boundary varies from about 421 to 172 SVG units at 600-unit width, whereas the study's synthetic contact surface stays near 369. That does not directly tell us which textured ledges are safe holds, but it confirms that a single nearly vertical collision line cannot model the whole cutout.

## Do not deploy yet

Visual inspection of the 25-frame contact sheet failed: the raster torso and drawn sleeves/trousers do not share the same rendering fidelity, and the final pose/flag still lack the reference's physical finish. Contact coordinates are based on a synthetic wall profile rather than the actual wall silhouette. The summit cutout is promising but must be blended and tested inside the real page at desktop/mobile sizes. The generated four-component clothing sheet was also inspected but rejected for current use because applying straight sprites to a bent rig would reproduce the original hinge artifact.

A continuous triangle-mesh warp of the existing full photographic climber was also rendered at 25 stages and rejected: the large arm/leg changes inverted triangles and visibly tore the figure. It was removed rather than substituted for the approved art.

Next: create a consistent textured, continuously deforming character skin for this solver (or a better lightweight rig), calibrate contact anchors against the actual wall image, then review all phases and the full ledge/flag sequence in the real Ascent layout. Only replace the production raster implementation after the character matches the approved still-image fidelity and all browser/content/accessibility checks pass.
