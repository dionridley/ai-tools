# Phases 2–5 — Preflight, Confirm, Generate, Ship, Output

Everything git and GitHub. Prerequisite: Phase 1 finished — the plan is closed out (or the user explicitly proceeded best-effort).

## Phase 2: Git preflight + confirmation

### 2a. Gather state

Run (parallel where possible):

| Check | Command | Notes |
|---|---|---|
| In a git repo? | `git rev-parse --is-inside-work-tree` | Fails → stop: /dr-ship needs a git repository. |
| Current branch | `git branch --show-current` | Empty output = detached HEAD → stop and ask the user to check out a branch first. |
| Changes | `git status --porcelain` | The candidate file list for staging. |
| Remote | `git remote get-url origin` | Fails → no remote (commit-only path). |
| Upstream | `git rev-parse --abbrev-ref --symbolic-full-name @{u}` | Fails → no upstream; push will need `-u origin <branch>`. |
| GitHub CLI | `gh auth status` | Only when the remote URL contains `github.com`. Failure → gh not ready (display fallback later). |
| Existing PR | `gh pr view --json number,url,title,body,state` | Only when GitHub + gh ready. Failure → no PR for this branch (PR action = create new). Note whether `state` is `OPEN` and whether `body` is non-empty — the flight plan states both, and Phase 4c reuses this result instead of re-querying. |

If `git status --porcelain` is empty (everything already committed — e.g., the plan move was the only change and even that is committed), say so and offer: continue with push + PR only, or abort.

### 2b. Main/master guard (mandatory stop)

If the current branch is literally `main` or `master`:

`AskUserQuestion`:

> You're on `[branch]`. Committing a finished plan directly to it is usually not what you want. How should we proceed?

- **Create a new branch (Recommended)** — suggest a name derived from the plan, e.g. `plan-[NNN]-[slug]`. Run `git switch -c [name]` (uncommitted changes, including the plan close-out, carry over automatically) and continue the happy path. A custom name can be given via Other.
- **Commit to [branch] anyway** — explicit override; continue on the current branch.
- **Abort** — stop. The Phase 1 close-out stays in place (it reflects reality); nothing has been committed.

### 2c. Flight-plan confirmation (the single gate)

Present the whole ship in one `AskUserQuestion`. In the question text, show:

- **Branch:** `[branch]` (note if just created)
- **Staging:** the `git status --porcelain` file list (if very long, collapse to per-directory counts with the plan file called out explicitly)
- **Push:** `origin/[branch]` (or "no remote — commit only")
- **PR:** create new / update existing #N — when that PR's body is non-empty, say explicitly that its current description will be REPLACED / display-only (state why, e.g. "remote is GitLab", "gh not authenticated", or "PR #N is MERGED")

Options:

- **Proceed** — run Phases 3–5 with no further prompts. Approval here covers everything shown, including replacing an existing PR description.
- **Adjust** — the user says what to change (exclude paths from staging, different PR action, skip push). Apply it, re-show the flight plan.
- **Abort** — stop. Close-out stays, nothing committed.

## Phase 3: Generate the summary + commit message

Read `${CLAUDE_SKILL_DIR}/../dr-plan/references/summary-mode.md` and follow **only** its section "Phase 4: Generate the PR Summary and Commit Message" — analyze the closed-out plan (re-Read the file at its completed/ path; it now includes the retro and final checkbox state) and draft:

1. The **PR summary** (creative reviewer-facing format per summary-mode rules).
2. The **commit message** — title (3–6 words, imperative) + up to 20 `*` bullets. Its primary purpose is the user's **squash-merge commit** on GitHub; it also serves as this branch commit's message.

Do not follow summary-mode's other phases (PR detection/validation/output) — this file owns those here.

## Phase 4: Commit, push, PR

### 4a. Commit

Order matters — stage **before** writing temp files so they're never swept into the commit:

1. Stage: `git add -A` (or the explicit path list from an Adjust).
2. `Write` the commit message (title, blank line, bullets) to `.dr-ship-commit-msg.tmp` at the repo root.
3. `git commit -F .dr-ship-commit-msg.tmp`
4. `rm .dr-ship-commit-msg.tmp`

### 4b. Push

- Upstream exists → `git push`.
- No upstream → `git push -u origin [branch]`.
- No remote → skip; note it for the output.
- Push fails → show the exact error and stop after emitting the Phase 5 display (the user resolves auth/conflict issues; the commit message must not be lost).

### 4c. PR

Execute the PR action the flight plan approved, using the preflight `gh pr view` result (do not re-query):

- **Remote isn't GitHub** → no PR call. Phase 5 displays the PR body for manual paste (works for GitLab/Bitbucket/etc.).
- **GitHub but gh not ready** (missing or unauthenticated) → Phase 5 displays the PR body **plus** the one-click compare URL: `https://github.com/[owner]/[repo]/compare/[branch]?expand=1` (derive owner/repo from the remote URL — handle both `https://github.com/owner/repo.git` and `git@github.com:owner/repo.git` forms).
- **PR exists but not OPEN** (merged/closed) → note it; Phase 5 displays instead.
- **Create or update** → `Write` the summary to `.dr-ship-pr-body.tmp`, then run the approved action:

  - No PR for the branch:

    ```
    gh pr create --title "[commit title only]" --body-file .dr-ship-pr-body.tmp
    ```

  - Open PR exists (replacement was approved at the flight plan):

    ```
    gh pr edit [url] --title "[commit title only]" --body-file .dr-ship-pr-body.tmp
    ```

  Then `rm .dr-ship-pr-body.tmp`. `--title` is the commit title ONLY — never the bullets.
- **Any gh command fails** → show the error, fall back to display. Never let a PR failure abort the ritual — the commit and push already succeeded.

## Phase 5: Output

The canonical closer — always emitted, shaped by what happened:

```
🚢 Plan Shipped

Plan: [Plan Name] → _claude/plans/completed/[file].md
Retro: [written now / already present / skipped (reason)]
Waived: [N items / none]
Branch: [branch] — [pushed to origin / commit only / push FAILED: reason]
PR: [created URL / updated URL / not created (reason)]
```

Then, **only if no PR was created or updated** (display fallback), the PR body in a tilde fence:

```
─────────────────────────────────────────────
📄 COPY THE MARKDOWN BELOW FOR YOUR PR
─────────────────────────────────────────────
~~~markdown
[full PR summary content]
~~~
```

Then, **always** — this is the primary deliverable:

```
─────────────────────────────────────────────
📝 SQUASH-MERGE COMMIT MESSAGE (copy into GitHub's merge box)
─────────────────────────────────────────────
~~~
[Commit Message Title]
* [Bullet 1]
* [Bullet 2]
~~~
```

Fence rules (inherited from summary-mode): PR body in ONE `~~~markdown` fence so backtick code blocks inside can't break it; commit message in its own `~~~` fence. Close with the compare URL when relevant, and a reminder to review the PR on GitHub before squash-merging.
