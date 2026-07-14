# Plan: Skill Portability Phases 1–3 — Relative Paths, Conditional Prose, Model Neutrality

## Metadata

- **Number:** 002
- **Status:** completed
- **Created:** 2026-07-10
- **Last refreshed:** 2026-07-10
- **Refinement count:** 0
- **Plan type:** migration/infra/refactor
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A — source plan: `.research/skill-portability-plan.md` (Phases 1–3 + Phase 0 capability matrix in its Appendix); original path research: `.research/skill-portability-agentskills.md`

## Executive Summary

Make every skill in this repo portable to harnesses implementing the Agent Skills spec (target: Pi.dev) while remaining first-class in Claude Code — the first three (non-breaking) phases of the skill-portability plan. Three workstreams: **(1)** replace all `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PLUGIN_ROOT}` path variables with skill-root-relative paths (62 occurrences / 17 skill files, re-measured 2026-07-10 in the bundles/ layout); **(2)** make harness-specific capabilities conditional in prose — AskUserQuestion (~32 sites), plan-verifier subagent spawns (9 sites), dr-research's web-access requirement, `$ARGUMENTS` tolerance, a branded-prose sweep, and a load-bearing audit that every dr-ship safety rule enforced by `allowed-tools` also exists in prose (Pi parses but does NOT enforce `allowed-tools`); **(3)** make dr-prd's AI-feature sections provider-neutral.

Ships as **one PR** with minor version bumps for the two changed bundles (project-management 2.4.0 → 2.5.0, experimental 0.7.0 → 0.8.0; engineering-tools is expected clean — confirmed by grep, no bump). The hard constraint throughout: **no behavior change on Claude Code** — graceful-degradation phrasing only, verified by a fresh-install smoke test before shipping. Breaking work (`_claude/` → `_project/` rename, AGENTS.md-canonical dr-init, mvp structural port, Pi testing) is explicitly out of scope — that's portability Phases 4–8.

## Current State

- The repo is in the post-restructure `bundles/` layout (PR #1, merged 2026-07-09): `bundles/{project-management,engineering-tools,experimental}` at 2.4.0 / 0.4.0 / 0.7.0, dual manifests per bundle, root Pi catalog with `pi.skills: ["bundles/*/skills/*"]`, marketplace named `ai-tools`.
- Skills reference their own files via `${CLAUDE_SKILL_DIR}` (and `${CLAUDE_PLUGIN_ROOT}`), a Claude Code-only substitution. Fresh inventory (2026-07-10): **62 occurrences across 17 skill files** (was 66/19 pre-restructure). Live evidence of the leak: during this plan's own creation, the harness substituted `${CLAUDE_SKILL_DIR}` tokens *inside the skill arguments* into absolute old-repo paths — exactly the class of non-portable coupling Phase 1 removes.
- Phase 0 (Pi capability audit, complete 2026-07-06, matrix in the source plan's Appendix) established the facts this plan builds on: Pi implements a lenient superset of the Agent Skills spec; honors `disable-model-invocation`; silently ignores unknown frontmatter; does **not** substitute `$ARGUMENTS` (appends args as `User: <args>`); does **not** enforce `allowed-tools`; has no core AskUserQuestion/subagent/web tools (all via packages).
- Claude Code announces each skill's base directory at invocation time ("Base directory for this skill: …") — observed live in this session. Pi likewise injects the skill path. Both harnesses therefore give the model what it needs to resolve skill-root-relative paths.
- Dion's own dev install intentionally still runs these skills from the old `claude-plugins` repo (frozen, stable) — his live tooling is unaffected by this work. Verification uses an isolated `CLAUDE_CONFIG_DIR` profile, the pattern established in plan 001.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- [x] Claude Code announces the skill base directory when a skill is invoked, so prose can say "resolve paths against the skill's base directory" without `${CLAUDE_SKILL_DIR}` — observed directly in this session's skill invocations.
- [x] Pi parses but does not enforce `allowed-tools`, so dr-ship's safety model must live in prose — Phase 0 matrix, evidence: pi-mono `skills.ts`.
- [x] Pi does not substitute `$ARGUMENTS` in skills (args appended as `User: <args>` after skill content) — Phase 0 matrix, evidence: pi-mono `docs/skills.md`.
- [x] Unknown frontmatter fields (`effort`, `argument-hint`, `disable-model-invocation`) are silently ignored by Pi, and `disable-model-invocation` is natively honored — Phase 0 matrix; no frontmatter removal needed in this plan.
- [x] Claude Code models reliably resolve bare relative references (e.g., `references/create-mode.md`) against the announced base directory without the explicit variable — **validated 2026-07-10 by the Phase 5 smoke test (direct evidence):** the smoke session quoted its own resolution — "I resolved it manually to the absolute path S:\dev\repos\dionridley\ai-tools\bundles\project-management\skills\dr-plan\references\create-mode.md rather than relying on any ${CLAUDE_SKILL_DIR} variable."
- [x] engineering-tools skills (frontend-design, react-19) contain zero Claude-isms and need no changes — confirmed by Phase 4's five-pattern grep (zero hits); version stays 0.4.0.
- [x] No test suite, lint, or typecheck exists in this repo (markdown-only) — held throughout; DoD ran as `claude plugin validate` ×4 + regression greps at every gate.
- [x] Migration-overlay DoD adjustments (schema migrations, feature flags) do not apply — held: text-only refactor, no data, no flags (verifier-confirmed diff surface).

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

*(none — scope, sequencing, and constraints were locked in conversation 2026-07-10)*

### Non-Blocking

Can resolve during implementation.

- [x] AskUserQuestion conditional phrasing — **RESOLVED 2026-07-10 (Phase 2): convention line per SKILL.md** (5 files; dr-research has no call sites), no inline call-site rewording needed — existing "Use AskUserQuestion:" phrasing reads correctly under the convention. Verifier confirmed every call site is covered. Record in Retro.
- [x] Root CLAUDE.md path-variable documentation — **RESOLVED 2026-07-10 (Phase 1): relative-path-first.** Skills-vs-Commands table row and Skill Structure section now prescribe relative paths; remaining variable mentions are labeled commands-only/do-not-use. Verifier confirmed.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [x] Zero `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PLUGIN_ROOT}` occurrences remain in `bundles/*/skills/**` — all intra-skill references are skill-root-relative (CHANGELOG history entries exempt). *Verified at every gate; 46/46 relative targets exist.*
- [x] Every AskUserQuestion, plan-verifier spawn, and web-access dependency is phrased capability-conditionally with a stated fallback, per the convention decided in Phase 2. *Phase 2 verifier PASS across all three surfaces.*
- [x] dr-ship safety audit complete: every rule enforced by its `allowed-tools` frontmatter is verifiably present in prose (audit table in the plan/PR as evidence). *14 = 14 bidirectional (Phase 2 verifier); mapping in `f74e020` commit body; table goes in the PR description at ship.*
- [x] `$ARGUMENTS` surrounding prose tolerates non-substituting harnesses in every SKILL.md that uses it. *5 of 5 — the plan's "seven" overcounted; dr-init and both engineering-tools skills contain no `$ARGUMENTS`.*
- [x] `bundles/project-management/skills/dr-prd/references/ai-feature-sections.md` is provider-neutral; the exact-model-ID discipline rule is retained. *Phase 3 greps confirm.*
- [x] Branded-prose sweep done (19 hits / 12 files measured 2026-07-10): reworded to "the agent" / "your harness" except sites where Claude Code is genuinely meant; `CLAUDE-template.md` deferred to portability Phase 5 (documented). *Phase 2 verifier PASS; zero bare "ask Claude"/"Claude's" remain.*
- [x] engineering-tools confirmed clean by grep — zero content changes, version stays 0.4.0. *Phase 4 five-pattern grep: zero hits.*
- [x] Versions consistent everywhere: project-management 2.5.0 and experimental 0.8.0 in plugin.json + package.json + marketplace.json entry + CHANGELOG entry each; `claude plugin validate` green on all three bundles and the marketplace. *Phase 4 + Phase 5 verifier both confirm.*
- [x] Fresh-install smoke test (isolated profile) shows no Claude Code behavior change: dr-plan routes to its mode reference via relative path, dr-prd trigger gate fires, no literal `${CLAUDE_SKILL_DIR}` appears in loaded skill text. *All three checks passed with quoted session evidence; one documented caveat — dr-prd's token→proceed leg evidenced via dr-plan's identical gate (dr-prd gate text byte-unchanged from 2.4.0).*
- [x] `.research/skill-portability-plan.md` statused: Phases 1–3 complete (local, gitignored bookkeeping). *Status line + per-phase sections updated with commits and corrections.*
- [x] Single branch ready for `/dr-ship` (one PR, minor bumps only). *4 commits ahead of main, tree clean, no waivers needed — Phase 5 verifier confirmed.*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — N/A: markdown-only repo, no test suite (see Assumptions).
- Manifest + skill validation: `claude plugin validate bundles/project-management`, `claude plugin validate bundles/engineering-tools`, `claude plugin validate bundles/experimental`, and marketplace validation from the repo root — all pass with zero errors.
- Path-variable regression grep: `grep -rn "CLAUDE_SKILL_DIR\|CLAUDE_PLUGIN_ROOT" bundles/*/skills/` — expected empty from Phase 1's gate onward (not applicable before).
- ~~Typecheck clean~~ — N/A: no type system.

Migration-overlay DoD adjustments (migration tooling registration, feature-flag states) do not apply to this text-only refactor.

## Rollback Plan

What it takes to undo this work at each phase boundary. Text-only changes on a single feature branch — rollback is uniformly cheap; no data, no schema, no flags.

### Rollback by phase

- **Phases 1–4:** `git reset` / `git revert` the branch commits, or delete the branch. Nothing outside the repo is touched.
- **Phase 5 (verify):** read-only against an isolated profile — nothing to roll back; delete the throwaway `CLAUDE_CONFIG_DIR` profile.
- **Post-merge:** `git revert` of the squash commit restores main exactly (text-only, no migrations). Note: Pi consumers track main unversioned, so a bad main is immediately visible to any future `pi install git:` consumer — which is exactly why the Phase 5 smoke test gates the merge. (Today there are no known Pi consumers; Claude consumers are pinned to released versions until they update.)

### Rollback validation

- [x] Confirmed: no scripts needed — `git revert` of a text-only squash commit is the entire procedure. *Diff verified text-only (modifications only, no adds/deletes/renames) at Phases 4 and 5.*
- [x] Working tree clean before each phase's first commit, so `git checkout -- .` can abandon any in-progress phase. *Held at every phase boundary.*

### Point of no return

None before the PR merges. Even post-merge, revert is lossless. The practical gate is the Phase 5 smoke test: do not ship if it fails.

## Implementation Plan

### Phase 1: Path Variables → Skill-Root-Relative Paths

#### Entry Preconditions

- [x] Feature branch `002-skill-portability-phases-1-3` created from up-to-date main; working tree clean.
- [x] Re-run the inventory grep (`grep -rn "CLAUDE_SKILL_DIR\|CLAUDE_PLUGIN_ROOT" bundles/`) and confirm it matches the table below (62 occurrences / 17 skill files, + 1 exempt CHANGELOG hit). *Matched exactly, 2026-07-10.*
- [x] Read `.research/skill-portability-agentskills.md` — its migration steps and the Bash-command cwd nuance are the source material for this phase.

#### Reference inventory (measured 2026-07-10)

| File | Hits |
|---|---|
| project-management/skills/dr-research/SKILL.md | 13 |
| project-management/skills/dr-plan/SKILL.md | 10 |
| project-management/skills/dr-prd/SKILL.md | 5 |
| project-management/skills/dr-init/SKILL.md | 4 |
| project-management/skills/dr-prd/references/create-mode.md | 4 |
| project-management/skills/dr-ship/SKILL.md | 3 |
| project-management/skills/dr-plan/references/create-mode.md | 3 |
| project-management/skills/dr-init/references/state-b-update.md | 2 |
| project-management/skills/dr-ship/references/{preflight,ship}.md | 1 + 1 |
| project-management/skills/dr-init/references/{state-a-fresh,state-c-uninitialized}.md | 1 + 1 |
| experimental/skills/mvp/SKILL.md | 4 |
| experimental/skills/mvp/references/build.md | 4 |
| experimental/skills/mvp/references/start.md | 3 |
| experimental/skills/mvp/references/summary.md | 2 |
| experimental/skills/mvp/references/conventions/elixir.md | 1 |
| *(exempt: experimental/CHANGELOG.md ×1 — release history, do not edit)* | — |

#### Tasks

- [x] Establish the replacement idiom and apply it uniformly: prose references become skill-root-relative (`references/create-mode.md`, `templates/plan-base.md`), and each SKILL.md that routes to other files carries one convention sentence: paths are relative to this skill's directory, which the harness announces when the skill loads — resolve against it. *Verifier PASS: convention line present in all six routing SKILL.mds.*
- [x] Rewrite all prose references in the 12 project-management files per the inventory table (48 occurrences). *Verifier PASS: full diff reviewed line-by-line; zero occurrences remain.*
- [x] Rewrite all prose references in the 5 experimental/mvp files (14 occurrences) — mechanical replacement only; mvp's structural port is Phase 6, out of scope. *Verifier PASS.*
- [x] Handle Bash-command call sites separately (the cwd nuance): commands run from the project root, not the skill directory, so any shell command embedding a skill path (dr-research's Phase 3.5 asset-copy is the known case; sweep for others) must instruct the agent to construct an absolute path from the announced skill base directory before running. Do not leave a bare relative path inside a command template. *Verifier PASS: dr-research uses `<skill-dir>` + resolve-to-absolute instruction; sweep found no other bash-embedded skill paths.*
- [x] `${CLAUDE_PLUGIN_ROOT}` sites (references crossing skill boundaries, e.g. dr-ship → dr-plan's summary-mode.md): reword as relative to the *bundle* root or as a sibling-skill reference (`../dr-plan/references/summary-mode.md` from the skill root), whichever reads unambiguously — the target must stay resolvable in a bare-directory install where only `skills/` is copied. If a cross-skill reference cannot survive a bare per-skill copy, note it as a known limitation inline (one sentence), not a redesign. *Verifier PASS: sibling reference + bundle-coupling note in SKILL.md; ship.md carries the shorter sibling note (accepted — plan required one sentence).*
- [x] Update root CLAUDE.md guidance per the [OPEN] decision: relative-path-first documentation for skill-internal references (Skills-vs-Commands table row, progressive-disclosure mentions). *Verifier PASS: relative-path-first; remaining variable mentions labeled commands-only/do-not-use.*
- [x] Commit as one commit (`git add` + commit; content-only diff). *`ee8b742`: 18 files, 71+/70−.*

#### Verification

- [x] Run `grep -rn "CLAUDE_SKILL_DIR\|CLAUDE_PLUGIN_ROOT" bundles/*/skills/` — expected: zero matches. *Verifier PASS.*
- [x] Run `grep -rn "CLAUDE_SKILL_DIR\|CLAUDE_PLUGIN_ROOT" bundles/ CLAUDE.md` — expected: only the exempt experimental/CHANGELOG.md history line, plus (if the [OPEN] decision keeps them) clearly-labeled legacy mentions in root CLAUDE.md. *Verifier PASS: CHANGELOG.md:25 + labeled CLAUDE.md:64/:106.*
- [x] Read each edited SKILL.md routing section — expected: every referenced file path actually exists relative to that skill's directory (spot-check with Glob per skill). *Verifier PASS: 46/46 targets exist.*
- [x] Read dr-research's asset-copy instruction — expected: it explicitly constructs an absolute path from the announced base directory before the shell command runs. *Verifier PASS: SKILL.md:238.*

#### Acceptance Criteria

- All intra-skill file references resolve relative to the skill root; no Claude-only path variable remains in skill content.
- Bash-command call sites never rely on cwd being the skill directory.
- Reference targets verified to exist (no typo'd relative paths introduced).

#### Phase Exit Gate

<!-- verifier-recommendation: yes — touches the routing mechanism of every skill; a single mis-reworded path silently breaks a skill's progressive disclosure, and "does the reword preserve meaning" is semantic, not grep-able -->

- [x] Run Definition of Done commands (see plan header). All must pass. *All four `claude plugin validate` runs green, 2026-07-10.*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *Ran with fresh context against commit `ee8b742`.*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *All items PASS — nothing withheld.*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *No UNVERIFIEDs. Verifier observation accepted: ship.md's cross-skill note names the sibling skill only (full bundle-coupling note lives in dr-ship SKILL.md). The `[?]` relative-path assumption remains open by design until Phase 5's smoke test.*

### Phase 2: Capability-Conditional Prose & dr-ship Safety Audit

#### Entry Preconditions

- [x] Phase 1 gate passed — prose edits in this phase reference files using the new relative idiom.
- [x] Working tree clean (Phase 1 committed). *Verifier's .gitignore observation did not reproduce — `git status --porcelain` empty.*

#### Tasks

- [x] Resolve the AskUserQuestion [OPEN] decision, then apply it: convention line in each affected SKILL.md's Operating Principles + inline edits only where needed. Affected surface (measured 2026-07-10): ~32 sites / 14 skill files — dr-ship (SKILL + preflight), dr-plan (SKILL + create/questions/refine/summary modes), dr-prd (SKILL + refine-mode), dr-init (state-b, state-c), mvp (SKILL, start, build). *Verifier PASS: convention line in all 5 SKILL.mds; every call site covered; no inline edits needed.*
- [x] plan-verifier spawn sites (9 sites / 5 files: dr-ship SKILL + preflight, dr-plan create-mode + questions-mode + templates/plan-base.md): add the conditional — if subagent spawning is available, spawn the verifier; otherwise run the verifier's checklist inline in a fresh, skeptical pass. The agent *definition* (`agents/plan-verifier.md`) stays Claude-format — do not restructure it in this plan. *Verifier PASS: all 5 imperative sites carry the fallback; 4 descriptive mentions correctly unchanged; the 3 gate templates word-identical.*
- [x] dr-research: declare the web-access requirement up front in SKILL.md — this skill requires web search/fetch; if the harness lacks it, stop with a clear message naming a remedy (e.g., Pi: `pi install npm:pi-web-access`) rather than degrading silently. *Verifier PASS: SKILL.md:14, before any phase.*
- [x] **dr-ship safety audit (load-bearing):** enumerate every restriction expressed by dr-ship's `allowed-tools` frontmatter (Bash limited to specific git/gh subcommands + rm; no arbitrary shell), map each to the prose rule that states it, and add prose for any rule that exists only in frontmatter. Record the mapping as a small table in the PR description or commit body — it is this task's evidence. *Verifier PASS: 14 frontmatter patterns = 14 commands in new Principle 11, bidirectional; prose strictly stricter (bans force push/history rewrite/branch deletion). Mapping in `f74e020` commit body as prose — include as a real table in the PR description at ship time.*
- [x] `$ARGUMENTS` tolerance sweep: in all SKILL.md files that use it, reword surrounding prose to "provided as `$ARGUMENTS` or in the invoking message" (Pi appends args instead of substituting). *Verifier PASS with documented deviation: 5 SKILL.mds use `$ARGUMENTS` (not 7 as planned — dr-init and both engineering-tools skills have none); all 5 carry tolerance at first use.*
- [x] Branded-prose sweep: 19 hits / 12 skill files → "the agent" / "your harness", except sites where Claude Code is genuinely meant (e.g., dr-init explaining the CLAUDE.md pointer). Defer `dr-init/templates/CLAUDE-template.md` (2 hits) to portability Phase 5 (AGENTS.md work) to avoid rewriting the template twice — leave a one-line note in the plan Retro. *Verifier PASS: 12 sites reworded/conditionalized; survivors = CLAUDE-template (Phase 5) + mvp start.md session mechanics ×5 (Phase 6); zero bare "ask Claude"/"Claude's" remain.*
- [x] Trigger Validation gates (dr-plan SKILL.md, dr-prd SKILL.md): add one harness-agnostic sentence — the `/dr-plan` / `/dr-prd` token is a convention in the user's message, not a harness mechanism (Pi's explicit invocation is `/skill:dr-plan`). *Verifier PASS: dr-plan:22, dr-prd:21.*
- [x] Commit as one commit. *`f74e020`: 15 files, 37+/23−.*

#### Verification

- [x] Grep `AskUserQuestion` in `bundles/*/skills/` — expected: every hit is either inside a conditional/convention construct or immediately adjacent to fallback phrasing. *Verifier PASS (convention-line construct per resolved decision).*
- [x] Grep `plan-verifier|subagent_type` in `bundles/*/skills/` — expected: all spawn sites carry the inline-fallback conditional. *Verifier PASS: 5 imperative sites have it; 4 descriptive mentions are not spawn instructions and correctly don't.*
- [x] Read dr-ship SKILL.md + the audit table — expected: every `allowed-tools` restriction has a matching prose rule; count in table equals count of distinct restrictions in frontmatter. *Verifier PASS: 14 = 14, both directions.*
- [x] Read dr-research SKILL.md top section — expected: web-access requirement declared before any phase instructions. *Verifier PASS.*
- [x] Grep `\$ARGUMENTS` in `bundles/*/skills/*/SKILL.md` — expected: each file that uses it has tolerance phrasing at first use. *Verifier PASS: 5/5 (plan's "7" overcounted; 2 SKILL.mds + dr-init contain no `$ARGUMENTS`).*
- [x] Grep `Claude Code|Claude's|ask Claude` in `bundles/*/skills/` — expected: only genuinely-meant sites + deferred CLAUDE-template.md remain; each survivor justifiable in one clause. *Verifier PASS: all survivors justified.*

#### Acceptance Criteria

- A harness with none of AskUserQuestion / subagents / web tools gets explicit instructions for what to do instead at every dependency point — no silent dead ends.
- dr-ship is exactly as safe on a harness that ignores `allowed-tools` as the prose can make it: no rule lives only in frontmatter.
- No behavior change for Claude Code: conditional phrasing always names the Claude tool as the primary path.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the dr-ship safety audit is a semantic completeness check (frontmatter→prose mapping) that greps can't confirm, and dr-ship pushes/publishes: highest blast radius in the repo -->

- [x] Run Definition of Done commands (see plan header). All must pass. *All four validations green + Phase 1 regression grep still zero.*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *Ran fresh-context against `f74e020`; full diff read hunk-by-hunk.*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *All PASS — nothing withheld.*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *Carried forward: (1) include the dr-ship audit mapping as a real table in the PR description at ship time; (2) Retro notes queued — AskUserQuestion resolution, CLAUDE-template deferral, 7→5 `$ARGUMENTS` overcount.*

### Phase 3: Model Neutrality in dr-prd AI Sections

#### Entry Preconditions

- [x] Phase 2 gate passed; working tree clean.

#### Tasks

- [x] Edit `bundles/project-management/skills/dr-prd/references/ai-feature-sections.md`:
  - Discovery question (~L9) → provider-neutral ("Which provider/model are you targeting?" instead of "Opus / Sonnet / Haiku / something else?"). *Done: names Anthropic/OpenAI/Google/open-weights as co-equal options.*
  - Example model IDs (~L29–30) → span providers or use `<exact-model-id>` placeholders. *Done: `<exact-model-id>` placeholders with one labeled example.*
  - "Use exact model IDs" rule (~L124) → **keep** the discipline, make the examples provider-mixed or placeholder. *Done: rule retained verbatim in spirit; examples labeled "Anthropic's … ; other providers have their own ID schemes."*
- [x] Commit as one commit. *`9bedc30`: 1 file, 4+/4−.*

#### Verification

- [x] Grep `Opus|Sonnet|Haiku|claude-` in `bundles/project-management/skills/dr-prd/` — expected: zero prescriptive-default hits; Anthropic models may remain only as one example among providers or not at all. *Confirmed: 2 hits, both labeled provider examples behind placeholders; Opus/Sonnet/Haiku discovery phrasing gone.*
- [x] Read the exact-model-ID rule — expected: rule retained, examples neutral. *Confirmed.*

#### Acceptance Criteria

- A user targeting any provider gets the same quality of discovery questions and the same exact-model-ID discipline; nothing steers them to Anthropic by default.

#### Phase Exit Gate

<!-- verifier-recommendation: no — single documentation file; the Verification greps + read cover the full surface -->

- [x] Run Definition of Done commands (see plan header). All must pass. *All four validations green post-commit.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *All three sub-edits verified by grep + read; nothing skipped.*

### Phase 4: Release Ritual & engineering-tools Clean Confirmation

#### Entry Preconditions

- [x] Phases 1–3 gates passed; all skill-content edits final (no content changes after versions are stamped).
- [x] Working tree clean.

#### Tasks

- [x] Confirm engineering-tools is clean: grep `CLAUDE_SKILL_DIR|CLAUDE_PLUGIN_ROOT|AskUserQuestion|\$ARGUMENTS|Claude Code` in `bundles/engineering-tools/skills/` — expected zero skill-content hits. If clean: no changes, no bump, record the evidence. *Clean: zero matches (also swept `Claude's|ask Claude`). No changes; stays 0.4.0.*
- [x] Bump **project-management 2.4.0 → 2.5.0** in all three declarations: `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, its entry in `.claude-plugin/marketplace.json`.
- [x] Bump **experimental 0.7.0 → 0.8.0** in the same three locations for that bundle.
- [x] CHANGELOG entries (dated, Keep-a-Changelog categories) in each changed bundle's own CHANGELOG.md — Changed: relative paths per Agent Skills spec, capability-conditional prose, `$ARGUMENTS` tolerance, branded-prose sweep; project-management additionally: dr-ship safety-prose audit, dr-research web-requirement declaration, dr-prd provider neutrality. *Both written, dated 2026-07-10; pm adds Principle 11 under Added.*
- [x] Update `.research/skill-portability-plan.md` (local, gitignored): mark Phases 1–3 complete with date, note the CLAUDE-template.md deferral to Phase 5 and any inventory deltas. *Status line + Phase 1/2/3 sections updated with commits, deferrals, and the 66→62 / 7→5 corrections.*
- [x] Commit as one commit (versions + changelogs only). *`305d818`: 7 files, 31+/6−.*

#### Verification

- [x] Grep `2.5.0` across `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, `.claude-plugin/marketplace.json` — expected: exactly one hit each. *Confirmed (1/1/1).*
- [x] Grep `0.8.0` across the experimental trio — expected: exactly one hit each. *Confirmed (1/1/1).*
- [x] Grep `0.4.0` for engineering-tools trio — expected: unchanged everywhere. *Confirmed: marketplace line 21 still 0.4.0; bundle manifests untouched by the commit.*
- [x] Run all `claude plugin validate` DoD commands — expected: zero errors, zero new warnings. *All four green.*
- [x] Read both CHANGELOGs — expected: new top section `## [X.Y.Z] - 2026-MM-DD` with categorized entries. *`## [2.5.0] - 2026-07-10` and `## [0.8.0] - 2026-07-10` in place.*

#### Acceptance Criteria

- Version agreement across all four locations per changed bundle (plugin.json, package.json, marketplace entry, CHANGELOG heading).
- engineering-tools verifiably untouched (clean grep evidence recorded) or properly bumped if the grep surprised us.
- Repo validates green — shippable at this boundary even before the smoke test.

#### Phase Exit Gate

<!-- verifier-recommendation: no — purely mechanical consistency checks; the Verification greps + validate commands cover the entire surface deterministically -->

- [x] Run Definition of Done commands (see plan header). All must pass. *All four validations green after the release commit; Phase 1 regression grep still zero.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *Every task verified by grep/validate output; the engineering-tools no-bump branch of the first task is the one that executed.*

### Phase 5: Verify in Claude Code (Fresh-Install Smoke Test)

*Adapted Verify-in-Prod: "production" here is a real Claude Code session running the changed skills from a fresh install. This phase proves the plan's core constraint — no behavior change on Claude.*

#### Entry Preconditions

- [x] Phase 4 gate passed (validate green, versions stamped).
- [x] Isolated test profile available: fresh `CLAUDE_CONFIG_DIR`, this repo added as a local marketplace, project-management installed from the branch at **2.5.0** (plan 001's pattern; credentials step is user-run via `!`). *Profile: `scratchpad/smoke-002/profile`. experimental not installed — smoke checks 1–3 only exercise project-management; mvp changes are covered by the installed-cache greps and Phase 1/2 verifier passes.*
- [x] **User availability:** the interactive smoke pass is driven by Dion in a separate session — the one deliberately user-interactive step in this plan. *Completed 2026-07-10; results quoted back in-conversation.*

#### Tasks

- [x] Set up the isolated profile + a throwaway smoke project; hand Dion a short smoke script (exact commands + what to watch for). *Marketplace added from local path, plugin installed; cache verified: version 2.5.0, relative paths served, zero `${CLAUDE_SKILL_DIR}` in skill instructions (only the CHANGELOG history mention).*
- [x] Smoke 1 — **relative-path routing (the Phase 1 risk):** invoke `/dr-plan` with a trivial create request; confirm the skill loads `references/create-mode.md` and `templates/plan-base.md` via relative paths (visible in the tool-call flash or by asking the session what it read). This is the direct test of the `[?]` assumption. *PASS — smoke session's own account: it read create-mode.md by resolving the relative path against the announced base directory ("Base directory for this skill: S:\dev\repos\...\skills\dr-plan").*
- [x] Smoke 2 — **trigger gate + conditional prose:** invoke `/dr-prd` conversationally-adjacent (no literal token) and confirm the gate still stops it; then with the token and confirm it proceeds. *PASS, evidence split across the sibling gates: "Can you draft a PRD for a todo app?" (no token) → dr-prd NOT invoked; session answered inline and offered the skill by name. Token→proceed evidenced via `/dr-plan` in the same session (identical gate pattern, same commit): skill loaded and routed to CREATE. A dr-prd-specific token run was not separately performed.*
- [x] Smoke 3 — **no variable leakage:** in the smoke session, confirm no literal `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PLUGIN_ROOT}` text appears in loaded skill instructions (ask the session to quote its routing section). *PASS — session quoted the full Route section verbatim (relative paths + convention sentence) and stated: "No — ${CLAUDE_SKILL_DIR} does not appear anywhere in my instructions."*
- [x] Read-through (no execution): dr-ship SKILL.md + preflight as installed — safety prose present, allowed-tools intact; dr-research SKILL.md — web requirement declared; asset-copy instruction constructs absolute path. *All confirmed against the installed cache copy: allowed-tools frontmatter present, Principle 11 at :55, preflight fallback at :26, web requirement at :14, 8 `<skill-dir>` placeholders.*
- [x] Confirm rollback still trivial: branch diff is text-only (`git diff main --stat` — no non-markdown/json files beyond manifests). *30 files: bundle markdown + root CLAUDE.md + exactly 5 version-bearing JSONs (marketplace, 2× plugin.json, 2× package.json — plan's "three" undercounted; the two Pi package.json files are also version-bearing). Nothing else.*
- [x] Tear down the isolated profile (plan 001 lesson: bash `rm -rf` for long paths; smoke project dir may need the terminal closed first). *Profile deleted (including the user-copied credentials file). The empty smoke `project/` dir is locked by the still-open smoke terminal — exactly the 001 pattern; harmless scratchpad content, deletable after that terminal closes.*

#### Verification

- [x] Smoke session evidence (Dion's report or quoted output) — expected: create-mode.md reached via relative path; trigger gate behavior unchanged; no variable leakage. *All three delivered as quoted output, 2026-07-10. Bonus finding: local-path marketplace installs serve the repo source live (announced base dir = repo path, not the plugin cache).*
- [x] Run `git diff main --stat` — expected: only `bundles/**` markdown + the version-bearing json files + root CLAUDE.md. *Confirmed: 30 files — bundle markdown, CLAUDE.md, and exactly 5 manifests (marketplace, 2× plugin.json, 2× package.json).*

#### Acceptance Criteria

- All three smoke checks pass with direct evidence (not equivalence-only inference — plan 001 retro lesson).
- Behavior on Claude Code is indistinguishable from 2.4.0 except for intended prose changes.
- Branch is ready for `/dr-ship` with no waivers.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — final safety net before shipping (overlay mandate); smoke-test evidence needs skeptical semantic evaluation, and this gate is what protects Pi's track-main consumers -->

- [x] Run Definition of Done commands (see plan header). All must pass. *All four validations green; regression grep zero — re-run independently by the verifier.*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *Ran fresh-context; re-verified all mechanical facts itself and skeptically evaluated the smoke evidence.*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *All items PASS. One documented caveat retained on Smoke 2 (see task annotation): dr-prd's token→proceed leg is evidence-by-equivalence (direct on dr-plan; dr-prd gate text + frontmatter byte-unchanged from 2.4.0). Recorded for the Retro and PR description.*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *Verifier's tidy-ups applied (assumptions + rollback-validation boxes flipped at close-out). No UNVERIFIEDs. Carry-forwards to /dr-ship: audit table + Smoke 2 caveat in the PR description.*

## Refinement History

- **2026-07-10:** Initial plan creation.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_claude/plans/in_progress/` to `_claude/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

### What worked

- Fresh-measure-first entry precondition caught the stale inventory (66/19 → actual 62/17) before any editing; the per-file hit table in the plan made Phase 1 a checklist, not a hunt (the 001 retro improvement, applied).
- AskUserQuestion resolution: one convention line per SKILL.md (5 lines) instead of ~28 inline call-site edits — verifier confirmed full coverage; the lean option won cleanly.
- `Edit replace_all` of `${CLAUDE_SKILL_DIR}/` → `` per file made Phase 1 mostly mechanical; only dr-research's Bash block and dr-ship's cross-skill refs needed hand-rewording, exactly as the plan predicted.
- The smoke test produced *direct* evidence for the load-bearing `[?]` assumption on the first attempt — asking the smoke session to quote its own loaded instructions is a cheap, high-signal probe (reusable pattern).
- Verifier gates on 1/2/5 all PASS with zero rework; the Phase 2 verifier's frontmatter-diff check later became the mitigation evidence for the Smoke 2 caveat — layered verification paying off across phases.

### What didn't

- Three plan-prose counts were wrong at execution time: "7 SKILL.mds use `$ARGUMENTS`" (5), "three version-bearing JSONs" (5), "all 9 spawn sites get the fallback" (5 imperative + 4 descriptive). None blocked, all needed in-flight corrections and honest annotations.
- Smoke 2 bundled two observables (gate holds without token; proceeds with token) into one checkbox; the token leg went untested on dr-prd specifically. **Caveat for the PR:** dr-prd token→proceed evidenced via dr-plan's identical gate; dr-prd's gate text and frontmatter are byte-unchanged from 2.4.0.
- Teardown again blocked on the open smoke terminal (001 repeat) — empty `smoke-002/project/` dir left in scratchpad.

### Learnings

- Write smoke checks as one observable per checkbox so partial evidence is visible at flip time instead of surfacing as a verifier caveat.
- Label plan-prose counts as "estimate — re-measure at execution" unless measured the same day in the same layout; only the entry-precondition-gated count (62/17) survived contact.
- The `<skill-dir>` placeholder + "resolve to absolute before running" instruction is the reusable idiom for Bash-embedded skill paths — mvp's Phase 6 port will need it for its PID/process commands.
- Scope regression greps to `skills/` — bundle CHANGELOGs legitimately mention removed variables as history.
- Local-path marketplace installs serve the repo source live (announced base dir = repo path, not the plugin cache) — future smoke tests see edits immediately, no reinstall needed; but it also means a smoke profile is NOT isolation from working-tree changes.
- CLAUDE-template.md branded prose (2 hits) deliberately deferred to portability Phase 5; mvp session-mechanics prose (5 hits) to Phase 6.
