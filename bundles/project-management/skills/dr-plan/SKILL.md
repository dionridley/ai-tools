---
name: dr-plan
description: Create or refine a detailed implementation plan file in `_claude/plans/` with per-phase acceptance criteria, verification gates, and safe refinement. Supports four modes: CREATE, REFINE, SUMMARY (PR summary, optional push to PR), and QUESTION RESOLUTION (interactive Q&A). Use when the user writes `/dr-plan` anywhere in their message, or explicitly asks to create, refine, or summarize a plan file under `_claude/plans/`. Do NOT use for general planning discussion, brainstorming, outlines, or task lists not destined for a file in `_claude/plans/`.
disable-model-invocation: false
allowed-tools: Read Write Edit Glob Grep AskUserQuestion Bash(gh pr view:*) Bash(gh pr edit:*)
effort: max
argument-hint: [implementation context OR @plan-file [refinement|summary [pr-url]|answer questions]] [--no-confirm|--in-progress]
---

# Create or Refine an Implementation Plan

This skill has four modes. Detect the mode from `$ARGUMENTS` first, then route to the correct reference file.

## Trigger Validation

Before mode detection, confirm this invocation is genuine and not conversational drift from an earlier `/dr-plan` use.

- **If the user's current message contains the literal token `/dr-plan`** → proceed.
- **If the user explicitly asked to create, refine, or summarize a plan file under `_claude/plans/` in this message** → proceed.
- **Otherwise** → stop. Ask: *"Did you want to run /dr-plan, or should we keep discussing this inline?"* Only continue if they confirm.

## Mode Detection

Inspect `$ARGUMENTS`:

1. **Starts with `@` AND contains `summary`** (with or without a trailing GitHub PR URL) → **SUMMARY mode**.
2. **Starts with `@` AND contains `answer questions` or `resolve questions`** → **QUESTION RESOLUTION mode**.
3. **Starts with `@`** (any other text, or empty) → **REFINE mode**.
4. **Does not start with `@`** (describing new work, or empty) → **CREATE mode**.

If `$ARGUMENTS` is empty in CREATE mode, the clarifying phase will prompt the user for implementation context before proceeding.

When a user passes `@file.md`, Claude Code auto-expands the file content into the conversation and removes the `@path` token from `$ARGUMENTS`. The text that follows (`summary`, `answer questions`, a refinement request, etc.) remains. Mode detection should look at both the content of `$ARGUMENTS` and whether plan content has been expanded into the conversation.

## Route

Load exactly one of these reference files based on the detected mode and follow its instructions end-to-end:

- **CREATE** → Read `${CLAUDE_SKILL_DIR}/references/create-mode.md`.
- **REFINE** → Read `${CLAUDE_SKILL_DIR}/references/refine-mode.md`.
- **SUMMARY** → Read `${CLAUDE_SKILL_DIR}/references/summary-mode.md`.
- **QUESTION RESOLUTION** → Read `${CLAUDE_SKILL_DIR}/references/questions-mode.md`.

Shared references loaded on demand:

- `${CLAUDE_SKILL_DIR}/references/template-variants.md` — Plan-type detection (silent default + announce-and-confirm overlays) and overlay composition rules.
- `${CLAUDE_SKILL_DIR}/templates/plan-base.md` — Standard-feature baseline template used in CREATE mode.
- `${CLAUDE_SKILL_DIR}/templates/plan-ai-feature.md` — Overlay for AI/LLM features (eval rubric, model/prompt selection, AI-specific criteria).
- `${CLAUDE_SKILL_DIR}/templates/plan-migration.md` — Overlay for migrations/infra/refactor (Rollback Plan, Verify-in-Prod phase, Entry Preconditions).
- `${CLAUDE_SKILL_DIR}/templates/plan-bug-fix.md` — Overlay for bug fixes (collapsed phases, no Dependencies).
- `${CLAUDE_SKILL_DIR}/templates/plan-spike.md` — Overlay for spikes (Questions to Answer, relaxed DoD, time-box).

## Operating Principles

These apply in every mode:

1. **Use extended thinking.** Analyze deeply — implementation shape, risks, phase boundaries, verification strategy, cross-cutting concerns.
2. **Use the current date from conversation context.** Never hardcode or guess dates. Format as `YYYY-MM-DD`.
3. **Native tools only.** No Bash for filesystem operations. `Write` creates parent directories automatically; `Glob` handles listing and existence checks; `Read` + `Write` handle backups. Bash is reserved for `gh pr view` and `gh pr edit` in SUMMARY mode.
4. **Cross-platform paths.** Always emit forward slashes. Works on Windows, macOS, and Linux.
5. **Incorporate only user-provided research or context.** Do not proactively Glob `_claude/research/` or any other directory looking for material to inject. Accept explicit references (`@path/to/research.md`, `@_claude/prd/[file].md`) and incorporate those.
6. **Respect investment level.** This plugin has a small user base. Keep flows lean — don't add elaborate migration tooling, defensive UX, or speculative safeguards.
7. **Autonomous execution by default.** Plans are designed to execute to completion without user intervention unless something genuinely goes wrong. Phase Exit Gates are the executing agent's self-discipline encoded in the artifact — not user checkpoints. Retry failing gates up to 2 times (3 total attempts) before escalating.

## Completion Summary

After the selected mode finishes, emit a brief summary covering:

- Mode that ran (CREATE / REFINE / SUMMARY / QUESTION RESOLUTION).
- File path created or updated (if applicable).
- Plan type detected (for CREATE) or version delta / resolution count (for other modes).
- Suggested next step (refine, answer questions, move to in_progress, generate summary, etc.).

The mode-specific reference file owns the detailed user-facing success message — this top-level summary is a compact closer.
