---
name: dr-init
description: Initializes or updates a project with the project-management plugin structure. Creates _project/ directories, a versioned AGENTS.md, and a CLAUDE.md pointer on fresh projects; verifies and updates outdated plugin-managed sections on existing projects; appends plugin sections to an existing AGENTS.md; and offers legacy migration (pre-3.0.0 full CLAUDE.md → AGENTS.md + pointer, _claude/ → _project/ rename). Use when setting up the plugin in a new project or when plugin template sections have been updated.
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Bash(git status:*) Bash(git mv:*)
effort: medium
argument-hint: (no arguments — run in the project root)
---

# Initialize Project-Management Plugin Structure

This skill scaffolds or updates the project-management plugin layout in the current working directory. It operates on **plugin-managed content only** — project-specific documentation (architecture, build commands, etc.) is out of scope. Suggest the harness's project-bootstrap command to the user for that (Claude Code: built-in `/init`).

The artifact model (since 3.0.0): **AGENTS.md is the canonical generated file** — it carries the plugin marker and the versioned sections, and works on any harness that reads AGENTS.md. **CLAUDE.md is a thin generated pointer** to AGENTS.md so Claude Code follows it. Output directories live under **`_project/`**.

## Phase 1: Detect Project State

Before doing anything else, classify the project into one of three states.

### Read the evidence

Run these checks (parallel where possible):

1. **`Read AGENTS.md`** — missing, empty, or has content; if content, check for the plugin marker.
2. **`Read CLAUDE.md`** — same three outcomes; if content, check for the plugin marker (a marker here with no marker-bearing AGENTS.md indicates a pre-3.0.0 project).
3. **`Glob _project/**`** — present with content, or missing/empty.
4. **`Glob _claude/**`** — legacy directory check (pre-3.0.0 layout).
5. **Plugin marker check** — the marker is the line `Plugin: project-management` inside an HTML comment near the top of a file. (The `<!--` opener sits on its own line, so match on `Plugin: project-management` — not on a single-line `<!-- Plugin: …` form. Markers generated before 3.0.0 carry a version suffix like ` v1.0.0` after the name; the substring still matches.)

### Classify

| State | Evidence |
|-------|----------|
| **A — Fresh** | AGENTS.md and CLAUDE.md both missing or empty |
| **B — Already Initialized** | Plugin marker in AGENTS.md; **or** (legacy) plugin marker in CLAUDE.md with no marker-bearing AGENTS.md |
| **C — Uninitialized** | AGENTS.md and/or CLAUDE.md have content, but no plugin marker in either |

**Edge cases:**
- Marker in AGENTS.md but `_project/` missing → State B (missing dirs will be backfilled)
- Both files missing, but `_project/` (or legacy `_claude/`) present → State A (files were deleted; recreate them)
- Marker in CLAUDE.md AND a marker-less AGENTS.md exists → State B, legacy variant (the conversion appends the plugin sections into the existing AGENTS.md rather than overwriting it)
- CLAUDE.md is already the generated pointer but AGENTS.md is missing → State B (recreate AGENTS.md from the template; the section comparison then runs against it)

### Legacy directory check (all states)

If `_claude/` exists and `_project/` does not, the project predates the 3.0.0 directory rename. Before executing the state handler, offer the migration (via the structured question tool, per Phase 2's convention): run `git mv _claude _project` (fall back to a plain filesystem move when the directory is untracked or gitignored), or keep the old layout for now — the other dr-* skills tolerate `_claude/` and will keep suggesting the rename. Never rename without approval.

### Route

Load the reference file that corresponds to the detected state (paths are relative to this skill's directory, which the harness announces when the skill loads):

- **State A** → Read `references/state-a-fresh.md`
- **State B** → Read `references/state-b-update.md`
- **State C** → Read `references/state-c-uninitialized.md`

For background on how plugin-managed section versioning works (relevant mainly to State B), also read `references/section-versioning.md`.

## Phase 2: Execute the State Handler

Follow the loaded reference file's instructions end-to-end. Where a reference file says `AskUserQuestion`, use the harness's structured question tool if one is available (`AskUserQuestion` in Claude Code); otherwise ask the same question in plain text, list the options, and wait for the user's reply. Each reference file covers:

- Pre-flight git safety check (warn if AGENTS.md or CLAUDE.md has uncommitted changes before any write; State A skips this — nothing exists to overwrite)
- Any user confirmation needed
- The actual filesystem operations
- The success message to emit

## Phase 3: Summarize

After execution, report a concise completion summary covering:

- Which state was detected (A / B / C, and legacy variant if applicable)
- What was created, updated, converted, or skipped
- Any follow-up suggestions (e.g., run `/init` for State A, or review the diff for State B)

Keep the summary tight — the reference file's success message is the canonical user-facing output for the detailed breakdown.

## Cross-Platform Notes

This skill uses the harness's native file tools (`Read`, `Write`, `Edit`, `Glob` in Claude Code) for all filesystem operations, which behave identically on Windows, macOS, and Linux. The only shell commands used are `git status` for the safety check and `git mv` for the approved legacy-directory rename, both consistent across platforms.

Do not invoke `mkdir`, `touch`, `ls`, `wc`, `test`, or any other shell utility — all have native-tool equivalents documented in the reference files. Always emit paths with forward slashes (works on all three OSes).
