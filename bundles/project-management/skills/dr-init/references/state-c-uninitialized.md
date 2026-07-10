# State C — CLAUDE.md Exists, No Plugin Structure

Use this flow when the project has an existing `CLAUDE.md` (with content) but no plugin marker and no `_claude/` directory. The plugin sections need to be appended to the existing file without disturbing what's already there.

There's no conflict to resolve: the plugin-managed sections describe plugin-specific conventions (plan workflow, available commands, task completion protocol) that don't overlap with what the user or Claude's `/init` would typically write.

## Steps

### 1. Pre-flight git safety

If the current directory is a git repository (detected by `Glob .git/**` returning results), run:

```
Bash: git status --porcelain CLAUDE.md
```

If output is non-empty, CLAUDE.md has uncommitted changes. Warn the user via AskUserQuestion:

> **Question:** CLAUDE.md has uncommitted changes. If you proceed, I'll append plugin sections to the end of the file, which will combine with your uncommitted changes. How would you like to proceed?
>
> **Options:**
> - **Proceed anyway** — append the plugin sections now
> - **Cancel** — don't modify CLAUDE.md, I'll commit or stash my changes first

If "Cancel", emit:

```
ℹ️  Cancelled — no changes made.
Run /dr-init again after committing or stashing your CLAUDE.md changes.
```

Then stop.

If not a git repo, skip this check silently.

### 2. Build the preview

**Get the current date.** Use today's date from the conversation context, formatted as `YYYY-MM-DD`.

**Read the template.** Read `${CLAUDE_SKILL_DIR}/templates/CLAUDE-template.md`.

**Extract the content to be appended.** From the template, skip the header HTML comment block, the `# CLAUDE.md` heading, and the intro paragraph. Keep everything from `## Project Structure` onward (including the `<!-- End of plugin-managed section -->` marker at the bottom).

**Prepend the version marker.** At the top of the append content, add the plugin version marker so State B can detect this file on future runs:

```markdown
<!--
  Plugin: project-management v1.0.0
  Plugin sections added: {{CURRENT_DATE}}

  These sections are managed by /dr-init. Running /dr-init again
  will check version markers and offer updates if needed.
-->
```

**Substitute `{{CURRENT_DATE}}`** with today's date in the prepended marker.

**Assemble the final append block** (what will actually land in the file):

```
[existing CLAUDE.md content ends here]

---

<!-- Plugin-managed sections added by /dr-init -->

<version marker from above>

<plugin sections — from ## Project Structure through <!-- End of plugin-managed section --> -->
```

### 3. Show the preview and ask

Display the preview so the user can see exactly what will be appended:

~~~markdown
## /dr-init — Plugin Setup Preview

📋 Detected: existing CLAUDE.md without plugin structure

Your existing CLAUDE.md content will be preserved exactly as-is.
The following content will be **appended to the end** of your CLAUDE.md,
and the `_claude/` directory structure will be created.

**Here's exactly what will be added to CLAUDE.md:**

```diff
+
+ ---
+
+ <!-- Plugin-managed sections added by /dr-init -->
+
+ <full version marker comment, with date substituted>
+
+ ## Project Structure
+ <full section content>
+
+ ## Plan Management Workflow
+ <!-- section: plan-management-workflow v2 -->
+ <full section content>
+
+ ## Available Commands
+ <!-- section: available-commands v1 -->
+ <full section content>
+
+ ## Task Completion Protocol
+ <!-- section: task-completion-protocol v1 -->
+ <full section content>
+
+ ---
+
+ <!-- End of plugin-managed section -->
+ <!-- Content above this line is managed by /dr-init. Content below is yours. -->
```

**Directories to be created:**
  _claude/docs/
  _claude/plans/draft/
  _claude/plans/in_progress/
  _claude/plans/completed/
  _claude/prd/
  _claude/resources/
  _claude/research/
~~~

In the actual render, replace the `<...>` placeholders with the real content assembled in step 2 — the user should see every line that will be inserted.

Then use AskUserQuestion:

> **Question:** Apply these changes?
>
> **Options:**
> - **Proceed** — append plugin sections to CLAUDE.md and create the `_claude/` directories
> - **Cancel** — don't make any changes

### 4. Handle the user's choice

#### If "Proceed":

**Use `Edit`** to append to the existing CLAUDE.md. The `old_string` should match the last line(s) of the user's existing content (a suitable unique anchor near the end of the file). The `new_string` should be the anchor followed by the assembled append block from step 2.

**Alternative simpler approach:** if finding a unique anchor is awkward, read the full current content, concatenate the append block, and use `Write` to rewrite the whole file. Either approach works — pick whichever is cleaner for the actual file.

**Create the 7 `.gitkeep` files** in parallel (same as State A):

- `_claude/docs/.gitkeep`
- `_claude/plans/draft/.gitkeep`
- `_claude/plans/in_progress/.gitkeep`
- `_claude/plans/completed/.gitkeep`
- `_claude/prd/.gitkeep`
- `_claude/resources/.gitkeep`
- `_claude/research/.gitkeep`

Parent directories are created automatically.

**Emit the success message:**

```
✅ Plugin structure added

Created:
  _claude/docs/
  _claude/plans/draft/
  _claude/plans/in_progress/
  _claude/plans/completed/
  _claude/prd/
  _claude/resources/
  _claude/research/

Updated CLAUDE.md:
  - Preserved all existing content
  - Appended plugin-managed sections at the end
  - Added version marker for future /dr-init runs

Next steps:
  1. Review CLAUDE.md — your content is at the top, plugin sections follow
  2. Reorganize if you'd like (content above/below is entirely up to you)
  3. Start a workflow: /dr-research, /dr-prd, or /dr-plan

Note: /dr-init will only update plugin-managed sections on future runs,
and only with your approval after showing a diff.
```

Do not suggest or run any git commands — the user handles their own commits.

#### If "Cancel":

```
ℹ️  Cancelled — no changes made.

Your CLAUDE.md and project structure remain unchanged.
Run /dr-init again when you're ready to set up the plugin structure.
```
