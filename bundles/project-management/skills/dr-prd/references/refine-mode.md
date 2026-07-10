# REFINE Mode — Update an Existing PRD

This reference owns the full REFINE flow end-to-end. Preserves the safety-critical features of the original command: backup, diff preview, linked-plan detection, status-aware warnings, and an explicit confirm gate.

The flow is: parse → validate → analyze → back up → generate → diff → confirm → apply → report.

## Phase 1: Parse Arguments

`$ARGUMENTS` has this shape:

```
@path/to/prd.md [natural-language refinement request] [--no-confirm] [migrate]
```

Parse:

- **File reference** — the `@...` token; strip the `@` and normalize Windows backslashes to forward slashes.
- **Refinement request** — all text between the file reference and any trailing flags. May be empty (means "just reconsider / clean up").
- **`--no-confirm`** — if present, skip Phase 7's confirm gate and apply directly.
- **`migrate` hint** (optional) — a natural-language cue like "migrate to new template" signals the user wants a structural migration from the old template to the new one. Handle this only when the user asks for it explicitly; never migrate silently.

## Phase 2: Validate the Target

1. **Read the file.** If it doesn't exist:

   Use `Glob` to list PRDs in `_claude/prd/`:

   ```
   ❌ PRD file not found: [path]

   Available PRDs in _claude/prd/:
     - [file-1].md
     - [file-2].md

   Usage: /dr-prd @_claude/prd/[filename].md [refinement request]
   ```

   Then stop.

2. **Confirm it's a PRD.** Look for `# PRD:` near the top and `**Status:**` in the metadata block. If neither is present, refuse with:

   ```
   ❌ [path] doesn't look like a PRD (missing `# PRD:` header and `**Status:**` metadata).
   ```

3. **Parse metadata.** Extract `Status`, `Version`, `Created`, `Author`, `Last Updated`, and (if present) `Feature Type`.

4. **Detect template generation.** The new template (v1.7+) includes a `Hypothesis` section and a top-level `Acceptance Criteria` section. The old template does not. If both are absent, treat the PRD as **old-template**.

## Phase 3: Status Gate

Branch on `Status`:

- **Superseded** — refuse immediately:

  ```
  ❌ Cannot refine Superseded PRD

  PRD: [name] (v[version])
  Superseded by: [if mentioned, name the replacement]

  This is a historical record. Refine the current version instead, or create a new major version.
  ```

  Do not proceed.

- **Approved** — note that Phase 7 must display an Approved warning.
- **Under Review** — note that Phase 7 must display an Under Review note.
- **Draft** — no additional warning.

## Phase 4: Linked-Plan Detection

Find both directions. You **must** run both methods; do not skip one.

### Method 1 — PRD → Plan links (references inside the PRD)

Use `Grep` on the PRD file:
- pattern: `@_claude/plans/`
- path: the PRD file path
- output_mode: `content`

Extract referenced plan paths (drop the `@`). Store as `prd_to_plan_links`.

### Method 2 — Plan → PRD links (references inside plan files)

Use `Grep` across the plans directory:
- pattern: `@_claude/prd/[actual-prd-filename].md`
- path: `_claude/plans/`
- output_mode: `files_with_matches`

Store the returned plan paths as `plan_to_prd_links`.

### Merge

Combine both lists, dedupe, store as `linked_plans`. Phase 7 and Phase 9 use this list.

## Phase 5: Create a Backup

Use `Read` on the existing PRD and `Write` to `_claude/prd/.[filename].backup` with the same content. No Bash `cp` — native `Read` + `Write` is cross-platform. Overwrite any existing backup (keep only the most recent).

## Phase 6: Analyze and Generate the Refined PRD

### Analyze (extended thinking)

- What specifically does the user want changed? Is it a clarification, a scope change, or a requirement add/remove?
- Which sections are affected? Which should remain untouched?
- Does the change invalidate assumptions elsewhere in the PRD (e.g., a scope expansion that breaks a dependency note)?
- How do linked plans relate to this change?

### Decide the version increment

- **Minor** (1.0 → 1.1) — clarifications, wording tweaks, small additions, open-question resolutions.
- **Major** (1.1 → 2.0) — scope change, new core requirements, removed requirements, hypothesis change, changed success metrics.

### Handle structural migration (only when explicitly requested)

If the user asked to migrate the PRD to the new template:

- Map old sections to new:
  - `Problem Statement` → stays.
  - Add a new `Hypothesis` section (best-effort inferred from existing Problem + Goals; flag in Open Questions if uncertain).
  - `Goals and Objectives` + `Success Metrics` → collapse into `Success Metrics` at the new location.
  - `Functional Requirements` (Must/Should/Nice) → `Core` + `Enhancements`. Demote `Nice to Have` into Open Questions or drop if dead.
  - Add a new top-level `Acceptance Criteria` section — derive from existing per-user-story criteria if present; otherwise leave marked `[ ]` with a note in Open Questions.
  - `Timeline and Milestones` → collapse to a single-line `Release Strategy`, or mark `[To be determined during planning]`.
  - Old `Refinement History` → preserved intact, and this migration gets a new entry.
- If the user did not ask to migrate, leave the structure as-is. Refine only what they asked to change.

### Generate the refined content

- Apply the requested changes.
- Keep everything else intact — be surgical.
- Update metadata:
  - `Status` — keep unless a major change suggests bumping Draft → Under Review.
  - `Version` — bump per the rule above.
  - `Created` — never change.
  - `Last Updated` — today's date.
  - `Author` — keep.
- Add a new `Refinement History` entry at the top of that section:

  ```markdown
  **Version [new]** — [YYYY-MM-DD]
  - [Concise description of what was refined]
  ```

## Phase 7: Show the Diff and Gate

### Build the diff summary

Categorize changes:

- **Added** (`+`) — new content, sections, or items.
- **Modified** (`~`) — changed content in existing sections.
- **Removed** (`-`) — deleted content (rare; callout important).
- **Preserved** — major sections unchanged.

Format:

```
Changes preview (v[old] → v[new]):

  + Added: [section/item]
      - [bullet detail]
  ~ Modified: [section/item]
      - [bullet detail]
  - Removed: [section/item] (only if applicable)

Preserved: [list major unchanged sections]
```

### Show status and linked-plan warnings

If `Status == Approved`:

```
⚠️  This PRD is Approved.

Change requested: "[request]"

Approved PRDs are typically change-controlled. Consider:
  - Moving status back to Under Review for significant changes
  - Creating a new major version (v[N].0) for scope changes
  - Proceeding only if this is a clarification that stakeholders would accept
```

If `Status == Under Review`:

```
ℹ️  This PRD is Under Review — stakeholders may be looking at it. Coordinate changes.
```

If `linked_plans` is non-empty:

```
⚠️  This PRD is referenced by [N] plan(s):
  - [plan-path-1]
  - [plan-path-2]

If this refinement changes scope or requirements, those plans may need updating.
```

### Gate on confirmation

If `--no-confirm` is present, skip the gate and go to Phase 8.

Otherwise, use `AskUserQuestion` with three options:

- **Apply** — write the refined PRD.
- **Show Diff** — render a detailed line-by-line comparison of the original and refined PRD, then re-ask (Apply / Cancel).
- **Cancel** — abort, remove the backup, exit.

If the user picks **Cancel**:

```
❌ Refinement cancelled. Original PRD is unchanged and the backup has been removed.
```

Use `Write` with empty/no content is not the right tool to delete the backup — instead skip this cleanup if there is no native delete available; leave a single-line note in the message: "Backup `_claude/prd/.[filename].backup` remains on disk; you can delete it manually if unwanted." This avoids pulling in Bash `rm` permissions just for cleanup.

## Phase 8: Apply

Use `Write` to overwrite the original PRD with the refined content.

## Phase 9: Completion Summary

### If no linked plans were found

```
✅ PRD refined: [name] (v[old] → v[new])

Location: _claude/prd/[filename].md
Status: [status]

Changes applied:
  [summary matching the diff]

Backup: _claude/prd/.[filename].backup

Next steps:
  1. Review the refined PRD
  2. If approved, update Status when stakeholders sign off
  3. Further refine: /dr-prd @_claude/prd/[filename].md [changes]
```

### If linked plans were found

```
✅ PRD refined: [name] (v[old] → v[new])

Location: _claude/prd/[filename].md
Status: [status][ — consider re-approval if Approved]

Changes applied:
  [summary matching the diff]

Backup: _claude/prd/.[filename].backup

⚠️  Referenced by [N] plan(s):
  - [plan-path-1]
  - [plan-path-2]

Recommended follow-ups:
  1. Review each linked plan for alignment
  2. If a plan needs updating: /dr-plan @[plan-path] Align with PRD v[new]
```

### If a structural migration was applied

Add one extra line before "Next steps":

> Note: Migrated from the old PRD template to the current structure. Review the new `Hypothesis`, `Acceptance Criteria`, and `Release Strategy` sections — some content was inferred and flagged in Open Questions.
