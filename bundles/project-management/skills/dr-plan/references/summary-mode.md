# SUMMARY Mode — Generate a PR Summary from a Plan

This reference owns the full SUMMARY flow end-to-end. Generates a reviewer-friendly PR summary plus a branch commit message. Auto-detects the current branch's open PR by default; preserves explicit-URL invocation for back-compatibility.

The flow is: parse args → detect PR → confirm path → generate → output (push to PR or display).

## Phase 1: Parse Arguments

`$ARGUMENTS` has one of these shapes (after `@plan-file` is auto-expanded and removed from args):

- `summary` — auto-detect the current branch's PR (default path).
- `summary https://github.com/[owner]/[repo]/pull/[N]` — explicit URL path (back-compat).

Store:
- `pr_url` — the URL if an explicit `https://github.com/.../pull/N` is present, else empty.

The plan content has been auto-expanded into the conversation via the `@` reference. Use that as the source material for summarization.

## Phase 2: Determine the Target PR

### If `pr_url` is set (explicit URL)

Skip auto-detection. Proceed directly to Phase 3 — validation still runs.

### If `pr_url` is empty (auto-detect)

Use `Bash`:

```
gh pr view --json number,url,title,body,state,isDraft
```

Parse the JSON. Three outcomes:

1. **Command fails** (non-zero exit, typically "no pull requests found for branch X") → no PR for the current branch. Inform the user and route to **display-only** (Path B below):

   ```
   ℹ️  No PR detected for the current branch.
   Falling back to display-only mode.
   ```

   Skip Phase 3 entirely (there's nothing to validate), generate the summary, and emit via Path B.

2. **Command succeeds, `state` is not `OPEN`** (e.g., `MERGED`, `CLOSED`) → inform the user and route to **display-only**:

   ```
   ℹ️  PR #[N] exists but is [state]. Cannot push updates.
   Falling back to display-only mode.
   ```

   Skip Phase 3, generate, emit via Path B.

3. **Command succeeds, `state == OPEN`** → proceed to Phase 2.5 for confirmation.

### Phase 2.5: Confirm the path (auto-detect only)

Before generating anything, ask via `AskUserQuestion`:

> PR #[N] ([title]) detected for the current branch. How would you like to handle the summary?

Options:
- **Push to PR** — generate the summary and replace the PR body via `gh pr edit`.
- **Display only** — generate the summary and display it in a `~~~markdown` fence for manual copy.
- **Cancel** — abort without generating.

This ordering (confirm **before** generating) saves tokens when the user cancels.

If the user picks **Cancel** → stop. Emit:

```
❌ Summary generation cancelled.
```

If the user picks **Push to PR** → store `pr_url` = the detected URL and proceed. The existing body (from the `gh pr view` response) is used in Phase 3.

If the user picks **Display only** → skip Phase 3 and go to Phase 4 for generation, then Path B.

## Phase 3: Validate the PR (Push path only)

This runs if `pr_url` is set — either from explicit URL or from auto-detect's "Push to PR" choice.

### If from explicit URL

Fetch the PR state:

```
gh pr view [pr_url] --json state,body,title
```

Branch on `state`:

- **Not `OPEN`** (MERGED, CLOSED, etc.) → stop the push path:

  ```
  ❌ PR is not open (current state: [state])
  The PR at [pr_url] is [state] and cannot be updated.
  Falling back to display-only mode.
  ```

  Route to Path B.

### Check for existing body (both paths)

If the `body` field is non-empty (has content beyond whitespace), ask via `AskUserQuestion`:

> The PR already has a description. Updating will replace it. How should I proceed?

Options:
- **Replace** — overwrite the existing PR title and description.
- **Cancel** — keep the existing PR unchanged. Fall back to display-only.

If **Cancel** → route to Path B (display-only) so the user can still copy the summary manually:

```
❌ PR update cancelled — existing description preserved.
Falling back to display-only mode so you can copy the summary manually.
```

If **Replace** or body was empty → continue to Phase 4.

## Phase 4: Generate the PR Summary and Commit Message

### Analyze the expanded plan content

Extract:

- **Title / Name** — from the plan heading.
- **Executive Summary** — the "why" in plain language.
- **Phases** — the phase names and key tasks (completed and otherwise).
- **Success Criteria** — what defines "done."
- **Completed tasks** — items marked `[x]`.
- **Open questions** — any remaining `[AWAITING]` or `[OPEN]` items.
- **Breaking changes / risks** — anything that might affect downstream.
- **Related PRD** — if linked.

### Draft the PR summary (creative format)

Make it scannable. Lead with what matters. Formats welcome:

- Tables for categorized changes.
- Emojis as section anchors (🎯 Summary, 📝 Changes, ✅ Test Plan, ⚠️ Notes).
- Mermaid diagrams for architecture or flow changes.
- Collapsible `<details>` blocks for lengthy file lists.

**Core content:**

1. **Summary / Overview** — what this PR does and why.
2. **What Changed** — organized by feature/component/phase.
3. **How to Test** — actionable verification steps.
4. **Notes for Reviewers** — breaking changes, dependencies, known limitations.

Synthesize from the plan — do not copy-paste phase blocks verbatim. The plan is a working doc; the PR summary is for reviewers.

### Draft the commit message

- **Title:** 3-6 words, imperative mood, no period (e.g., `Add user authentication`, `Fix event loading`).
- **Bullets:** up to 20, past tense, `*` prefix, no period at end (e.g., `* Implemented login endpoint with JWT issuance`). Don't pad to hit the cap — use only as many as the meaningful changes warrant.

Prioritize the most significant changes. Skip trivia.

## Phase 5: Output

### Path A: Push to PR

Use `Bash` with a heredoc for the body to handle special characters safely:

```
gh pr edit [pr_url] --title "[commit title only]" --body "$(cat <<'PRBODY'
[full PR summary markdown]
PRBODY
)"
```

**Critical:** `--title` is the commit message title ONLY (the first line). Do NOT include the bullet points in the title.

If the command succeeds, emit:

```
✅ PR Updated Successfully

PR: [pr_url]
Title: [commit title]
Description: Updated with generated summary

─────────────────────────────────────────────
📝 BRANCH COMMIT MESSAGE (for your merge/squash commit)
─────────────────────────────────────────────
~~~
[Commit Message Title]
* [Bullet 1]
* [Bullet 2]
* [Bullet 3]
~~~

Tips:
  - PR title and description have been updated on GitHub.
  - Copy the commit message above for your merge/squash commit.
  - Review the PR on GitHub to verify formatting.

Related:
  - Refine plan: /dr-plan @[plan-file] [changes]
```

If `gh pr edit` fails, emit the error and fall back to Path B with a warning prefix:

```
⚠️  Failed to update PR: [error message]
Falling back to display mode — copy the content below manually.
```

Then continue with Path B.

### Path B: Display for manual copy

Emit:

```
📋 PR Summary Generated

Plan: [Plan Name]
Source: [file path]

─────────────────────────────────────────────
📄 COPY THE MARKDOWN BELOW FOR YOUR PR
─────────────────────────────────────────────
~~~markdown
[full PR summary content — headers, tables, code blocks, everything]
~~~

─────────────────────────────────────────────
📝 COPY THE COMMIT MESSAGE BELOW
─────────────────────────────────────────────
~~~
[Commit Message Title]
* [Bullet 1]
* [Bullet 2]
~~~

Tips:
  - Copy the PR summary and paste into GitHub's PR description.
  - Copy the commit message for your merge/squash commit.

Related:
  - Refine plan: /dr-plan @[plan-file] [changes]
```

**Fence rules:**
- The PR summary goes inside ONE `~~~markdown` (tilde) fence. This lets the contents include triple-backtick code blocks without breaking the outer fence.
- The commit message goes inside its own `~~~` fence (language unnecessary).
- Everything that should render as literal markdown for the user to copy lives inside those fences.
