# Plan: Skill Portability Phase 7 — Frontmatter & Packaging Polish

## Metadata

- **Number:** 005
- **Status:** completed
- **Created:** 2026-07-12
- **Last refreshed:** 2026-07-12
- **Refinement count:** 1
- **Plan type:** migration/infra/refactor
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A (workstream doc: `.research/skill-portability-plan.md`, Phase 7 section + Decision 5)

## Executive Summary

Close the packaging half of the skill-portability workstream: make every skill's frontmatter spec-clean against the Agent Skills specification (agentskills.io), apply the `compatibility:` field per the now-locked policy (only where degradation is real), and fill the README's remaining cross-harness gap (per-skill capability notes — the Pi install docs already exist). The spec validator `skills-ref validate` (spec-named; npm `skills-ref` 0.1.5 with a real CLI binary) runs as both the baseline and the final gate.

Content is tiny — three `compatibility:` lines, one two-line frontmatter fix (react-19's non-spec top-level `version:`), a short README subsection, and three bundle releases (pm **3.1.0**, et **0.4.1**, exp **0.10.0**). The judgment work is triage: the validator's rule set is undocumented, so findings are classified as *spec violations* (fix) vs. *Claude Code extension fields* (`disable-model-invocation`, `effort`, `argument-hint` — accept and document; they cannot be removed without breaking Claude Code behavior, and Pi provably ignores them).

Phase 8 (live test-in-Pi) is explicitly out of scope — it is the next plan. Every `compatibility:` claim written here is phrased as a requirement, not a guarantee, so Phase 8 cannot contradict it.

## Current State

- 8 skills across 3 bundles: pm `dr-init|dr-research|dr-prd|dr-plan|dr-ship`, et `frontend-design|react-19`, exp `mvp`. Baseline: main `3b238e1`, pm 3.0.0 / et 0.4.0 / exp 0.9.0.
- README already carries full Pi install docs (`## Pi`: whole-repo install, settings filters, local dev installs) — the workstream's "install note" item is substantially done; the gap is per-skill capability expectations on non-Claude harnesses.
- Spec facts (verified 2026-07-12 against agentskills.io/specification): `compatibility` is an **optional prose string, 1–500 chars**, "should only be included if your skill has specific environment requirements"; the spec itself notes *"Most skills do not need the `compatibility` field"* — directly supporting the lean policy. Validator: `skills-ref validate <dir>` (README documents `validate`, `read-properties`, `to-prompt`; rule specifics and unknown-field/exit-code behavior undocumented).
- Measured frontmatter inventory (2026-07-12, verbatim grep of all 8 SKILL.mds):

| Skill | Spec fields | Claude Code extension fields | Notes |
|---|---|---|---|
| dr-init, dr-prd, dr-plan | name, description, allowed-tools | disable-model-invocation, effort, argument-hint | clean |
| dr-research, dr-ship | name, description, allowed-tools | same 3 | `allowed-tools` comma-separated (spec says space-separated; see Design Decisions) |
| mvp | name, description, allowed-tools | argument-hint, disable-model-invocation, effort | clean |
| frontend-design | name, description, license | none | clean |
| react-19 | name, description | **top-level `version: 0.1.0`** | not a spec field — spec puts version under `metadata:` |

- All 8 `name:` fields match their parent directory names (a validator naming rule) — grep-verified 2026-07-12.
- `compatibility:` currently absent everywhere.

## Assumptions

- [x] `skills-ref` exists on npm at 0.1.5 with bin `skills-ref` → `dist/cli.js` — verified 2026-07-12 via `npm view`. Executable via `npx skills-ref@0.1.5`.
- [x] `compatibility` is spec-blessed: optional string, 1–500 chars, requirements-oriented — verified 2026-07-12 against agentskills.io/specification.
- [x] Pi silently ignores unknown frontmatter (incl. `compatibility` if it doesn't consume it) — Phase 0 audit 2026-07-06, Confirmed.
- [x] All 8 skill `name:` fields match parent dirs — grep-verified 2026-07-12.
- [x] skills-ref treats non-spec fields as **hard errors** (exit 1: "Unexpected fields in frontmatter: … Only allowed-tools, compatibility, description, license, metadata, name are allowed.") — observed 2026-07-12 at the Phase 1 baseline; the original "warnings or ignores" guess was wrong, and the triage rule's hard-error branch applies: "validator clean" = zero findings beyond the Accepted Deviations list. Notably it does NOT inspect `allowed-tools` content/format, so the comma-separator decision needs no deviation entry.
- No test/lint/typecheck commands exist: markdown/docs repo — DoD uses validator runs + structural greps + read-through (established in plans 002–004).

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`.
  - Option B (Adaptive): Verifier runs only on phases annotated `verifier-recommendation: yes`.
  - Option C (Never): Agent self-review only.

### Blocking

Must resolve before implementation starts.

- (none)

### Non-Blocking

Can resolve during implementation.

- (none — the historically-open `compatibility:` policy is locked below per the standing lean, the user's instruction in the plan request, and the spec's own guidance)

### Design Decisions (locked at planning, 2026-07-12)

- **`compatibility:` policy (resolves workstream Decision 5): only where degradation or hard environment requirements are real.** Applied to exactly three skills — `mvp` (subagents/worktrees/settings enforcement; Reduced Sequential Mode elsewhere), `dr-research` (hard web-access requirement), `dr-ship` (git + gh + GitHub remote). The other five get none: dr-init/dr-plan/dr-prd degrade gracefully with no hard requirements (their conditionals are self-documenting), and the et skills are pure content. Mirrors the spec's "most skills do not need it."
- **Claim phrasing rule:** `compatibility:` text states *requirements and design intent* ("requires X", "designed for Y, degrades to Z"), never live-tested guarantees — Phase 8 must not be able to contradict anything written here. ≤500 chars each.
- **Validator triage rule:** each finding is either a *spec violation* → fix in this plan, or a *Claude Code extension field* → accept, never remove (Claude Code reads them; Pi ignores them), and record on the accepted-deviations list with rationale. "Validator clean" = zero findings beyond that list.
- **react-19 top-level `version:` → `metadata: version: "0.1.0"`** regardless of validator verdict — guiding strategy #2 is spec-compliance-first, the spec's own example shows version under `metadata`, and nothing in Claude Code reads a skill-level `version` (plugin versioning lives in plugin.json).
- **`allowed-tools` separator: leave as-is.** dr-ship/dr-research use commas; the spec says space-separated — but the field is spec-Experimental, entries like `Bash(git status:*)` contain internal spaces (making space-tokenization ambiguous anyway), Claude Code is the only harness that enforces the field, and Pi parses-but-ignores it. If the validator flags it, it goes on the accepted-deviations list rather than risking Claude Code's permission parsing. Revisit only if Phase 8 shows a harness consuming the field.
- **Version bumps:** pm 3.0.0 → **3.1.0** (Added: compatibility on 2 skills), et 0.4.0 → **0.4.1** (Fixed: non-spec frontmatter field), exp 0.9.0 → **0.10.0** (Added: compatibility on mvp). All three bundles bump because installed users only receive content changes via catalog version changes.
- **README placement:** a short `### Capability notes` subsection under the existing `## Pi` section — additions only; the existing install/filter/local-dev docs are correct and stay untouched.

## Success Criteria

- [x] `skills-ref validate` has been run on all 8 skill directories with per-directory results recorded in this plan; every spec violation is fixed; every surviving finding is on the accepted-deviations list naming a Claude Code extension field with rationale. *(phase 3 verifier re-ran all 8: end-state matches the Accepted Deviations exactly; react-19 was the only spec violation, fixed)*
- [x] `compatibility:` present on exactly `mvp`, `dr-research`, `dr-ship` — each ≤500 chars, requirements-phrased per the claim rule — and absent from the other five skills. *(verifier: 3 hits, 276/114/135 chars, every clause grounded against the skills' actual conditional prose; nothing a Phase 8 live test could falsify)*
- [x] react-19's top-level `version:` is gone; `metadata: version: "0.1.0"` carries it; no other skill has non-spec fields introduced by this plan. *(verifier: branch diff introduces only `compatibility` ×3 and the `metadata` block — both spec fields; all 10 deletion lines in the branch are version strings or the relocated line)*
- [x] README documents per-skill capability expectations for non-Claude harnesses; existing Pi install docs byte-unchanged except the new subsection. *(verifier: bullet-by-bullet grounded incl. the "everything else" fallback claims; git diff = 9 insertions, 0 deletions, single hunk)*
- [x] Releases consistent: pm **3.1.0** / et **0.4.1** / exp **0.10.0** across each bundle's plugin.json + package.json + marketplace.json entry, with a dated CHANGELOG entry per bundle matching the shipped work. *(verifier: 9/9 declarations + 3 CHANGELOG headings agree; every CHANGELOG factual claim re-derived true; nothing else bumped)*
- [x] Workstream doc updated: Decision 5 flipped to RESOLVED with the locked policy; the accepted-deviations list recorded where Phase 8 will find it. *(verifier: Decision 5 row, Open item 1 struck, Phase 7 section carries the pointer + Phase 8 exit-code expectation)*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — no test suite (docs repo); replaced by validator runs + each phase's Verification greps.
- Structural gates: `skills-ref validate` output matches the phase's expected state (zero findings beyond the accepted-deviations list); Verification greps return exactly the expected results.
- Claude-Code-path fidelity: `git diff` shows frontmatter changes limited to *additions* of spec fields plus the react-19 version relocation — no Claude Code extension field is removed or altered.
- ~~Migrations registered / feature flags defined~~ — N/A (no schema, no flags; overlay adjustment struck).

## Rollback Plan

What it takes to undo at each phase boundary. All work is prose/manifest edits in git — rollback is always `git revert` (or branch deletion pre-merge); no data, infra, or state migrations.

### Rollback by phase

- **Phase 1 (validator baseline + spec fixes):** revert the phase commit. The react-19 relocation is self-contained.
- **Phase 2 (compatibility + README):** revert the phase commit. Frontmatter additions and the README subsection have no downstream coupling.
- **Phase 3 (release + final verify):** revert the release commit; CHANGELOG entries disappear with it (nothing published to npm; marketplace serves from git).

### Rollback validation

- [ ] Rollback mechanism exists and is exercised routinely — plain `git revert`/branch deletion; no scripts needed (justification: prose-only change, validated pattern from plans 001–004).
- Rehearsal and on-call runbook: N/A — single-maintainer repo, no runtime system.

### Point of no return

Squash-merge of the PR to main. After merge, rollback = revert the merge commit (cheap; installed users pick up the revert on next marketplace update). No boundary inside execution requires a pause for confirmation.

## Implementation Plan

### Phase 1: Validator Baseline & Spec-Violation Fixes

#### Entry Preconditions

- [x] On a feature branch cut from main at `3b238e1` or later. *(branch `005-skill-portability-phase-7`, tip = `3b238e1`)*
- [x] Working tree clean (`git status`). *(confirmed at execution start, 2026-07-12)*

#### Tasks

- [x] Confirm the validator runs on this machine: `npx skills-ref@0.1.5 --help` (pin the version so reruns are reproducible). If npx fails, fall back to a one-off local install in the scratchpad; if the package is fundamentally broken on Windows, escalate — do not hand-roll a validator. *(runs clean via `npx -y skills-ref@0.1.5`; commands: validate / read-properties / to-prompt)*
- [x] Run `skills-ref validate` against each of the 8 skill directories (`bundles/*/skills/*`). Record the verbatim per-directory results as an annotation on this task — this is the baseline, including exit codes.
  *(2026-07-12 baseline: **frontend-design exit 0** ("Valid skill"). **react-19 exit 1**: "Unexpected fields in frontmatter: version." **mvp, dr-init, dr-plan, dr-prd, dr-research, dr-ship all exit 1**, identical message: "Unexpected fields in frontmatter: argument-hint, disable-model-invocation, effort. Only allowed-tools, compatibility, description, license, metadata, name are allowed." No other rule fired — names, descriptions, and allowed-tools content were not flagged.)*
- [x] Triage every finding per the locked triage rule: spec violation → fix now; Claude Code extension field (`disable-model-invocation`, `effort`, `argument-hint`, and `allowed-tools` separator if flagged) → add to an **Accepted Deviations** list annotated on this task, with one-line rationale each. This also settles the `[?]` assumption (warnings vs. hard errors) — flip it with the observed behavior.
  *(**Accepted Deviations list (final, for Phase 3 + Phase 8 reuse):** the single deviation class is `argument-hint` + `disable-model-invocation` + `effort` present top-level in 6 skills (mvp, dr-init, dr-plan, dr-prd, dr-research, dr-ship). Rationale: Claude Code consumes all three from the top level — `disable-model-invocation` gates auto-discovery (load-bearing for dr-ship's safety posture), `effort` sets reasoning effort, `argument-hint` renders in /help; relocating under `metadata:` would silence them in Claude Code, and Pi's Phase 0 audit confirmed unknown fields are ignored there. Expected validator end-state: these 6 dirs exit 1 with exactly that one message; frontend-design and react-19 exit 0. react-19's `version` was a genuine spec violation → fixed this phase. allowed-tools separator: not flagged (validator doesn't inspect the field's content) → no entry needed.)*
- [x] Relocate react-19's `version: 0.1.0` → `metadata:` block (per the locked decision, independent of validator verdict). Grep `^version:` across all SKILL.mds afterward — expected zero. *(done; react-19 now exits 0)*
- [x] Re-run the validator on any directory whose files changed — expected: previous spec-violation findings gone, no new findings. *(react-19: "Valid skill", exit 0)*

#### Verification

- [x] Run `skills-ref validate` on all 8 directories — expected: zero findings beyond the Accepted Deviations list. *(pass: 2 exit-0, 6 exit-1 with exactly the accepted extension-fields message)*
- [x] Grep `^version:` in `bundles/*/skills/*/SKILL.md` — expected: zero hits; grep `version:` inside react-19's frontmatter — expected: one hit, indented under `metadata:`. *(pass: 0 top-level; react-19 line 5 `  version: "0.1.0"` under `metadata:`)*
- [x] `git diff` — expected: only react-19's SKILL.md frontmatter (plus any triage-mandated spec fixes) changed; no extension fields touched. *(pass: 1 file, 2 insertions/1 deletion)*

#### Acceptance Criteria

- The validator's actual rule behavior is recorded fact, not assumption; the baseline and Accepted Deviations list exist in this plan for Phase 3 and Phase 8 to reuse.
- Every skill passes validation modulo the documented deviations; Claude Code frontmatter behavior is untouched.

#### Phase Exit Gate

<!-- verifier-recommendation: no — command outputs and a two-line diff cover the surface; the Phase 3 verifier re-derives the whole branch including this phase's triage judgments -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(validator end-state matches Accepted Deviations exactly; greps pass; diff touches no extension field — 2026-07-12)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(all 5 tasks command-verified; the one surprise — hard errors, not warnings — was the pre-declared [?] and is recorded in the Assumptions flip; nothing skipped)*

### Phase 2: `compatibility:` Fields + README Capability Notes

#### Entry Preconditions

- [x] Phase 1 Exit Gate passed (validator baseline recorded, spec fixes committed). *(0c4822f)*

#### Tasks

- [x] Add `compatibility:` to `mvp/SKILL.md`, starting from this draft and adjusting for accuracy against the skill's own conditionals: *"Designed for Claude Code (subagent dispatch, worktree isolation, settings-based permissions); runs on other Agent Skills harnesses in Reduced Sequential Mode with single-session setup. Requires git; the agent-managed dev server additionally requires bash background execution."* *(applied verbatim — 276 chars; matches the 0.9.0 conventions exactly)*
- [x] Add `compatibility:` to `dr-research/SKILL.md`, draft: *"Requires web search and fetch tools (built into Claude Code; other harnesses need a web-access package installed)."* *(applied verbatim — 114 chars)*
- [x] Add `compatibility:` to `dr-ship/SKILL.md`, draft: *"Requires git and the GitHub CLI (gh) on PATH with a GitHub remote; PR steps degrade to display-only output when gh is unavailable."* *(accuracy-adjusted per the task's own instruction: "Requires git; PR creation additionally requires the GitHub CLI (gh) and a GitHub remote, degrading to display-only output without them." — 135 chars; the draft overstated gh/remote as skill-wide requirements when ship.md scopes them to the PR step)*
- [x] Check each final string against the claim rule (requirements/design intent only, nothing Phase 8 could falsify) and the 500-char limit; confirm the other five skills remain `compatibility:`-free per policy. *(276/114/135 chars; all requirements-phrased; grep shows exactly 3 files with the field)*
- [x] Add a `### Capability notes` subsection under README's `## Pi` section (~6–10 lines): dr-research needs a web-access package; mvp runs in Reduced Sequential Mode (no parallel subagents/worktrees) with single-session setup; dr-ship needs git + gh; everything else runs on stock capabilities. Existing Pi content untouched. *(added at end of ## Pi, before ## Repository Layout; 9 inserted lines, zero deletions)*
- [x] Re-run `skills-ref validate` on the three touched skill directories — expected: no new findings (a well-formed `compatibility` string is spec-valid). *(all three: only the accepted extension-fields message, identical to Phase 1 end-state)*

#### Verification

- [x] Grep `^compatibility:` in `bundles/*/skills/*/SKILL.md` — expected: exactly 3 hits (mvp, dr-research, dr-ship), each line ≤500 chars of value. *(pass: 3 files ×1 hit; 276/114/135)*
- [x] Validator on mvp/dr-research/dr-ship — expected: unchanged from the Phase 1 end-state. *(pass: same single message, exit 1, `compatibility` not flagged)*
- [x] `git diff README.md` — expected: one added subsection; no other hunks. *(pass: 9 insertions, 0 deletions)*
- [x] Read the three compatibility strings against each skill's actual conditional prose — expected: no claim exceeds what the skill's own degraded paths promise. *(pass: mvp ↔ Reduced Sequential Mode + single-session conventions; dr-research ↔ declared web requirement + Pi remedy; dr-ship ↔ ship.md 4b/4c display fallbacks)*

#### Acceptance Criteria

- A Pi user reading either the frontmatter or the README knows what degrades before invoking anything; a Claude Code user sees zero behavior change.
- Workstream Decision 5 is now implementable as written — exactly three fields, lean policy applied.

#### Phase Exit Gate

<!-- verifier-recommendation: no — small additive diff; the semantic review of claim modesty and README accuracy is exactly what the Phase 3 whole-branch verifier is scoped to do -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(validator end-state unchanged vs Accepted Deviations; greps pass; diff is purely additive — no extension field touched — 2026-07-12)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(all 6 tasks verified; one deliberate deviation from the plan's draft text — dr-ship's accuracy adjustment — is documented in its task annotation for the Phase 3 verifier to judge)*

### Phase 3: Release + Final Verification

#### Entry Preconditions

- [x] Phases 1–2 Exit Gates passed and committed. *(0c4822f, 833387e)*
- [x] Working tree clean except this phase's edits. *(confirmed pre-edit)*

#### Tasks

- [x] Bump project-management → **3.1.0** (plugin.json, package.json, marketplace.json entry); CHANGELOG entry dated at execution: Added (`compatibility` frontmatter on dr-research and dr-ship per the lean policy), plus any Phase 1 triage fixes that touched pm skills. *(no triage fixes touched pm — react-19 was the only spec violation; intro line documents the accepted-deviation posture)*
- [x] Bump engineering-tools → **0.4.1**; CHANGELOG: Fixed (react-19's non-spec top-level `version` moved under `metadata`).
- [x] Bump experimental → **0.10.0**; CHANGELOG: Added (`compatibility` frontmatter on mvp declaring Claude Code design intent and Reduced Sequential Mode).
- [x] Update `.research/skill-portability-plan.md`: flip Decision 5 to RESOLVED (policy + the three skills); note in the Phase 7 section that the Accepted Deviations list lives in this plan for Phase 8's reference. *(Decision 5 table row, Open item 1 struck, Phase 7 section rewritten with the validator facts + Phase 8 expectation)*
- [x] Final sweep: run `skills-ref validate` on all 8 directories; grep the three version numbers across their three declaration sites; `git diff --stat` against main — expected scope: 8-or-fewer SKILL.mds, README.md, 3×(plugin.json, package.json, CHANGELOG.md), marketplace.json, and nothing else. *(validator: frontend-design + react-19 exit 0, the 6 deviation skills exit 1 with exactly the accepted message; 9/9 version declarations agree; scope: 15 files = 4 SKILL.mds + README + 3×3 release files + marketplace.json, 43+/10−)*
- [x] Read the full branch diff against the Success Criteria list; flip plan-level criteria with evidence notes. *(verifier initially FAILed this task — the annotation predated the flips; criteria flipped post-report with verifier evidence, resolving the report's only FAIL)*

#### Verification

- [x] Grep `3.1.0` / `0.4.1` / `0.10.0` — expected: each appears in exactly its bundle's plugin.json + package.json + marketplace entry (+ CHANGELOG heading). *(pass — 9 hits, 3 per bundle, lines pinned in the sweep output)*
- [x] Read each CHANGELOG top entry — expected: Keep-a-Changelog format, execution date, categories matching the shipped work. *(pass — 2026-07-12; pm Added / et Fixed / exp Added)*
- [x] `skills-ref validate` all 8 — expected: zero findings beyond the Accepted Deviations list. *(pass — end-state identical to the accepted list)*
- [x] `git diff --stat` — expected: exactly the scope listed in the sweep task. *(pass — 15 files, nothing outside the declared scope)*

#### Acceptance Criteria

- All three bundles release consistently; CHANGELOGs are accurate; no file outside the declared scope changed.
- The validator end-state and Accepted Deviations list are recorded where Phase 8 inherits them.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the plan's single safety net: semantic review of compatibility-claim modesty and README/CHANGELOG accuracy, plus independent re-derivation of the validator end-state and triage rationales before /dr-ship -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(validator end-state = Accepted Deviations exactly; greps pass; fidelity check: all 10 deletion lines accounted as version strings + the relocated line — 2026-07-12)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(spawned 2026-07-12, whole-branch scope; report: every task, verification item, and Success Criterion PASS except one procedural FAIL — the criteria flips hadn't happened yet)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the verifier's reasoning. *(applied: six Success Criteria flipped with verifier evidence, resolving the single FAIL; its dangling-pointer observation resolves with the Completion move to completed/)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in Phase 8 or the Retro. *(zero UNVERIFIEDs; Phase 8 inherits only what was planned: the validator exit-code expectation and the two Pi-side [?] checks from plan 004)*

## Refinement History

- **2026-07-12:** Initial plan creation.
- **2026-07-12:** Question resolution: 0 blocking + 0 non-blocking to resolve (all decisions locked at planning); the 1 `[?]` assumption (skills-ref unknown-field behavior) deliberately left for Phase 1's first validator run; Verification Policy reviewed and kept Adaptive.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

*(populated at completion, 2026-07-12 — created, question-resolved, and executed same-day; three commits `0c4822f`/`833387e`/`31412b7`; single verifier gate, whole-branch scope, one procedural FAIL resolved in place)*

### What worked

- **Planning-time probes killed every open question before execution.** `npm view` (validator exists), the spec fetch (`compatibility` = ≤500-char prose string), and the frontmatter grep (full field inventory, names match dirs) left zero blocking and zero non-blocking questions — the smallest resolution round of the workstream, and execution hit no surprises beyond the one pre-declared `[?]`.
- **The pre-declared `[?]` with a both-ways triage rule.** The validator turned out to hard-error on unknown fields — the "wrong" guess — and nothing about the plan changed, because "clean = zero findings beyond the Accepted Deviations list" was defined before the first run.
- **Single-verifier-gate policy** (phases 1–2 self-review, phase 3 whole-branch verifier) was right-sized for a 15-file additive branch: the verifier still re-derived everything, including clause-level grounding of all three compatibility strings against the skills' actual prose.
- **The claim rule made an overstatement visible at edit time:** dr-ship's drafted string claimed gh + GitHub remote as skill-wide requirements; ship.md scopes them to the PR step. The adjustment was documented in the task annotation for the verifier to judge — it confirmed the adjusted string as more accurate.

### What didn't

- **A task annotation written before its work existed:** "flipped below with verifier evidence" was recorded while the criteria were still `[ ]` (deferred pending the report), so the verifier correctly FAILed the task. Honest annotations describe state, not intent.
- **The workstream-doc pointer named the `completed/` path while the plan still sat in `in_progress/`** — correct only because the Completion move happened; the verifier rightly flagged it as a would-be dangling pointer.

### Learnings

- **skills-ref 0.1.5 facts for future plans:** hard-errors (exit 1) on any unknown frontmatter field; does not inspect `allowed-tools` content; `compatibility` and `metadata` are accepted. Phase 8 should expect exit-1 on the six extension-field skills with exactly one message.
- **When a task's completion depends on the verifier's own report, phrase the task "flip after the report"** — otherwise the gate manufactures a FAIL out of correct sequencing.
- **Write cross-file pointers to a file's *final* path only in the same edit batch as the move**, or point at the current path — a verifier will catch the gap, but only if one runs.
