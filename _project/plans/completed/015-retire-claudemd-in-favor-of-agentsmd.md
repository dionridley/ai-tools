# Plan: Retire CLAUDE.md in Favor of AGENTS.md

## Metadata

- **Number:** 015
- **Status:** completed
- **Created:** 2026-09-23
- **Last refreshed:** 2026-09-23
- **Refinement count:** 2
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Since v2.1.277, Claude Code reads `AGENTS.md` on its own when a project has no `CLAUDE.md`. The generated `CLAUDE.md` pointer that project-management has shipped since 3.0.0 used to be required. Now it actively gets in the way: while any `CLAUDE.md` exists, Claude Code reads that file instead of `AGENTS.md`. This plan makes AGENTS.md the plugin's **only** instruction file. dr-init stops creating, appending to, or keeping a `CLAUDE.md`. The CLAUDE.md template, the State C pointer note, the pre-3.0.0 Legacy Conversion sub-flow and its "keep the legacy layout" option are all deleted. dr-plan and dr-prd stop mentioning CLAUDE.md, and so does the bundle README, except for one line describing the migration.

What replaces them is a single migration step that runs first. If a root `CLAUDE.md` exists, dr-init shows a preview and asks one yes/no question before doing anything else. The preview covers what will move to the end of `AGENTS.md`, what plugin-generated content will be dropped, and that `CLAUDE.md` will be deleted. **Yes** applies the move immediately, deletes `CLAUDE.md`, and continues. **No** stops dr-init with zero changes. After the migration, state detection looks at AGENTS.md alone. Every run on an already-set-up project also checks for the two outdated sentences older versions wrote into AGENTS.md (the CLAUDE.md-pointer intro and the `/init` advice) and offers to fix them, whether or not a CLAUDE.md ever existed. So a `/dr-init` run always leaves the project in the intended state.

This is a breaking change to what dr-init produces, so the release is **project-management 4.0.0**. The final phase tests the real skill before anything else changes. You run `/dr-init` in four throwaway projects outside the repo (L1–L4). Between them they cover moving real content, creating AGENTS.md from a CLAUDE.md-only project, the stale-text fix with no CLAUDE.md, a fresh folder, and a No answer that must change nothing. Then this repo is switched by hand to the same result, because `/dr-init` is never run inside ai-tools, and its docs are updated.

## Current State

- **dr-init (3.4.0)** creates `AGENTS.md` from `templates/AGENTS-template.md` and `CLAUDE.md` from `templates/CLAUDE-pointer.md` (State A). State C appends a pointer note to an existing `CLAUDE.md`, or creates AGENTS.md when the user has only a CLAUDE.md. State B has a three-way sub-flow: modern, pointer-without-canonical, and legacy. It includes a Legacy Conversion for pre-3.0.0 projects, whose **Skip** option keeps the CLAUDE.md layout. `SKILL.md` classifies states from AGENTS.md *and* CLAUDE.md evidence.
- **The generated text recommends `/init`**: the `AGENTS-template.md` header comment (lines 7–12), the `state-a-fresh.md` success tip, `SKILL.md:12` and `SKILL.md:73`, and `state-c-uninitialized.md:5`. `/init` still writes `CLAUDE.md` ([memory docs](https://code.claude.com/docs/en/memory): *"Run `/init` to generate a starting CLAUDE.md automatically"*), so following that advice would recreate the file that stops AGENTS.md from loading.
- **The template's intro line 22** says *"the generated CLAUDE.md is a pointer here"*. It sits outside every versioned section, so State B never updates it, and every existing 3.x project carries it.
- **Other skills:** `dr-plan/references/create-mode.md:105` lists CLAUDE.md as a Definition-of-Done source, `dr-plan/references/refine-mode.md:119` does the same, and `dr-prd/references/create-mode.md:204` promises "its CLAUDE.md pointer". dr-research and dr-ship have no mentions.
- **Bundle README:** CLAUDE.md appears at lines 69, 86, 89–93, 334, 479 and 733–743, and `/init` at line 87.
- **This repo** runs on the 3.x layout: root `CLAUDE.md` is the generated pointer, verbatim and with nothing below its managed block. Root `AGENTS.md` has the plugin marker plus the stale intro (line 22), the `/init` header, and dev guidance that names the pointer template (lines 278, 292). Root `README.md:119` calls CLAUDE.md a thin pointer.
- **Out of scope and left untouched:** CHANGELOG history, completed plans, `_project/research/`, `_project/prd/`, and `_project/fixtures/verifier-regression/**`. That last one is a frozen defect snapshot whose answer keys depend on its exact bytes.
- **Environment:** the local Claude Code is 2.1.280. Claude Code serves this plugin live from this working tree (the `ai-tools` directory marketplace). `project-management@ai-tools` is enabled at user scope, so a session opened in any folder runs the working-tree skill. There is no automated test suite: validation is manual, per AGENTS.md. `S:/dev/scratch/` already holds plan 006's live-test projects (`pi-phase8/`).

## Assumptions

- [x] Claude Code reads `AGENTS.md` natively from v2.1.277. Release notes: *"Added AGENTS.md support: in a project with no CLAUDE.md, Claude Code reads AGENTS.md instead"* (https://github.com/anthropics/claude-code/releases/tag/v2.1.277, fetched 2026-09-23).
- [x] Any `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or above it stops AGENTS.md from loading in the default `claude-md-or-agents-md` mode. So `CLAUDE.md` must be **deleted**, not just emptied. Source: memory docs, "When Claude Code reads AGENTS.md": *"By default, Claude reads `AGENTS.md` only when you have no `CLAUDE.md` in your working directory or above it"*.
- [x] `@path` imports inside AGENTS.md are expanded (memory docs: *"Inside each `AGENTS.md`: `@path` imports are expanded"*). That lets moved `@path` lines keep working.
- [x] `/init` still generates CLAUDE.md (memory docs, quoted above). That is why every `/init` recommendation is removed. Decided with the user on 2026-09-23.
- [x] Local CLI is `2.1.280 (Claude Code)`, which is at least 2.1.277. `/memory` lists a directly-read AGENTS.md from 2.1.280 (memory docs, troubleshooting).
- [x] Some sessions can't read AGENTS.md directly: Bedrock, Vertex and Foundry per the release note, sessions with telemetry disabled, and the first session after an upgrade. There is no fallback for them. The user decided on 2026-09-23 that the plugin keeps no CLAUDE.md-based approach.
- [x] Root `CLAUDE.md` only. `.claude/CLAUDE.md` and `CLAUDE.local.md` get a one-line warning and are never moved. `CLAUDE.local.md` is personal and usually gitignored, so copying it into a committed file would expose it. Decided with the user on 2026-09-23.
- [x] The three versioned template sections (`plan-management-workflow` v3, `available-commands` v3, `task-completion-protocol` v1) mention neither CLAUDE.md nor `/init`, confirmed by grep. So **no section version bumps**. Only the unversioned header and intro change.
- [x] A breaking change to what dr-init produces means a semver major, so **4.0.0**. 3.0.0 set this precedent for the AGENTS.md shape change.
- [x] Definition of Done has no test or typecheck command. This repo has no automated suite (validation is manual, per AGENTS.md "Testing Commands") and no type system, since it is markdown and JSON. Each phase's Verification block stands in: fixture paper-tests, grep invariants and live runs.
- [x] `rm CLAUDE.md` deletes the file from the shell dr-init has on every target: Claude Code's Bash tool (Git Bash on Windows), macOS/Linux shells, and PowerShell, where `rm` is an alias. Validated by the L1 Yes-run in Phase 3, which must also show no permission prompt for it.
  > **Resolved 2026-09-24, with its scope stated.** Validated live on Windows in Claude Code's Bash tool (Git Bash), in default permission mode, in `l1-yes-3` and `l2-4`. The user saw no permission dialog. macOS/Linux shells were not run live (`rm` is POSIX). PowerShell doesn't apply, because the instruction names the Bash tool.
- [x] The plugin is available in Claude Code sessions opened outside the repo. `~/.claude/settings.json` enables `project-management@ai-tools` at user scope, and the `ai-tools` marketplace is a `directory` source pointing at this working tree (checked 2026-09-23).
- [x] `/dr-init` is never run inside ai-tools. This is a standing rule for the repo: work-in-progress skills are tested in scratch projects. The user reaffirmed it on 2026-09-23, replacing this plan's earlier No/Yes runs in this repo with the scratch runs L1–L4 and a hand switch.
- [x] No `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/CLAUDE.md` or `.claude/AGENTS.md` exists in `S:/`, `S:/dev` or `S:/dev/scratch`, so test projects under `S:/dev/scratch/pm-4.0.0/` behave like standalone projects. `pm-4.0.0/` does not exist yet (checked 2026-09-23).
- [x] Edited skill text reaches a running Claude Code session through the live directory marketplace. The frontmatter (`allowed-tools`) may be cached until `/reload-plugins` or a new session. Checked at the start of Phase 3's live runs. If it is stale, the only cost is a permission prompt for `rm`.
  > **Resolved 2026-09-24.** Every live run used a new session, and each round's skill fixes appeared in the next run's tool calls (Detect Greps, the provenance Grep, State C routing). The frontmatter grant was live too: no `rm` prompt in default mode. Changes made *within* a single running session were not tested, because no run needed that.

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase gets independent verification. Highest rigor, highest token cost. Use for high-stakes work or when self-verification has been unreliable.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. Verification runs only on phases the model judged worth the cost.
  - Option C (Never): No independent verification at all. Agent self-review only. Lowest cost, lowest rigor.

  **Independent verification is the outcome; delegation is the preferred mechanism, not the definition.** Where the harness supports subagents, it runs as `project-management:plan-verifier`. Where it does not — Pi has no built-in subagent primitive — it runs inline against the Inline Verification Rubric in this plan's header and labels itself `[INLINE FALLBACK …]`. That is a normal operating mode there, not a degradation, and A and B remain meaningful on both. Option C is different in kind: it renders no verification task at all, so "Never" and "fell back" are distinguishable in the artifact rather than only in intent.

### Blocking

None. The four plan-shaping questions were resolved with the user before drafting:

- [x] **`/init` recommendation:** drop it everywhere and replace it with the neutral tip *"ask your coding agent to scan the codebase and add project-specific documentation to AGENTS.md"*. A CLAUDE.md that `/init` creates later is absorbed by the next `/dr-init` run. (2026-09-23)
- [x] **Other CLAUDE-family files:** root `CLAUDE.md` only. Warn about `.claude/CLAUDE.md` and `CLAUDE.local.md`, and never move them. (2026-09-23)
- [x] **This repo:** in scope as the final phase. It is switched by hand to the migration's result, because `/dr-init` is never run inside ai-tools, and the repo's docs are updated. Live testing runs in the scratch projects L1–L4. (2026-09-23, revised the same day)
- [x] **Where CLAUDE.md may still be mentioned:** only in dr-init's migration step (`SKILL.md` plus `references/claude-md-migration.md`), in **one** bundle-README line describing the migration, and in CHANGELOG history. (2026-09-23)

### Non-Blocking

- [x] [DECIDED: 2026-09-23] Should State B also repair the stale 3.x intro and header text in projects whose CLAUDE.md was already deleted by hand? Those projects never trigger the migration, so they keep the old text. Default: **no**. The repair wording names CLAUDE.md, and that would spread mentions into `state-b-update.md`. Those users can edit two sentences.
  > **Decision:** Yes. State B checks and applies the stale-text repairs on every run, not only during the CLAUDE.md move.
  > **Rationale:** The user wants `/dr-init` to leave any project in the intended working state. The repair wording stays in the `## Stale-text repairs` section of `references/claude-md-migration.md`, and `state-b-update.md` points at that section by path. So the mention scope is unchanged, because the filename doesn't match `claude(\.local)?\.md`.
- [x] [DECIDED: 2026-09-23] Deletion uses plain `rm CLAUDE.md` rather than `git rm`. It is one command that works on tracked, untracked and non-git files alike, and it leaves staging to the user, matching dr-init's "you handle your own commits" stance. Revisit only if the live run shows a harness where `rm` fails.
  > **Decision:** Plain `rm CLAUDE.md`.
  > **Rationale:** One path for tracked, untracked and non-git files. The deletion shows as an unstaged change, and the user stages and commits it.
- [x] [DECIDED: 2026-09-23 — by the executing agent during Phase 1 verification; the user can overrule] In a pre-3.0.0 CLAUDE.md, what happens to lines a user added *inside* a plugin section's body without a heading of their own? The verifier flagged this against "User content is never dropped".
  > **Decision:** Accept the disclosed residual. The migration moves anything under a user heading (an unknown `##` or `###`). Headless edits inside plugin text are dropped whole with the section, but the preview names each dropped section with its line count and says: answer No, move your lines below the end marker, and rerun.
  > **Rationale:** Closing it fully means shipping every historical template version so the migration could diff against them. That is migration tooling out of proportion to a rare shape: pre-3.0.0 files whose users also edited plugin text. The plugin's contract has always been that plugin sections are plugin-owned, and State B replaces them whole. The Success Criterion wording was narrowed to match.

## Success Criteria

- [x] dr-init never creates, appends to, or preserves a `CLAUDE.md`. `templates/CLAUDE-pointer.md` is gone, and no flow offers to keep a CLAUDE.md layout.
- [x] A root `CLAUDE.md` triggers the migration gate before **any** write, including the `_claude/` rename offer and `.gitkeep` backfill. **Yes** moves the user's content to the end of AGENTS.md and deletes CLAUDE.md. **No** stops the run and leaves the working tree byte-identical.
- [x] Plugin-generated CLAUDE.md content is dropped rather than moved: the 3.x pointer, the State C pointer note, pre-3.0.0 plugin sections, and `@AGENTS.md` self-imports. User content is never dropped silently. Anything under the user's own `##`/`###` heading moves. Lines a user added inside a plugin section's body, which happens only in pre-3.0.0 files, are dropped only after the preview names that section and tells the user how to keep them (see Non-Blocking decision, 2026-09-23). The fixture paper-tests in Phase 1 match their expected outcomes.
- [x] Any `/dr-init` run on a plugin-marked AGENTS.md leaves no stale 3.x plugin text (the CLAUDE.md-pointer intro and the `/init` header advice), whether or not a CLAUDE.md existed. The repair is shown in the preview and applied only on approval.
- [x] Across `bundles/project-management/` (excluding CHANGELOG.md), CLAUDE.md is mentioned only in `skills/dr-init/SKILL.md`, `skills/dr-init/references/claude-md-migration.md`, and exactly one line of `README.md`.
- [x] No `/init` recommendation remains in the bundle. The only `/init` text left is the old header wording quoted inside the migration reference so it can be repaired.
- [x] project-management is `4.0.0` in `plugin.json`, the bundle `package.json` and `marketplace.json`, with a `[4.0.0]` CHANGELOG entry.
- [x] Five live `/dr-init` runs in scratch projects outside the repo (L1 No, L1 Yes, L2, L3, L4) each end in their expected git state with the final skill text. Together they cover the content-move path, AGENTS.md creation, the no-CLAUDE.md repair and a fresh setup.
- [x] This repo runs on AGENTS.md alone. `CLAUDE.md` is deleted and AGENTS.md carries the two repairs, done by hand to match the migration's result. The root README and AGENTS.md no longer mention CLAUDE.md, and a fresh session loads AGENTS.md.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase. Run them from the repo root in Git Bash:

- ~~Tests pass~~: not applicable (see Assumptions).
- Manifests parse. Expected output is three `ok` lines:
  `for f in .claude-plugin/marketplace.json bundles/project-management/.claude-plugin/plugin.json bundles/project-management/package.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "ok $f"; done`
- Template HTML comments balance. This is the plan-007 learning: a stray delimiter inside the header comment ends it early. Expected: `balanced`.
  `t=bundles/project-management/skills/dr-init/templates/AGENTS-template.md; [ "$(grep -o '<!--' $t | wc -l)" -eq "$(grep -o -- '-->' $t | wc -l)" ] && echo balanced`
- ~~Typecheck clean~~: not applicable (see Assumptions).

## Inline Verification Rubric

How to verify a plan phase **yourself**, when independent verification could not be delegated.

This is the fallback branch of a Phase Exit Gate, and of `/dr-ship --verify`. When delegation
succeeds, the `plan-verifier` agent carries its own copy of these rules and this rubric is not
used — the two are deliberately separate, because a fresh-context subagent and an agent grading
its own work need different framing.

**The thing that makes this branch dangerous is not that it is less capable. It is that it is
not independent.** Everything below exists to supply, deliberately, the independence that
delegation would have given for free.

### Verdicts

One per task, per Verification item, and per Acceptance Criterion:

- **PASS** — evidence is direct and observable. Cite it (`file:line`, or the command and output).
- **FAIL** — evidence shows the opposite of what is required. Cite it.
- **UNVERIFIED** — evidence is missing, ambiguous, or could not be gathered. State why.

**Under-report beats over-report.** When you are unsure, the answer is `UNVERIFIED`, not `PASS`.
A second pass is cheap. A false `PASS` is silently corrosive: it is a *record* that a check
happened, and nothing downstream — no later phase, no retro, no `/dr-ship` audit — will ever
re-examine it. A missing check is recoverable; a false record of a check is not.

### Skepticism rules

- A test file existing is not a test passing. Run it.
- A function being defined is not the behaviour working. Check a call site or a test.
- An import being added is not a feature being used. Check for actual use.
- A config change is not a deployment. Check that the change is loaded.
- A `TODO` removed does not mean the work behind it is done. Check the replacement.
- No inference from naming. `login-handler.ts` existing is not login being implemented. Open it.
- **A task marked `[x]` is not evidence.** That mark is the claim under test, not proof of it.
- **You wrote this code. That is a reason for more skepticism, not less.** You know what you intended, which makes it easy to read intent into what is actually there. Delegation would have bought that independence for free; inline, you supply it deliberately. Go and look at what is actually there, and actively seek the thing you would rather not find.

### Naming the condition in the label

An inline verification must record that it happened, by tagging the gate task **immediately
after the checkbox** — the same position `[WAIVED …]` occupies:

```
- [x] [INLINE FALLBACK YYYY-MM-DD: agent not registered] **Run this phase's independent
      verification.** …
```

**The date stays a literal `YYYY-MM-DD` placeholder in this example, deliberately.** These words
ship verbatim into every generated plan, so a concrete date here would put a string shaped
exactly like a real label into plans where no fallback ever occurred — making the audit
unfindable by the very grep that justifies the label. Detection therefore anchors on a real
date, and this example cannot match it:

```
grep -rnE '\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:' _project/plans/
```

Dated the day the fallback occurred — matching the `[WAIVED YYYY-MM-DD: reason]` convention,
which stamps the action, not the plan. Neither parser matches the other's prefix, and the two
tags **can** legitimately share a line: `/dr-ship` appends a waiver to an already-`[x]` item
when shipping proceeds despite an adverse verdict, and that item may be one this label already
marks. Order them fallback first, waiver second — *how it was verified*, then *what was decided
about the result*. `<condition>` is exactly one of:

| Value | When |
|---|---|
| `no subagent mechanism` | The harness has no delegation tool at all. |
| `agent not registered` | A spawn was refused, and `plan-verifier` was **not** among the agents the refusal listed. |
| `spawn attempted and rejected` | A spawn was refused, and `plan-verifier` **was** listed — it exists, something else refused. |
| `delegation withheld` | A mechanism exists and `plan-verifier` is registered, but the session withholds delegation, so no spawn was attempted. |
| `permission uncertain, not resolved` | A mechanism exists, you were unsure whether you could use it, and you did not ask. |

**The last two values exist because the first three cannot describe the incident this rubric
was written for.** In that case a mechanism was present, the agent *was* registered, and no
spawn was ever attempted — so there was no refusal to read and none of the first three values
fit. An agent with no legal value to write is an agent that writes nothing, which is the
unannotated pass this whole mechanism exists to prevent.

`permission uncertain, not resolved` is deliberately uncomfortable to write. Branch 3 tells you
to ask; this value is the record that you did not. Write it anyway — it is far better than the
alternative, and a reviewer seeing it knows exactly what to re-check.

**Read the refusal before naming the condition.** This applies to the second and third values,
which a refusal distinguishes directly, so there is no reason to guess between them. Measured on
Claude Code 2.1.220: an unregistered `subagent_type` returns
`Agent type '…' not found. Available agents: …` and runs nothing. The fourth and fifth values
have no refusal to read — they are reached without an attempt.

**The first four are not admissions of failure.** On a harness with no delegation primitive, or
a session that withholds it, the label is the normal, correct operating record — it says which
path ran, not that something went wrong. Write it plainly and without apology.

## Implementation Plan

### Phase 1: Rewrite dr-init Around AGENTS.md Alone

All paths below are relative to `bundles/project-management/skills/dr-init/` unless stated. This phase delivers the plugin's user-visible contract: the migration gate and the rewritten state flows.

#### Tasks

- [x] **Create `references/claude-md-migration.md`.** This is the only file besides `SKILL.md` that may name CLAUDE.md. Contents, in this order:
  1. **When and why** (one short paragraph). Runs when a root `CLAUDE.md` exists with any content, including an empty file or a symlink. It runs before state classification, before the `_claude/` rename offer, and before any other write. Why: Claude Code (v2.1.277+) reads AGENTS.md only when there's no CLAUDE.md, so the project must use AGENTS.md alone.
  2. **Step 1 — Git state (no prompt).** If `Glob .git/**` matches, run `git status --porcelain AGENTS.md CLAUDE.md` and remember any dirty files for the preview.
  3. **Step 2 — Split CLAUDE.md into *moved* and *dropped*.**
     - **Nothing to move** when the content is empty or whitespace, is identical to AGENTS.md (a symlink or a copy), or is only the line `AGENTS.md` (a symlink that Git checked out as a text file on Windows).
     - **Always drop**, whatever the file's origin: a leading `# CLAUDE.md` title; every `@AGENTS.md` line, which would be a self-import; and any paragraph beginning `The imported AGENTS.md above is the canonical instruction file` or `**Note for Claude Code:** keep this file a thin pointer`.
     - **Drop only when the file contains a `Plugin: project-management` comment.** That comment proves the plugin generated the file or part of it, and AGENTS.md carries the current version of those pieces. Without it, nothing else is dropped: a user's own `## Project Structure` or `## Available Commands` is user content. (a) Every HTML comment containing `Plugin: project-management`. A one-line comment is just that line. A multi-line comment runs from its `<!--` line through the first line that is exactly `-->` after trimming. Pre-3.0.0 headers close early on an inner `-->`, and the stray lines up to the real closer still belong to the header. (b) The generated intro line beginning `This file provides guidance to Claude Code (claude.ai/code)`. (c) The plugin sections `## Project Structure` (including its `###` subsections), `## Plan Management Workflow`, `## Available Commands` and `## Task Completion Protocol`, but **only where they sit between the plugin comment and `<!-- End of plugin-managed section -->`**. Each runs from its heading to the next `##` heading or the end marker. Any other heading inside that range is user content and moves. (d) `<!-- End of plugin-managed section -->`, the one-line comment directly after it, and a `---` line separated from a dropped comment or the end marker only by blank lines.
     - **Move** everything else verbatim and in order. That includes `@path` imports, which AGENTS.md expands, and any user section sitting *inside* the old plugin-managed block. Trim leading and trailing blank lines, and collapse runs of blank lines left by drops to one.
     - The rule, stated in the file: **if unsure whether a piece is plugin-generated, move it.** A duplicate in AGENTS.md is easy to delete. A dropped line may be unrecoverable, because CLAUDE.md may be untracked.
  4. **Step 3 — Repair stale 3.x text in an existing AGENTS.md.** Write this as its own self-contained `## Stale-text repairs` section. The migration uses it here, and State B uses it on every run (see the `state-b-update.md` task), so it must read correctly for both. Exact-match only; if a string is not found, skip it silently.
     - Intro. Old: `It is the canonical instruction file for this project — the generated CLAUDE.md is a pointer here.` New: `It is the only instruction file for this project — record new repository guidance here.`
     - Header comment. Old four lines:
       ```
         We recommend running your harness's project-bootstrap command (Claude
         Code: the built-in `/init`) to scan your codebase and add that content
         to this file. It will integrate cleanly alongside the plugin-managed
         sections below.
       ```
       New three lines, which must match the template byte for byte:
       ```
         Ask your coding agent to scan the codebase and add that content to
         this file. It will integrate cleanly alongside the plugin-managed
         sections below.
       ```
  5. **Step 4 — Preview and gate.** Show this preview, filled with the real content:
     ~~~markdown
     ## /dr-init — CLAUDE.md found

     This project will use AGENTS.md as its only instruction file. Claude Code
     reads AGENTS.md only when there is no CLAUDE.md, so /dr-init moves
     CLAUDE.md into AGENTS.md before setting anything up.

     **Moves to the end of AGENTS.md** [— AGENTS.md will be created]:

     ```diff
     + <!-- Moved from CLAUDE.md by /dr-init on YYYY-MM-DD -->
     +
     + <every moved line>
     ```

     **Dropped** (plugin-generated; AGENTS.md already carries the current version):
       <one line per dropped piece, e.g. "plugin header comment", "## Plan Management Workflow", "@AGENTS.md import">

     **Also updated in AGENTS.md:** <each repair from Step 3 that applies>

     **Deleted:** CLAUDE.md
     ~~~
     If there is nothing to move, replace the Moves block with `**Nothing to move** — CLAUDE.md holds only content the plugin generated.` Omit the Dropped and Also-updated lines when they are empty. If Step 1 found dirty files, add `⚠ Uncommitted changes in <files> — they are carried into the result.` Then ask with AskUserQuestion:
     > **Question:** Move CLAUDE.md into AGENTS.md and continue? This happens right away, before the rest of /dr-init.
     >
     > **Options:**
     > - **Yes** — move it, delete CLAUDE.md, and continue with /dr-init
     > - **No** — stop; nothing is changed

     Any answer other than Yes counts as No.
  6. **Step 5 — Apply (Yes).** Two paths:
     - **Content to move.** Append the moved block to AGENTS.md: a blank line, the `<!-- Moved from CLAUDE.md by /dr-init on {{CURRENT_DATE}} -->` comment, a blank line, then the content. Use `Edit`-append, or read, concatenate and `Write` if a clean anchor is awkward. If AGENTS.md does not exist, `Write` it with the block. Apply the Step 3 repairs. **Re-read AGENTS.md and confirm the moved block is present verbatim. Only then** delete CLAUDE.md. If the write or the confirmation fails, stop, report, and leave CLAUDE.md in place.
     - **Nothing to move.** Write nothing to AGENTS.md except the Step 3 repairs, and only if AGENTS.md already exists. Never create an AGENTS.md here: a file holding only the provenance comment would be classified as State C instead of State A's clean scaffold. Then delete CLAUDE.md. There is no block to confirm.
     - **Deleting.** Run exactly `rm CLAUDE.md` with the Bash tool. `allowed-tools` grants that exact string, so any variant (`rm ./CLAUDE.md`, quoting, flags, another shell tool) triggers a permission prompt.
     - Say that a later Cancel in the state handler does not undo the move. Record the outcome line for SKILL.md Phase 3: `CLAUDE.md: moved <N> lines into AGENTS.md, then deleted` or `CLAUDE.md: nothing to move (plugin-generated only) — deleted`.
  7. **Step 6 — Stop (No).** Emit this, then end the run: no rename offer, no state handler.
     ```
     ℹ️  Stopped — no changes made.
     /dr-init sets up projects that use AGENTS.md as their only instruction
     file. Run it again when you're ready to move CLAUDE.md into AGENTS.md.
     ```
- [x] **Rewrite `SKILL.md`.**
  - `description`: "Initializes or updates a project with the project-management plugin structure. Creates _project/ directories and a versioned AGENTS.md on fresh projects; verifies and updates outdated plugin-managed sections on existing projects; appends plugin sections to an existing AGENTS.md. If a CLAUDE.md exists, first moves its content into AGENTS.md and deletes it (declining stops the run). Offers the legacy _claude/ → _project/ rename. Use when setting up the plugin in a new project or when plugin template sections have been updated."
  - `allowed-tools`: add `Bash(rm CLAUDE.md)`.
  - Line 12: replace the `/init` suggestion with "suggest the user ask their coding agent to add that to AGENTS.md".
  - Line 14 artifact model: "**AGENTS.md is the only generated guidance file.** It carries the plugin marker and the versioned sections, and every supported harness reads it (Claude Code natively since v2.1.277). Output directories live under **`_project/`**."
  - Phase 1 evidence: `Read AGENTS.md`; `Glob` for `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md` at the project root; `Glob _project/**`; `Glob _claude/**`; the marker check on AGENTS.md only.
  - New **"Move CLAUDE.md first"** step, placed after evidence and before classification: if the root `CLAUDE.md` exists, read and follow `references/claude-md-migration.md`. A No ends the run. After a Yes, re-read AGENTS.md and continue.
  - Classification uses AGENTS.md only. **A**: missing or empty. **B**: plugin marker present. **C**: content without the marker. Keep only two edge cases: marker present but `_project/` missing → B, and AGENTS.md missing but `_project/` present → A.
  - The legacy `_claude/` check stays, after the migration step.
  - Phase 2's git-safety bullet covers AGENTS.md only. Add: if the migration modified AGENTS.md during this run, skip the state handler's uncommitted-changes prompt. The migration preview already disclosed and approved those changes.
  - Phase 3 summary: include the migration outcome line. If `.claude/CLAUDE.md` exists, emit `⚠ .claude/CLAUDE.md exists — Claude Code reads it instead of AGENTS.md. Move what you need into AGENTS.md and delete it.` If `CLAUDE.local.md` exists, emit `⚠ CLAUDE.local.md exists — while it does, Claude Code reads it instead of AGENTS.md. /dr-init leaves it alone (it's personal and usually gitignored); fold what you need into AGENTS.md and delete it.` The follow-up example changes from "run `/init` for State A" to "add project documentation to AGENTS.md for State A".
  - Cross-Platform Notes: add `rm CLAUDE.md` as the one approved deletion, since no native tool deletes files, run only after the user says Yes.
- [x] **`templates/AGENTS-template.md`**: replace header lines 9–12 with the three new lines from the migration Step 3, and line 22 with `This file provides guidance to coding agents when working with code in this repository. It is the only instruction file for this project — record new repository guidance here.` Leave the versioned sections and markers untouched.
- [x] **Delete `templates/CLAUDE-pointer.md`** with `git rm`.
- [x] **`references/state-a-fresh.md`**: trigger is "no AGENTS.md, or an empty one". Read only the AGENTS template. Create 8 files in parallel instead of 9 (drop the CLAUDE.md row). Remove the CLAUDE.md line from the success message. Replace the `/init` tip with:
  ```
  💡 Tip: Ask your coding agent to scan the codebase and add
     project-specific documentation (architecture notes, build/test
     commands, coding conventions) to AGENTS.md, alongside the
     plugin-managed sections we just added.
  ```
  Drop the "CLAUDE.md stays a thin pointer…" sentence from the closing note.
- [x] **`references/state-b-update.md`**: delete Step 0 and the whole Legacy Conversion section (L1–L4). Remove "offer the conversion…" from the intro. Step 5 short-circuits on sections and directories only: delete the `CLAUDE.md pointer:` lines, the "(or the pointer was missing)" clause and the pointer-recreation paragraph. Delete the pointer line in Step 9. **Add the stale-text repairs to every run.** Step 1 also reads the `## Stale-text repairs` section of `references/claude-md-migration.md`. Step 4 also checks AGENTS.md for each repair's old text. The Step 5 "nothing to do" short-circuit fires only when no repair is pending. Steps 7–8 show each pending repair as its own diff entry (`# --- Stale plugin text (repair) ---`). Step 9 "Apply" applies them under the same approval. Refer to that section by path. Do not copy its old/new text into `state-b-update.md`, so the repair wording lives in one file. If the migration already repaired the text earlier in this run, nothing is pending. Steps 1–9 are otherwise unchanged.
- [x] **`references/state-c-uninitialized.md`**: retitle it "Existing AGENTS.md, No Plugin Structure". Keep a single case: append to the user's AGENTS.md (old Case 1 without the CLAUDE.md parts). Delete Case 2, the pointer-note assembly and the "create from pointer template" line. Git safety covers `git status --porcelain AGENTS.md`. The preview, the Proceed option and the success message lose their CLAUDE.md lines. Line 5 becomes "…what the user or their coding agent would typically write."
- [x] **`references/section-versioning.md`**: delete the pre-3.0.0 parenthetical on line 3 and the pointer sentence on line 64.
- [x] **Fixture paper-tests** in `.research/fixtures/pm-4.0.0/` (gitignored), one folder per case. Build each input exactly as described, including user lines in the ones that need them. Apply the migration reference's Step 2 and Step 3 rules to each by hand, **reading from the new file, not from memory**. Write `moved.md` (the exact block that would be appended) and `outcome.txt` (the dropped list and the repairs) to each folder, then compare against the expected outcome:

  | Folder | Input | Expected |
  |---|---|---|
  | `f1-pointer-3x` | CLAUDE.md = `git show d167153:bundles/project-management/skills/dr-init/templates/CLAUDE-pointer.md` plus `## Claude-only` / `- Prefer the Grep tool.` appended below it. AGENTS.md = the d167153 `AGENTS-template.md` with the date substituted. | Moved: only the two appended lines. Both repairs apply. |
  | `f2-state-c-note` | CLAUDE.md = `# CLAUDE.md`, a blank line, `## Build`, `` `npm test` ``, then the State C pointer note (`git show d167153:…/references/state-c-uninitialized.md`, lines 79–91, fence stripped). | Moved: `## Build` and `` `npm test` `` only. The title, `---`, marker, `@AGENTS.md` and note paragraph are dropped. |
  | `f3-legacy-pre3` | CLAUDE.md = `git show 0b87efa:bundles/project-management/skills/dr-init/templates/CLAUDE-template.md` with the date substituted, plus `## Architecture` / `- Hexagonal.` inserted between `## Available Commands` and `## Task Completion Protocol`, plus `## Team notes` / `- Ship Fridays.` below the end marker. No AGENTS.md. | Moved: the Architecture and Team-notes sections only. The whole early-closing header, including its stray lines up to the real `-->`, and all four plugin sections are dropped. AGENTS.md would be created. |
  | `f4-plain-user` | CLAUDE.md = `# CLAUDE.md`, a blank line, `@docs/conventions.md`, a blank line, `## Style`, `- Tabs.` No AGENTS.md. | Moved: the import line and the Style section. The title is dropped. |
  | `f5-symlink-text` | CLAUDE.md = the single line `AGENTS.md` | Nothing to move |
  | `f6-identical` | CLAUDE.md = a byte copy of AGENTS.md | Nothing to move |
  | `f7-empty` | Empty CLAUDE.md | Nothing to move |
  | `f8-user-generic-headings` | CLAUDE.md with no plugin marker: `# CLAUDE.md`, a blank line, `## Project Structure`, `- src/ and lib/`, a blank line, `## Available Commands`, `- npm test`. No AGENTS.md. | Moved: both sections, because without the marker, plugin-named headings are user content. Only the title is dropped. |
  | `f9-state-b-stale` | **State B paper-test, no CLAUDE.md.** AGENTS.md = the d167153 `AGENTS-template.md` with the date substituted, sections current, `_project/` complete. Apply `state-b-update.md` as rewritten, not the migration. Write `outcome.txt` only. | The "nothing to do" short-circuit does **not** fire. The preview lists both repairs (intro, header) as pending. After Apply, lines 7–11 and 21 match the new template exactly. |

  A mismatch means the reference's wording is wrong: fix the reference, not the expectation, then rerun the affected fixtures.

  **Implementation notes (2026-09-23).** Where the files go beyond the wording above, and why:
  - Marker-gated rule (b) also drops paragraphs beginning `Read AGENTS.md and follow all of its guidance.`. That is the pointer wording 3.0.0 (b479419) shipped in both the pointer template and the State C note; both carry the marker. It sits under (b), not the always-drop list, so a hand-written file starting with that generic sentence keeps its paragraph (f11, f12). It first went into the always-drop list; the verifier flagged that, and it was moved.
  - Nothing to move also covers "nothing left after the drops", which is this repo's own case and the most common 3.x case. Without it, the nothing-to-move path had no trigger for a clean pointer.
  - An extra check in the identical-content case. AGENTS.md may be a symlink *to* CLAUDE.md, the reverse direction, which is common in repos that started on Claude Code. So after `rm`, AGENTS.md is re-read. If it's gone, it is rewritten from the content read earlier. If that write recreated CLAUDE.md, the user is told to fix the link by hand.
  - The Step 5 Write branch also covers an empty AGENTS.md, or one holding only the line `CLAUDE.md` (a reverse symlink checked out as text).
  - The `rm` instruction also names a `cd … &&` prefix and chained commands as variants that break the exact `allowed-tools` grant.
  - The git-safety skip ("if `references/claude-md-migration.md` wrote AGENTS.md earlier in this run") is in `state-b-update.md` Step 6 and `state-c-uninitialized.md` Step 1 as well as SKILL.md Phase 2, because that's where the `git status` runs. SKILL.md Phase 2 also says a later Cancel or Skip doesn't undo the move.
  - Fixture f5 exposed a wording gap: there was no preview or outcome wording for a text symlink. The reason `(a link to AGENTS.md)` was added and f5 was rerun.
  - The marker-check note about pre-3.0.0 version suffixes was dropped from SKILL.md, because AGENTS.md was never generated before 3.0.0. The migration's substring match still catches `Plugin: project-management v1.0.0` (f3).
  - The verifier found four more things, and all were fixed. Its recheck confirmed the fixes and that f1–f9 were unaffected:
    - Rule (c) now says a plugin section runs through its `###` subsections. Any `###` other than the plugin's own three moves, up to the next `##`/`###` heading or the end marker. Those three are `### Directory Purposes`, `### IMPORTANT: Plan Execution Rules` and `### Plan Status Workflow`, the only ones in every historical template.
    - Rule (d) also drops `<!-- Plugin-managed sections added by /dr-init -->`, which pre-3.0.0 State C appended, and so also the `---` before it.
    - When rule (c) fires, the preview gives dropped plugin sections their line counts and a "dropped whole — answer No to keep your own lines" note.
    - The reverse-symlink rewrite now keeps the Step 3 repairs.
  - Fixtures f10 (a pre-3.0.0 State C append with a user `###` inside `## Project Structure`), f11 (the 3.0.0 pointer) and f12 (an unmarked file starting with the generic sentence) were added. All twelve match.
  - Fixture evidence is in `.research/fixtures/pm-4.0.0/`: per-folder `moved.md`, `outcome.txt` and `repairs.txt`. `repairs.js` reads the Old/New text from the migration file. f9's repaired AGENTS.md is byte-identical to the new template.

#### Verification

- [x] `grep -rliE 'claude(\.local)?\.md|CLAUDE-pointer|CLAUDE-template' bundles/project-management/skills/dr-init | sort`. Expected: exactly `…/dr-init/SKILL.md` and `…/dr-init/references/claude-md-migration.md`.
- [x] `test ! -e bundles/project-management/skills/dr-init/templates/CLAUDE-pointer.md && git status --porcelain bundles/project-management/skills/dr-init/templates/`. Expected: a `D` entry for `CLAUDE-pointer.md`, and `AGENTS-template.md` modified.
- [x] `grep -rnE '/init\b' bundles/project-management/skills/dr-init`. Expected: hits only inside `references/claude-md-migration.md`, in the quoted old header text.
- [x] `sed -n '7,11p;21p' bundles/project-management/skills/dr-init/templates/AGENTS-template.md`. Expected: the new header lines and the new intro line exactly. The new header lines must be byte-identical to the "New" block in the migration reference: diff the two extracts.
- [x] `grep -n "Bash(rm CLAUDE.md)" bundles/project-management/skills/dr-init/SKILL.md`. Expected: one hit, on the `allowed-tools` line.
- [x] Read `state-b-update.md`. Expected: no "Legacy Conversion" heading, no Step 0, no pointer text. Read `state-c-uninitialized.md`. Expected: a single-case flow with no "Case 2".
- [x] All nine fixtures have output that matches the expected column: `moved.md` and `outcome.txt` for f1–f8, and `outcome.txt` for f9. (f10–f12 were added during verification; all twelve match.)
- [x] `grep -nE 'claude-md-migration\.md|Stale-text repairs' bundles/project-management/skills/dr-init/references/state-b-update.md`. Expected: State B points at the repairs section. `grep -c 'the generated CLAUDE.md is a pointer' bundles/project-management/skills/dr-init/references/state-b-update.md`. Expected: `0`, because the repair wording is not copied.

#### Acceptance Criteria

- In `SKILL.md`, the migration step comes before state classification, before the `_claude/` rename offer and before any write. State classification reads AGENTS.md evidence only.
- The migration reference's gate has exactly two outcomes. Yes with content to move: it moves, repairs, confirms by re-reading, and only then deletes. Yes with nothing to move: it applies repairs only to an existing AGENTS.md, never creates one, then deletes. No emits the stop message and ends the run with no other step executed.
- The plugin-specific drops (header comment, generated intro, the four plugin sections, end markers) apply only to a CLAUDE.md carrying a `Plugin: project-management` comment. The four sections are dropped only between that comment and the end marker.
- No dr-init flow creates, appends to, or offers to keep a CLAUDE.md, and nothing references the deleted pointer template.
- The drop list covers all three generated shapes (3.x pointer, State C note, pre-3.0.0 file). The "if unsure, move it" rule is stated. All nine fixtures match their expected outcomes when the rules are read from the file, including f8, where plugin-named headings in an unmarked file move. (Twelve fixtures after verification: f10–f12 cover the pre-3.0.0 State C append, the 3.0.0 pointer and an unmarked generic sentence.)
- State B checks the stale-text repairs on every run. Pending repairs appear in its preview and apply under the same Apply approval, and "nothing to do" fires only when none are pending (f9). The repair wording lives only in the migration reference's `## Stale-text repairs` section.
- `.claude/CLAUDE.md` and `CLAUDE.local.md` produce warnings only and are never read for moving.
- AGENTS-template's versioned sections are byte-unchanged (`git diff` touches only the header lines and line 22), so no section version bump is owed.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase is the plugin's user-visible contract, and the migration deletes a user file; a drop rule that is too broad loses user content, and only a semantic read against the fixtures catches that -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [x] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 2: Sweep the Other Skills and the Bundle README

This phase edits files outside `skills/dr-init/` only. It describes dr-init's new behavior as delivered in Phase 1: AGENTS.md only, plus a CLAUDE.md migration gate where No stops the run.

#### Tasks

- [x] **`skills/dr-plan/references/create-mode.md` Phase 5**: delete list item 2 (CLAUDE.md) and renumber items 3–6 as 2–5. Item 1's parenthetical becomes "(the project's instruction file)". Do not touch any other part of the file. Its Phase 7 gate blocks are covered by a drift invariant.
- [x] **`skills/dr-plan/references/refine-mode.md:119`**: change to "infer commands from `AGENTS.md` / `package.json` / etc."
- [x] **`skills/dr-prd/references/create-mode.md:204`**: end the note with "…plus a versioned AGENTS.md."
- [x] **Bundle `README.md`.**
  - Line 69: "…with the standard directory structure and a canonical AGENTS.md."
  - Line 86: "Generates **AGENTS.md**, the project's only agent-guidance file, carrying the versioned plugin sections. Every supported harness reads it (Claude Code natively since v2.1.277)."
  - Add a new bullet directly after it. This is the **only** README line that may name CLAUDE.md: "- **Moves an existing `CLAUDE.md` into AGENTS.md first**: Claude Code (v2.1.277+) reads AGENTS.md only when no CLAUDE.md exists, so /dr-init previews what will move, asks yes/no, then deletes CLAUDE.md. Answering no stops /dr-init without changes."
  - Line 87: end with "…ask your coding agent to add it to AGENTS.md".
  - Lines 89–91 states: *Fresh*, no `AGENTS.md`. *Already initialized*, plugin marker in AGENTS.md; keep the diff-preview text and offer the `_claude/` → `_project/` rename to pre-3.0.0 layouts. *Has AGENTS.md, no plugin structure*.
  - Line 93: "warns if `AGENTS.md` has uncommitted changes…".
  - Line 334: drop `CLAUDE.md` from the list.
  - Lines 478–479: the tree ends with `└── AGENTS.md              # Canonical agent guidance (plugin-managed sections)`.
  - Lines 733–743: heading "AGENTS.md was modified unexpectedly". Keep four cases: fresh scaffold, which creates AGENTS.md when none exists; section update; append, without the pointer clause; and "**Instruction-file move**: moves another instruction file's content to the end of AGENTS.md (see `/dr-init` above; always previewed and asked first)". The closing line uses `git log -- AGENTS.md`.

#### Verification

- [x] `grep -rliE 'claude(\.local)?\.md|CLAUDE-pointer|CLAUDE-template' bundles/project-management --exclude=CHANGELOG.md | sort`. Expected: exactly `bundles/project-management/README.md`, `…/skills/dr-init/SKILL.md` and `…/skills/dr-init/references/claude-md-migration.md`.
- [x] `grep -ciE 'claude(\.local)?\.md' bundles/project-management/README.md`. Expected: `1`.
- [x] `grep -rnE '/init\b' bundles/project-management --exclude=CHANGELOG.md`. Expected: hits only in `skills/dr-init/references/claude-md-migration.md`. (2026-09-23: one more hit, `skills/dr-research/assets/template/vendor/highlight.min.js:404`. It is highlight.js's Swift keyword regex `/init\?/`, a vendored file unchanged since 0b87efa and not a `/init` recommendation, so the intent of this check holds.)
- [x] Gate-block drift check from `create-mode.md` Phase 7, "Hold the gate blocks byte-identical", run from `bundles/project-management/skills/dr-plan/`. Expected output:
  ```
  present 3 (want 3) · distinct 1 (want 1)
  present 2 (want 2) · distinct 1 (want 1)
  present 3 (want 3) · distinct 1 (want 1)
  ```
- [x] `git diff --stat -- bundles/project-management/skills/dr-plan bundles/project-management/skills/dr-prd`. Expected: only `create-mode.md` (dr-plan), `refine-mode.md` and `create-mode.md` (dr-prd), each with a handful of lines changed.

#### Acceptance Criteria

- The bundle-wide mention scope holds: CLAUDE.md appears only in dr-init's `SKILL.md`, the migration reference and one README line. CHANGELOG.md is excluded because it is history.
- dr-plan's Definition-of-Done source list reads AGENTS.md → package.json → Cargo.toml → go.mod → pyproject.toml/setup.py, numbered 1–5.
- The README's dr-init section describes Phase 1's behavior: AGENTS.md only, a migration gate where No stops, and no `/init` advice. The troubleshooting section lists the four ways dr-init writes AGENTS.md.
- The dr-plan gate blocks are unchanged: the drift check reports the wanted counts.

#### Phase Exit Gate

<!-- verifier-recommendation: no — documentation and one-line reference edits; the grep invariants and the drift check cover the surface mechanically -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 3: Live-Test in Scratch Projects, Release 4.0.0, and Switch This Repo

Entry condition: the bundle's skills already carry the AGENTS.md-only behavior, the migration gate and the State B stale-text repairs, as Phases 1–2 delivered them. `/dr-init` has `disable-model-invocation: true`, so only the user can start it. This phase needs the user for five `/dr-init` runs (L1 twice, L2, L3, L4) and one new-session check. Ask them, and wait for them. **Never run `/dr-init` inside ai-tools.** Live tests run in scratch projects outside the repo, and this repo is switched by hand.

#### Tasks

- [x] **Set up the live test projects** in `S:/dev/scratch/pm-4.0.0/`. They sit outside the repo because Claude Code reads a `CLAUDE.md` in the working directory *or any parent*, so a project under ai-tools would pick up this repo's files. Precedent: plan 006's `S:/dev/scratch/pi-phase8/`. For each folder:
  1. Create it and add the starting files below.
  2. Run `git init`, `git add -A` and `git commit -m "start"`. Use `--allow-empty` for L4.

  This way every run's changes show up in `git status`, and a folder resets with `git reset --hard && git clean -fd`. Take the `d167153` files with `git -C S:/dev/repos/dionridley/ai-tools show d167153:<path>`.

  | Folder | Starting files |
  |---|---|
  | `l1-pointer-with-content` | `AGENTS.md` = the d167153 `bundles/project-management/skills/dr-init/templates/AGENTS-template.md` with `{{CURRENT_DATE}}` → today. The seven `_project/**/.gitkeep` files. `CLAUDE.md` = the d167153 `…/templates/CLAUDE-pointer.md`, followed by a blank line, `## Claude-only` and `- Prefer the Grep tool.` |
  | `l2-claude-only` | `CLAUDE.md` = `# CLAUDE.md`, a blank line, `## Build`, and ``- Run `npm test` before committing.`` Nothing else. |
  | `l3-stale-no-claude` | The same `AGENTS.md` and seven `.gitkeep` files as L1. No `CLAUDE.md`. |
  | `l4-fresh` | Nothing (an empty commit). |

- [x] **Live runs L1–L4** (this needs the user). For each run:
  1. Ask the user to open a new Claude Code session in the folder (`cd S:/dev/scratch/pm-4.0.0/<folder>`, then `claude`), run `/dr-init`, and give the answers below.
  2. Have them save the transcript with `/export S:/dev/repos/dionridley/ai-tools/.research/pm-4.0.0/transcripts/<run>.txt`. If `/export` isn't available, ask them to paste the final summary into this session.
  3. Save `git status --porcelain` and `git diff` into `.research/pm-4.0.0/<run>-result.txt` and compare them with the expected result.

  | Run | Answers | Expected |
  |---|---|---|
  | `l1-no` | **No** | The migration preview shows the moved block (the provenance comment, `## Claude-only`, `- Prefer the Grep tool.`), the dropped pointer pieces, both repairs and `Deleted: CLAUDE.md`. After **No**, the stop message appears and nothing else runs. `git status --porcelain` is empty. |
  | `l1-yes` | **Yes** | The same preview. After **Yes**, State B's "nothing to do" message appears (sections current, directories complete, no stale text left), with the line `CLAUDE.md: moved 2 lines into AGENTS.md, then deleted`. `git status` shows ` D CLAUDE.md` and ` M AGENTS.md`. `git diff AGENTS.md` shows only the two repairs and the appended block at the end of the file. There is no permission prompt for `rm CLAUDE.md`. |
  | `l2` | **Yes**, then **Proceed** | The preview says AGENTS.md will be created and lists `# CLAUDE.md` as dropped. After Yes, State C shows its append preview, with no uncommitted-changes prompt because the migration wrote AGENTS.md in this run. After Proceed: AGENTS.md = the provenance comment, `## Build` and its line, then the plugin block with its marker. `git status` shows ` D CLAUDE.md`, `?? AGENTS.md` and `?? _project/`, and the seven `.gitkeep` files exist. |
  | `l3` | **Apply** | No migration prompt, since there is no CLAUDE.md. The State B preview lists the two repairs as pending and no section changes. After Apply, `git diff AGENTS.md` shows exactly the two repairs, and lines 7–11 and 21 match the new template. |
  | `l4` | none | No migration prompt. State A creates AGENTS.md and the seven `.gitkeep` files, and no CLAUDE.md. `git status` shows only `?? AGENTS.md` and `?? _project/`. The success message carries the new "ask your coding agent" tip and no `/init`. |

  If a run differs from its expected result:
  1. Fix the skill text (the Phase 1 files) and note the change under this task.
  2. If the fix touches the migration rules, rerun the affected Phase 1 fixture paper-tests.
  3. Reset the folder, and rerun that case plus any earlier case the fix could affect.

  Don't start switching this repo until all five runs match.

  **Run log (2026-09-23).** Evidence is in `.research/pm-4.0.0/`: `l1-*-result.txt`, plus `toolcalls.js`, which lists every tool call from a scratch session's JSONL log.
  - **`l1-no`: match.** Session 2602f399, Sonnet 5 at medium effort. Its tool log shows only reads, `git status` and the question; no write was attempted. The folder was at `start`, because an earlier accidental Yes run had been reverted with `git restore`.
  - **`l1-yes`: mismatch.** Session d36bc9f0, Sonnet 5 at medium effort. It moved the block and deleted CLAUDE.md, but it never checked for the stale text. The preview had no repairs line, and State B then said "no stale-text patterns present" without searching, so both old sentences stayed in AGENTS.md. The same text on Opus 5.5 (session 1c62b077, the accidental run) made both repairs.
    - Cause: detection relied on the model reading a 145-line file for exact strings, and the preview let an empty repairs line be left out, so skipping the check looked the same as finding nothing.
    - Fix, in `claude-md-migration.md` and `state-b-update.md`:
      - Each repair gains a single-line `Detect:` Grep pattern, with "detect with Grep, never by reading".
      - The migration preview always shows a verdict for each repair (applies / not found) when AGENTS.md exists.
      - State B records a verdict for each repair, and its "nothing to do" messages print `Stale plugin text: none found (every repair checked with Grep)`.
    - Checks: ripgrep finds both Detect patterns in a 3.x AGENTS.md and neither in the new template. Old/New are unchanged, so f1–f12 hold, and f9 still repairs to the new template.
    - This fix also covers L3, which depends on the same detection.
  - **The "no permission prompt for `rm`" criterion was untested.** Every scratch session ran in **auto** permission mode, which would allow `rm` either way. The `l1-yes` rerun must use `claude --permission-mode default`. No `rm` allow rule exists in the user settings or in L1.
  - L1 was reset to `start`, and `l1-no` and `l1-yes` are to be rerun with the fixed text.
  - **Second round (19:41–19:49), all on Sonnet 5 at medium effort.** Evidence is in `.research/pm-4.0.0/<run>-result.txt`. All five runs **match on end state**:
    - `l1-no-2`: no write was attempted.
    - `l1-yes-2`: both Detect searches hit, the preview listed both repairs, and the diff is exactly the two repairs plus the appended block.
    - `l2`: CLAUDE.md deleted, and AGENTS.md is the moved block plus the plugin block, byte-identical to the template. There was no uncommitted-changes prompt, and all 7 `.gitkeep` files were created.
    - `l3`: the Detect searches ran and 2 repairs were listed as pending. The result is byte-identical to the new template.
    - `l4`: AGENTS.md is byte-identical to the new template, with no CLAUDE.md and the new tip.
  - The second round still got **every session in auto mode**, so the `rm` prompt criterion is still untested.
  - Deviations:
    - `l1-yes-2` and `l2` skipped the "re-read before deleting" confirmation. It was hardened to a mandatory Grep for the provenance comment before `rm`, the same fix that worked for Detect. This needs one more `l1-yes` and `l2` run in default permission mode.
    - Not fixed, and noted:
      - Outcome lines were paraphrased.
      - The State C preview was summarized rather than shown line by line; its wording is unchanged from 3.x.
      - `l1-no-2` read files through a Bash `cd … && cat` despite SKILL.md's no-shell-utilities rule, which would prompt in default mode.
  - L1 and L2 were reset for the third round.
  - **Third round (2026-09-24), both in default permission mode**, confirmed in the session logs. Sonnet 5 at medium effort.
    - **`l1-yes-3`: match.** The Detect searches ran, the provenance Grep ran **before** `rm`, and the diff is exactly the two repairs plus the appended block. The outcome line was exact.
    - **`l2-3`: mismatch, and the most serious finding of this plan.** The migration itself was right. Classification then chose **State A instead of State C**, reasoning "no plugin marker, no `_project/` content". As a result:
      - the Proceed question never appeared;
      - the State A Write rewrote the non-empty AGENTS.md as the template, with the moved block at line 146.
      - The user's content survived **only because the model departed from `state-a-fresh.md`**. Followed literally, it would have destroyed `## Build` after CLAUDE.md was already deleted.
    - Fix:
      - SKILL.md's Move step and the edge-case list now state that an AGENTS.md created by the move is always State C, never State A.
      - `state-a-fresh.md` has a guard: if AGENTS.md has any content, stop and follow State C.
      - SKILL.md Cross-Platform Notes say to run each shell command exactly as written, because `l2-3` prefixed `git status` with `cd … &&`.
    - The fixtures' `outcome.txt` now record the post-move state: C for f2/f3/f4/f8/f10/f12, A for f7/f11, and B for f1/f5/f6.
    - L2 was reset for `l2-4`.
  - Effort stays `medium`. Every failure was an instruction gap that a mechanical rewrite fixed on the next medium run, and raising the effort would hide the next one. This is a Retro follow-up.
  - **The `rm` permission criterion passes.** The user reported (2026-09-24) that neither `l1-yes-3` nor `l2-3` showed any permission dialog, and both ran in default permission mode. So the exact `rm CLAUDE.md` is covered by `allowed-tools` with no prompt. The `l2-3` `cd … && git status` also didn't prompt, but only because of the user's global `Bash(cd:*)` allow rule.
- [x] **Switch this repo by hand**, following the migration reference rather than running `/dr-init`. This repo's `CLAUDE.md` is the generated pointer with nothing below its managed block. That is the "nothing to move" case, so nothing is appended to AGENTS.md. Run `rm CLAUDE.md`, then apply the two `## Stale-text repairs` to root `AGENTS.md` exactly as written in `references/claude-md-migration.md`. Copy the old and new text from that file; never retype it.
- [x] **Repo docs.** `README.md:119`: delete the parenthetical "([CLAUDE.md](./CLAUDE.md) is a thin pointer to it)". Root `AGENTS.md:278`: the parenthetical becomes "(dr-init's only generated guidance file)", and delete the sentence about the generated CLAUDE.md pointer. `AGENTS.md:292`: "…compares them against the user's AGENTS.md to detect outdated or missing sections". Leave the `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_SKILL_DIR}` mentions alone: they are environment variables, not the file.
- [x] **Version ritual.** Set `version` to `4.0.0` in `bundles/project-management/.claude-plugin/plugin.json`, in `bundles/project-management/package.json`, and in the project-management entry of `.claude-plugin/marketplace.json`.
- [x] **CHANGELOG.** Write this after the live runs, so it describes the final behavior, including any fixes the runs forced. Add `## [4.0.0] - <current date>` at the top of `bundles/project-management/CHANGELOG.md`. Start with a one-paragraph lead: Claude Code v2.1.277 reads AGENTS.md natively and any CLAUDE.md blocks it, so AGENTS.md becomes the only instruction file. **Migration:** run `/dr-init`. It moves CLAUDE.md into AGENTS.md and deletes it; declining stops the run. **Requires Claude Code v2.1.277+.** Sessions that can't read AGENTS.md directly (Bedrock, Vertex, Foundry, telemetry disabled) lose project instructions.
  - **Removed**: CLAUDE.md pointer generation and `templates/CLAUDE-pointer.md`; the State C pointer note; the pre-3.0.0 Legacy Conversion sub-flow and its keep-legacy option; every `/init` recommendation; CLAUDE.md as a dr-plan Definition-of-Done source.
  - **Changed**: BREAKING, dr-init classifies on AGENTS.md alone; BREAKING, a CLAUDE.md triggers a mandatory yes/no migration gate; the template header and intro wording.
  - **Added**: `references/claude-md-migration.md` (drop/move rules, and exact-match repairs of 3.x text that State B also offers on every run, so projects whose CLAUDE.md was deleted by hand get fixed too); `.claude/CLAUDE.md` and `CLAUDE.local.md` warnings; `rm CLAUDE.md` in `allowed-tools`.
- [x] **New-session check** (this needs the user). Ask the user to start a fresh Claude Code session in this repo and run `/memory`.

#### Verification

- [x] `grep -rn '"version"' bundles/project-management/.claude-plugin/plugin.json bundles/project-management/package.json; grep -n -A3 '"name": "project-management"' .claude-plugin/marketplace.json`. Expected: `4.0.0` in all three, and `grep -rn '3\.4\.0'` finds none of the three manifests.
- [x] `ls S:/dev/scratch/pm-4.0.0/`. Expected: the four folders. In each, `git log --oneline` shows the `start` commit.
- [x] Each of `.research/pm-4.0.0/{l1-no,l1-yes,l2,l3,l4}-result.txt` matches its row in the expected-results table. (2026-09-24: the final passing files are `l1-no-2`, `l1-yes-3`, `l2-4`, `l3` and `l4`, indexed in `.research/pm-4.0.0/FINAL.txt`. The earlier mismatch files are kept as evidence. `l3`, `l4` and `l1-no-2` predate the last two fixes: the confirm-before-`rm` Grep and post-move State C routing. Neither fix touches the State B, fresh State A or No-stop paths those runs exercised.) In particular, `l1-no-result.txt` shows an empty `git status --porcelain`, and `l1-yes-result.txt` shows the appended block at the end of AGENTS.md. A transcript (or the pasted summary) exists for all five runs under `.research/pm-4.0.0/transcripts/`.
- [x] After the hand switch and before the repo-doc edits: `git status --porcelain -- CLAUDE.md AGENTS.md` shows ` D CLAUDE.md` and ` M AGENTS.md`, `test ! -e CLAUDE.md` succeeds, and `git diff AGENTS.md` shows exactly the two repairs (the intro line and the header lines).
- [x] (2026-09-24: in Git Bash the `:!` shorthand fails with "Unimplemented pathspec magic '_'". The check was run as `git grep --untracked -lIiE 'claude(\.local)?\.md' -- . ':(exclude)_project' ':(exclude)**/CHANGELOG.md' ':(exclude).research'`. `--untracked` is needed because the migration file isn't committed yet. Result: exactly the three files below.) `git grep -nIiE 'claude(\.local)?\.md' -- . ':!_project' ':!**/CHANGELOG.md'`. Expected: hits only in `bundles/project-management/README.md` (one line), `bundles/project-management/skills/dr-init/SKILL.md` and `bundles/project-management/skills/dr-init/references/claude-md-migration.md`.
- [x] (2026-09-24: the user reports that the new session printed `agents-md: no CLAUDE.md found; AGENTS.md loaded: S:\dev\repos\dionridley\ai-tools\AGENTS.md` and that `/memory` showed no CLAUDE.md.) The user reports that `/memory` in the new session lists `AGENTS.md`, or that session start showed `no CLAUDE.md found; AGENTS.md loaded: …`.

#### Acceptance Criteria

- The three manifests and the CHANGELOG agree on `4.0.0`. The CHANGELOG entry names the Claude Code v2.1.277 requirement and the migration path, and uses Removed / Changed / Added.
- All five live runs match their expected results with the final skill text. Each of these paths ran for real, not just on paper: moving content (L1), creating AGENTS.md from a CLAUDE.md-only project (L2), the no-CLAUDE.md repair (L3) and a fresh setup (L4).
- The L1 No-run left its project byte-identical. This is the user's explicit requirement that "no" does not continue.
- `rm CLAUDE.md` ran without a permission prompt in the L1 Yes-run.
- This repo was switched by hand to exactly the migration's result for a clean 3.x pointer: nothing moved, two repairs, CLAUDE.md deleted. `/dr-init` was never run inside ai-tools.
- Outside `_project/` and the CHANGELOGs, the repo mentions CLAUDE.md only in the three allowed bundle files.
- A fresh Claude Code session in this repo loads AGENTS.md directly.

#### Phase Exit Gate

<!-- verifier-recommendation: no — each live run is checked against a fixed expected result by git status and git diff saved to .research/pm-4.0.0/, and the hand switch, version bumps and doc edits are mechanical; any skill fix a run forces reruns the Phase 1 fixtures it touches -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

## Refinement History

- **2026-09-23:** Initial plan creation.
- **2026-09-23:** Resolved 0 blocking + 2 non-blocking questions and verified 0 assumptions (the live-reload assumption was skipped and stays uncertain until Phase 3). Verification Policy kept at Adaptive. Deciding that State B repairs stale 3.x text on every run added the shared `## Stale-text repairs` section, the State B wiring, fixture f9, and a new Success Criterion.
- **2026-09-23:** Added live `/dr-init` testing in scratch projects outside the repo (`S:/dev/scratch/pm-4.0.0/` L1–L4, following plan 006's layout). There are five runs covering the content-move path, AGENTS.md creation, the no-CLAUDE.md repair, a fresh setup, and a No answer that must change nothing, with evidence in `.research/pm-4.0.0/`. Per the standing "never `/dr-init` inside ai-tools" rule, this repo's No/Yes runs were replaced by a hand switch. Phase 3 was reordered so the CHANGELOG is written last, and three assumptions plus one Success Criterion were added.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- **Twelve fixture paper-tests** caught wording gaps before any live run. `repairs.js` read the Old/New text straight from the migration reference, and f9's repaired AGENTS.md was checked byte-for-byte against the new template.
- **The delegated Phase 1 verifier** found what self-review missed: plugin-section user edits being dropped silently, two stray pre-3.0.0 lines leaking into AGENTS.md, and an over-broad always-drop sentence. A delta recheck through SendMessage was cheap, because the verifier kept its context.
- **Live runs in scratch projects outside the repo**, plan 006's layout. They found three real instruction gaps that the fixtures couldn't.
- **Reading the scratch sessions' JSONL logs** (`toolcalls.js`) beat the exported transcripts, which collapse tool calls. The logs showed what each run actually did. That rescued `l1-no` after it was run without the requested pause, and exposed auto permission mode through the `permissionMode` field.
- **Every mechanical rewrite held on the next medium-effort run.** "Grep with a fixed pattern", "Grep before `rm`" and "move-created AGENTS.md is State C" each fixed their failure on the first retry.
- **The hand switch copied its text from the reference with the fixture helper** instead of retyping it, so this repo's AGENTS.md matches the template byte-for-byte.

### What didn't

- **Sonnet 5 at medium effort skipped every "check by reading" step:**
  - Repair detection was skipped in `l1-yes`, and State B then falsely reported "no stale-text patterns present".
  - The confirm-before-delete was skipped in `l1-yes-2` and `l2`.
  - The post-move AGENTS.md was routed to State A in `l2-3`. The user's moved content survived only because the model departed from `state-a-fresh.md`. This was the most serious finding.
- **Two rounds ran in auto permission mode**, which made "no prompt for `rm`" untestable until default mode was requested explicitly and confirmed from the logs.
- **The plan's own check commands had flaws.** The `:!` pathspec shorthand fails in Git Bash, `git grep` skips untracked files unless given `--untracked`, and the `/init` grep hit a Swift regex in vendored highlight.js.
- **The "pause after `l1-no`" instruction** came in the same message as the run table, so it was easy to miss. That cost a round of evidence reconstruction.

### Learnings

- **Plan 006's blocking-guard lesson extends to checks.** A detection or confirmation step must be a named tool call with a fixed pattern, and its result must appear as a verdict for each item in the output (applies / not found). "Check by reading" and "omit when empty" let a skipped check look like a negative result.
- **After a pre-step that mutates state, spell out the routing.** Don't rely on the model re-deriving a classification table from files that just changed.
- **Live skill tests should fix the permission mode and the model up front, and read both from the session JSONL.** Transcripts alone aren't evidence of what ran.
- **Put a pause instruction before the run table,** or ask for one run per message.
- **Follow-ups:**
  - Consider `effort: high` for skills that delete user files. Deliberately not done here, because medium is what surfaced the gaps.
  - Harness-neutral preview wording and an optional Pi smoke test are recorded in memory as `pm4-harness-neutrality-followup`.
