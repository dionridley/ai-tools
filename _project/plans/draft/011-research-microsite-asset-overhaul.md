# Plan: Research Microsite Asset Overhaul

## Metadata

- **Number:** 011
- **Status:** draft
- **Created:** 2026-07-22
- **Last refreshed:** 2026-07-22
- **Refinement count:** 0
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A (scope decided in brainstorm with Dion, 2026-07-22)

## Executive Summary

Overhaul how the dr-research skill's HTML microsite handles assets and large diagrams, in one release (project-management 3.1.3 → **3.2.0**, minor — behavior change).

Today every research directory receives its own frozen copy of the template assets — ~280 KB of fonts/CSS/JS plus a 2.5 MB `mermaid.min.js` whenever a diagram exists — and since `_project/` is git-tracked, each diagram-bearing report permanently bakes 2.5 MB into repo history. This plan moves to **shared versioned assets**: one corpus-level `_project/research/assets/v1/` folder that all research references relatively, frozen per version (`v2` gets minted at the next overhaul; old research keeps rendering against `v1`). Alongside the restructure, the zoom overlay gains real navigation (vendored `svg-pan-zoom`: wheel-zoom, drag-pan, +/−/reset buttons — overlay covers the viewport, explicitly not the Fullscreen API), the bundled mermaid upgrades 11.4.1 → 11.16.0 so `v1` is born current, a **corpus index** (`_project/research/index.md` + `.html`) lists every report, and a new filesystem-only **`/dr-research repair`** mode verifies/restores shared assets and corpus-index completeness.

Decided tradeoff (Dion, 2026-07-22): a single research folder is no longer standalone-copyable — sharing means taking `assets/` along. The existing self-contained `pi-dev-capability-audit-2026-07-06/` stays exactly as-is; the repair mode's index job is how legacy reports join the corpus index without asset migration.

## Current State

- `bundles/project-management/skills/dr-research/assets/template/` holds the microsite template: `styles.css` (16.5 KB), `render.js` (9.4 KB, header comment "template v2"), `theme.js` (3 KB), `fonts/` (5 woff2, ~96 KB), `vendor/` (`marked.min.js` 35 KB, `highlight.min.js` 122 KB, `mermaid.min.js` 2.5 MB @ 11.4.1).
- SKILL.md Phase 3.5 copies the full base assets into each new report root and `mermaid.min.js` conditionally (only when a page has a ```mermaid fence). Deep dives share the parent's assets via `../../assets`.
- `templates/page-template.html` parameterizes the asset path per page via `{{ASSETS}}` (`assets` for root pages, `../../assets` for deep-dive pages) and includes mermaid via the conditional `{{MERMAID_SCRIPT}}` placeholder.
- `render.js` `setupZoom()` clones the clicked SVG into a `#zoom` lightbox — no pan, no zoom controls, Escape/click closes. Large diagrams scale to fit and become unreadable. Mermaid core has no built-in pan/zoom; `svg-pan-zoom` is the ecosystem-standard companion.
- Mermaid re-renders on theme change via `theme: 'base'` + `themeVariables` pulled from CSS custom properties (`DR.mermaidThemeVars()`).
- One research corpus exists: `_project/research/pi-dev-capability-audit-2026-07-06/` (self-contained assets, no mermaid, one deep dive). There is no corpus-level index.
- dr-research SKILL.md has a linear phase flow with a blocking Phase 0 web-access gate and no mode routing.
- No automated test suite in this repo — validation is manual (AGENTS.md).

## Assumptions

- [x] Bundled mermaid is 11.4.1; latest stable is 11.16.0 — verified 2026-07-22 (grep of vendor bundle; npm registry).
- [x] The existing research dir has no `mermaid.min.js` and stays untouched — verified 2026-07-22 (Glob listing); no migration per investment-level rule.
- [x] No test/lint/typecheck commands exist for this repo (AGENTS.md: manual validation) — Definition of Done uses adapted equivalents below.
- [ ] [?] mermaid 11.16.0 keeps the `theme: 'base'` + `themeVariables` init API compatible (same major version) — verified empirically in Phase 1's browser smoke test before anything depends on it.
- [ ] [?] `svg-pan-zoom` works on an SVG cloned into the overlay stage over `file://` (its standard inline-SVG usage) — verified empirically in Phase 1.
- [ ] [?] Latest stable `svg-pan-zoom` is 3.6.x — pin the exact version at implementation time and record it in the CHANGELOG entry.
- [ ] Vendor files are fetched at implementation time from a CDN mirror of the npm packages (jsdelivr/unpkg) via curl — network needed during implementation only, never at skill runtime.

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only.

### Blocking

Must resolve before implementation starts.

- (none — scope, tradeoffs, and mechanisms were decided in the 2026-07-22 brainstorm: svg-pan-zoom over hand-rolled; viewport overlay, not Fullscreen API; corpus index in scope; mermaid upgraded; repair mode included)

### Non-Blocking

Can resolve during implementation.

- [ ] [OPEN] Corpus index entry format — table (Title | Date | Answer) vs. list with answer as sub-line. Decide when writing the format spec in Phase 2; optimize for readability at ~10–50 entries.
- [ ] [OPEN] Overlay toolbar placement/styling (corner cluster vs. bottom bar) — decide in Phase 1 while styling; must not obscure diagram content.
- [ ] [OPEN] Whether repair regenerates the corpus `index.html` unconditionally or only when entries changed — decide in Phase 2; either is acceptable, pick the simpler to specify.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] Research generated by the updated skill references shared `../assets/v1` (deep dives `../../../assets/v1`) and no per-report asset copies are created; the corpus assets folder is created once and `mermaid.min.js` lands there lazily on the corpus's first diagram.
- [ ] The zoom overlay on a fixture page provides wheel-zoom, drag-pan, and working +/−/reset buttons over `file://`; Escape still closes; overlay covers the viewport (no Fullscreen API); hand-authored SVG figures get the same treatment as mermaid diagrams.
- [ ] Mermaid 11.16.0 renders fixture diagrams and re-themes correctly on palette and light/dark switches.
- [ ] The corpus index lists every research report (including a simulated legacy self-contained report added via repair) with title, date, one-line answer, and a working link.
- [ ] `/dr-research repair` in the fixture: restores a deleted current-version vendor file, adds a missing index entry, reports (without touching) legacy self-contained dirs, and never attempts web access.
- [ ] project-management is 3.2.0 in all four locations (plugin.json, bundle package.json, marketplace.json entry, CHANGELOG) with a CHANGELOG entry covering all five features.
- [ ] No stale instruction survives anywhere in the skill or bundle README claiming reports carry their own asset copies.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — no automated suite in this repo (see Assumptions). Adapted equivalents:
- Fixture HTML pages render over `file://` with no console errors.
- Both catalogs and all touched manifests parse as valid JSON.
- Version numbers agree across all four declaration points (final phase).

## Implementation Plan

### Phase 1: Template Layer — Vendor Upgrades and Pan-Zoom Overlay

The template must remain fully functional under the OLD per-report copy semantics at this phase boundary (SKILL.md still says copy-per-report until Phase 2) — this phase only upgrades what gets copied.

#### Tasks

- [ ] Fetch mermaid 11.16.0 minified UMD build from a CDN mirror of the npm package; replace `assets/template/vendor/mermaid.min.js`. Record the exact version.
- [ ] Fetch the latest stable `svg-pan-zoom` minified build (pin exact version); add as `assets/template/vendor/svg-pan-zoom.min.js`.
- [ ] `templates/page-template.html`: add an unconditional `<script>` tag for `svg-pan-zoom.min.js` alongside marked/highlight (13 KB — not worth conditional complexity; `{{MERMAID_SCRIPT}}` stays conditional as the only heavy asset).
- [ ] `render.js`: rework `setupZoom()` — on open, instantiate `svgPanZoom` on the cloned SVG (fit + center, sensible zoom limits, `zoomScaleSensitivity` tuned for wheel use); add an overlay toolbar with + / − / reset / close buttons wired to the svgPanZoom API; keep Escape-to-close and click-outside-to-close (click-outside must not fight drag-pan — close on the backdrop only, not the stage); destroy the pan-zoom instance on close; guard `if (window.svgPanZoom)` so pages rendered without the library fall back to the current static clone behavior.
- [ ] `styles.css`: overlay toolbar styles (both light/dark and all palettes via existing custom properties), grab/grabbing cursors on the stage, overlay remains viewport-covering (no Fullscreen API).
- [ ] Add `assets/template/VERSION` file containing `v1` — the single source of truth for the asset version the skill ships (read by Phase 3.5 generation and repair mode; the template directory listing itself is the file manifest, so no separate manifest file).
- [ ] Build a minimal hand-authored smoke page in gitignored `.research/microsite-overhaul/smoke/` (one page, one mermaid diagram, one hand-authored SVG figure) using the updated template with per-dir assets, and exercise it in a browser over `file://`.

#### Verification

- [ ] Grep `page-template.html` — expected: svg-pan-zoom script tag present unconditionally; `{{MERMAID_SCRIPT}}` placeholder unchanged.
- [ ] Grep the new `mermaid.min.js` for its version string — expected: 11.16.x.
- [ ] Browser check of the smoke page over `file://` (Dion or browser automation): mermaid renders; palette + light/dark switches re-theme the diagram; clicking a diagram opens the overlay; wheel-zoom, drag-pan, +/−/reset buttons work; Escape closes; the hand-authored SVG figure gets the same overlay; no console errors.
- [ ] Temporarily rename `svg-pan-zoom.min.js` and reload — expected: overlay degrades to the static clone (guard works), no console errors; restore the file after.

#### Acceptance Criteria

- Updated template renders and themes correctly with mermaid 11.16.0 over `file://`.
- Pan-zoom overlay is fully navigable for oversized diagrams and degrades gracefully without the library.
- `VERSION` file exists and reads `v1`.

#### Phase Exit Gate

<!-- verifier-recommendation: no — template-layer changes are verified empirically in the browser here and re-exercised end-to-end by Phase 3's fixture, where the verifier runs; a fresh-context verifier cannot drive a browser. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: Skill Flow — Shared Assets, Corpus Index, Repair Mode, Reference Docs

Text/instruction changes to the skill. At this boundary the skill is fully coherent on the new scheme; the empirical proof comes in Phase 3.

#### Tasks

- [ ] SKILL.md Phase 3.5 rewrite: replace per-report copying with corpus-level copy-once — create `_project/research/assets/<VERSION>/` from the template only if missing; `mermaid.min.js` still lazily copied on the corpus's first diagram (check: any page in the corpus referencing this asset version has a ```mermaid fence and the file is absent); `{{ASSETS}}` values become `../assets/v1` (report-root pages) and `../../../assets/v1` (deep-dive pages); drop the "parent predates HTML format" per-dir copy rule — all newly generated HTML references corpus assets; keep the frozen-version guarantee language (a published vN is never edited; overhauls mint the next vN).
- [ ] SKILL.md: add corpus-index step to Phase 3.5 — create `_project/research/index.md` if missing; add/update this research's entry (title, date, one-line answer from the answer block, relative link to the report's `index.md`); generate `index.html` beside it with the page template (`{{ASSETS}}` = `assets/v1`, regenerated each run — the corpus index is not frozen).
- [ ] SKILL.md: repair-mode routing — before Phase 0, if `$ARGUMENTS` starts with the literal token `repair`, read `references/repair-mode.md` and follow it end-to-end, explicitly skipping the Phase 0 web-access gate (repair is filesystem-only) and all research phases. Update the frontmatter `argument-hint` to mention `repair`.
- [ ] New `references/repair-mode.md`: (a) **assets job** — for each asset version directory under `_project/research/assets/` that pages actually reference, if it equals the skill's current `VERSION`, diff its contents against `assets/template/` and restore missing files (mermaid restored only if some corpus page needs it; svg-pan-zoom always); older frozen versions are reported as unrepairable-by-design (the skill only ships its current template); legacy self-contained research dirs (own `assets/` folder) are reported, never modified; (b) **index job** — every research directory (`_project/research/*/index.md`, deep dives excluded, `assets/` excluded) has a corpus-index entry; create the corpus index if missing entirely; add missing entries including legacy dirs (title from the report H1, date from the directory suffix, answer from the answer block or a `(legacy report)` note); regenerate `index.html` per the Phase 2 decision; (c) end with a short repair report (checked / restored / added / flagged).
- [ ] `references/output-formats.md`: update the deep-dive output tree (assets now corpus-level, show `assets/v1/` at the research root) and any asset-path prose; document the corpus index file alongside the other output files.
- [ ] `references/diagrams.md`: update the click-to-zoom note to describe the pan-zoom overlay (wheel, drag, buttons) — authors still don't need to shrink big diagrams.
- [ ] Consistency pass over the whole skill: no surviving claim that report folders carry their own assets ("frozen copy" language now describes `assets/vN`); Phase 4 completion-summary template mentions the corpus index line.

#### Verification

- [ ] Grep the skill for `report-dir>/assets`, `carries its own` and similar per-dir-copy phrasing — expected: zero stale hits.
- [ ] Grep SKILL.md + repair-mode.md for `assets/v` path references — expected: consistent `../assets/v1` / `../../../assets/v1` / `assets/v1` values and VERSION-file reads, no hardcoded contradictions.
- [ ] Read repair-mode.md end-to-end — expected: both jobs specified, legacy/older-version behavior is report-only, no web access anywhere in the procedure.

#### Acceptance Criteria

- A fresh reader of SKILL.md can execute the new Phase 3.5 without encountering the old copy semantics.
- Repair mode is reachable only via the literal `repair` argument and bypasses the web gate.
- Reference docs and SKILL.md agree on every asset path.

#### Phase Exit Gate

<!-- verifier-recommendation: no — instruction-text edits; the greps above cover structural consistency and Phase 3's fixture is the real test of whether the instructions execute. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 3: End-to-End Fixture, Bundle Docs, Release

Empirical proof of the whole scheme in a scratch fixture, then docs and the version ritual. The real `_project/research/` is NOT touched by this plan — it gains corpus assets/index only when dr-research actually runs there later.

#### Tasks

- [ ] Build a fixture corpus at `.research/microsite-overhaul/fixture/` simulating `_project/research/`: execute the NEW Phase 3.5 procedure literally for a fake report (with a mermaid diagram and a hand-authored SVG) plus one deep dive — verify `assets/v1/` is created once, both pages reference it via the correct relative depths, and no per-report assets exist.
- [ ] Corpus index: confirm the fixture run created `index.md` + `index.html` with the report's entry; add a second fake report and confirm the index gains (not rewrites) entries.
- [ ] Simulate a legacy self-contained report in the fixture (own `assets/`, no corpus entry); run the repair procedure — expected: index entry added, legacy assets untouched and flagged in the repair report.
- [ ] Repair restoration drill: delete `assets/v1/vendor/svg-pan-zoom.min.js` and one index entry; run repair — expected: file restored byte-identical from the template, entry re-added, report lists both actions; confirm the procedure never attempted web access.
- [ ] Browser verification of the fixture over `file://` (Dion or browser automation): pan-zoom overlay full behavior, mermaid 11.16.0 theming across palette/mode switches, corpus index navigation into reports and back, deep-dive page assets resolve.
- [ ] Bundle README (`bundles/project-management/README.md`): update the dr-research section — shared versioned corpus assets, pan-zoom overlay, corpus index, `repair` mode.
- [ ] Version ritual: pm 3.1.3 → 3.2.0 in plugin.json, bundle package.json, and marketplace.json; CHANGELOG entry dated with the current date (Added: pan-zoom overlay, corpus index, repair mode; Changed: shared versioned corpus assets replace per-report copies, mermaid 11.4.1 → 11.16.0 with pinned svg-pan-zoom version noted).
- [ ] Keep the fixture and a short evidence note in `.research/microsite-overhaul/` (findings-first convention: record observations at the moment they're made).

#### Verification

- [ ] Glob the fixture — expected: exactly one `assets/v1/` tree at the corpus root, zero `assets/` dirs inside the two generated reports, legacy sim dir unchanged.
- [ ] Read fixture `index.md` — expected: three entries (two generated + one legacy via repair), each with title/date/answer/link.
- [ ] Diff restored `svg-pan-zoom.min.js` against the template copy — expected: byte-identical.
- [ ] Grep all four version locations — expected: 3.2.0 everywhere; CHANGELOG entry present; JSON parses.
- [ ] Grep repo for personal email — expected: 0 matches in tracked files (standing rule).

#### Acceptance Criteria

- All seven plan-level Success Criteria hold, evidenced by the fixture and greps above.
- Evidence note exists in `.research/microsite-overhaul/`.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — final phase with evidence-backed claims (fixture behavior, restoration byte-identity, four-location version consistency); high blast radius: this is the released contract of pm 3.2.0. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

## Refinement History

- **2026-07-22:** Initial plan creation.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- [Populated at completion]

### What didn't

- [Populated at completion]

### Learnings

- [Populated at completion — things a future plan would do differently]
