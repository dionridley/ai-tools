# State B — Already Initialized (Verify and Update)

Use this flow when AGENTS.md carries the plugin marker (see SKILL.md Phase 1). The goal is to verify completeness, backfill anything missing, offer updates for outdated plugin-managed sections, and repair stale plugin text that older versions left in AGENTS.md. User customizations are never touched.

## Step 1: Inventory what's present

Run these checks (parallel):

1. **`Glob _project/**`** — inventory existing directories. Compare against the expected 7 leaf directories:
   - `_project/docs/`
   - `_project/plans/draft/`
   - `_project/plans/in_progress/`
   - `_project/plans/completed/`
   - `_project/prd/`
   - `_project/resources/`
   - `_project/research/`
   Note any missing directories.
2. **`Read AGENTS.md`** — already read during state detection, reuse that content.
3. **`Read templates/AGENTS-template.md`** (from the skill root) — the authoritative template to compare against.
4. **Read the `## Stale-text repairs` section of `references/claude-md-migration.md`** — the stale plugin text older versions wrote into AGENTS.md outside the versioned sections, each with its exact replacement. Use that section as the only source of the old and new text.

## Step 2: Backfill missing directories (silent, no user prompt)

For any of the 7 expected leaf directories that don't exist, write a `.gitkeep` file to that path. Parallel `Write` calls for all missing ones at once. This is routine housekeeping and doesn't require confirmation. (The legacy `_claude/` → `_project/` rename offer is handled before this flow — see SKILL.md Phase 1. Don't backfill `_project/` dirs while a rename offer is still pending.)

Track which directories were backfilled — include them in the final summary.

## Step 3: Extract versioned sections from the template

Parse the template content to identify each versioned section. A versioned section is a `##` heading followed immediately by a line matching the pattern `<!-- section: <slug> v<N> -->`.

For each versioned section, note:
- Section heading (e.g., `## Plan Management Workflow`)
- Slug (e.g., `plan-management-workflow`)
- Current version from the template (e.g., `3`)
- Full section body (from the `##` heading through to the next `##` heading or the `<!-- End of plugin-managed section -->` marker)

See `references/section-versioning.md` for the versioning scheme.

## Step 4: Categorize each section against the user's AGENTS.md

For each versioned section from the template:

- **✓ Current** — heading exists AND marker version ≥ template version
- **⚠ Outdated** — heading exists AND (marker absent OR marker version < template version)
- **✗ Missing** — heading not found in user's AGENTS.md

Then, for **every** repair in the Stale-text repairs section, run Grep on AGENTS.md with that repair's **Detect** text — never decide by reading the file. A hit makes it a **pending repair**. Record a verdict for each repair (pending / not found); Steps 5 and 8 report them. (If `references/claude-md-migration.md` already applied the repairs earlier in this run, none will be found.)

## Step 5: Short-circuit on "everything current"

If all versioned sections are ✓ Current AND no repair is pending AND no directories needed to be backfilled:

```
✅ Project structure verified — nothing to do

Directory structure: Complete
AGENTS.md sections:
  ✓ Plan Management Workflow (current)
  ✓ Available Commands (current)
  ✓ Task Completion Protocol (current)
Stale plugin text: none found (every repair checked with Grep)

Your project is fully up to date.
```

Then stop.

If all sections are current and no repair is pending, but directories were backfilled, report just those and stop:

```
✅ Project structure verified

Directory structure: Updated
  Created: _project/prd/ (was missing)

AGENTS.md sections: All current (3)
Stale plugin text: none found (every repair checked with Grep)

No AGENTS.md changes needed.
```

## Step 6: Pre-flight git safety (before any AGENTS.md write)

If `references/claude-md-migration.md` wrote AGENTS.md earlier in this run, skip this check — its preview already showed those changes and the user approved them.

Otherwise, if the current directory is a git repository (detected by `Glob .git/**` returning results — check once, use a Glob pattern that matches anything inside `.git/`), run:

```
Bash: git status --porcelain AGENTS.md
```

If output is non-empty, AGENTS.md has uncommitted changes. Warn the user via AskUserQuestion:

> **Question:** AGENTS.md has uncommitted changes. If you proceed, those changes may be modified by the section update. How would you like to proceed?
>
> **Options:**
> - **Proceed anyway** — apply updates now, I'll review the resulting changes before committing
> - **Cancel** — don't modify AGENTS.md, I'll commit or stash my changes first

If "Cancel", emit:

```
ℹ️  Cancelled — no changes made.
Run /dr-init again after committing or stashing your AGENTS.md changes.
```

Then stop.

If not a git repo, skip this check silently.

## Step 7: Build the diff preview

For each outdated or missing section, and each pending repair, compute a unified diff showing what would change:

- **Outdated section:** diff between the user's current section body and the template's version of that section
- **Missing section:** show the full section to be inserted (rendered as additions only)
- **Pending repair:** the repair's Old lines as removals and its New lines as additions, under the header `# --- Stale plugin text (repair) ---` — one entry per repair

Assemble all diffs into a single preview block with clear headers per entry. Use a standard ` ```diff ` fenced block so it renders with syntax highlighting.

## Step 8: Present the summary and the diff, then ask

Display this layout:

~~~markdown
## /dr-init — Update Available

**Plugin-managed sections (AGENTS.md):**

  ✓ Plan Management Workflow (current)
  ⚠ Task Completion Protocol (outdated — v1 → v2)
  ✗ New Section Name (missing)

**Stale plugin text (AGENTS.md):** 1 repair pending

**Proposed changes to AGENTS.md:**

```diff
# --- Task Completion Protocol (v1 → v2) ---
@@ -154,4 +154,5 @@
-When working on tasks from an implementation plan, follow this protocol for each phase:
+When working on tasks from an implementation plan, follow this protocol for EACH phase:
+(Updated guidance here...)

# --- New Section Name (new) ---
+## New Section Name
+<!-- section: new-section-name v1 -->
+
+Full content of new section...

# --- Stale plugin text (repair) ---
-<the repair's Old text>
+<the repair's New text>
```

Only the plugin-managed sections and stale plugin text listed above will change.
Everything else in your AGENTS.md stays exactly as it is.
~~~

Omit the **Stale plugin text** line when no repair is pending.

Then use AskUserQuestion:

> **Question:** Apply these updates to AGENTS.md?
>
> **Options:**
> - **Apply** — update the outdated and missing sections and repair the stale text
> - **Skip** — don't modify AGENTS.md right now
> - **Show full sections** — display the complete new section content (not a diff) for manual copy

## Step 9: Handle the user's choice

### If "Apply":

For each outdated section (from top to bottom in the file to keep line references stable):
- Use `Edit` to replace the old section body (from the `##` heading through to just before the next `##` heading or `<!-- End of plugin-managed section -->`) with the new section body from the template.

For each missing section:
- Use `Edit` to insert the section from the template immediately before the `<!-- End of plugin-managed section -->` marker.
- If that marker doesn't exist, fall back to appending the section at the end of the file.

For each pending repair:
- Use `Edit` to replace the repair's Old text with its New text, exactly as the Stale-text repairs section gives them.

After all edits, emit:

```
✅ AGENTS.md updated

Sections updated:
  ⚠→✓ Task Completion Protocol (v1 → v2)
Sections added:
  ✗→✓ New Section Name (v1)
Stale plugin text repaired:
  ✓ <each repair applied, by name>
Sections preserved unchanged:
  ✓ Plan Management Workflow
  ✓ Available Commands
  [... all other content outside plugin-managed sections ...]

Your project-specific customizations have been preserved.
```

Omit any group that is empty.

Do not suggest or run any git commands — the user handles their own commits.

### If "Skip":

```
ℹ️  AGENTS.md not modified.
Run /dr-init again when you're ready to review and apply updates.
```

### If "Show full sections":

For each outdated/missing section, display the full current section content from the template in a code fence so the user can copy/paste manually. For each pending repair, display its New text the same way, naming the Old text it replaces. Then:

```
Copy the sections above into your AGENTS.md to update manually.
Run /dr-init again afterward to verify the updates took effect.
```

Do not write any changes to AGENTS.md in this branch.
