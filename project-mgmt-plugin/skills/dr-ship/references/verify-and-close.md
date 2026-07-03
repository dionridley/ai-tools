# Phase 1 — Verify Done + Close Out

Decide whether the plan is done, resolve anything that isn't, then close the plan out (retro → metadata → move). All plan-file changes happen here, **before** anything is committed, so the completed plan rides in the same commit as the work.

## 1. Checkbox audit (always runs)

Read the plan and collect every incomplete item:

**Counts as blocking (must be `[x]` or waived):**

- Unchecked `- [ ]` items in any phase's **Tasks**, **Verification**, and **Phase Exit Gate** blocks.
- Unchecked **Success Criteria**.
- **Blocking open questions** still tagged `[AWAITING]`.

**Does NOT count as blocking:**

- Any line carrying a `[WAIVED YYYY-MM-DD: reason]` tag (see Waiving below).
- **Assumptions** — their validation state is informational, not a shipping gate.
- **Non-blocking** open questions tagged `[OPEN]`.
- Retro placeholder bullets (handled in Close out, not the audit).

Report the audit result as a short list grouped by section, quoting each unchecked line.

## 2. `--verify` (only when the flag was passed)

Spawn the verifier via the Agent tool with `subagent_type="project-management:plan-verifier"`, passing the plan file path and the final phase number. Wait for its report.

- Treat every **FAIL** and **UNVERIFIED** item in the report as an additional blocking item in the audit, quoting the verifier's verdict and reasoning verbatim.
- Do not soften or reinterpret the verdicts. Under-report beats over-report.

## 3. If anything is blocking

Present the full list, then `AskUserQuestion`:

> The plan has [N] incomplete items. How should we proceed?

- **Finish first** — abort /dr-ship so the remaining work can be completed. Emit a short list of what's left as the parting message.
- **Waive items** — the user declares specific items unnecessary for done (dropped scope, optional tasks). Ask which items and why if not stated. For each, `Edit` the line to insert the tag after the checkbox, keeping the checkbox `[ ]` (honest state — it was not done):

  ```
  - [ ] [WAIVED 2026-07-03: descoped — covered by existing integration test] Original task text
  ```

  A reason is required for every waiver. For verifier-flagged items whose plan line is already `[x]`, waiving means appending the same `[WAIVED ...]` tag with the verifier's verdict quoted in the reason, leaving the checkbox as the executing agent set it — the tag records that shipping proceeded despite the verdict. After tagging, re-run the audit; if items remain unwaived and unchecked, ask again.
- **Abort** — stop entirely, no changes.

The plan proceeds to Close out only when the audit comes back clean (everything `[x]`, `[WAIVED]`, or non-blocking).

## 4. Close out

Run these in order:

### Retro backstop

Check the `## Retro` section. If it's already populated with real content (the executing agent did its Completion duty), leave it alone and note "retro already present."

If placeholders remain (`[Populated at completion]` or similar), write it now:

1. Draft **What worked / What didn't / Learnings** in terse bullets, drawing on: the plan's own accumulated content (Refinement History, task annotations, resolved questions, waiver reasons) and the conversation context if this session executed the plan.
2. Ask ONE optional question via `AskUserQuestion`: *"Anything you'd like to add to the retro before I write it?"* — options: **Nothing to add** / a couple of likely-relevant suggestions drawn from the execution; free text arrives via Other. Fold any answer in.
3. If signals are thin (fresh session, sparse plan), write what is honestly derivable and append a final dated bullet: `- (closed via /dr-ship YYYY-MM-DD — retro drawn from plan content only)`. Do not fabricate execution details.

### Metadata

`Edit` the plan's `## Metadata` block: `**Status:**` → `completed`.

### Move to completed/

Move the file from `_claude/plans/in_progress/` to `_claude/plans/completed/` (same filename):

1. Prefer `git mv "_claude/plans/in_progress/[file].md" "_claude/plans/completed/[file].md"` — cross-platform and stages the move in one step.
2. If `git mv` fails (file untracked — e.g., the project gitignores `_claude/`): `Read` the file, `Write` it to the completed/ path, then `rm` the original. The move is then filesystem-only, which is correct for an ignored file.

If the plan was passed via `@plan-file` from somewhere other than `in_progress/`, confirm with the user before moving — a plan already in `completed/` needs no move; a plan in `draft/` being shipped is unusual enough to question.

Then continue to `${CLAUDE_SKILL_DIR}/references/git-and-pr.md` (Phases 2–5).
