# Repair Mode

Filesystem-only maintenance for the research corpus: verify and restore the shared assets, and bring the corpus index to completeness. Reached only via SKILL.md's Mode Routing — `$ARGUMENTS` starting with the literal token `repair`.

**No web access.** Never call web tools in this mode; every step works from the local filesystem. Phase 0's web gate does not apply, and no research phase runs.

Path conventions (same as Phase 3.5): `<skill-dir>` = this skill's root directory (absolute path, announced when the skill loads); `<research-root>` = absolute path of `_project/research`. If `<research-root>` doesn't exist, report that there is nothing to repair and stop.

## Job 1: Shared assets

1. Read `<skill-dir>/assets/template/VERSION` → the asset version the skill currently ships (`v1`).
2. Inventory `<research-root>/assets/` with Glob. For each version directory found:
   - **Current version (name matches VERSION):** compare its file list against `<skill-dir>/assets/template/` — the template directory listing IS the manifest (`styles.css`, `render.js`, `theme.js`, `VERSION`, `fonts/*`, `vendor/marked.min.js`, `vendor/highlight.min.js`, `vendor/svg-pan-zoom.min.js`; `vendor/mermaid.min.js` is conditional). Restore each missing file with `cp` from the template. `mermaid.min.js`: restore only if some corpus page needs it (Grep the corpus `.md` files for ```mermaid fences); `svg-pan-zoom.min.js` and everything else: unconditional. **Restore means add missing files only — never overwrite a file that exists.** The version folder is frozen; content drift in existing files is reported, not corrected.
   - **Older version folders:** frozen and unrepairable-by-design — the skill only ships its current template. Report them (with any missing files noticed), change nothing.
3. **Legacy self-contained reports** — report directories carrying their own `assets/` folder (generated before the shared scheme): report them as legacy, never modify their assets.
4. If `<research-root>/assets/` doesn't exist at all but corpus-era pages reference it (Grep report `.html` files for `assets/v`), create the current-version folder via the Phase 3.5 copy-once procedure.

## Job 2: Corpus index

1. Enumerate reports: every `<research-root>/*/index.md` (exclude the `assets/` directory; deep dives live inside report directories and never get top-level entries).
2. If `<research-root>/index.md` is missing, create it with the structure from Phase 3.5's corpus-index step.
3. For every report without an entry, add one — keeping newest-first order. Title from the report's H1, date from the directory-name suffix, one-line answer from the report's answer block; if the report predates the answer-block format, use its stated purpose or research question — legacy self-contained reports join the index like any other (the index lists all research regardless of asset era).
4. **Remove nothing.** An entry pointing at a directory that no longer exists is flagged in the repair report for the user to decide.
5. **ALWAYS regenerate `index.html`** from the page template (per Phase 3.5: `{{TITLE}}` = `Research`, `{{ASSETS}}` = `assets/v1`, `{{MERMAID_SCRIPT}}` empty, `{{PAGE_CLASS}}` = `corpus-index`), even when no entries changed — repair heals a stale or corrupt view by definition.

## Repair report

End the run with a short report in the conversation:

```
Repair report — _project/research/
  Assets (v1): [N files checked; restored: [files] / none]
  Older asset versions: [none / vN: frozen — missing [files], not repairable]
  Legacy self-contained reports: [list / none] (untouched)
  Corpus index: [N entries verified; added: [titles] / none; index.html regenerated]
  Flagged for user: [dangling entries, content drift, anything unexpected / none]
```

Nothing outside `_project/research/` is modified, and no web access occurs.
