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

Do **not** display the audit as its own prose — the results feed the Ship Report's READINESS section. Keep each blocking item's quoted line on hand: the gate's Finish-first and Adjust responses need them.

## 1b. `--verify` (only when the flag was passed)

Spawn the verifier via the Agent tool with `subagent_type="project-management:plan-verifier"`, passing the plan file path and the final phase number. Wait for its report.

- Every **FAIL** and **UNVERIFIED** verdict is an additional blocking item; keep the verdicts verbatim.
- Do not soften or reinterpret the verdicts. Under-report beats over-report.
- The Ship Report gains a `Verifier` row in READINESS.

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
- If the plan file is untracked (e.g., the project gitignores `_claude/`), the move will be filesystem-only and never reaches the commit: annotate the R line `(untracked — filesystem move only)` and exclude it from the Stage count.
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
  ⚠️ Verifier           [N] FAIL / [M] UNVERIFIED

SHIP PLAN
  Branch   [branch] (existing | created now)
  Stage    [N] files — plan → completed/ + [M] changed
  Push     origin/[branch] (existing upstream | new upstream, -u | no remote — commit only)
  PR       create new | update #[N] — replaces existing description | update #[N] — sets empty description | display only ([reason])

FILES ([N])
  R  _claude/plans/in_progress/[file].md → completed/
  M  [path]
  …  (+[K] more)
```

Template rules — deterministic on purpose; users should see the identical shape every run:

- **Fixed row order, all rows always present** (exceptions: `Verifier` only with `--verify`; `FILES` collapses to a single `nothing to commit` line when empty).
- **Glyphs:** ✅ nominal · ⚠️ blocking (needs waiving or finishing) · ℹ️ informational, auto-handled (e.g., retro auto-draft — never counts toward the blocking total).
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

On Ship it / Ship anyway → Read `${CLAUDE_SKILL_DIR}/references/ship.md` and execute it end-to-end.
