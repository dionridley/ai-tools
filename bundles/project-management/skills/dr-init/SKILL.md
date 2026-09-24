---
name: dr-init
description: Initializes or updates a project with the project-management plugin structure. Creates _project/ directories and a versioned AGENTS.md on fresh projects; verifies and updates outdated plugin-managed sections on existing projects; appends plugin sections to an existing AGENTS.md. If a CLAUDE.md exists, first moves its content into AGENTS.md and deletes it (declining stops the run). Offers the legacy _claude/ → _project/ rename. Use when setting up the plugin in a new project or when plugin template sections have been updated.
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Bash(git status:*) Bash(git mv:*) Bash(rm CLAUDE.md)
effort: medium
argument-hint: (no arguments — run in the project root)
---

# Initialize Project-Management Plugin Structure

This skill scaffolds or updates the project-management plugin layout in the current working directory. It operates on **plugin-managed content only** — project-specific documentation (architecture, build commands, etc.) is out of scope. For that, suggest the user ask their coding agent to add it to AGENTS.md.

The artifact model: **AGENTS.md is the only generated guidance file.** It carries the plugin marker and the versioned sections, and every supported harness reads it (Claude Code natively since v2.1.277). Output directories live under **`_project/`**.

## Phase 1: Detect Project State

Before doing anything else, gather the evidence, move any CLAUDE.md into AGENTS.md, then classify the project into one of three states.

### Read the evidence

Run these checks (parallel where possible):

1. **`Read AGENTS.md`** — missing, empty, or has content; if content, check for the plugin marker.
2. **`Glob`** for `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md` at the project root — note which exist. If `CLAUDE.md` exists, Read it for the next step.
3. **`Glob _project/**`** — present with content, or missing/empty.
4. **`Glob _claude/**`** — legacy directory check (pre-3.0.0 layout).
5. **Plugin marker check** (AGENTS.md only) — the marker is the line `Plugin: project-management` inside an HTML comment near the top of the file. (The `<!--` opener sits on its own line, so match on `Plugin: project-management` — not on a single-line `<!-- Plugin: …` form.)

### Move CLAUDE.md first

If a root `CLAUDE.md` exists, read and follow `references/claude-md-migration.md` now — before classifying, before the legacy directory offer, and before any other write. It previews the move and asks the user once:

- **No** → it emits its stop message. End the run there; nothing else in this skill runs.
- **Yes** → it moves the content and deletes CLAUDE.md. Re-read AGENTS.md, then continue below with the new content. If the move created AGENTS.md, that file now has content and no plugin marker: it is **State C**, never State A — State A writes AGENTS.md from scratch and would overwrite what was just moved.

`.claude/CLAUDE.md` and `CLAUDE.local.md` are never moved or read for moving. They only produce warnings in the Phase 3 summary.

### Classify

| State | Evidence |
|-------|----------|
| **A — Fresh** | AGENTS.md missing or empty |
| **B — Already Initialized** | Plugin marker in AGENTS.md |
| **C — Uninitialized** | AGENTS.md has content, but no plugin marker |

**Edge cases:**
- Marker in AGENTS.md but `_project/` missing → State B (missing dirs will be backfilled)
- AGENTS.md missing, but `_project/` (or legacy `_claude/`) present → State A (the file was deleted; recreate it)
- AGENTS.md created by the CLAUDE.md move in this run → State C, whether or not `_project/` exists (it has content; State C appends the plugin sections below it)

### Legacy directory check (all states)

If `_claude/` exists and `_project/` does not, the project predates the 3.0.0 directory rename. Before executing the state handler, offer the rename (via the structured question tool, per Phase 2's convention): run `git mv _claude _project` (fall back to a plain filesystem move when the directory is untracked or gitignored), or keep the old layout for now — the other dr-* skills tolerate `_claude/` and will keep suggesting the rename. Never rename without approval.

### Route

Load the reference file that corresponds to the detected state (paths are relative to this skill's directory, which the harness announces when the skill loads):

- **State A** → Read `references/state-a-fresh.md`
- **State B** → Read `references/state-b-update.md`
- **State C** → Read `references/state-c-uninitialized.md`

For background on how plugin-managed section versioning works (relevant mainly to State B), also read `references/section-versioning.md`.

## Phase 2: Execute the State Handler

Follow the loaded reference file's instructions end-to-end. Where a reference file says `AskUserQuestion`, use the harness's structured question tool if one is available (`AskUserQuestion` in Claude Code); otherwise ask the same question in plain text, list the options, and wait for the user's reply. Each reference file covers:

- Pre-flight git safety check (warn if AGENTS.md has uncommitted changes before any write; State A skips this — nothing exists to overwrite). If the CLAUDE.md move wrote AGENTS.md earlier in this run, skip that prompt: the move's preview already showed those changes and the user approved them.
- Any user confirmation needed
- The actual filesystem operations
- The success message to emit

A Cancel or Skip in the state handler doesn't undo a CLAUDE.md move that already ran — the summary's move line records it.

## Phase 3: Summarize

After execution, report a concise completion summary covering:

- Which state was detected (A / B / C)
- The CLAUDE.md move's outcome line, if the move ran
- What was created, updated, or skipped
- Any follow-up suggestions (e.g., add project documentation to AGENTS.md for State A, or review the diff for State B)

Then add a warning line for each of these files that exists:

- `.claude/CLAUDE.md` → `⚠ .claude/CLAUDE.md exists — Claude Code reads it instead of AGENTS.md. Move what you need into AGENTS.md and delete it.`
- `CLAUDE.local.md` → `⚠ CLAUDE.local.md exists — while it does, Claude Code reads it instead of AGENTS.md. /dr-init leaves it alone (it's personal and usually gitignored); fold what you need into AGENTS.md and delete it.`

Keep the summary tight — the reference file's success message is the canonical user-facing output for the detailed breakdown.

## Cross-Platform Notes

This skill uses the harness's native file tools (`Read`, `Write`, `Edit`, `Glob` in Claude Code) for all filesystem operations, which behave identically on Windows, macOS, and Linux. The only shell commands used are `git status` for the safety check, `git mv` for the approved legacy-directory rename, and `rm CLAUDE.md` — the one deletion, since no native tool deletes files, run only after the user answers Yes to the move. All three behave the same on every platform. Run each one exactly as written, from the project root, with nothing before or after it — no `cd … &&` prefix and no chained commands. `allowed-tools` grants those exact forms, and any variant makes the harness ask the user for permission.

Do not invoke `mkdir`, `touch`, `ls`, `wc`, `test`, or any other shell utility — all have native-tool equivalents documented in the reference files. Always emit paths with forward slashes (works on all three OSes).
