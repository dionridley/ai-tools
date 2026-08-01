# Plan: Harden the Phase Exit Gate Verifier Fallback

## Metadata

- **Number:** 013
- **Status:** completed
- **Created:** 2026-07-31
- **Last refreshed:** 2026-07-31
- **Refinement count:** 1
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Every Phase Exit Gate this plugin generates carries one sentence: *"If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass."* In `planaraid/par` plan 073 an agent that **could** spawn the verifier, and **was** authorized to, read that clause as covering its situation, self-verified, and recorded a pass. Nobody noticed until the user asked directly. When the verifier eventually ran it found a real defect a green test suite had missed. The clause conflates *cannot* with *may not*, and it assumes a binary that isn't harness-neutral — on Pi the verifier agent is unregistered, so the fallback branch is correct-by-design there, which is precisely why the bug is invisible: one clause covers both a defect and a normal operating mode.

The fix is wording plus one new file. The gate becomes three explicit capability-first branches, and — the load-bearing change — an inline fallback must **label itself** in the plan with a fixed `[INLINE FALLBACK YYYY-MM-DD: <condition>]` token, mirroring the `[WAIVED YYYY-MM-DD: reason]` convention `dr-ship` already greps for. This matters because the other two branches are prose guards, and prose guards are exactly what failed in 073; the label is the only part of the change that leaves a durable, greppable artifact after the fact. Had it existed, the 073 incident would have written `[INLINE FALLBACK …: session instruction suggested subagents were not authorized]` into the plan file — visible, honest, and caught on the next read.

Three things ride along. `dr-ship` learns to surface the label, because `--verify` gates a push and a PR and a fallback-labelled gate from an earlier phase currently passes its audit invisibly. The Verification Policy option text is neutralized, since it is the thing carrying the authorization and currently promises Claude-specific behaviour the plugin cannot deliver on Pi. And a new `references/verification-rubric.md` gives the inline branch the skepticism rules it needs — written fresh as a sibling, **not** moved out of `agents/plan-verifier.md`, because stubbing the agent file would risk the delegated path that works today in order to fix the fallback one.

## Current State

**The gate text is duplicated across eight sites**, all word-identical in their fallback clause, all verified at these exact lines on 2026-07-31:

| File | Line | Kind |
|---|---|---|
| `skills/dr-plan/templates/plan-base.md` | 104 | Spawn |
| `skills/dr-plan/references/create-mode.md` | 176 | Spawn |
| `skills/dr-plan/references/questions-mode.md` | 179 | Spawn |
| `skills/dr-plan/templates/plan-base.md` | 105 | Apply |
| `skills/dr-plan/references/create-mode.md` | 177 | Apply |
| `skills/dr-plan/references/questions-mode.md` | 180 | Apply |
| `skills/dr-ship/SKILL.md` | 24 | Skill prose |
| `skills/dr-ship/references/preflight.md` | 26 | Skill prose |

The originating handover listed five. The three **Apply verification report** sites are additions found while verifying it — they are written in branch-1-only language (*"Flip `[x]` only for tasks **the verifier** reports as PASS"*), which has no referent under a fallback. The first six generate text into a plan file; the last two are skill prose instructing the executing agent, and need the same logic phrased differently.

**Three further sites carry the Verification Policy option text:** `plan-base.md:45–47`, `questions-mode.md:135`, `create-mode.md:135`. Option A promises *"Every phase spawns `project-management:plan-verifier`"* — unsatisfiable on Pi as currently registered — and Option C ("Never") is indistinguishable in wording from the labelled inline fallback, though distinguishable in the artifact (`create-mode.md:192` omits the gate tasks entirely under `no`).

**The manifest asymmetry is real.** `bundles/project-management/.claude-plugin/plugin.json:25` registers `./agents/plan-verifier.md`; the root `package.json` — the only manifest Pi reads on a whole-repo install — globs `bundles/*/skills/*` and does not cover `bundles/*/agents/*`.

**A cross-skill reference precedent already exists.** `dr-ship/SKILL.md` documents reading `../dr-plan/references/summary-mode.md`, noting *"both ship together in the `project-management` bundle; a standalone copy of `dr-ship` alone will not resolve it."* This is the established escape from the skill-root rule for same-bundle siblings, and it is what makes a rubric under `dr-plan/references/` reachable from `dr-ship`. It does **not** help a generated plan file, which has no skill-relative anchor at all — resolved in the blocking question below.

**`draft/` and `in_progress/` are empty in this repo**, as they are in `par`. The old clause survives only in nine completed plans, which is correct history and must not be rewritten.

**This plan is generated from the template it fixes**, so its own gates below carry the old wording throughout. That is deliberate and must stay that way: retrofitting them mid-flight would put this plan's gates, the template that generates them, and the `dr-ship` audit that reads them all in motion simultaneously, which is the one configuration where a surprising result cannot be attributed to any single cause. The behavioural evidence comes from Phase 5's negative test instead, on a separately generated plan whose template is already final.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

### Validated

- [x] All five handover sites exist at the stated line numbers, and the three `Apply verification report` sites are real additions — both confirmed by `grep -rn` across `bundles/` on 2026-07-31.
- [x] `draft/` and `in_progress/` are empty here; `grep -rln "harness cannot spawn subagents" _project/plans/` matches only nine files in `completed/`.
- [x] The same-bundle cross-skill reference pattern is established and documented (`dr-ship/SKILL.md`, the `../dr-plan/references/summary-mode.md` note), so `verification-rubric.md` under `dr-plan/references/` is reachable from `dr-ship` by precedent rather than by invention.
- [x] This repo has no automated test, lint, or typecheck suite — markdown and JSON only, root `package.json` carries no `scripts` block. Established in plan 012; the Definition of Done below substitutes the integrity checks that are the real gates, per the base template's guidance.
- [x] The Ship Report is a deterministic fixed-shape template (`dr-ship/references/preflight.md:62–95`) with an explicit rule that row order is fixed and all rows are always present, `Verifier` being conditional on `--verify`. Adding or extending a row is therefore a deliberate template change, not a free addition.
- [x] Pi is installed locally at `~/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent`, so Q2 is answerable from disk without fetching pi-mono.
- [x] The harness prompt line that triggered the incident (*"Do not call the AgentTool unless the user requested it"*) biases but does not block — the handover confirms `Agent` was present and callable throughout, and the verifier ran the moment it was asked for. This plan therefore targets the gate, not the harness.

### Pending / uncertain

These three are empirical and are Phase 1's entire job. They were deliberately **left uncertain** during question resolution on 2026-07-31 rather than confirmed from reasoning — confirming them without observation would be precisely the false-record failure this plan exists to prevent.

- [x] **`Agent(<subagent_type>)` deny-rule syntax remains untested, and the plan no longer depends on it.** Binary inspection of `claude.exe` 2.1.220 found an extractor pulling `subagent_type` for tools named `Agent`/`Task`, beside the equivalent `Skill(name)` extractor, but only observed it feeding a telemetry properties object. **Superseded 2026-07-31:** the unregistered-type mechanism below rejects cleanly, so Candidate A was never run. Recorded as untested rather than confirmed — nothing in this plan rests on it.
- [x] **An unregistered `subagent_type` produces a clean, visible rejection — it does not silently substitute `general-purpose`.** Measured 2026-07-31 in this session: `Agent(subagent_type="project-management:does-not-exist")` returned `Agent type '…' not found. Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, plugin-dev:agent-creator, plugin-dev:plugin-validator, plugin-dev:skill-reviewer, project-management:plan-verifier, statusline-setup`. No agent ran. This is the negative-test mechanism: portable, no settings syntax, no session restart.
- [x] **Pi has no built-in delegation/subagent primitive** (Q2 — settled 2026-07-31 against the installed `@earendil-works/pi-coding-agent` **0.81.1**). The package description lists its tools as "read, bash, edit, write … and session management". Subagents exist only as an **example extension**, `examples/extensions/subagent/`, listed in `docs/extensions.md:2935` and sitting in the examples folder alongside `snake.ts` and `tic-tac-toe.ts` — a demonstration of what `registerTool` + `exec` can build, not a shipped capability. It spawns separate `pi` processes and discovers agent definitions via `getAgentDir()` from **user/project `.pi`-scoped directories, not from installed packages** (`subagent/agents.ts`). Two consequences: on a stock Pi install of this repo, branch 1 is unavailable and the labelled inline fallback is Pi's **permanent** path; and even a user who installs that example extension would not pick up `bundles/project-management/agents/plan-verifier.md`, because nothing scans package `agents/` folders — though the frontmatter format is coincidentally compatible (`name`, `description`, `tools`), so a manual copy into `.pi/agents/` would work. Branch 1 therefore must **not** name a Pi mechanism, and policy options A and B do collapse on Pi.
- [x] **Q1 — whether a whole-repo `pi install git:…` vendors `bundles/*/agents/*` to disk — is answered by inference only.** `_project/docs/pi-extension-pattern.md:82` states `pi update --all` "reconciles the **clone**", implying a full repo clone in which the agent file is present but unregistered. Stated as inference, not verification; it does not change any decision in this plan, since the rubric is written fresh rather than moved.

## Open Questions & Decisions

### Resolved before drafting

Settled with the user on 2026-07-31 and recorded so a later reader does not reopen them:

- **The label is the fix.** Branches 1 and 3 are prose guards asking an agent to correctly classify its own permission state — the exact judgment that failed in 073. Only the label leaves a durable artifact. If one thing ships, it is the token.
- **Authorization wording must not override the harness.** The handover's proposed *"treat it as authorized, not as something needing fresh permission"* is rejected as written: it instructs an agent to override a harness-level withholding, which is worse than the original ambiguity because it is explicit. The permitted assertion is narrower — *the plan is not the thing withholding permission, so do not skip on the plan's account.* Branch 1 must additionally be conditioned on delegation not being withheld by the session.
- **The rubric is a new sibling file, not a move.** Reducing `agents/plan-verifier.md` to a stub that reads a shared rubric would trade a working delegated path for a portability fix. The two audiences genuinely differ: a fresh subagent needs *"a task marked `[x]` is not evidence"*; an in-context agent needs *"you wrote this code — that is a reason for more skepticism, not less"*, which is meaningless to a fresh-context verifier. `agents/plan-verifier.md` stays byte-unchanged.
- **Verification splits honestly.** Structural checks (all sites updated, token shape fixed, greps land, `dr-ship` rows render) are fully verifiable. The behavioural check — an agent facing rejection labels rather than self-passing — is a single-observation check and will be recorded as evidence, not proof, using the convention plan 012 used for SC1.
- **The mechanism check is the plan's first task**, not a pre-plan spike (user's call).

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

  Reviewed 2026-07-31 and kept at Adaptive: Phases 2, 3 and 4 are annotated `yes` (the generated-text contract, the nine-edit sweep, the push-gating `dr-ship` change); Phases 1 and 5 are `no` (findings whose only evidence is the transcript, and a mechanical release ritual).

### Blocking

Must resolve before implementation starts.

- [x] [DECIDED: 2026-07-31] **How does the inline branch reach the rubric from inside a generated plan file?**

  This shapes Phase 2 and Phase 3 and cannot be deferred. A generated plan lives at `_project/plans/in_progress/NNN-slug.md` in the *user's* repo. It has no skill-relative anchor, so it cannot reference `references/verification-rubric.md` the way `dr-ship` can. `dr-ship`'s own dangling reference is solved by the `../dr-plan/references/` precedent; the generated-plan case is not.

  - **Option A: render the rubric once into the plan header.** Add a conditional `## Inline Verification Rubric` section to `plan-base.md`, emitted only when at least one phase has a verifier task; each gate's branch 2 says *"follow the Inline Verification Rubric in this plan's header."*
  - **Option B: compress the essential rules into the gate task itself.** Four or five lines of skepticism rules inline in branch 2, with no separate section.
  - **Option C: point at the skill and accept best-effort.** Branch 2 says *"if the `dr-plan` skill is available, follow its `references/verification-rubric.md`."*

  > **Decision:** Option A — render the rubric once into the plan header.
  > **Rationale:** The plan stays self-contained, the rubric appears once rather than per-phase, and there is no cross-file path problem. **Consequence to carry into Phase 2:** the rubric exists in two renderings — the full reference file (`references/verification-rubric.md`, used by `dr-ship` via the same-bundle precedent) and a condensed form rendered into the plan header. They must not drift on substance. Rejected: Option B, because the block would repeat verbatim once per phase and the gate task grows noticeably; Option C, because a generated plan has no skill-relative anchor, so branch 2 would silently degrade to "be skeptical" — reintroducing the exact failure class this plan closes.

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-31] Should the label's date be the date the fallback occurred, or the plan's date?

  > **Decision:** The date the fallback occurred.
  > **Rationale:** Matches `[WAIVED YYYY-MM-DD: reason]`, which stamps the date the waiver was applied rather than the plan's date. Keeps both tokens readable the same way, and means a long-running plan shows when each fallback actually happened.

- [x] [DECIDED: 2026-07-31] Does the Ship Report gain a new always-present row for fallbacks, or does the existing conditional `Verifier` row absorb the signal?

  > **Decision:** A new always-present `Fallbacks` row in READINESS, **plus** the existing `--verify`-only `Verifier` row stating which branch it used.
  > **Rationale:** These are two distinct signals and one row cannot carry both. The `Fallbacks` row reports earlier-phase labels found by the 1a audit and is present on every run (`✅ Fallbacks  none` when clean), matching the template's "identical shape every run" philosophy and giving positive confirmation that the audit looked. The `Verifier` row reports which branch `--verify` itself took. Folding both into `Verifier` was rejected because that row only renders with `--verify`, so an earlier phase's label would stay invisible on a normal ship run — the exact hole this plan closes. Target shape:
  >
  > ```
  >   ℹ️ Fallbacks           1 — Phase 3 (spawn rejected)
  >   ⚠️ Verifier            inline fallback — 0 FAIL / 2 UNVERIFIED
  > ```

- [x] [DECIDED: 2026-07-31] Should `README.md:374` document the label as a user-facing concept, or only mention that the fallback self-labels?

  > **Decision:** Document it fully, including the audit grep.
  > **Rationale:** The label's whole value is being findable after the fact; one nobody knows to look for is only half a fix. Show the token's shape and `grep -rn "INLINE FALLBACK" _project/plans/`, at the cost of a few lines added to a currently-short paragraph.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [x] `grep -rn "harness cannot spawn subagents" bundles/` returns zero matches **in skill content** — `skills/`, `agents/`, and `templates/` across every bundle. **PASS.** *(Criterion amended 2026-07-31: the literal "zero matches in `bundles/`" is now false, and correctly so — `CHANGELOG.md` quotes the removed clause to document what changed, which is exactly what a changelog should do. Caught by running the audit rather than assuming it; a criterion that forbids its own release notes from describing the release is the criterion that is wrong.)* The nine occurrences under `_project/plans/completed/` are untouched history.
- [x] All eight gate/apply sites carry capability-first three-branch logic, and all three Verification Policy sites are neutralized around independent verification as the outcome with delegation as the preferred mechanism. **PASS** — verified programmatically: all three `dr-plan` files carry the three-branch block and the branch-neutral apply line; both `dr-ship` files carry the delegate/inline logic; no `phase spawns` promise survives anywhere.
- [x] The `[INLINE FALLBACK YYYY-MM-DD: <condition>]` token has exactly one documented shape, dated to the fallback, and a generated plan that takes branch 2 is found by the **date-anchored** audit pattern `grep -rnE '\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:' _project/plans/` — which must return **zero** on a generated plan where no fallback occurred. *(Anchoring added 2026-07-31 after the Phase 3 verifier found the rubric's worked example poisoning the naive grep; see Phase 3 Findings.)* **PASS** — exactly one shape in the rubric (`YYYY-MM-DD`), and a freshly generated plan returns **0** anchored matches. The branch-2 test produced exactly 1, correctly dated and placed.
- [x] `dr-ship` surfaces a fallback: preflight 1a lists the token as informational-but-shown, the Ship Report carries an always-present `Fallbacks` row, and `--verify`'s `Verifier` row states which branch ran. **PASS** — 1a carries the labels block, the Ship Report has the always-present `Fallbacks` row, and the `Verifier` row leads with its branch.
- [x] `skills/dr-plan/references/verification-rubric.md` exists and is reachable from `dr-ship` via the documented same-bundle precedent; its condensed counterpart renders into generated plan headers under the Option A condition; `agents/plan-verifier.md` is byte-identical to its pre-plan state. **PASS** — resolves from the `dr-ship` skill root; the condensed rendering is byte-identical to the source region at 89 lines; `git diff HEAD` on `agents/plan-verifier.md` is empty.
- [x] No generated or skill text instructs an agent to override a harness-level withholding of delegation, **nor asserts on the agent's behalf that permission for any particular mechanism has been given.** *(Second clause added 2026-07-31: the Phase 2 verifier found this criterion and Phase 2's task 7 grading the same sentence against different standards — one passed it, the other failed it. Merged so they cannot diverge again.)* **PASS** — no `treat it as authorized` / `regardless of your harness` phrasing anywhere; the shipped clause scopes the claim to the outcome, not the mechanism.
- [x] `project-management` is 3.3.0 in all four locations, with a CHANGELOG entry citing `planaraid/par` plan 073 as the field report. **PASS** — 3.3.0 in plugin.json, package.json, marketplace.json, and the CHANGELOG heading; the entry names `planaraid/par` plan 073 as the field report.
- [x] The behavioural check is recorded with its evidentiary status stated explicitly — a single observation, not proof — or carried as an explicitly labelled unverified item if Phase 1 finds no mechanism produces a visible rejection. **PASS** — two live runs (branch 1 delegated, branch 2 `delegation withheld`) with unprimed agents, recorded in Phase 5 Findings as a single observation per branch rather than proof, including the destroyed run-2 artifact and why no reconstruction was written.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- **Manifest integrity:** every JSON file touched parses; the `project-management` version string is identical in `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, and the `project-management` entry in `.claude-plugin/marketplace.json`; `plugin.json`'s `skills[]` lists every directory under `bundles/project-management/skills/` and `agents[]` lists every file under `agents/`.
- **Frontmatter validity:** every `SKILL.md` touched still parses as YAML and has `name` and `description`; `name` matches its own directory name.
- **Reference integrity:** every relative path referenced from a `SKILL.md` or reference file resolves to a file that exists — including the new rubric and the existing `../dr-plan/references/summary-mode.md`.
- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — **struck.** This repo is markdown and JSON with no `scripts` block and no automated suite; the three checks above are the real gates. Justified in Assumptions.

## Implementation Plan

### Phase 1: Settle the rejection mechanism and the Pi delegation question

Both unknowns gate design decisions downstream, and neither is answerable by reasoning. This phase produces facts, not edits.

#### Tasks

- [x] **Determine which rejection mechanism produces a visible spawn rejection on Claude Code.** Two candidates; test whichever is cheaper first and stop when one works. **Candidate B ran and won; A was never needed.**
  - **Candidate A — deny rule.** Add `"deny": ["Agent(project-management:plan-verifier)"]` to `.claude/settings.local.json`, then in a fresh session ask an agent to spawn that verifier. Record whether the spawn is rejected with a visible error or silently proceeds.
  - **Candidate B — unregistered type.** Ask an agent to spawn `subagent_type="project-management:does-not-exist"`. Record whether it errors or silently substitutes `general-purpose`.
  - **This task requires the user to run it** — it needs a settings edit and an actual spawn attempt, and the current session withholds the `Agent` tool absent an explicit request. Do not attempt it unilaterally; ask, then wait.
- [x] **Record the outcome and fix the negative-test design.** If A works, the negative test is a deny rule. If only B works, it is the better test anyway — no settings syntax, and it reproduces "attempted and rejected" on any harness. If neither produces a visible rejection, record that and carry the behavioural check as an explicitly labelled unverified item rather than inventing a weaker substitute. **Design fixed: temporarily unregister `plan-verifier` from the manifest to reproduce the real Pi condition — see Findings.**
- [x] **Answer Q2 — does Pi have any delegation/subagent primitive?** Inspect the installed package at `~/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent` (README, CHANGELOG, and the extension API surface) for a spawn/delegate/subagent capability. **Answered: no built-in primitive** — see Findings below and the flipped assumption above.
- [x] **Flip the three `[?]` assumptions** to validated or restate them with what was actually observed. All three resolved: Q2 answered from the installed package, the unregistered-type behaviour measured directly, and the deny-rule assumption restated as untested-and-not-load-bearing rather than falsely confirmed.

#### Findings

**Q2 — Pi delegation (settled 2026-07-31, pi-coding-agent 0.81.1).** No built-in subagent tool. Delegation is available only by installing the `examples/extensions/subagent/` extension, whose agent discovery reads user/project `.pi`-scoped directories rather than installed packages — so `agents/plan-verifier.md` is unreachable there without a manual copy. **Design consequences carried into Phases 2 and 3:**

1. Branch 1 names **Claude Code only**. There is no portable Pi delegation mechanism to name beside it.
2. The labelled inline fallback is Pi's **permanent** path, not a degradation — so the `<condition>` value on a Pi run is a normal operating state and the wording must not imply something went wrong.
3. Verification Policy options A ("Always") and B ("Adaptive") **do collapse on Pi** — both resolve to inline verification on every phase. The neutralized option text must say so rather than offering two identical choices.

**Rejection mechanism (settled 2026-07-31, Claude Code 2.1.220).** Candidate B wins; Candidate A was never needed. An unregistered `subagent_type` is **rejected cleanly and visibly** — no agent runs, nothing substitutes:

```
Agent type 'project-management:does-not-exist' not found. Available agents: claude,
claude-code-guide, Explore, general-purpose, Plan, plugin-dev:agent-creator,
plugin-dev:plugin-validator, plugin-dev:skill-reviewer,
project-management:plan-verifier, statusline-setup
```

**Unanticipated finding, and it changes the token design: the rejection enumerates the registered agents.** An agent whose spawn is refused therefore learns, from the error itself, whether `plan-verifier` is registered. That makes two of the three `<condition>` values **empirically distinguishable rather than guessed**:

| `<condition>` | How the agent knows |
|---|---|
| `agent not registered` | Rejection fired **and** `plan-verifier` is absent from the `Available agents:` list |
| `spawn attempted and rejected` | Rejection fired **and** `plan-verifier` **is** in the list — so it exists and something else refused |
| `no subagent mechanism` | No delegation tool available at all (Pi's stock case — nothing to attempt) |

Phase 2 must state this, so branch 2 tells an agent to *read the rejection* rather than assume a cause. This is the same discipline `preflight.md` uses in the Pencil skill: never assert a cause the tool already answered.

**Negative-test design for Phase 5 (follows from the above).** Do **not** use a bogus type — that tests the harness, not the gate. Instead reproduce the real Pi condition: temporarily remove `"./agents/plan-verifier.md"` from `bundles/project-management/.claude-plugin/plugin.json`, restart, run a verifier-bearing phase gate, and observe whether the agent takes branch 2 and labels it `agent not registered`. Revert afterwards. This is faithful to the permanent Pi case rather than to a hypothetical deny rule. **Verify during Phase 5, do not assume:** that removing the manifest entry actually unregisters it, rather than the `agents/` directory being auto-discovered by convention.

#### Verification

- [x] Read this plan's Assumptions section — expected: no `[?]` remains on the deny-syntax, unregistered-type, or Pi-delegation lines. **PASS** — `grep -n "\[?\]"` returns only the template explainer, a task description, this verification line, and Refinement History; no assumption bullet carries the tag.
- [x] Read this phase's recorded outcome — expected: a named mechanism for the negative test, or an explicit statement that none was found. **PASS** — Findings names the unregistered-type mechanism, measured, plus the Phase 5 test design derived from it.

#### Acceptance Criteria

- The negative-test design for Phase 5 is fixed and justified by an observation, not an assumption.
- Q2 is answered yes or no, with the evidence cited, so Phase 3 knows whether policy options A and B collapse on Pi.

#### Phase Exit Gate

<!-- verifier-recommendation: no — this phase produces findings whose only evidence is the session transcript and the assumption flips; there is no code or structure for a fresh-context verifier to independently check. -->

- [x] Run Definition of Done commands (see plan header). All must pass. **PASS** — all four JSON manifests parse; `project-management` is 3.2.0 consistently across plugin.json / package.json / marketplace.json; no `SKILL.md` or reference file was touched this phase, so frontmatter and reference integrity are unchanged.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. **All four tasks passed on direct evidence** — the rejection was measured live, not inferred, and Q2 was answered from the installed package rather than from documentation about it. One task was deliberately *not* run: Candidate A (deny rule), because Candidate B settled the question and running A would have tested a mechanism the plan no longer uses. Its assumption is recorded as untested rather than confirmed.

### Phase 2: Design the gate contract and write the rubric

The single highest-stakes phase: this text is generated into every future plan and cannot be quietly corrected afterwards.

#### Tasks

- [x] **Write the canonical three-branch gate text.** Branch 1 conditioned on delegation being available, registered, **and not withheld by the session**, with Claude Code named once as a parenthetical example in the style of `dr-plan/SKILL.md` rule 8. Branch 2 the labelled inline fallback, pointing at the Inline Verification Rubric in the plan header per the blocking decision. Branch 3 the ask, scoped as a narrow escape hatch per `SKILL.md` rule 7 — never a per-phase user checkpoint. **Deliverable A below.**
- [x] **Fix the token shape** as `[INLINE FALLBACK YYYY-MM-DD: <condition>]`, dated to the fallback, where `<condition>` names which of the three fallback conditions applied (no subagent mechanism / agent not registered / spawn attempted and rejected). Confirm it does not collide with the `[WAIVED YYYY-MM-DD: reason]` parser at `dr-ship/references/preflight.md:17`. **No collision** — the only two waiver sites (`preflight.md:17`, `ship.md:14`) match the literal prefix `[WAIVED `. **Placement corrected** to immediately after the checkbox, matching `ship.md:14`.
- [x] **Write `skills/dr-plan/references/verification-rubric.md`** fresh — verdict definitions (PASS/FAIL/UNVERIFIED), the skepticism rules, and a report shape. Include the self-verification framing that has no analogue in the agent file: *you wrote this code; that is a reason for more skepticism, not less.*
- [x] **Draft the condensed header rendering** that Phase 3 will add to `plan-base.md`, and state explicitly which parts of the full rubric it drops. Two renderings now exist; record what keeps them from drifting on substance. **Reverted by the verifier, then fixed and re-verified.** The original topical drop/keep taxonomy was not exhaustive and content fell through it; the rule is now **positional** (everything above `## Report` is verbatim), Deliverable B is **generated** rather than retyped, and the check diffs the whole region — 89 lines, 0 differences.
- [x] **Confirm `agents/plan-verifier.md` is untouched** and will stay so for the rest of the plan. `git diff --stat` returns empty.
- [x] **Leave this plan's own Exit Gates on the old text.** Do not retrofit them — see Current State for why, and do not treat their old wording as an oversight to fix.
- [x] **Write the authorization sentence and check it against the rejected form** — it must assert only that the plan is not withholding permission, never that the agent is authorized regardless of its harness. **Reverted by the verifier, ruled on by Dion 2026-07-31, now fixed.** The first draft's opening clause (*"the user's standing request for it"*) asserted, in the 073 harness, precisely the predicate its guard conditions on — *"unless the user requested it"*. Resolution **Option B**: narrow the claim to the *outcome*. Shipped form: *"The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2."* An agent cannot read this as permission for a tool call, because it says the opposite in the same breath. Success Criterion 6 was widened to cover the same ground, so the two can no longer grade this sentence differently.

#### Deliverables — paste targets for Phase 3

**A. The gate tasks.** Replaces both the `Spawn plan-verifier` and `Apply verification report` lines at all six `dr-plan` sites:

```markdown
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's
  header is the user's standing request for independent verification — for the outcome, not for
  any particular mechanism. The plan is not what withholds permission, so never skip on the
  plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is
     registered, and the session does not withhold delegation: delegate with this plan's path
     and phase number, then wait for the report.
     *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline
     Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a
     verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and
     Acceptance Criterion, each with its evidence. Then tag this task immediately after its
     checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition
     values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it,
     ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its
     label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned
  PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL
  and UNVERIFIED with a short note referencing the reasoning.
```

**B. The condensed header section.** Added to `templates/plan-base.md`, rendered only when at least one phase carries the verification task:

~~~markdown
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
~~~

**Drift control between the two renderings.** The condensed form drops **orientation only** — the report skeleton, the boundaries block, malformed-plan handling, and the two-renderings note — because its reader is already in context on that plan. It keeps **every judgment rule verbatim**: verdict definitions, under-report-beats-over-report, all eight skepticism rules, and the condition table. Rule recorded in `verification-rubric.md`: if a judgment rule changes there, it changes in `plan-base.md` in the same edit.

> **"Verbatim" was chosen over "same substance" deliberately, and it took three rounds to
> actually achieve.** Every drift below is a harmless-looking compression that a "same
> substance" rule would have passed by inspection — because each genuinely *is* the same
> substance.
>
> | Round | Caught by | Drifts |
> |---|---|---|
> | 1 | Bullet-scoped `diff` | Skepticism rule 6 lost its `login-handler.ts` example; rule 8's second half diverged; 3 condition-table rows abbreviated; `PASS` definition rephrased |
> | 2 | `plan-verifier` | The **under-report paragraph** — never checked at all, and compressed four ways; the **"exactly one of"** closure sentence, dropped; the **condition-choosing guidance**, paraphrased and stripped of its measured evidence |
> | 3 | Whole-region `diff` | Trailing structure and a nested fence that made the block malformed markdown |
>
> **Round 2 is the instructive one.** My round-1 check compared *bullets* — skepticism rules,
> table rows, verdict definitions — and reported "8/8, 3/3, 3/3". Three counts, for four claimed
> categories. The unchecked fourth was the one that had drifted, and the missing count was
> visible in my own annotation. The other two round-2 drifts lived in *connective sentences
> between* lists, which a bullet-scoped comparison structurally cannot see.
>
> **Two rules came out of this, both now in `verification-rubric.md`:**
>
> 1. **The boundary is positional, not topical.** Everything above `## Report` is verbatim;
>    everything below is dropped. The earlier version classified content by topic, and the
>    condition-choosing guidance fell through the taxonomy — on neither list, so silently
>    paraphrased. A rule requiring per-paragraph classification will eventually meet a paragraph
>    it does not cover; a rule naming a line in the file will not.
> 2. **The condensed form is generated, never retyped.** Every drift in all three rounds came
>    from transcription. Deliverable B above is now produced by extracting the region and
>    demoting headings one level — the single permitted transformation — and the check diffs the
>    **whole region**, not its bullets. Current state: 89 lines, 0 differences.

**Token placement, corrected during this phase.** The original design said "append to this line". `dr-ship/references/ship.md:14` shows the house convention puts `[WAIVED …]` **immediately after the checkbox**, before the task text — so this label matches that position. The two never co-occur (a waiver tags an *unchecked* item, this label a *checked* one), so no ordering rule is needed, and neither parser matches the other's prefix. *(Correction to an earlier note: there are three functional `[WAIVED …]` sites, not two — `preflight.md:17`, `preflight.md:111`, and `ship.md:14`. The no-collision conclusion is unaffected, but Phase 4 edits `preflight.md`, so it matters there.)*

**The condition vocabulary was defective, and the verifier caught it.** The original closed set of three values — `no subagent mechanism`, `agent not registered`, `spawn attempted and rejected` — **could not express this plan's own motivating incident.** In plan 073 a mechanism was present, `plan-verifier` *was* registered, and no spawn was ever attempted, so there was no refusal to read and none of the three fitted. Worse, branch 3 requires an agent that does not ask to take branch 2 *with its label* — leaving it instructed to write a value that did not exist.

An agent with no legal value to write is an agent that writes nothing, which is precisely the unannotated pass the whole mechanism exists to prevent. **A closed vocabulary that omits the canonical case is worse than no vocabulary**, because it converts a recordable event into an unrecordable one. Two values were added:

| Added value | Covers |
|---|---|
| `delegation withheld` | Mechanism exists, agent registered, but the session withholds delegation — no spawn attempted, nothing to read. |
| `permission uncertain, not resolved` | Mechanism exists, the agent was unsure whether it could use it, and did not ask. **This is the 073 case.** |

The second is deliberately uncomfortable to write, and that is the design: branch 3 says ask, and this value is the record that you did not. It is still far better than silence, and a reviewer who greps it knows exactly what to re-check. `Read the refusal` guidance was correspondingly scoped to values 2 and 3 — the only two a refusal can distinguish.

#### Verification

- [x] Read the drafted gate text — expected: three branches, delegation conditioned on not-withheld, no instruction to override a harness. **PASS** — Deliverable A: branch 1 gated on available + registered + not withheld; branch 2 labelled; branch 3 the narrow ask with the no-ask fallback stated. No text asserts authorization over a harness.
- [x] Read `skills/dr-plan/references/verification-rubric.md` — expected: exists, contains verdict definitions, skepticism rules, report shape, and the self-verification framing. **PASS** — 6.2 KB; 3 verdicts, 8 skepticism rules, report skeleton, boundaries, malformed-plan handling, and the *"you wrote this code"* rule.
- [x] Read the condensed header draft alongside the full rubric — expected: no substantive rule present in one and contradicted in the other. **PASS, after three rounds of fixes.** Round 1 (bullet diff) found 5 drifts; the Phase 2 verifier then found 3 more that a bullet-scoped check structurally could not see, including the under-report paragraph I never checked. Deliverable B is now **generated** from the rubric rather than retyped, and the check diffs the whole region: **89 lines, 0 differences.**
- [x] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: no output. **PASS** — empty.
- [x] Read this plan's Phase 3–5 Exit Gates — expected: unchanged, still carrying the old wording. **PASS** — verified against `HEAD` rather than by reading: the gate blocks are byte-identical to the committed draft. *(Annotation corrected: Phases 3 and 4 carry the old spawn clause; Phase 5 is `verifier-recommendation: no` and has no spawn task at all, so an earlier note claiming "all three still read…" was wrong. The expectation holds; the evidence sentence did not.)*

#### Acceptance Criteria

- The gate text is complete enough to paste into **the six `dr-plan` sites** without per-site invention. *(Rescoped from "all eight" — the two `dr-ship` sites are skill prose, not generated plan text, and Phase 4 already assigns their variant wording. The original criterion was overstated.)*
- The token has exactly one shape, documented in one place, and is greppable — and its vocabulary can express every reachable condition, including a mechanism that exists but was not used.
- An agent taking branch 2 with only the header rendering in hand can produce a report comparable to a delegated one, and is told explicitly to record a verdict per item.
- `agents/plan-verifier.md` is byte-identical to its pre-plan state.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase produces the user-visible contract for the whole plan (generated gate text plus a new reference file), and its failure mode is subtle wording drift that Verification commands cannot catch. -->

- [x] Run Definition of Done commands (see plan header). All must pass. **PASS** — manifests parse, `project-management` 3.2.0 consistent across all three; `skills[]` confirmed to be *directories*, so the new reference file needs no manifest entry; reference integrity 41/41 skill-internal paths resolve, 0 broken. *Check-quality note: the first reference-integrity pass reported 13 "broken" links, all in `dr-research`. They are links inside the research corpus dr-research **generates** (`index.md` → its sibling `findings.md` in the user's output directory), not references to skill files. The check was re-scoped to skill-internal `references/`, `templates/`, `agents/` paths. A naive link-checker on this repo will always produce those false positives.*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. **Ran, with the user's per-phase authorization.** Returned **5 FAILs** — the verbatim invariant (3 distinct breaches), the authorization sentence, and all three of AC1/AC2/AC3 — plus two annotation corrections. Self-review had passed every one of them.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. **Applied.** Fixed and re-verified: the under-report paragraph, the "exactly one of" closure, the condition-choosing guidance, the drop/keep rule (now positional), the generation-not-transcription rule, the missing verdict-recording instruction, and the **condition vocabulary**, which could not express the plan's own motivating incident. Corrected two inaccurate evidence notes (Phase 3–5 gates; the third `[WAIVED …]` site). Rescoped AC1 to six sites and assigned the `dr-ship` variant — including its no-header-section case — to Phase 4. **Task 7 remains `[ ]`** pending a ruling.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. **All 5 verifier FAILs resolved**, each re-verified mechanically rather than by inspection; the authorization ruling landed as Option B. **Carried forward:** the `dr-ship` no-header-section case and the fenced-checkbox audit question are now explicit Phase 4 tasks; AC1 was rescoped to six sites with the `dr-ship` variant assigned to Phase 4. **The honest headline of this phase:** self-review passed material containing eight defects across three rounds, including one — a closed vocabulary that could not express the plan's own motivating incident — that would have shipped a gate instructing agents to write a value that did not exist. The verifier was worth every token, and *"you wrote this code, that is a reason for more skepticism, not less"* earned its place in the rubric by being demonstrated on the rubric.

### Phase 3: Apply to `dr-plan` — six gate sites, three policy sites, and the header section

Scoped to one skill directory so the sweep is verifiable by a single directory-scoped grep.

#### Tasks

- [x] **Replace the three Spawn sites** with the Phase 2 gate text: `templates/plan-base.md:104`, `references/create-mode.md:176`, `references/questions-mode.md:179`. All three now carry the identical 5-line three-branch block (1627 chars, verified by diff).
- [x] **Rewrite the three Apply sites** so they work under both branches: `templates/plan-base.md:105`, `references/create-mode.md:177`, `references/questions-mode.md:180`. Remove branch-1-only phrasing ("the verifier reports as PASS") in favour of wording that covers a delegated report and an inline one.
- [x] **Add the conditional `## Inline Verification Rubric` section** to `templates/plan-base.md`, and the rendering condition to `create-mode.md` Phase 7 — emitted only when at least one phase has a verifier task, omitted entirely otherwise. Section **generated** from the rubric, not retyped; carries an HTML comment stating its provenance and condition.
- [x] **Neutralize the three Verification Policy sites**: `templates/plan-base.md:45–47`, `references/questions-mode.md:135`, `references/create-mode.md:135`. Frame options around independent verification as the outcome, delegation as the preferred mechanism. If Phase 1 answered Q2 "no delegation primitive on Pi", say so in the option text rather than offering a Pi user two identical choices. **Q2 came back "no", so the two options-list sites say it explicitly** (`plan-base.md:45–49`, `questions-mode.md:135–140`), and both note that Never differs *in kind* — it renders no task at all, which is what keeps it distinguishable from a fallback. *(Annotation corrected by the Phase 3 verifier: an earlier note claimed "all three"; `create-mode.md:135` does **not** mention Pi, and correctly so — it is a mechanism-naming instruction to the composing model, not a set of options shown to a user, so the "don't offer two identical choices" rationale does not apply there.)*
- [x] **Keep `create-mode.md:192`'s omission rule correct** — under `verifier-recommendation: no`, the gate tasks are still omitted entirely, not rendered as skipped. Confirm this composes with the new header-section condition: a plan with no verifier-bearing phase gets neither the gate tasks nor the rubric section.

#### Findings

**A fourth branch-1-only phrasing, not in the site list.** The **Agent self-review** line in both reference files read *"confirm the verifier's recommendations are reflected"* — no referent under a fallback, exactly like the three Apply sites. Now *"the verification's findings"*. The site list was built by grepping the fallback clause and the Apply phrasing; this one used neither, and was found only by reading the surrounding block while editing it.

**The duplication had already drifted before this plan touched it.** `plan-base.md` said *"with a **short** note"*; both reference files said *"with a note"* — divergent at `HEAD`, and confirmed pre-existing via `git show`. The Current State claim that the sites were "all word-identical" held for the *fallback clause* specifically, which is what was grepped; it did not hold for the Apply line. Normalized to "a short note" everywhere. **This is the argument for the plan's own verbatim-by-diff rule, found in the wild:** four copies of a sentence, maintained by hand, silently disagreed — and nobody noticed because nobody ever diffed them.

**Phase 7 regeneration needed rules the plan did not anticipate.** The `## Inline Verification Rubric` section is *plan-wide*, but Phase 7 regenerates *per-phase* gate blocks — so a policy change can now require adding or removing a section outside any gate. Its preservation rule said "only the 4–5 lines of the Exit Gate block are replaced", which was both stale (the gate is longer) and incomplete. Added: the add/remove rule per policy, and a prohibition on stripping an existing `[INLINE FALLBACK …]` tag during regeneration — that tag is history, and deleting it would erase the only durable evidence of how a phase was verified.

*(Correction, from the Phase 3 verifier: I fixed the preservation rule and believed that closed it. It did not — **two other places still said regeneration touches only the gate block**: the Phase 7 preamble at `:169`, and Phase 8 step 5, which is where the write actually happens. An agent following either would produce a gate with no rubric section, or a section with no gate. Both now carry the add/remove rule. The lesson repeats Phase 2's: fixing the paragraph that states a rule is not the same as fixing every place that restates it.)*

**`refine-mode.md` is a third gate-writing path.** Neither the site list nor either verifier pass caught it as in scope, because it composes correctly *by default* — it adds missing gates with `verifier-recommendation: no`, which needs no rubric section. But a refinement that promotes a phase to `yes` would need one. Noted at `refine-mode.md:120` rather than left to be rediscovered.

**The verifier confirmed the verbatim invariant independently**, by extracting the source region, demoting headings, and diffing against the template section: a single hunk, the four-line provenance comment, every other line byte-identical. That is the check working as designed — and worth contrasting with Phase 2, where my own equivalent claim was wrong three times running.

#### Verification

- [x] Run `grep -rn "harness cannot spawn subagents" bundles/project-management/skills/dr-plan/` — expected: zero matches. **PASS** — 0.
- [x] Run `grep -rn "the verifier reports as PASS" bundles/project-management/skills/dr-plan/` — expected: zero matches. **PASS** — 0, and widened to `verifier's reasoning|verifier's recommendations`, also 0, which is how the fourth branch-1-only phrasing was confirmed gone.
- [x] Run `grep -rn "INLINE FALLBACK" bundles/project-management/skills/dr-plan/` — expected: matches in all three gate-bearing files. **PASS** — plan-base 3, questions-mode 3, create-mode 1 (create-mode instructs *generating* the rubric section rather than embedding it, so one mention is correct).
- [x] Read `templates/plan-base.md:41–47` — expected: policy options framed around independent verification, no unsatisfiable "every phase spawns" promise. **PASS** — `grep "phase spawns"` returns 0 across the whole skill.
- [x] Read `templates/plan-base.md` for the rubric section — expected: present, with its conditional-rendering note. **PASS** — at line 82, provenance comment attached; the three renderings (rubric file, template section, plan Deliverable B) diff **identical at 89 lines**.

#### Acceptance Criteria

- All six `dr-plan` gate/apply sites carry identical three-branch logic — word-identical where they are the same instruction, as they are today.
- The three policy sites describe an outcome, not a Claude-specific mechanism.
- A plan generated after this phase renders a gate with three branches and a token slot, plus the rubric section exactly when a verifier task exists.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — ten edits across three files, word-identical duplication that drifts silently, and a blast radius covering every plan the plugin will ever generate. -->

- [x] Run Definition of Done commands (see plan header). All must pass. **PASS** — all four manifests parse; reference integrity 43 checked, 0 broken (up from 41, the two new paths being the rubric wired into `create-mode.md` and `questions-mode.md`); no `SKILL.md` frontmatter touched this phase.
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. **Ran, with the user's per-phase authorization.** All 5 tasks and all 5 Verification items PASS, independently re-derived rather than taken on trust — including a mechanical re-diff of the verbatim invariant. **1 FAIL** (AC3) plus one grep-poisoning defect and one inaccurate annotation.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. **Applied.** AC3 fixed at both remaining sites (`questions-mode.md:169` and Phase 8 step 5); the worked example's date changed to a `YYYY-MM-DD` placeholder and detection anchored on a real date, propagated to SC3, Phase 4's `Fallbacks` row, and Phase 5's audit; Task 4's annotation corrected; `refine-mode.md` noted as a third gate-writing path. Re-verified: composition rules present in all three places, zero stale "ONLY the gate block" claims, all three renderings still verbatim-identical.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. **The grep-poisoning find is the one that mattered** — I had built a worked example with a concrete date into text that ships verbatim into every plan, which would have made `✅ Fallbacks none` unreachable and stripped Phase 5's negative test of its positive signal. It was invisible from inside the diff-based check, because the check only asks whether the copies *agree* — not whether what they agree on is safe to duplicate. **Carried into Phase 4:** the `Fallbacks` row must use the date-anchored pattern, and the fenced-checkbox audit question (already task 7) now has a second instance shipping in every generated plan.

### Phase 4: Apply to `dr-ship` — two prose sites plus new fallback reporting

This is the half that gates a push and a PR. A fallback-labelled gate from an earlier phase currently passes the readiness audit invisibly, because it is a checked box.

#### Tasks

- [x] **Rewrite the two prose sites** with the same three-branch logic phrased as instructions to the executing agent: `SKILL.md:24`, `references/preflight.md:26`.
- [x] **Point `preflight.md:26`'s inline branch at the rubric** via `../dr-plan/references/verification-rubric.md`, following the documented same-bundle precedent — this closes a pre-existing dangling reference, since "run the verifier's checklist inline" currently names a document the skill has no legal path to.
- [x] **`dr-ship` must reference the rubric *file*, never "this plan's header."** The generated gate text says "the Inline Verification Rubric in this plan's header" because a plan file cannot resolve a skill path. `/dr-ship` is the mirror case: it is a skill, so it *can* resolve the file — and it must, because it runs against plans that have no such section. Two whole classes of them: every plan generated **before** this change, and every plan whose phases are all `verifier-recommendation: no`. Wording that assumes the header section would silently degrade to nothing on exactly the plans most likely to need it. *(Found by the Phase 2 verifier; the two skills resolve the same rubric by different routes on purpose.)*
- [x] **Add the token to preflight 1a's informational list** (`references/preflight.md:15–20`), so a fallback-labelled gate is recognized rather than silently counted as a normal `[x]`.
- [x] **Add the always-present `Fallbacks` row** to the Ship Report READINESS block (`references/preflight.md:62–95`), reporting earlier-phase labels found by the 1a audit and rendering `✅ Fallbacks  none` on a clean run. Update the template rules so fixed row order still holds. **Detect with the date-anchored pattern**, never a bare `INLINE FALLBACK` substring: every generated plan carries the rubric's worked example, so a naive match reports fallbacks on plans that never had one and `✅ Fallbacks none` becomes unreachable.
- [x] **Make `--verify` state which branch ran** in the `Verifier` row, since that row is the one gating a push.
- [x] **Confirm 1a's audit does not count checkboxes inside fenced blocks.** 1a scopes counting to Tasks / Verification / Phase Exit Gate blocks, so a correct reading already excludes them — but this plan is itself the test case: Phase 2's Deliverables block contains two `- [ ]` lines that are *template text*, not work. If the audit counts them, this plan reports two phantom blocking items at ship time. Worth stating explicitly in 1a now that the gate text being copied around is itself a checkbox list. **Made explicit** — 1a's non-blocking list now excludes anything inside a fenced block.

#### Findings

**Phase 4 falsified a Phase 2 claim.** The rubric asserted that `[INLINE FALLBACK …]` and `[WAIVED …]` *"never co-occur: a waiver applies to an unchecked item, this label to a checked one, so no ordering rule is needed."* The stated **reason** is false, and `dr-ship` says so in its own instructions: `ship.md:18` appends a waiver tag to an item **already `[x]`**. Removing the claim was right, and the rubric now gives the ordering — **fallback first, waiver second**: how it was verified, then what was decided about the result.

*(Correction from the Phase 4 verifier, and worth keeping honest.* My original justification named the wrong scenario: "a gate task verified inline and then shipped over an adverse verdict". **That route is not reachable.** Neither verification scope produces a verdict on a *gate task* — `agents/plan-verifier.md:28` explicitly excludes the Phase Exit Gate from evaluation, and the rubric and shipped gate text both scope verdicts to tasks, Verification items, and Acceptance Criteria. Since the label only ever lives on a gate task, the two tags cannot meet that way. The reachable route is narrower: a user-directed **Adjust waiver** at gate 1f naming an already-`[x]` gate item. The ordering rule is retained as defensive and zero-cost, but its evidence was overclaimed and a later reader should not inherit the wrong reason.)*

Worth noting *how* this surfaced. It was not found by any check: not the verbatim diff, not either verifier pass, not the greps. It emerged from **editing the consuming skill** and noticing its behaviour contradicted the producing skill's documentation. Two of this plan's three substantive discoveries have come from that pattern — Phase 1's condition-vocabulary gap surfaced the same way, from reading a real refusal rather than reasoning about one.

**The rubric path resolves from the skill root, not from `references/`.** Verified by resolving both: `../dr-plan/references/verification-rubric.md` exists relative to `skills/dr-ship/`, and does **not** exist relative to `skills/dr-ship/references/`. That is correct per the Agent Skills spec and matches the `summary-mode.md` precedent exactly — but it means a reader resolving relative to the file gets nothing, silently. The wording was matched verbatim to the precedent's, *"(in the sibling `dr-plan` skill, relative to this skill's root)"*, so the resolution base is stated rather than assumed.

**`dr-ship` now reaches the rubric by a different route than a generated plan does, on purpose.** A plan carries the `## Inline Verification Rubric` section and points its gates at it, because a plan file cannot resolve a skill path. `/dr-ship` is a skill, so it reads the file — and must, because it runs against plans generated before that section existed and plans whose phases are all `verifier-recommendation: no`. Both facts are now stated at the point of use rather than left to be re-derived.

#### Verification

- [x] Run `grep -rn "harness cannot spawn subagents" bundles/project-management/skills/dr-ship/` — expected: zero matches. **PASS** — 0.
- [x] Read `references/preflight.md` §1a — expected: the `[INLINE FALLBACK …]` token appears in the non-blocking list with a note that it is shown, not hidden. **PASS** — its own subsection, "informational, but always shown", carrying the date-anchored detection pattern and why a bare substring fails.
- [x] Read the Ship Report template — expected: a `Fallbacks` row in fixed order, and the always-present rule updated to include it. **PASS** — row sits between `Retro` and `Verifier`; rules added for both it and the `Verifier` branch prefix.
- [x] Confirm `../dr-plan/references/verification-rubric.md` resolves from the `dr-ship` skill root. **PASS** — resolves from the skill root (and *not* from `references/`), exactly like the `summary-mode.md` precedent; wording matched to that precedent so the resolution base is explicit.

#### Acceptance Criteria

- `dr-ship` can no longer approve a push while an earlier phase's inline fallback goes unmentioned.
- `--verify` output distinguishes a delegated verification from an inline one.
- The pre-existing unresolvable "run the verifier's checklist inline" instruction now names a reachable file.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase changes a deterministic user-facing template and the audit that gates commit, push, and PR; a wording error here ships unverified work. -->

- [x] Run Definition of Done commands (see plan header). All must pass. **PASS** — manifests parse; `dr-ship` frontmatter still valid YAML with `name: dr-ship` matching its directory; reference integrity 46 checked, 0 broken (up from 43, the new paths being the rubric reached from `dr-ship`). Full-repo sweep: `grep -rn "harness cannot spawn subagents" bundles/` returns **0** — Success Criterion 1 met.
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. **Ran, with the user's per-phase authorization.** All 7 Tasks, all 4 Verification items, and all 3 Acceptance Criteria PASS — the verbatim invariant confirmed by SHA across all three renderings (`844538e1…`, 89 lines each). **Two must-fix defects** and one unowned-scope gap found besides.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. **Applied.** (1) `/dr-ship` is now explicitly carved out of the rubric's "must tag the gate task" instruction — preflight is read-only, and the tag would have been semantically false. (2) `ship.md` now states the tag order and resolves its own `:11`-vs-`:18` contradiction. (3) The three unowned `/dr-ship` README lines corrected here, with Phase 5's task rescoped to say so. Also: detection restated as a `Grep` pattern rather than a shell command (principle 11 forbids the shell form the instruction was printing); the `Fallbacks` row given a deterministic ordering; phase-number capture made explicit; the co-occurrence Finding's overclaimed justification corrected; four stale "77 lines" references updated to 89.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. **The read-only contradiction is the one worth remembering.** Phase 4 made the rubric reachable from `/dr-ship` for the first time — and in doing so imported an instruction ("must tag the gate task") that directly contradicts preflight's read-only guarantee. Nothing was wrong with either document alone; wiring them together created the defect. **Nothing carried into Phase 5** beyond its own scope: `:374` is the only README line still owed.

### Phase 5: Behavioural check, docs, and the 3.3.0 release

#### Tasks

- [x] **Run the negative test** using whichever mechanism Phase 1 established: generate or use a plan with a verifier-bearing gate, cause the spawn to be rejected, and observe whether the agent takes branch 2 and labels it. Record the transcript evidence. If Phase 1 found no mechanism, record this as an explicitly labelled unverified item with its reason, following plan 012's SC1 convention.

#### Findings

**Test method changed, twice, and the reasons matter.**

*The manifest-unregistration design (fixed in Phase 1) was abandoned before use.* It would have tested this plan's own gates — which deliberately carry the **old** text — so it could not have exercised the new gate at all. The test instead runs against a throwaway plan generated from the real post-Phase-3 template (`.research/013-negative-test/`, gitignored), carrying the real three-branch gate and the real rubric section.

*My replacement premise was then falsified empirically.* I predicted subagents cannot nest, making branch 1 unavailable to one. **Wrong — a subagent spawned `plan-verifier` successfully.** Recorded because it is a reusable fact about the harness, and because it is the second time in this plan that a confident claim about agent capability survived only until someone ran it.

**Run 1 — branch 1, unprimed agent (2026-07-31).** A fresh `general-purpose` agent, told only to close out a Phase Exit Gate and given no hint that labels, fallbacks, or this plan existed. Result: it read the gate, took **branch 1**, delegated to `plan-verifier`, and — the part worth quoting — declined to label, reasoning that *"none of the five legal `<condition>` values could have been truthfully written."* It then confirmed the absence with the date-anchored pattern, returning 0.

That is not the negative test, but it establishes four things the negative test cannot:

| Claim | Evidence |
|---|---|
| The gate is executable by an agent with no context | Worked all four gate items in order, unprompted |
| The vocabulary is *checked*, not decorative | It enumerated the five values and found none true |
| No false-positive labelling | Zero labels written on a correctly-delegated run |
| The anchored grep works in the field | Agent independently used it to verify absence |

It also distinguished *"unchecked because it failed"* from *"unchecked because skipped"* on the DoD item, and flagged one real usability gap: the plan's `workspace/` paths are relative to the plan, not the repo root, so it had to supply that to the verifier or every item would have come back UNVERIFIED for the wrong reason.

Archived at `.research/013-negative-test/RESULT-branch1-delegated.md`.

**Run 2 — branch 2, delegation withheld by session instruction. PASS.** Same plan reset to pristine, same neutral prompt, plus one line: *"do not use the Agent tool. Subagents are not permitted here."* Nothing said about branches, labels, or conditions. **This is a closer reproduction of plan 073 than the manifest route would have been** — the original incident was not an unregistered agent but a *session instruction that withheld delegation*, resolved silently in the direction that skipped the check.

The agent did not self-pass. It took branch 2, ran the inline verification, and wrote:

```
- [x] [INLINE FALLBACK 2026-07-31: delegation withheld] **Run this phase's independent verification.** …
```

**It derived the condition by elimination, in its own words**, rather than picking the first plausible value:

> I did *not* attempt a spawn, so there was no refusal to read — which rules out `agent not registered` and `spawn attempted and rejected` per the rubric's own instruction. `plan-verifier` **is** registered and the Agent mechanism exists, and I was told plainly rather than being unsure, so `permission uncertain, not resolved` doesn't fit either.

Independently re-verified against the artifact:

| Check | Result |
|---|---|
| Label present, correctly dated | `2026-07-31` ✓ |
| Placement immediately after the checkbox | ✓ matches the `ship.md` convention |
| Condition among the five legal values | ✓ `delegation withheld` |
| Date-anchored audit finds it | **1** match |
| Naive substring audit | **4** matches — would have been useless |

**Three separate fixes are validated by this one run, and two of them would have failed without the verifiers:**

1. **The vocabulary fix (Phase 2, found by the Phase 2 verifier).** `delegation withheld` did not exist in the original closed set of three. Facing exactly this condition, the agent enumerated the values and would have found **none true** — leaving it instructed to write a label with no legal value, which is an agent that writes nothing. The value it actually used is one of the two added *because* the original three could not describe plan 073.
2. **The grep-poisoning fix (Phase 3, found by the Phase 3 verifier).** The naive pattern returns 4 on this plan; the anchored pattern returns 1. Without the fix, `✅ Fallbacks none` would be unreachable and this very test would have had no positive signal. The agent used the anchored pattern itself to confirm its own label, and noted that the rubric's `YYYY-MM-DD` example correctly did not match.
3. **The gate text itself.** Executed correctly, in order, by an agent with no context.

Two unprompted behaviours worth recording, because neither was asked for and both are the disposition the rubric is trying to install. It refused to treat *"the Definition of Done has no executable commands"* as a pass — *"Not a vacuous pass"* — and it deliberately left the sibling `RESULT-branch1-delegated.md` unread, reasoning that consuming another run's verdicts would have made its own pass derivative.

**Honest scope.** Two runs, one harness, one model, one plan shape. This is a single observation per branch, not proof — recorded per plan 012's SC1 convention. What it does establish is that the gate is *executable as written* and that the two verifier-found defects were load-bearing rather than theoretical.

**The run-2 artifact was destroyed, by me, immediately after verification.** Running `build.js` to produce a pristine before-state for the audit grep regenerated the same file the branch-2 result lived in. The test agent had explicitly warned that this would happen — *"Re-running it overwrites everything above"* — and I did it anyway one step later. Only run 1's archive (`RESULT-branch1-delegated.md`) survives.

What is *not* lost: the verification ran **before** the overwrite, and its results are the table above — label text, dating, placement, legal-value check, and the 1-vs-4 anchored/naive comparison, each read off the artifact directly. The agent's verbatim edits are in its report. **No reconstruction has been written, deliberately.** A rebuilt file sitting in a directory of real ones, indistinguishable from an original, is precisely the false record this plan exists to prevent — and writing one to tidy up the evidence would be a poor way to close a plan about not doing that.

The lesson is narrow but real: a generated test rig has no memory, and results must be copied out *before* the next regeneration, not after.

**Grep poisoning, round two — found by running the audit rather than assuming it.** Phase 5's own Verification item exposed a second false-positive class the Phase 3 fix did not cover. The date anchor excludes the *worked example* (which uses a `YYYY-MM-DD` placeholder), but not **quoted real evidence**: this plan's Findings quote a correctly-dated label inside a fence as documentation. `/dr-ship` would therefore have reported `ℹ️ Fallbacks 1` for a plan in which no phase fell back.

Measured on this plan:

| Detection rule | Hits | Correct? |
|---|---|---|
| Naive substring | 16 | No — matches all prose |
| Date-anchored (Phase 3 fix) | 1 | No — matches quoted evidence |
| Anchored + not-in-fence + inside a `#### Phase Exit Gate` | **0** | Yes |

All three exclusions are now stated in `preflight.md` with what each one catches. The general shape is worth carrying: **a plan that documents a mechanism will contain strings that look like uses of it**, and any audit keyed on text alone has to distinguish the two. This is the second time in this plan that the artifact describing the feature poisoned the feature's own detection — and both times the fix was scoping rather than a cleverer pattern.
- [x] **Run the audit greps end to end**: `grep -rn "harness cannot spawn subagents" bundles/` returns nothing, and the date-anchored `grep -rnE '[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:' _project/plans/` finds the labelled gate produced by the test.
- [x] **Update the README's verifier documentation.** `README.md:374` (the `/dr-plan` verifier paragraph) gains the fallback, the token's shape, and the date-anchored audit pattern `\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:`. **Scope extended by the Phase 4 verifier:** three `/dr-ship` lines were owned by no phase — `:391` (a comment calling `--verify` agent-only), `:396` (the same in the preflight description), and `:397` (READINESS contents, omitting `Fallbacks`). The last three were corrected during Phase 4, since that phase changed the behaviour they describe; `:374` remains this phase's work.
- [x] **Version ritual — all four locations to 3.3.0:** `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, the `project-management` entry in `.claude-plugin/marketplace.json`, and a new `CHANGELOG.md` section. All three manifests are clean one-line diffs. *(`JSON.stringify` round-tripping expanded `package.json`'s inline arrays into a 10-line diff; reverted and re-done as a surgical string edit. Worth knowing for the next bump: two of the three manifests survive re-serialization, one does not.)* `engineering-tools` 0.4.2 and `experimental` 0.11.0 untouched.
- [x] **Write the CHANGELOG entry** under `### Changed`, citing `planaraid/par` plan 073 as the field report — matching how `CHANGELOG.md:55` cites plan 006 for the `dr-research` web guard, which is the closest precedent for this failure class. Entry carries `### Changed`, `### Added`, and `### Fixed`; the field report is named in the section preamble.
- [x] **Confirm no migration is needed** — `draft/` and `in_progress/` are empty, and the nine `completed/` plans keep the old text as history. Confirmed: `draft/` empty, and the only `in_progress/` match is **this plan's own gates**, left on the old text by the no-retrofit decision. Nothing to migrate.

#### Verification

- [x] Run `grep -rn "harness cannot spawn subagents" bundles/` — expected: zero matches. **PASS** in shipped skill content (`skills/`, `agents/`, `templates/`) — 0. The one match in `CHANGELOG.md` is the release notes quoting the removed clause; see the amended Success Criterion 1.
- [x] Run the label audit over `_project/plans/` — expected: at least one match from the negative test, or a recorded reason why none exists. Run it **before** the test too: a freshly generated plan must return zero, or the label proves nothing. **PASS, and it found a defect.** Before: a freshly generated plan returned **0** anchored matches. After: the branch-2 run produced exactly **1**, correctly dated and placed. But running the audit over `_project/plans/` then matched *this plan's own quoted evidence* — a false positive the date anchor could not exclude. The rule now also drops hits inside fenced blocks and outside a `#### Phase Exit Gate` block; applied across all eleven plans in the repo it returns **0**, which is correct — no phase of any plan here has fallen back. *(Pattern text also repaired: an earlier shell-escaping slip had dropped the leading backslash from `\[INLINE FALLBACK`, so the version recorded in this plan was not the version that was run.)*
- [x] Run `grep -rn '"version"' bundles/project-management/package.json bundles/project-management/.claude-plugin/plugin.json` and read the marketplace entry — expected: `3.3.0` in all three, matching the new CHANGELOG heading.
- [x] Read `bundles/project-management/README.md` around line 374 — expected: the fallback, the token shape, and the grep are all documented.

#### Acceptance Criteria

- The behavioural check is recorded with its evidentiary status stated plainly — a single observation, not proof.
- Every Success Criterion above is satisfied or carries an individually-reasoned waiver.
- `project-management` 3.3.0 is consistent across all four locations and the bundle is shippable.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the release ritual is mechanical and fully covered by the version and grep checks above; the behavioural test's evidence is the transcript, which a fresh-context verifier cannot re-observe. -->

- [x] Run Definition of Done commands (see plan header). All must pass. **PASS** — manifests parse and `project-management` is 3.3.0 in all three; `skills[]` covers all 5 skill directories and `agents[]` the 1 agent file; frontmatter valid on all 5 `SKILL.md` files with `name` matching directory; reference integrity 47 checked, 0 broken; the rubric invariant holds at 89 lines, identical.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. **All 6 tasks and 4 Verification items pass on direct evidence.** Two were corrected during this phase rather than after it: Success Criterion 1, which my own CHANGELOG falsified by quoting the removed clause, and the label audit, which produced a false positive on this plan's quoted evidence. Both surfaced only because the checks were *run* rather than assumed — which is the behaviour the whole plan is trying to install, applied to the plan itself. **One item is honestly weaker than it looks:** the behavioural evidence is two runs, one harness, one model. It is recorded as a single observation per branch, not proof, and the run-2 artifact was destroyed by my own subsequent command — noted in Findings rather than reconstructed, because a rebuilt artifact indistinguishable from an original is the exact failure mode this plan exists to prevent.

## Refinement History

- **2026-07-31:** Initial plan creation.
- **2026-07-31:** Resolved 1 blocking + 3 non-blocking questions, verified 0 assumptions (3 `[?]` deliberately left for Phase 1 to settle empirically), Verification Policy reviewed and kept at Adaptive so no exit gates were regenerated. The blocking decision (Option A — rubric rendered once into the plan header) added a deliverable: Phase 3 gains the `## Inline Verification Rubric` section task, Phase 2 gains the condensed-rendering draft and a drift note, and Success Criterion 5 was extended to cover it.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- **The verifier, every single time it ran.** Three phases, three sets of real defects in material self-review had already passed: 5 FAILs in Phase 2 (including a condition vocabulary that could not express the plan's own motivating incident), 1 FAIL plus the grep-poisoning flaw in Phase 3, 2 must-fix contradictions in Phase 4. Nothing it flagged was cosmetic.
- **Mechanical checks over inspection.** `diff` and SHA comparison caught every drift between the rubric's three renderings; reading them side by side had passed the same content three times running.
- **Generating derived copies instead of retyping.** Every drift in this plan came from transcription. Once Deliverable B and the template section were *generated* from the source region, drift stopped entirely.
- **Running audits rather than asserting them.** Two defects surfaced only because a check was executed: my own CHANGELOG falsified Success Criterion 1 by quoting the removed clause, and the label audit false-positived on this plan's quoted evidence.
- **Two live runs with unprimed agents.** Both branches executed correctly by agents with no context — and branch 2's agent derived its condition value by elimination, out loud, rather than guessing.

### What didn't

- **Self-review passed defective work in every phase where it was the only check.** This is the plan's own thesis demonstrated on the plan. The rubric's line *"you wrote this code — that is a reason for more skepticism, not less"* earned its place by being proved on the rubric itself.
- **Two confident capability claims were falsified by running them.** That subagents cannot nest (they can), and that three condition values were sufficient (they could not describe plan 073). Both were stated as fact before being tested.
- **I destroyed the branch-2 test artifact one step after verifying it** — running `build.js` for a before-state regenerated the file the result lived in. The test agent had explicitly warned this would happen.
- **Fixing the paragraph that states a rule is not fixing every place that restates it.** Hit twice: Phase 3's AC3 (preservation rule fixed, two other sites still said "only the gate block"), and Phase 4's tag order (rubric fixed, `dr-ship` — the file that actually writes tags — silent).
- **Shell escaping corrupted plan text twice.** Once visibly (backticks eaten, caught immediately), once silently — a dropped `\` meant the audit pattern *recorded* in the plan was not the pattern that was *run*.

### Learnings

- **A verbatim invariant replicates defects as faithfully as it replicates content.** The `diff` asks whether the copies agree, never whether what they agree on is safe to duplicate — which is exactly how a worked example with a concrete date got copied into every generated plan and poisoned the audit it existed to support.
- **A plan that documents a mechanism contains strings that look like uses of it.** Both grep-poisoning rounds were this. The fix each time was *scoping* (date anchor, then fence-and-block exclusion), never a cleverer pattern.
- **Test a closed vocabulary against the case that motivated it.** The original three values omitted the exact incident this plan was written to fix, and an agent with no legal value to write is an agent that writes nothing — the silent pass, reintroduced by the mechanism meant to prevent it.
- **Wiring two correct documents together can create a contradiction neither contained.** Making the rubric reachable from `/dr-ship` imported "must tag the gate task" into a phase documented as read-only.
- **Prefer creating the condition over simulating it.** The negative test worked because delegation was genuinely withheld and the agent was told nothing about labels — not because it was asked to pretend.
- **Copy results out of a generated test rig before regenerating it.** Obvious in hindsight, warned about in advance, done wrong anyway.
