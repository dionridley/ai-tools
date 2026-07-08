---
name: dr-prd
description: Creates or refines a Product Requirement Document (PRD) under _claude/prd/ with a structured discovery phase, adaptive sections based on feature type, and safe refinement with backup, diff preview, and linked-plan detection. Use when the user writes `/dr-prd` anywhere in their message. Do NOT use for general discussion about drafting or updating a PRD without the explicit `/dr-prd` token. Supports traditional features and AI/LLM features (adds eval rubrics, model constraints, prompt specs, performance budgets, guardrails).
disable-model-invocation: false
allowed-tools: Read Write Edit Glob Grep AskUserQuestion
effort: max
argument-hint: [feature description OR @prd-file [refinement request]] [--no-confirm]
---

# Create or Refine a Product Requirement Document

This skill has two modes. Detect the mode from `$ARGUMENTS` first, then route to the correct reference file.

## Trigger Validation

Before mode detection, confirm this invocation is genuine and not conversational drift from an earlier `/dr-prd` use.

- **If the user's current message contains the literal token `/dr-prd`** (anywhere in the message, not only at the start) → proceed.
- **Otherwise** → stop. Ask: *"Did you want to run /dr-prd, or should we keep discussing this inline?"* Only continue if they confirm.

## Mode Detection

Inspect the first non-whitespace token of `$ARGUMENTS`:

- **Starts with `@`** → **REFINE mode**. The user is pointing at an existing PRD file.
- **Anything else, or empty** → **CREATE mode**. The user is describing (or will describe) a new feature.

If `$ARGUMENTS` is empty in CREATE mode, the clarifying phase will prompt the user for a feature description before proceeding.

## Route

Load exactly one of these reference files based on the detected mode and follow its instructions end-to-end:

- **CREATE** → Read `${CLAUDE_SKILL_DIR}/references/create-mode.md`.
- **REFINE** → Read `${CLAUDE_SKILL_DIR}/references/refine-mode.md`.

Both modes also rely on shared references loaded on demand:

- `${CLAUDE_SKILL_DIR}/references/template-variants.md` — Project-type detection and which sections to include/skip.
- `${CLAUDE_SKILL_DIR}/references/ai-feature-sections.md` — Additional sections to inject for AI/LLM features (eval rubrics, model constraints, prompt specs, performance budgets, guardrails).
- `${CLAUDE_SKILL_DIR}/templates/prd-base.md` — The base template used in CREATE mode.

## Operating Principles

These apply in both modes:

1. **Use extended thinking.** Analyze deeply — problem framing, edge cases, risks, second-order effects.
2. **Use the current date from conversation context.** Never hardcode or guess dates. Format as `YYYY-MM-DD`.
3. **Native tools only.** No Bash for filesystem operations. `Write` creates parent directories automatically; `Glob` handles listing and existence checks; `Read` + `Write` handle backups.
4. **Cross-platform paths.** Always emit forward slashes. Works on Windows, macOS, and Linux.
5. **Incorporate only user-provided research or context.** Do not proactively Glob `_claude/research/` or any other directory looking for material to inject. Accept explicit references (`@path/to/research.md`) and incorporate those.
6. **Respect investment level.** This plugin has a small user base. Keep flows lean — don't add elaborate migration tooling, defensive UX, or speculative safeguards.

## Completion Summary

After the selected mode finishes, emit a brief summary covering:

- Mode that ran (CREATE or REFINE)
- File path created or updated
- Feature type detected (for CREATE) or version delta (for REFINE)
- Suggested next step (refine, move to `/dr-plan`, etc.)

The mode-specific reference file owns the detailed user-facing success message — the top-level summary here is just a compact closer.
