# State C — Existing Guidance Files, No Plugin Structure

Use this flow when the project has an AGENTS.md and/or CLAUDE.md with content but no plugin marker in either. The plugin sections need to land in AGENTS.md (canonical) without disturbing what's already there, and CLAUDE.md needs to point at AGENTS.md for Claude Code.

There's no conflict to resolve: the plugin-managed sections describe plugin-specific conventions (plan workflow, available commands, task completion protocol) that don't overlap with what the user or a project-bootstrap command (like Claude Code's `/init`) would typically write.

Two cases, by which files exist:

- **Case 1 — user has their own AGENTS.md** (with or without a CLAUDE.md): append the plugin sections to their AGENTS.md. If a CLAUDE.md exists and doesn't already tell the agent to read AGENTS.md, also offer to append the short pointer note to it (same approval gate).
- **Case 2 — user has only a CLAUDE.md**: create AGENTS.md fresh from the template, and append the short pointer note to their CLAUDE.md.

## Steps

### 1. Pre-flight git safety

If the current directory is a git repository (detected by `Glob .git/**` returning results), run:

```
Bash: git status --porcelain AGENTS.md CLAUDE.md
```

If output is non-empty, the file(s) have uncommitted changes. Warn the user via AskUserQuestion:

> **Question:** [AGENTS.md / CLAUDE.md] has uncommitted changes. If you proceed, I'll append plugin content, which will combine with your uncommitted changes. How would you like to proceed?
>
> **Options:**
> - **Proceed anyway** — append the plugin content now
> - **Cancel** — don't modify anything, I'll commit or stash my changes first

If "Cancel", emit:

```
ℹ️  Cancelled — no changes made.
Run /dr-init again after committing or stashing your changes.
```

Then stop.

If not a git repo, skip this check silently.

### 2. Build the preview

**Get the current date.** Use today's date from the conversation context, formatted as `YYYY-MM-DD`.

**Read the templates.** Read `templates/AGENTS-template.md` and `templates/CLAUDE-pointer.md`.

**Assemble the AGENTS.md content:**

- **Case 1 (append to existing AGENTS.md):** extract the plugin sections from the template — skip the header HTML comment block, the `# AGENTS.md` heading, and the intro paragraph; keep everything from `## Project Structure` onward (including the `<!-- End of plugin-managed section -->` marker at the bottom). Prepend the version marker so State B can detect this file on future runs:

  ```markdown
  <!--
    Plugin: project-management
    Plugin sections added: {{CURRENT_DATE}}

    These sections are managed by /dr-init. Running /dr-init again
    will check version markers and offer updates if needed.
  -->
  ```

  Substitute `{{CURRENT_DATE}}`, then assemble the append block:

  ```
  [existing AGENTS.md content ends here]

  ---

  <!-- Plugin-managed sections added by /dr-init -->

  <version marker from above>

  <plugin sections — from ## Project Structure through <!-- End of plugin-managed section --> -->
  ```

- **Case 2 (no AGENTS.md):** the full processed template (`{{CURRENT_DATE}}` substituted), written as a new file.

**Assemble the CLAUDE.md pointer note** (both cases, when a CLAUDE.md exists and doesn't already tell the agent to read AGENTS.md):

```markdown

---

<!-- Plugin: project-management — pointer added by /dr-init -->

Read AGENTS.md and follow all of its guidance. It is the canonical
instruction file for every coding agent working in this repository,
including Claude Code.
```

(When no CLAUDE.md exists at all in Case 1, create it from `templates/CLAUDE-pointer.md` verbatim instead.)

### 3. Show the preview and ask

Display the preview so the user can see exactly what will change — every line, with the real assembled content in place of the `<...>` placeholders:

~~~markdown
## /dr-init — Plugin Setup Preview

📋 Detected: existing agent-guidance file(s) without plugin structure

Your existing content will be preserved exactly as-is.

**AGENTS.md** — [appended to / created]:

```diff
+ <the full AGENTS.md addition assembled in step 2>
```

**CLAUDE.md** — [pointer note appended / created / already points at AGENTS.md — unchanged]:

```diff
+ <the pointer note assembled in step 2, if applicable>
```

**Directories to be created:**
  _project/docs/
  _project/plans/draft/
  _project/plans/in_progress/
  _project/plans/completed/
  _project/prd/
  _project/resources/
  _project/research/
~~~

Then use AskUserQuestion:

> **Question:** Apply these changes?
>
> **Options:**
> - **Proceed** — apply the AGENTS.md and CLAUDE.md changes shown and create the `_project/` directories
> - **Cancel** — don't make any changes

### 4. Handle the user's choice

#### If "Proceed":

**AGENTS.md** — Case 1: use `Edit` to append (anchor on the last line(s) of the user's existing content), or read-concatenate-`Write` if a clean anchor is awkward. Case 2: `Write` the new file.

**CLAUDE.md** — append the pointer note with `Edit` (or create the file from the pointer template when it doesn't exist). Skip entirely if it already points at AGENTS.md.

**Create the 7 `.gitkeep` files** in parallel:

- `_project/docs/.gitkeep`
- `_project/plans/draft/.gitkeep`
- `_project/plans/in_progress/.gitkeep`
- `_project/plans/completed/.gitkeep`
- `_project/prd/.gitkeep`
- `_project/resources/.gitkeep`
- `_project/research/.gitkeep`

Parent directories are created automatically.

**Emit the success message:**

```
✅ Plugin structure added

Created:
  _project/docs/
  _project/plans/draft/
  _project/plans/in_progress/
  _project/plans/completed/
  _project/prd/
  _project/resources/
  _project/research/

AGENTS.md:
  - [Appended plugin-managed sections / Created from template]
  - Added version marker for future /dr-init runs
CLAUDE.md:
  - [Pointer note appended — your content preserved / Created as pointer / Already pointed at AGENTS.md — unchanged]

Next steps:
  1. Review AGENTS.md — your content is preserved; plugin sections follow
  2. Reorganize if you'd like (content outside the managed block is entirely yours)
  3. Start a workflow: /dr-research, /dr-prd, or /dr-plan

Note: /dr-init will only update plugin-managed sections on future runs,
and only with your approval after showing a diff.
```

Do not suggest or run any git commands — the user handles their own commits.

#### If "Cancel":

```
ℹ️  Cancelled — no changes made.

Your files and project structure remain unchanged.
Run /dr-init again when you're ready to set up the plugin structure.
```
