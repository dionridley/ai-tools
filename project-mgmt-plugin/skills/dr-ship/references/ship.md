# Phases 2–5 — Close Out, Generate, Ship, Output

Prerequisite: the gate approved a Ship Report. Everything here executes with **no further prompts** — the gate's approval covers all of it.

## Phase 2: Close out the plan

All plan-file edits happen now, before anything is committed, so the completed plan rides in the same commit as the work.

### Waivers (only when the gate added them)

- **Ship anyway:** for every blocking item, `Edit` the line to insert the tag after the checkbox, keeping the checkbox `[ ]` (honest state — it was not done):

  ```
  - [ ] [WAIVED 2026-07-03: shipped via /dr-ship escape hatch] Original task text
  ```

- **Adjust waivers:** same tag format, but with the user's stated reason instead of the escape-hatch boilerplate.
- **Verifier-flagged items whose plan line is already `[x]`:** append the same tag with the verifier's verdict quoted in the reason, leaving the checkbox as the executing agent set it — the tag records that shipping proceeded despite the verdict.

### Retro backstop

Check the `## Retro` section. If it's already populated with real content, leave it alone and note "retro already present."

If placeholders remain (`[Populated at completion]` or similar), **auto-draft it now — no question**: terse **What worked / What didn't / Learnings** bullets drawn from the plan's own accumulated content (Refinement History, task annotations, resolved questions, waiver reasons) and the conversation context if this session executed the plan. If signals are thin (fresh session, sparse plan), write what is honestly derivable and append a final dated bullet: `- (closed via /dr-ship YYYY-MM-DD — retro drawn from plan content only)`. Do not fabricate execution details.

### Metadata

`Edit` the plan's `## Metadata` block: `**Status:**` → `completed`.

### Move to completed/

Execute exactly the move the approved Ship Report showed. If the report showed no move (plan already in `completed/`), skip this step. Otherwise move the file from the source path on the report's R line (normally `in_progress/`) to `_claude/plans/completed/` (same filename):

1. Prefer `git mv "[plan source path]" "_claude/plans/completed/[file].md"` — cross-platform and stages the move in one step.
2. If `git mv` fails (file untracked — e.g., the project gitignores `_claude/`): `Read` the file, `Write` it to the completed/ path, then `rm` the original. The move is then filesystem-only, which is correct for an ignored file.

## Phase 3: Generate the summary + commit message

Read `${CLAUDE_SKILL_DIR}/../dr-plan/references/summary-mode.md` and follow **only** its section "Phase 4: Generate the PR Summary and Commit Message" — analyze the closed-out plan (re-Read the file at its completed/ path; it now includes the retro, waiver tags, and final checkbox state) and draft:

1. The **PR summary** (creative reviewer-facing format per summary-mode rules).
2. The **commit message** — title (3–6 words, imperative) + up to 20 `*` bullets. Its primary purpose is the user's **squash-merge commit** on GitHub; it also serves as this branch commit's message.

Do not follow summary-mode's other phases (PR detection/validation/output) — this file owns those here.

## Phase 4: Commit, push, PR

### 4a. Commit

Order matters — stage **before** writing temp files so they're never swept into the commit:

1. Stage: `git add -A` (or the explicit path list from a gate Adjust).
2. `Write` the commit message (title, blank line, bullets) to `.dr-ship-commit-msg.tmp` at the repo root.
3. `git commit -F .dr-ship-commit-msg.tmp`
4. `rm .dr-ship-commit-msg.tmp`

If the gate approved a push-and-PR-only run (nothing to commit), skip 4a entirely.

### 4b. Push

- Upstream exists → `git push`.
- No upstream → `git push -u origin [branch]`.
- No remote → skip; note it for the output.
- Push fails → skip 4c, show the exact error, and emit the Phase 5 display with `PR: not created (push failed)` (the user resolves auth/conflict issues; the commit message must not be lost).

### 4c. PR

Execute the PR action the gate approved, using the preflight `gh pr view` result (do not re-query):

- **Remote isn't GitHub** → no PR call. Phase 5 displays the PR body for manual paste (works for GitLab/Bitbucket/etc.).
- **GitHub but gh not ready** (missing or unauthenticated) → Phase 5 displays the PR body **plus** the one-click compare URL: `https://github.com/[owner]/[repo]/compare/[branch]?expand=1` (derive owner/repo from the remote URL — handle both `https://github.com/owner/repo.git` and `git@github.com:owner/repo.git` forms).
- **PR exists but not OPEN** (merged/closed) → note it; Phase 5 displays instead.
- **Create or update** → `Write` the summary to `.dr-ship-pr-body.tmp`, then run the approved action:

  - No PR for the branch:

    ```
    gh pr create --title "[commit title only]" --body-file .dr-ship-pr-body.tmp
    ```

  - Open PR exists (replacement was approved at the gate):

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
