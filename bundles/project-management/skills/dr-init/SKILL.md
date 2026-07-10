---
name: dr-init
description: Initializes or updates a project with the project-management plugin structure. Creates _claude/ directories and a versioned CLAUDE.md on fresh projects, verifies and updates outdated plugin-managed sections on existing projects, or appends plugin sections to an existing CLAUDE.md. Use when setting up the plugin in a new project or when plugin template sections have been updated.
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Bash(git status:*)
effort: medium
argument-hint: (no arguments — run in the project root)
---

# Initialize Project-Management Plugin Structure

This skill scaffolds or updates the project-management plugin layout in the current working directory. It operates on **plugin-managed content only** — project-specific documentation (architecture, build commands, etc.) is out of scope. Suggest Claude Code's built-in `/init` to the user for that.

## Phase 1: Detect Project State

Before doing anything else, classify the project into one of three states.

### Read the evidence

Run these checks (parallel where possible):

1. **`Read CLAUDE.md`** — Handle three outcomes:
   - File-not-found error → no CLAUDE.md
   - File has content → inspect for plugin marker
   - File exists but is empty or whitespace-only → treat as no CLAUDE.md
2. **`Glob _claude/**`** — Handle two outcomes:
   - Empty result → no `_claude/` directory (or it exists but is empty)
   - Non-empty result → `_claude/` directory exists with content
3. **Plugin marker check** — If CLAUDE.md has content, check whether it contains the substring `<!-- Plugin: project-management` near the top of the file

### Classify

| State | CLAUDE.md | `_claude/` | Plugin marker in CLAUDE.md |
|-------|-----------|-----------|---------------------------|
| **A — Fresh** | Missing or empty | Missing | — |
| **B — Already Initialized** | Has content | Present (any content) | Present |
| **C — Uninitialized** | Has content | Missing | Absent |

**Edge cases:**
- CLAUDE.md present with marker, but `_claude/` missing → State B (missing dirs will be backfilled)
- CLAUDE.md missing, `_claude/` present → State A (user likely deleted CLAUDE.md, recreate it)
- Both missing → State A (fresh)

### Route

Load the reference file that corresponds to the detected state:

- **State A** → Read `${CLAUDE_SKILL_DIR}/references/state-a-fresh.md`
- **State B** → Read `${CLAUDE_SKILL_DIR}/references/state-b-update.md`
- **State C** → Read `${CLAUDE_SKILL_DIR}/references/state-c-uninitialized.md`

For background on how plugin-managed section versioning works (relevant mainly to State B), also read `${CLAUDE_SKILL_DIR}/references/section-versioning.md`.

## Phase 2: Execute the State Handler

Follow the loaded reference file's instructions end-to-end. Each reference file covers:

- Pre-flight git safety check (warn if CLAUDE.md has uncommitted changes before any write)
- Any user confirmation needed
- The actual filesystem operations
- The success message to emit

## Phase 3: Summarize

After execution, report a concise completion summary covering:

- Which state was detected (A / B / C)
- What was created, updated, or skipped
- Any follow-up suggestions (e.g., run `/init` for State A, or review the diff for State B)

Keep the summary tight — the reference file's success message is the canonical user-facing output for the detailed breakdown.

## Cross-Platform Notes

This skill uses Claude Code's native tools (`Read`, `Write`, `Edit`, `Glob`) for all filesystem operations, which behave identically on Windows, macOS, and Linux. The only Bash permission is `git status` for the safety check, which is consistent across platforms.

Do not invoke `mkdir`, `touch`, `ls`, `wc`, `test`, or any other shell utility — all have native-tool equivalents documented in the reference files. Always emit paths with forward slashes (works on all three OSes).
