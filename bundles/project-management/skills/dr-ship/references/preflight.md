# Phase 1 — Preflight, Ship Report, Gate

Everything in this phase is **read-only**: no file edits, no waiver tags, no retro, no move, no commits. The one allowed state change is branch creation from the main/master guard (1d). Close-out happens in `ship.md` *after* the gate approves — an Abort at the gate leaves every file exactly as /dr-ship found it (an empty branch created at 1d is the only possible leftover).

## 1a. Readiness audit (always runs)

Read the plan and collect every incomplete item:

**Counts as blocking (must be `[x]` or waived):**

- Unchecked `- [ ]` items in any phase's **Tasks**, **Verification**, and **Phase Exit Gate** blocks.
- Unchecked **Success Criteria**.
- **Blocking open questions** still tagged `[AWAITING]`.

**Does NOT count as blocking:**

- Any line carrying a `[WAIVED YYYY-MM-DD: reason]` tag.
- **Assumptions** — their validation state is informational, not a shipping gate.
- **Non-blocking** open questions tagged `[OPEN]`.
- Retro placeholder bullets — the retro is auto-drafted at close-out; the report's `Retro` row notes it.
- **Anything inside a fenced code block** (``` or `~~~`). Plans quote gate text, templates, and example checklists as illustrations; those `- [ ]` lines are sample text, not work. Counting them reports phantom blocking items on exactly the plans that document this skill.

**Inline-fallback labels — informational, but always shown.**

A gate task carrying `[INLINE FALLBACK YYYY-MM-DD: <condition>]` is **not blocking**: it is `[x]`, and the verification genuinely happened. But it did not happen the way the delegated path would have, and that is a fact the person approving a push should see rather than have to go looking for. Collect these alongside the audit and report them in the Ship Report's `Fallbacks` row.

Detect with the **date-anchored** pattern, never a bare substring — via `Grep`, not the shell (principle 11 allows only git, gh, and `rm`):

```
\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:
```

**Then discard hits inside fenced blocks, and hits outside a `#### Phase Exit Gate` block.** Both exclusions are load-bearing, and each catches a different false positive:

- **The date anchor** excludes the worked example in every plan's `## Inline Verification Rubric` section, which contains the literal token with a `YYYY-MM-DD` placeholder.
- **The fence exclusion** excludes *quoted real evidence*. A plan that documents a fallback — a retro, a findings block, a plan about this feature — quotes correctly-dated labels as illustrations. Those are prose about a fallback, not a fallback.
- **The block scoping** is the backstop: a real label only ever lives on a gate task, so a hit anywhere else is discussion.

A label reported from any of these is a plan being blamed for describing the mechanism rather than using it.

Record the **phase number** with each surviving hit, not just the line — the Ship Report's `Fallbacks` row is keyed by phase, and a line number cannot be turned back into one after the fact.

Every plan with a verifier-bearing phase carries an `## Inline Verification Rubric` section whose worked example contains the literal text `[INLINE FALLBACK YYYY-MM-DD: …]`. A bare `INLINE FALLBACK` match therefore fires on every such plan whether or not a fallback ever occurred, which would make `✅ Fallbacks none` unreachable and the row meaningless. Anchoring on a real date excludes the example by construction.

Do **not** display the audit as its own prose — the results feed the Ship Report's READINESS section. Keep each blocking item's quoted line on hand: the gate's Finish-first and Adjust responses need them.

## 1b. `--verify` (only when the flag was passed)

Run independent verification of the final phase. Three branches, in order:

1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: spawn it via the Agent tool with `subagent_type="project-management:plan-verifier"`, passing the plan file path and the final phase number, then wait for its report.
2. **Inline fallback** — otherwise verify the final phase yourself against `../dr-plan/references/verification-rubric.md` (in the sibling `dr-plan` skill, relative to this skill's root), recording a verdict per item.

   **Do not write an `[INLINE FALLBACK …]` tag here.** The rubric instructs a *Phase Exit Gate* caller to tag its gate task; that instruction does not apply to `/dr-ship`, for two reasons. Preflight is **read-only** (see the top of this file) — it writes nothing before the gate approves. And the tag would be false: a gate task records how *that phase* was verified, not how `/dr-ship` verified it afterwards. Report the branch in the Ship Report's `Verifier` row, which exists for exactly this.
3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, **ask**. Uncertainty about permission is not inability. This flag gates a push and a PR, so an unannotated pass here ships unverified work.

**Read the rubric file — never a plan's `## Inline Verification Rubric` section.** A generated plan carries that section and points its own gates at it, because a plan file sits in the user's repo and cannot resolve a path into a skill. `/dr-ship` is the mirror case: it is a skill, so it *can* resolve the file, and it must — it runs against plans generated before that section existed, and against plans whose phases are all `verifier-recommendation: no`, neither of which has one. The two reach the same rubric by different routes on purpose.

- Every **FAIL** and **UNVERIFIED** verdict is an additional blocking item; keep the verdicts verbatim.
- Do not soften or reinterpret the verdicts. Under-report beats over-report.
- The Ship Report gains a `Verifier` row in READINESS, **stating which branch ran** — a delegated verification and an inline one are not the same evidence, and the reader is about to approve a push.

## 1c. Git state

Run (parallel where possible):

| Check | Command | Notes |
|---|---|---|
| In a git repo? | `git rev-parse --is-inside-work-tree` | Fails → stop: /dr-ship needs a git repository. |
| Current branch | `git branch --show-current` | Empty output = detached HEAD → stop and ask the user to check out a branch first. |
| Changes | `git status --porcelain` | The candidate file list for staging. |
| Remote | `git remote get-url origin` | Fails → no remote (commit-only path). |
| Upstream | `git rev-parse --abbrev-ref --symbolic-full-name @{u}` | Fails → no upstream; push will need `-u origin <branch>`. |
| GitHub CLI | `gh auth status` | Only when the remote URL contains `github.com`. Failure → gh not ready (display fallback later). |
| Existing PR | `gh pr view --json number,url,title,body,state` | Only when GitHub + gh ready. Failure → no PR for this branch (PR action = create new). Note whether `state` is `OPEN` and whether `body` is non-empty — the report states both, and Phase 4c reuses this result instead of re-querying. |

Notes for the report:

- The plan move (source folder → `completed/`) has **not happened yet** — it is predicted. Count it in the Stage numbers and show it as the first FILES line, using the plan's **actual source path**: normally `in_progress/`, but a `@plan-file` plan from elsewhere (e.g. `draft/`) shows that path — the gate's approval covers the move, so there is no separate confirmation later. A plan already in `completed/` needs no move: no R line, Stage counts exclude it.
- If the plan file is untracked (e.g., the project gitignores `_project/`), the move will be filesystem-only and never reaches the commit: annotate the R line `(untracked — filesystem move only)` and exclude it from the Stage count.
- If `git status --porcelain` is empty and the plan needs no close-out changes (already in `completed/`, retro present), there is nothing to commit: the SHIP PLAN's Stage row says `nothing to commit` and the gate's approval covers push + PR only.

## 1d. Main/master guard (mandatory stop)

If the current branch is literally `main` or `master`, `AskUserQuestion` **before** displaying the report (so the report shows the final branch):

> You're on `[branch]`. Committing a finished plan directly to it is usually not what you want. How should we proceed?

- **Create a new branch (Recommended)** — suggest a name derived from the plan, e.g. `plan-[NNN]-[slug]`. Run `git switch -c [name]` (uncommitted changes carry over automatically) and continue. A custom name can be given via Other.
- **Commit to [branch] anyway** — explicit override; continue on the current branch.
- **Abort** — stop. Nothing has been changed.

## 1e. The Ship Report (deterministic template)

Print as **normal assistant output** — never inside AskUserQuestion text — as ONE code fence in exactly this shape:

```
🚢 SHIP REPORT — [plan-slug] ([NNN])

READINESS
  ✅ Tasks              [done]/[total]
  ✅ Success criteria   [done]/[total]
  ⚠️ Verification       [done]/[total] — [N] unchecked (Phase [M])
  ✅ Open questions     none blocking
  ℹ️ Retro              placeholder — will draft
  ℹ️ Fallbacks          [N] — Phase [M] ([condition])
  ⚠️ Verifier           [branch] — [N] FAIL / [M] UNVERIFIED

SHIP PLAN
  Branch   [branch] (existing | created now)
  Stage    [N] files — plan → completed/ + [M] changed
  Push     origin/[branch] (existing upstream | new upstream, -u | no remote — commit only)
  PR       create new | update #[N] — replaces existing description | update #[N] — sets empty description | display only ([reason])

FILES ([N])
  R  _project/plans/in_progress/[file].md → completed/
  M  [path]
  …  (+[K] more)
```

Template rules — deterministic on purpose; users should see the identical shape every run:

- **Fixed row order, all rows always present** (exceptions: `Verifier` only with `--verify`; `FILES` collapses to a single `nothing to commit` line when empty).
- **Glyphs:** ✅ nominal · ⚠️ blocking (needs waiving or finishing) · ℹ️ informational, auto-handled (e.g., retro auto-draft — never counts toward the blocking total).
- **`Fallbacks` row — always present, never blocking.** `✅ Fallbacks  none` when the date-anchored audit (1a) finds no label; otherwise `ℹ️ Fallbacks  [N] — Phase [M] ([condition])`, listing **the two lowest-numbered phases, in phase order**, then `+[K] more`. Lowest-first and not "first found", because the template's whole virtue is that two runs over the same plan print the same thing. It is always present precisely so a clean run *positively confirms the audit looked* — a row that only appears on failure cannot distinguish "no fallbacks" from "nobody checked".
- **`Verifier` row states its branch first**, then the verdict counts: `delegated — 0 FAIL / 1 UNVERIFIED`, or `inline fallback — 0 FAIL / 2 UNVERIFIED`. The counts alone are not the whole story; a reader approving a push should see how the evidence was obtained, not just what it said. The row still appears only with `--verify`.
- **READINESS rows** use `done/total` counts. A ⚠️ row appends ` — ` plus the shortest useful locator (phase number, question tag). No quoted plan lines here — those surface only if the user picks Finish first or Adjust.
- **FILES:** plan move first (status `R`, actual source path; omitted when no move is needed; suffixed `(untracked — filesystem move only)` when applicable), then `git status --porcelain` entries as `[two-letter status]  [path]`, capped at **10 lines**, then `…  (+[K] more)`. No other per-file commentary or annotations — ever.
- **No prose inside the fence.** After the fence, at most one line: `⚠️ [N] blocking item(s) — "Ship anyway" waives them with a dated tag.` Omit it when clean.

## 1f. The gate (single short question)

One `AskUserQuestion`, one question. The question text is **one line** — all detail lives in the report above; never restate branch, files, or PR action in the question.

> Ship `[plan-slug]`? — or, with blocking items: Ship `[plan-slug]` with [N] blocking items?

**Clean run options:**

- **Ship it** — proceed to `ship.md` with no further prompts. This approval covers close-out edits, staging, commit, push, and the shown PR action (including replacing an existing PR's description).
- **Adjust** — the user states changes (exclude paths from staging, different PR action, skip push). Apply, re-print the Ship Report, ask again.
- **Abort** — stop. No files have been changed (a branch created at 1d, if any, remains — it is empty).

**With blocking items, options become:**

- **Ship anyway** — the escape hatch. Approves bulk-waiving every blocking item with `[WAIVED YYYY-MM-DD: shipped via /dr-ship escape hatch]` (applied in ship.md Phase 2), then proceeds exactly like Ship it.
- **Finish first** — abort so the remaining work can be completed. Emit the blocking items as a short quoted list — the parting message.
- **Adjust** — as above, plus individually-reasoned waivers: the user names items and reasons; note them for ship.md, re-run the audit arithmetic, re-print the report, ask again.
- **Abort** — stop. No files have been changed (a branch created at 1d, if any, remains — it is empty).

On Ship it / Ship anyway → Read `references/ship.md` and execute it end-to-end.
