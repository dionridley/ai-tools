# REFINE Mode — Update an Existing Plan

This reference owns the full REFINE flow end-to-end. Preserves the safety-critical features of the original command: backup, diff preview, status-aware warnings, and an explicit confirm gate. Adds old-template detection with opt-in structural migration.

The flow is: parse → validate → detect generation → status gate → back up → analyze → generate → diff → confirm → apply → report.

## Phase 1: Parse Arguments

`$ARGUMENTS` has this shape:

```
@_claude/plans/[folder]/[NNN]-[slug].md [natural-language refinement request] [--no-confirm]
```

Parse:

- **File reference** — the `@...` token; strip the `@` and normalize Windows backslashes to forward slashes.
- **Refinement request** — all text between the file reference and any trailing flags. May be empty.
- **`--no-confirm`** — if present, skip Phase 8's confirm gate and apply directly.

The file content has been auto-expanded into the conversation via the `@` reference — use that expanded content as the source of truth, not a fresh `Read` (they will be the same, but the expansion already happened).

## Phase 2: Validate the Target

1. **Verify the path shape.** Must match `_claude/plans/(draft|in_progress|completed)/NNN-[slug].md`.

2. **Read the file** (fresh, to confirm it exists at that path). If it doesn't exist:

   Use `Glob` with pattern `_claude/plans/**/*.md` to list available plans grouped by folder:

   ```
   ❌ Plan file not found: [path]

   Available plans:
     draft/:
       - [list]
     in_progress/:
       - [list]
     completed/:
       - [list]

   Usage: /dr-plan @_claude/plans/[folder]/[NNN]-[slug].md [refinement request]
   ```

   Then stop.

3. **Parse metadata.** Extract `Number`, `Status`, `Created`, `Last refreshed`, `Refinement count`, `Plan type`, `Verification Policy`, `Related PRD`.

## Phase 3: Detect Template Generation

The new template (v1.8+) has:

- A `## Definition of Done` section (plan-level).
- Per-phase `#### Phase Exit Gate` subsections.
- No `**Estimated Time:**` markers on phases.

A plan is **old-template** if any of these hold:

- No `## Definition of Done` section is present.
- No `#### Phase Exit Gate` subsection exists in the Implementation Plan.
- Any phase has `**Estimated Time:**` markers.

Store this as `is_old_template` — used in Phase 7.

## Phase 4: Status Gate

Branch on `Status` (derive from folder path if metadata is missing):

- **completed** (file is in `_claude/plans/completed/`) — refuse immediately:

  ```
  ❌ Cannot refine completed plan

  Plan #[NNN]: [Plan Name]
  Status: completed (historical record)

  Completed plans are archived for reference and should not be modified.

  Instead:
    1. Create a new plan incorporating lessons learned: /dr-plan [new context]
    2. Reference the completed plan's Retro section when drafting the new plan.
  ```

  Do not proceed.

- **in_progress** (`_claude/plans/in_progress/`) — note that Phase 8 must show an in-progress banner if changes turn out to be major.

- **draft** (`_claude/plans/draft/`) — no special warning.

## Phase 5: Create a Backup

Use `Read` on the existing plan and `Write` to `_claude/plans/[folder]/.[filename].backup` with the same content. No Bash `cp` — native `Read` + `Write` is cross-platform. Overwrite any existing backup (single-level — keep only the most recent).

## Phase 6: Old-Template Handling

Only runs if `is_old_template` was set in Phase 3.

Before analyzing the refinement request, ask once with `AskUserQuestion`:

> This plan uses the old template (no per-phase Acceptance Criteria, Phase Exit Gates, or Definition of Done block). The new template adds structure for autonomous verification and completion. How should I handle this refinement?

Options:
- **No — surgical refinement only (default).** Apply the requested changes to the existing structure. Don't touch the old shape. Choose this unless the user explicitly wants structural modernization.
- **Yes — also migrate structure.** Apply the requested changes AND restructure to match the new template (adds DoD, Phase Exit Gates with adaptive annotations, Completion + Retro sections, Execution Policy). Best-effort migration.
- **Show what changes.** Render a concise preview of what structural migration would add, then re-ask.

Store the choice as `migrate_structure` (boolean). Default is **No** if the user presses Enter or picks "No."

## Phase 7: Analyze and Generate the Refined Plan

### Analyze (extended thinking)

- What specifically does the user want changed? Is it a clarification, a scope change, a new phase, a restructure?
- Which sections are affected? Which should remain untouched?
- Does the change invalidate work already marked `[x]` in an in_progress plan? If so, the "major change" warning in Phase 8 applies.
- If `migrate_structure` is true, plan the section mapping:
  - Old `## Implementation Notes` → drop (Retro covers its purpose; Refinement History covers decisions).
  - Old `**Estimated Time:**` on phases → drop.
  - Missing `## Definition of Done` → add; infer commands from `CLAUDE.md` / `AGENTS.md` / `package.json` / etc. (See create-mode.md Phase 5.)
  - Missing `#### Phase Exit Gate` per phase → add with `verifier-recommendation: no` as safe default (no model-level risk evaluation without extra signal).
  - Missing `## Completion` + `## Retro` → add.
  - Missing `Execution Policy` subsection under `Open Questions & Decisions` → add with `Verification Policy [OPEN] Current: Adaptive (default)`.

### Decide the refinement scope

- **Minor** — clarifications, small additions, single-section tweaks, typo fixes, open-question resolution, one new task.
- **Major** — new phases, significant restructuring, substantial scope change, major rewrite of an existing phase.

Store as `scope` — used in Phase 8.

### Generate the refined plan

- Apply the requested changes. Be surgical — don't touch unrelated sections.
- If `migrate_structure` is true, apply structural migration alongside the requested changes.
- Update metadata:
  - `Status` — keep unless the change moves draft → in-progress (rare via refine).
  - `Last refreshed` — today's date.
  - `Refinement count` — increment by 1.
  - `Created` — never change.
  - `Plan type`, `Related PRD`, `Verification Policy` — keep unless the user's request explicitly changes them.
- Append a new entry to `## Refinement History`:

  ```markdown
  - **[YYYY-MM-DD]:** [Concise description of what was refined][; migrated structure to new template if applicable]
  ```

## Phase 8: Show the Diff and Gate

### Build the diff summary

Categorize changes:

- **Added** (`+`) — new content, sections, tasks, or phases.
- **Modified** (`~`) — changed content in existing sections.
- **Removed** (`-`) — deleted content.
- **Preserved** — major sections unchanged.

Format:

```
Changes preview:

  + Added: [section/item]
      - [bullet detail]
  ~ Modified: [section/item]
      - [bullet detail]
  - Removed: [section/item]

Preserved: [list major unchanged sections]

Scope: [Minor | Major]
```

### Show status and migration banners

If `Status == in_progress` AND `scope == Major`:

```
⚠️  WARNING: This plan is in progress and the change is major

Plan #[NNN]: [Plan Name]
Your request: "[request]"

Major structural changes to in-progress plans can invalidate completed work.

Recommendations:
  1. Move the plan back to draft for major redesign:
     mv _claude/plans/in_progress/[filename].md _claude/plans/draft/
     (Or ask Claude to move it.)
  2. Or create a new plan for the new approach: /dr-plan [new context]
  3. Or continue with minor adjustments only.
```

If `Status == in_progress` AND `scope == Minor`:

```
ℹ️  Note: This plan is in progress. Some tasks may be [x]. Verify this change doesn't conflict with completed work.
```

If `migrate_structure` is true:

```
ℹ️  Structural migration applied alongside the requested changes. New sections: Definition of Done, per-phase Phase Exit Gate, Execution Policy subsection, Completion, Retro.
```

### Gate on confirmation

If `--no-confirm` is present, skip the gate and go to Phase 9.

Otherwise, use `AskUserQuestion` with three options:

- **Apply** — write the refined plan.
- **Show Diff** — render a detailed line-by-line comparison of the original and refined plan, then re-ask (Apply / Cancel).
- **Cancel** — abort. The backup remains on disk and can be deleted manually.

If the user picks **Cancel**:

```
❌ Refinement cancelled. Plan is unchanged.

Backup: _claude/plans/[folder]/.[filename].backup
  (Remove manually if no longer needed.)
```

## Phase 9: Apply

Use `Write` to overwrite the original plan with the refined content.

## Phase 10: Completion Summary

```
✅ Plan refined: _claude/plans/[folder]/[filename].md

Plan #[NNN]: [Plan Name]
Status: [status]
Refinement count: [new count]

Changes applied:
  [summary matching the diff]

Backup: _claude/plans/[folder]/.[filename].backup

Next steps:
  1. Review the refined plan.
  2. Refine again: /dr-plan @_claude/plans/[folder]/[filename].md [changes]
  [If in draft/:]
  3. When ready, move to in_progress:
     mv _claude/plans/draft/[filename].md _claude/plans/in_progress/
     (Or ask Claude.)
```

If structural migration was applied, add one extra line before "Next steps":

> Note: Migrated structure to the current template. Review the new Definition of Done block (verify the commands match your project) and the Execution Policy subsection (Adaptive is the default; change via `answer questions`).
