# Plan: dr-init Generated-Output Fixes (pm 3.1.2)

## Metadata

- **Number:** 007
- **Status:** draft
- **Created:** 2026-07-14
- **Last refreshed:** 2026-07-14
- **Refinement count:** 2
- **Plan type:** bug-fix
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Three fixes to dr-init's generated output, all found by dogfooding in this repo: (1) the generated CLAUDE.md pointer uses a prose "Read AGENTS.md" instruction, which Claude Code may or may not obey — the docs-blessed `@AGENTS.md` import inlines the file mechanically at load time; (2) the AGENTS-template.md header comment embeds a literal `<!-- section: name v1 -->` example, and since HTML comments cannot nest, the inner `-->` closes the header early, leaving stray text (`).`, two orphaned lines, and a dangling `-->`) rendering at the top of every generated AGENTS.md; (3) the generated pointer says nothing about where to *write* new guidance, so model-mediated writes (`/init` output, "add this to project memory" requests) can land in CLAUDE.md, invisible to harnesses that read only AGENTS.md (e.g., Pi) — the pointer gains an explicit write-redirect note. Fix all three in the skill, fix this repo's own generated files, and ship as project-management **3.1.2**.

## Current State

- `bundles/project-management/skills/dr-init/templates/CLAUDE-pointer.md:9-11` — prose pointer ("Read AGENTS.md and follow all of its guidance…"). Same prose in the State C append-note at `references/state-c-uninitialized.md:79-88`.
- `bundles/project-management/skills/dr-init/templates/AGENTS-template.md:14` — `(e.g. <!-- section: name v1 -->)` inside the header comment; the inner `-->` terminates the comment early. Reproduces in this repo's own `AGENTS.md:14` (generated 2026-07-13): rendered markdown shows `).` and a stray `-->` at the top of the document.
- `references/state-c-uninitialized.md:72` — an instructional placeholder embeds `<!-- End of plugin-managed section --> -->`, confusing text an agent could copy literally.
- State C's "already points at AGENTS.md" checks (`state-c-uninitialized.md:9, 77, 109, 139`) only contemplate the prose form — an `@AGENTS.md` import line must also count, or re-runs would append a redundant note.
- The write-redirect note ("record repository guidance in AGENTS.md, not here") exists only in this repo's hand-written `CLAUDE.md` — the pointer template lacks it, so generated projects get no steer and cross-agent guidance can accumulate in a file AGENTS.md-only harnesses never load.
- This repo's `CLAUDE.md` was hand-written with the `@AGENTS.md` import on 2026-07-13 and matches the target shape except for note placement/wording (its note sits below the managed block).
- Version baseline: project-management **3.1.1** in all three manifests (verified consistent).

## Assumptions

- [x] Claude Code loads only CLAUDE.md (never AGENTS.md natively) and supports `@AGENTS.md` imports that inline the file mechanically at load time — validated against official docs (code.claude.com/docs/en/memory.md, re-verified 2026-07-14); this repo's hand-written CLAUDE.md uses the import live.
- [x] HTML comments cannot nest — the inner `-->` at `AGENTS-template.md:14` is the root cause of the stray rendered text; reproduced in this repo's generated AGENTS.md.
- [x] The header comment block is not a versioned section — only `plan-management-workflow`, `available-commands`, and `task-completion-protocol` carry markers (per `references/section-versioning.md`), so no section-version bumps are needed for any of the fixes.
- [x] Pi is unaffected by the pointer change — Pi loads AGENTS.md alone and ignores the CLAUDE.md pointer (validated live during plan 006 / portability Phase 8).
- [x] The write-redirect note steers model-mediated writes only — Claude Code's built-in `#` memory shortcut appends directly to the chosen memory file (per the memory docs) and cannot be intercepted by file content. Accepted limitation: misplaced content lands below the managed block, survives /dr-init runs untouched, and can be relocated by hand.
- [ ] [?] Harnesses that read CLAUDE.md but lack `@` import support will see a literal `@AGENTS.md` line; the declarative sentence kept after it still conveys the pointer, so this is acceptable degradation. Verified only for Claude Code and Pi.

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost. Use for high-stakes work or when self-verification has been unreliable.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

### Blocking

Must resolve before implementation starts.

*(none)*

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-14] Should State B learn to repair the broken header in already-generated AGENTS.md files?
  > **Decision:** No — skip repair.
  > **Rationale:** The header is not version-tracked, the only known affected install is this repo (fixed in Phase 1), and the investment level says keep flows lean. Revisit only if another affected install surfaces.

## Success Criteria

- [ ] A fresh generation from the updated templates produces an AGENTS.md whose header comment closes exactly once — no stray `).` or `-->` visible in rendered markdown — and a CLAUDE.md whose managed block contains the `@AGENTS.md` import.
- [ ] Both generated pointer forms (the template and the State C append-note) carry the write-redirect instruction: new repository guidance goes to AGENTS.md, not CLAUDE.md.
- [ ] State C recognizes a CLAUDE.md containing an `@AGENTS.md` line as "already points at AGENTS.md" (no duplicate note on re-runs).
- [ ] This repo's own AGENTS.md header renders clean, and its CLAUDE.md matches the final template shape.
- [ ] project-management reads **3.1.2** in plugin.json, the bundle package.json, and marketplace.json, with a matching CHANGELOG entry.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — no automated suite; validation is manual per AGENTS.md. Closest equivalent: the Phase 2 fixture regeneration check.
- Manifests valid: the three JSON manifests parse (`Get-Content <file> | ConvertFrom-Json` for plugin.json, the bundle package.json, marketplace.json).
- ~~Typecheck clean~~ — markdown/JSON repo, no type system.

## Implementation Plan

### Phase 1: Fix the Generated-Output Defects

#### Tasks

- [ ] **`templates/CLAUDE-pointer.md`** — replace the prose body (lines 9–11) with the import form plus the write-redirect note, both inside the managed block. Header comment and trailing managed-section markers stay as-is. Target body:

  ```markdown
  # CLAUDE.md

  @AGENTS.md

  The imported AGENTS.md above is the canonical instruction file for
  every coding agent working in this repository, including Claude Code.

  **Note for Claude Code:** keep this file a thin pointer. When recording
  or updating repository guidance — anything that would traditionally go
  in CLAUDE.md, including `/init` output or "add this to project memory"
  requests — write it to AGENTS.md, not here, so agents that read only
  AGENTS.md see it too. Reserve the space below the managed block for
  genuinely Claude-specific instructions.
  ```

- [ ] **`references/state-c-uninitialized.md`** — four changes:
  - Replace the pointer-note block (~lines 79–88) with the import form (same `---` separator and `<!-- Plugin: project-management — pointer added by /dr-init -->` comment), including a one-sentence redirect. Target note body:

    ```markdown
    @AGENTS.md

    The imported AGENTS.md above is the canonical instruction file for
    every coding agent working in this repository, including Claude Code.
    Record new repository guidance in AGENTS.md — not here — so agents
    that read only AGENTS.md see it too.
    ```

  - Update the "doesn't already tell the agent to read AGENTS.md" wording at Case 1 (~line 9) and the assembly step (~line 77) so that **either** the prose note **or** an `@AGENTS.md` import line counts as already pointing.
  - Confirm the preview label (~line 109) and apply step (~line 139) read naturally with the broadened recognition (adjust wording only if needed).
  - Reword the instructional placeholder at ~line 72 to drop its embedded `-->` (e.g., `<plugin sections — from ## Project Structure through the end-of-managed-section marker>`).
- [ ] **`templates/AGENTS-template.md:14`** — reword the version-marker example so no literal `<!--` or `-->` appears inside the header comment, e.g.: `Sections managed by the plugin have version markers — HTML comments like "section: name v1" placed directly under the section heading.`
- [ ] **Repo cleanup** — apply the same line-14 rewording to this repo's own `AGENTS.md` (its header is not version-tracked, so this is a manual fix, not a State B update). Align this repo's `CLAUDE.md` with the final template shape — its hand-written write-redirect note moves into the managed block with the template wording; anything genuinely Claude-specific stays below the block.
- [ ] **Sweep** — grep the dr-init skill for any remaining comment block that would land in generated output with a nested `-->`. Expected: zero after the fixes. (Instructional examples inside code fences that are *not* wrapped in an outer comment are fine.)

#### Verification

- [ ] Read `templates/CLAUDE-pointer.md` and `templates/AGENTS-template.md` (lines 1–20) — each header comment closes exactly once; the pointer body contains `@AGENTS.md`.
- [ ] Grep the write-redirect wording (e.g., `write it to AGENTS.md` / `Record new repository guidance`) in `templates/CLAUDE-pointer.md` and `references/state-c-uninitialized.md` — both pointer forms carry it.
- [ ] Grep `Read AGENTS.md and follow` across `bundles/` — expected: zero hits. (Hits under `_project/plans/completed/` are historical record — never edit those.)
- [ ] Read this repo's `AGENTS.md` lines 1–20 — header comment closes exactly once, no stray `).`. Read this repo's `CLAUDE.md` — matches the final template shape.

#### Acceptance Criteria

- The old template demonstrably produced the defect (this repo's AGENTS.md, generated 2026-07-13, rendered stray `).` + `-->`); after Phase 2's regeneration check, no stray text renders.
- A hypothetical /dr-init State C re-run against this repo would classify CLAUDE.md as "already points at AGENTS.md — unchanged" under the broadened recognition.
- Both generated pointer forms instruct that new repository guidance is written to AGENTS.md, not CLAUDE.md.
- No change to any versioned section body — section markers stay at v3/v3/v1.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the templates are the plan's user-visible contract; subtle text defects (a stray delimiter, a missed recognition site) would not be caught by commands alone -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 2: Version Ritual and Fixture Verification

#### Tasks

- [ ] Bump `version` to `3.1.2` in `bundles/project-management/.claude-plugin/plugin.json`.
- [ ] Bump `version` to `3.1.2` in `bundles/project-management/package.json`.
- [ ] Bump the project-management entry to `3.1.2` in `.claude-plugin/marketplace.json`.
- [ ] Add a `## [3.1.2] - <current date>` entry to `bundles/project-management/CHANGELOG.md`: under **Fixed**, both defects (pointer → `@AGENTS.md` import + State C recognition; header comment no longer self-terminating); under **Added**, the write-redirect note in both generated pointer forms (rationale: keep repository guidance flowing into AGENTS.md so AGENTS.md-only harnesses see it). Use the actual current date from conversation context.
- [ ] **Fixture regeneration check** in `.research/fixtures/pm-3.1.2/` (gitignored scratch home): simulate a State A generation — substitute `{{CURRENT_DATE}}` into the updated `AGENTS-template.md` and write it plus the new `CLAUDE-pointer.md` verbatim as `AGENTS.md`/`CLAUDE.md` in the fixture. Inspect: header comment closes exactly once (no visible `).`/`-->` when rendered), `@AGENTS.md` line and write-redirect note present in CLAUDE.md.

#### Verification

- [ ] Parse all three JSON manifests — no syntax errors.
- [ ] Grep `3.1.1` across the three manifest files — expected: zero hits.
- [ ] Read the fixture `AGENTS.md` (lines 1–20) and `CLAUDE.md` — clean header, import and redirect note present, date substituted.

#### Acceptance Criteria

- All three manifests agree on `3.1.2`; CHANGELOG's newest entry is `[3.1.2]` with the correct date, both fixes under **Fixed**, and the redirect note under **Added**.
- The fixture pair is byte-faithful to what a fresh /dr-init State A run would produce from the updated templates.
- Nothing under `.research/` is staged for commit.

#### Phase Exit Gate

<!-- verifier-recommendation: no — mechanical version bumps and a file-inspection check; the Verification commands cover the surface -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

## Refinement History

- **2026-07-14:** Initial plan creation.
- **2026-07-14:** Added the write-redirect note to both generated pointer forms (template + State C append-note), aligned this repo's CLAUDE.md to the final shape, and extended success criteria/CHANGELOG accordingly — motivated by the risk of cross-agent guidance landing in CLAUDE.md where AGENTS.md-only harnesses (Pi) never see it.
- **2026-07-14:** Question resolution — decided the State B header-repair question (No — skip repair, per plan default); Verification Policy kept at Adaptive; 1 uncertain assumption left as-is (harnesses without `@` import support).

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- [Populated at completion]

### What didn't

- [Populated at completion]

### Learnings

- [Populated at completion — things a future plan would do differently]
