---
name: dr-ship
description: Close out a completed /dr-plan and ship it — verify all plan checkboxes, backfill the retro, move the plan to completed/, then commit, push, and open a GitHub PR populated from the plan summary. Invoked explicitly as /dr-ship.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent, Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git mv:*), Bash(git switch:*), Bash(git branch:*), Bash(git remote:*), Bash(git rev-parse:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(gh auth status:*), Bash(rm:*)
effort: medium
argument-hint: [@plan-file] [--verify]
---

# Ship a Completed Plan

This skill runs the end-of-plan ritual as one pipeline:

**locate plan → read-only preflight (readiness audit + git state) → Ship Report + one gate → close out → generate summary → commit + push + PR → display the squash-merge commit message.**

It ships **done plans only**. There is no WIP mode — partial or end-of-day pushes stay plain git.

## Arguments

Inspect `$ARGUMENTS`:

- **`@plan-file`** — explicit plan reference (Claude Code auto-expands the content and removes the token). Overrides auto-discovery.
- **`--verify`** — in addition to the checkbox audit, spawn the `project-management:plan-verifier` agent on the final phase for independent, evidence-based verification.

## Phase 0: Locate the Plan

1. If a plan was passed via `@plan-file`, use it (the expanded content is already in the conversation; note its path for the move step).
2. Otherwise `Glob _claude/plans/in_progress/*.md`:
   - **Exactly one** → that's the plan. Read it.
   - **Multiple** → `AskUserQuestion`: which plan is being shipped?
   - **Zero** → off the happy path. Ask how to proceed (options: user points at a plan file; abort). This skill does not run without a plan.
3. **Format sanity check** — the file must look like a /dr-plan artifact: `## Metadata`, `## Implementation Plan` (or phase headings with Tasks/Verification checkboxes), `## Success Criteria`. If it doesn't match, tell the user what's missing and ask whether to proceed best-effort (audit whatever checkboxes exist; skip retro/move if there's no Retro section or the file isn't under `_claude/plans/in_progress/`) or abort.

## Route

Work through the phases in order. Load each reference file when its phase begins and follow it end-to-end:

- **Phase 1 — Preflight, Ship Report, gate** → Read `${CLAUDE_SKILL_DIR}/references/preflight.md`. Read-only: readiness audit (+ `--verify`), git state, the deterministic Ship Report display, and the single confirmation question.
- **Phases 2–5 — Close out, generate, ship, output** → Read `${CLAUDE_SKILL_DIR}/references/ship.md`. Runs only after the gate approves.

Phase 3 (generation) has no reference of its own: `ship.md` directs you to Read `${CLAUDE_SKILL_DIR}/../dr-plan/references/summary-mode.md` and follow **only** its "Phase 4: Generate the PR Summary and Commit Message" section. That file is the single source of truth for the summary and commit-message formats — do not restate or improvise the format rules.

## Operating Principles

1. **Use the current date from conversation context.** Never hardcode or guess dates. Format as `YYYY-MM-DD`.
2. **Cross-platform, always.** All git/gh commands run via the Bash tool (Git Bash on Windows — POSIX everywhere). Multiline text reaches git/gh **only via files**: `git commit -F <file>`, `gh pr create --body-file <file>`. Never inline multiline `-m` strings, never heredocs. Emit forward slashes in all paths.
3. **Native tools for non-git filesystem work.** `Glob` for discovery, `Read`/`Write`/`Edit` for file content. Bash is reserved for git and gh (plus `rm` for this skill's own temp files and the untracked-plan move fallback).
4. **Temp file discipline.** Commit message and PR body go in `.dr-ship-commit-msg.tmp` / `.dr-ship-pr-body.tmp` at the repo root, written with `Write`, deleted with `rm` immediately after use. **Stage changes before writing temp files** so they are never swept into the commit.
5. **One gate for shipping.** The Ship Report gate (preflight 1f) is the single approval covering close-out edits, waivers, staging, commit, push, and PR action — including replacing an existing PR's description. The only other mandatory stop is the main/master guard. Don't add prompts beyond these.
6. **The Ship Report is the only state display.** Print it as normal output in its exact template shape — never put state detail (file lists, branch info, PR actions) inside AskUserQuestion text; question text stays one line. Users should see the identical report shape on every run.
7. **Abort leaves no trace.** Preflight is read-only; nothing — waiver tags, retro, status, move — is written before the gate approves. (Branch creation from the main/master guard is the one exception.)
8. **Best-effort, not all-or-nothing.** A missing PR path (non-GitHub remote, no `gh`, closed PR) degrades to displaying the artifacts, never to failing the whole ritual.
9. **Respect investment level.** Small user base — keep flows lean; no speculative safeguards.

## Completion Summary

After Phase 5's canonical output, no additional summary is needed — the Phase 5 display **is** the closer. It must always include: plan close-out status (moved / retro), branch + push result, PR result (URL, or displayed body), and the squash-merge commit message in its own `~~~` fence.
