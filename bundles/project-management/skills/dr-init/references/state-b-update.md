# State B — Already Initialized (Verify and Update)

Use this flow when the project already has the plugin installed. The goal is to verify completeness, backfill anything missing, and offer updates for outdated plugin-managed sections — while leaving user customizations untouched.

## Steps

### 1. Inventory what's present

Run these checks (parallel):

1. **`Glob _claude/**`** — inventory existing directories. Compare against the expected 7 leaf directories:
   - `_claude/docs/`
   - `_claude/plans/draft/`
   - `_claude/plans/in_progress/`
   - `_claude/plans/completed/`
   - `_claude/prd/`
   - `_claude/resources/`
   - `_claude/research/`
   Note any missing directories.
2. **`Read CLAUDE.md`** — already read during state detection, reuse that content.
3. **`Read ${CLAUDE_SKILL_DIR}/templates/CLAUDE-template.md`** — the authoritative template to compare against.

### 2. Backfill missing directories (silent, no user prompt)

For any of the 7 expected leaf directories that don't exist, write a `.gitkeep` file to that path. Parallel `Write` calls for all missing ones at once. This is routine housekeeping and doesn't require confirmation.

Track which directories were backfilled — include them in the final summary.

### 3. Extract versioned sections from the template

Parse the template content to identify each versioned section. A versioned section is a `##` heading followed immediately by a line matching the pattern `<!-- section: <slug> v<N> -->`.

For each versioned section, note:
- Section heading (e.g., `## Plan Management Workflow`)
- Slug (e.g., `plan-management-workflow`)
- Current version from the template (e.g., `2`)
- Full section body (from the `##` heading through to the next `##` heading or the `<!-- End of plugin-managed section -->` marker)

See `${CLAUDE_SKILL_DIR}/references/section-versioning.md` for the versioning scheme.

### 4. Categorize each section against the user's CLAUDE.md

For each versioned section from the template:

- **✓ Current** — heading exists AND marker version ≥ template version
- **⚠ Outdated** — heading exists AND (marker absent OR marker version < template version)
- **✗ Missing** — heading not found in user's CLAUDE.md

### 5. Short-circuit on "everything current"

If all versioned sections are ✓ Current AND no directories needed to be backfilled:

```
✅ Project structure verified — nothing to do

Directory structure: Complete
CLAUDE.md sections:
  ✓ Plan Management Workflow (current)
  ✓ Available Commands (current)
  ✓ Task Completion Protocol (current)

Your project is fully up to date.
```

Then stop.

If all sections are current but directories were backfilled, report the backfill and stop:

```
✅ Project structure verified

Directory structure: Updated
  Created: _claude/prd/ (was missing)
  Created: _claude/resources/ (was missing)

CLAUDE.md sections: All current (3)

No CLAUDE.md changes needed.
```

### 6. Pre-flight git safety (before any CLAUDE.md write)

If the current directory is a git repository (detected by `Glob .git/**` returning results — check once, use Glob pattern that matches anything inside `.git/`), run:

```
Bash: git status --porcelain CLAUDE.md
```

If output is non-empty, CLAUDE.md has uncommitted changes. Warn the user via AskUserQuestion:

> **Question:** CLAUDE.md has uncommitted changes. If you proceed, those changes may be modified by the section update. How would you like to proceed?
>
> **Options:**
> - **Proceed anyway** — apply updates now, I'll review the resulting changes before committing
> - **Cancel** — don't modify CLAUDE.md, I'll commit or stash my changes first

If "Cancel", emit:

```
ℹ️  Cancelled — no changes made.
Run /dr-init again after committing or stashing your CLAUDE.md changes.
```

Then stop.

If not a git repo, skip this check silently.

### 7. Build the diff preview

For each outdated or missing section, compute a unified diff showing what would change:

- **Outdated section:** diff between the user's current section body and the template's version of that section
- **Missing section:** show the full section to be inserted (rendered as additions only)

Assemble all diffs into a single preview block with clear headers per section. Use a standard ` ```diff ` fenced block so it renders with syntax highlighting.

### 8. Present the summary and the diff, then ask

Display this layout:

~~~markdown
## /dr-init — Update Available

**Plugin-managed sections:**

  ✓ Plan Management Workflow (current)
  ⚠ Task Completion Protocol (outdated — v1 → v2)
  ✗ New Section Name (missing)

**Proposed changes to CLAUDE.md:**

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
```

Only the plugin-managed sections listed above will change.
Everything else in your CLAUDE.md stays exactly as it is.
~~~

Then use AskUserQuestion:

> **Question:** Apply these updates to CLAUDE.md?
>
> **Options:**
> - **Apply** — update the outdated and missing sections
> - **Skip** — don't modify CLAUDE.md right now
> - **Show full sections** — display the complete new section content (not a diff) for manual copy

### 9. Handle the user's choice

#### If "Apply":

For each outdated section (from top to bottom in the file to keep line references stable):
- Use `Edit` to replace the old section body (from the `##` heading through to just before the next `##` heading or `<!-- End of plugin-managed section -->`) with the new section body from the template.

For each missing section:
- Use `Edit` to insert the section from the template immediately before the `<!-- End of plugin-managed section -->` marker.
- If that marker doesn't exist, fall back to appending the section at the end of the file.

After all edits, emit:

```
✅ CLAUDE.md updated

Sections updated:
  ⚠→✓ Task Completion Protocol (v1 → v2)
Sections added:
  ✗→✓ New Section Name (v1)
Sections preserved unchanged:
  ✓ Plan Management Workflow
  ✓ Available Commands
  [... all other content outside plugin-managed sections ...]

Your project-specific customizations have been preserved.
```

Do not suggest or run any git commands — the user handles their own commits.

#### If "Skip":

```
ℹ️  CLAUDE.md not modified.
Run /dr-init again when you're ready to review and apply updates.
```

#### If "Show full sections":

For each outdated/missing section, display the full current section content from the template in a code fence so the user can copy/paste manually. Then:

```
Copy the sections above into your CLAUDE.md to update manually.
Run /dr-init again afterward to verify the updates took effect.
```

Do not write any changes to CLAUDE.md in this branch.
