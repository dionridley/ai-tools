# Plan: Skill Portability Phase 8 — Test in Pi

## Metadata

- **Number:** 006
- **Status:** completed
- **Created:** 2026-07-12
- **Last refreshed:** 2026-07-12
- **Refinement count:** 1
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** _project/prd/cross-harness-repo-architecture.md (only its two deferred Pi-side acceptance criteria close here)

## Executive Summary

Phase 8 is the final phase of the skill-portability workstream (`.research/skill-portability-plan.md`): install the released repo (main `518671c`; pm 3.1.0 / et 0.4.1 / exp 0.10.0) into a real Pi instance on this machine and prove — or falsify with evidence — that everything Phases 1–7 built on top of docs actually works. All Pi knowledge so far is documentation-derived (the 2026-07-06 Phase 0 capability audit, stamped against Pi 0.80.3); no skill from this repo has ever run in Pi.

The plan is a five-phase test campaign: (1) stand up the Pi runtime, fixtures, and an evidence scaffold; (2) install the package and verify the catalog-level acceptance criteria deferred from the restructure PRD; (3) exercise the five dr-* skills as one realistic project journey in a remote-less fixture (init → prd → plan → ship) plus dr-research's two legs; (4) run mvp start+build on a tiny toy app and answer the two capability probes deferred from Phase 6; (5) triage every logged deviation as fix-or-document, release any fixes per the version ritual, and close the workstream. **Deviation policy:** only test-blocking defects are fixed mid-phase (testing can't continue otherwise); everything else is logged to `.research/pi-phase8/deviation-log.md` and batched into Phase 5. A fully clean run is possible — if every disposition is document-only into gitignored paths, the plan closes with **no committable diff, no release, and no PR** (see Completion).

Cost & safety notes: Pi sessions bill the user's API key (provider/model per the blocking question below) — keep toy scopes deliberately tiny and run each exercise once, not until it looks good. `/dr-ship` and `/dr-init` are exercised **only** inside the remote-less fixture tree outside this repo — never via Pi inside `ai-tools` itself. Credential setup, if any, is a user-run step.

## Current State

- **Repo:** main at `518671c` == the released baseline (pm 3.1.0 / et 0.4.1 / exp 0.10.0). Root `package.json` is the Pi catalog (`pi.skills: ["bundles/*/skills/*"]`, private); per-bundle manifests mirror plugin.json. README has a `## Pi` install section with `### Capability notes` (added in Phase 7).
- **Skills:** all 8 are spec-relative and capability-conditional (Phases 1–7). Three carry `compatibility:` frontmatter (mvp, dr-research, dr-ship) — requirements-phrased so this phase can't contradict them, only confirm them. Six carry Accepted Deviations (top-level `argument-hint`/`disable-model-invocation`/`effort`; rationale in `_project/plans/completed/005-skill-portability-phase-7.md` Phase 1 triage task).
- **Pi:** never run on this machine. The Phase 0 matrix (workstream doc Appendix) is the expectation baseline: lenient spec superset, `/skill:name` invocation, `disable-model-invocation` honored, unknown frontmatter ignored, `allowed-tools` not enforced, no `$ARGUMENTS` substitution (args appended as `User: <args>`), stock Pi has no web/subagents/background-bash/MCP/structured-questions (all package-land). Pi ships patches every 1–3 days — the matrix itself says re-verify load-bearing rows now.
- **Inherited obligations landing here** (the complete list):
  1. Restructure PRD deferred AC (a): `pi install git:github.com/dionridley/ai-tools` succeeds; `/skill:dr-plan` invocable; `disable-model-invocation` skills explicit-only.
  2. Restructure PRD deferred AC (b): the README settings-filter snippet excludes the `experimental` bundle.
  3. Phase 6 deferred `[?]`: Pi bash background execution (`cmd &`, `$!`, ps/kill) — mvp's agent-managed server mode depends on it.
  4. Phase 6 deferred `[?]`: Pi project-scoped MCP config analog — extends or confirms mvp start.md Phase 5b's conditional.
  5. Phase 7 validator baseline: 6 skill dirs exit 1 with exactly one accepted-deviation message each; frontend-design + react-19 exit 0.
  6. `.research/pi-releases.md` trigger 1: decide tag-or-not now that Phase 8 is starting.
  7. Phase 8 exercise list: dr-plan create, dr-prd create, dr-research standard path, dr-init fresh, dr-ship carefully (it pushes), mvp start+build on a toy app. frontend-design/react-19 need only discovery checks (content-only skills, no Claude-isms).

## Assumptions

- [x] Node.js/npm/npx work on this box — plan 005 ran `npx -y skills-ref@0.1.5` successfully (2026-07-12).
- [x] `github.com/dionridley/ai-tools` is public and main == `518671c` == the released baseline — PR #5 squash-merge, post-merge sync verified.
- [x] Fixture projects must live **outside** the ai-tools tree — Pi concatenates AGENTS.md/CLAUDE.md from global + parent dirs + cwd (Phase 0 matrix, docs/index.md), so nesting fixtures under this repo would bleed repo instructions into test sessions. Fixture root: `S:/dev/scratch/pi-phase8/`. Evidence (deviation log, transcripts) stays in-repo under gitignored `.research/pi-phase8/`.
- [x] Stock Pi lacks subagents, background bash, structured questions, web, and MCP (Phase 0 matrix) — so the expected modes are: mvp in Reduced Sequential Mode, plain-text questions everywhere, dr-research declaring its web requirement, dr-ship inline-verifier fallback on `--verify`.
- [x] The Pi CLI installs and runs on Windows 11 — verified 2026-07-12 (Phase 1): npm-global install clean, `pi --version` → 0.80.6, live completions on deepseek-v4-pro.
- [ ] [?] The Phase 0 matrix rows still hold at the current Pi version (stamped 0.80.3, five weeks old). Re-verified implicitly as Phases 2–4 exercise each row; drift gets deviation-log entries.
- [x] Pi's non-interactive modes are workable for scripted multi-turn skill exercises — verified 2026-07-12 (Phase 1): `-p` one-shot and `-p -c` continuation both live-confirmed (transcripts probe-1/probe-2); execution mode decided agent-driven.
- [ ] Definition of Done note: this repo has no test/lint/typecheck suite — those DoD lines are struck; verification is recorded Pi-session evidence, on-disk artifacts, and validator runs.

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

### Blocking

Must resolve before implementation starts.

- [x] [DECIDED: 2026-07-12] **Pi provider/model/auth:** which provider + model should Pi use, and is an API key available for non-interactive use? Pi sessions bill this key; mvp build is the heaviest exercise. Key setup (env var / login) is a user-run step — the executing agent never handles credential values.
  - Option A (recommended): Anthropic key via environment; a cheap/fast model for all exercises, escalating only if a deviation needs sharper discrimination.
  - Option B: another provider Pi supports — name it and its key mechanics.

  > **Decision:** Option B — DeepSeek, model "v4 pro" (user-specified).
  > **Rationale:** User's provider choice. Phase 1 confirms Pi-side DeepSeek support, pins the exact model identifier, and sets up the key as a user-run step (typically `DEEPSEEK_API_KEY`). If Pi cannot target DeepSeek, escalate at Phase 1 — do not silently substitute a provider. Deviation-log verdicts must note the model used, so model-specific skill-following quirks can be separated from portability defects.

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-12] **Tag the current release commits before testing?** (`.research/pi-releases.md` trigger 1.) Recommendation: **skip** — zero Pi consumers exist, pinning/update mechanics were already verified in the 2026-07-06 deep dive (ledger claim #5), and tags are retrofittable via `claude plugin tag`. Whichever way it lands, record the decision in `.research/pi-releases.md` (Phase 1 task).

  > **Decision:** Skip tagging.
  > **Rationale:** Zero consumers, pinning mechanics already verified, retrofittable anytime — revisit at the first real Pi consumer (pi-releases.md trigger 2). Phase 1 records this outcome in `.research/pi-releases.md`.
- [x] [DECIDED: 2026-07-12] **dr-research full-web leg:** attempt `pi install npm:pi-web-access` and run the standard path end-to-end, or settle for the mandatory leg (stock Pi correctly declares the web requirement and stops)? Default: attempt the package; if it demands new accounts/keys or more than ~15 minutes of friction, the declaration leg plus a documented partial-coverage note is acceptable.

  > **Decision:** Attempt the package, degrade on friction (the plan's default).
  > **Rationale:** Try `pi install npm:pi-web-access` and run the full standard path; if it demands new accounts/keys or more than ~15 minutes of friction, the declaration-leg result plus a documented partial-coverage note closes the item.
- [x] [DECIDED: 2026-07-12] **Execution mode:** agent-driven (scripted headless sessions) vs user-driven (user at the Pi TUI with prepared scripts) — resolved empirically by Phase 1's drive-mode probe; mixed mode per-skill is fine (e.g., agent drives dr-plan/dr-ship, user drives mvp if interactivity is heavy).

  > **Decision:** Agent-driven.
  > **Rationale:** Phase 1 live-verified both `-p` (one-shot) and `-p -c` (session continuation) on deepseek-v4-pro — scripted multi-turn works, so the executing agent drives all exercises from Bash; the user was needed only for the auth step (done). Per-skill fallback to user-driven remains available if an exercise proves too interactive.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [x] Pi CLI operational on this machine, and `pi install git:github.com/dionridley/ai-tools` succeeds (restructure AC (a), install leg). — *Pi 0.80.6 on Windows 11; install exit 0, clone at `518671c` (log rows 2, 5).*
- [x] All 8 skills discovered by Pi; `disable-model-invocation: true` skills are explicit-only; `/skill:dr-plan` is invocable (restructure AC (a), invocation leg). — *Model view = exactly the 4 manifest-visible; all 4 hidden skills invoked explicitly across Phases 2–4; dr-plan CREATE ran end-to-end (rows 6, 10–13).*
- [x] The README `## Pi` settings-filter snippet, applied verbatim, excludes the experimental bundle while the other skills remain (restructure AC (b)). — *Both directions confirmed (row 7).*
- [x] Exercise matrix complete, each with a deviation-log verdict: dr-init fresh (incl. AGENTS.md/CLAUDE.md both-files precedence), dr-prd create, dr-plan create, dr-ship display-only degradation with `--verify` inline fallback, dr-research (mandatory declaration leg; full-web leg per [OPEN] resolution), mvp start+build on a toy app. — *All six exercised with verdicts (rows 10–22); precedence: AGENTS.md loads alone (row 11).*
- [x] Both Phase-6 deferred `[?]` probes (background exec; MCP-config analog) answered with evidence, and the conditional prose confirmed to cover reality — or fixed. — *Background exec PRESENT (matrix correction, row 18); MCP absent as designed (row 19); prose covered both outcomes, no edit needed.*
- [x] Validator baseline re-confirmed at `518671c`: 6 dirs exit 1 with exactly the accepted message, frontend-design + react-19 exit 0. — *Exact 8/8 match (row 1); changed dirs re-validated post-fix.*
- [x] Every deviation-log row dispositioned (fixed + released per the version ritual, or documented); any fixes re-verified in Pi before shipping. — *24/24 dispositioned; dr-research fix Pi-retested (row 24); mvp fallback verified by review (nondeterministic trigger — stated in Phase 5 task 2); releases pm 3.1.1 / exp 0.10.1.*
- [x] Workstream closed: `.research/skill-portability-plan.md` Phase 8 marked ✅ COMPLETE with evidence, both inherited `[?]` checkboxes flipped, header status → workstream COMPLETE; tag decision recorded in `.research/pi-releases.md`. — *All done 2026-07-12.*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — no automated test suite in this repo (see Assumptions).
- ~~Lint clean~~ — not applicable.
- ~~Typecheck clean~~ — not applicable.

Substitute: phase Verification items produce recorded evidence — transcripts under `.research/pi-phase8/transcripts/`, artifacts on disk in the fixtures, and deviation-log rows citing them.

## Implementation Plan

### Phase 1: Pi Runtime, Fixtures, and Local Baseline

#### Tasks

- [x] Confirm the Pi CLI's current npm package name and install channel from pi.dev / badlogic/pi-mono docs (the audit stamped `@earendil-works/pi-coding-agent` 0.80.3 on 2026-07-06 — re-check rather than trust), install it globally, and record `pi --version` in the deviation-log header. Windows-compat findings (if any) are the first log rows. — *Done: npm registry confirms the package name; installed 0.80.6 globally (3 patches past the audit's 0.80.3); version in log header; zero Windows issues (log row 2).*
- [x] Configure provider/model per the resolved [AWAITING] answer; key setup is a user-run step if needed. Verify with a trivial one-shot completion. — *Done: deepseek/deepseek-v4-pro pinned from the live catalog; user added the key to `~/.pi/agent/auth.json`; one-shot completion verified (probe-1).*
- [x] Probe drive modes: can a one-shot prompt run non-interactively? Can a multi-turn session be scripted (json/rpc/continue mechanisms per current docs)? Resolve [OPEN] execution mode and note the per-skill driving plan in the log. — *Done: `-p` and `-p -c` live-verified (probes 1–2); [OPEN] resolved: agent-driven (decision recorded in Open Questions and log row 4).*
- [x] Create the evidence scaffold `.research/pi-phase8/`: `deviation-log.md` (columns: area | expected — citing source: compatibility claim / README capability note / matrix row | observed | severity: blocker/mismatch/cosmetic | disposition: fix-now/fix-phase-5/document-only) and `transcripts/`. Write the deviation policy at the top: only blockers are fixed mid-phase; all else batches to Phase 5. — *Done: log with policy, schema, env header, rows 1–4; transcripts/ holds probe-1 and probe-2.*
- [x] Create the fixture root `S:/dev/scratch/pi-phase8/` (outside the repo tree — parent-AGENTS.md bleed rationale in Assumptions). — *Done: created; probes confirmed Pi writes sessions to `~/.pi/agent/sessions/<encoded-cwd>/`, not the cwd.*
- [x] Validator baseline smoke at `518671c`: run `npx -y skills-ref@0.1.5 validate` on all 8 skill dirs; expect frontend-design + react-19 exit 0 and the other six exit 1 with exactly their one accepted-deviation message (plan 005 baseline). — *Done: exact 8/8 match (log row 1).*
- [x] Record the tag decision (decided 2026-07-12: skip) in the deviation log and append it to `.research/pi-releases.md`. — *Done: log row 3; pi-releases.md trigger 1 struck with the resolution.*

#### Verification

- [x] Run `pi --version` — expected: a version prints; value recorded in the log header. — *0.80.6.*
- [x] One-shot completion returns model output — expected: success under the chosen provider/model. — *"PONG" on deepseek-v4-pro (probe-1).*
- [x] Read `.research/pi-phase8/deviation-log.md` — expected: header (pi version, date, model), column schema, deviation policy, tag decision row. — *All present: env header, policy, rows 1–4, session index.*
- [x] Validator run output — expected: 8/8 dirs match the plan-005 baseline exactly; any drift is a deviation-log row (the baseline was taken 0 commits ago, so drift would mean validator-version drift — pin 0.1.5). — *Exact match at skills-ref 0.1.5.*
- [x] `Glob S:/dev/scratch/pi-phase8/*` — expected: fixture root exists, empty. — *Exists; still empty after probes (Pi sessions stored user-globally).*

#### Acceptance Criteria

- Pi runs on this machine with working auth, or the plan has escalated with the specific failure (Windows incompatibility is a legitimate early exit — surface it, don't work around it silently).
- Execution mode decided and recorded; evidence scaffold ready; validator baseline confirmed.

#### Phase Exit Gate

<!-- verifier-recommendation: no — environment setup with binary, directly observable command outcomes; self-review over recorded outputs suffices, and Phase 5's whole-plan verifier re-audits the evidence trail. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — *DoD struck (no suite); substitute satisfied: evidence recorded in the deviation log + transcripts.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. — *Self-review 2026-07-12: all 7 tasks flipped on passing verification; no skips or failures; the one residual `[?]` (matrix staleness) is by-design open until Phases 2–4 exercise the rows.*

### Phase 2: Package Install and Catalog Verification

#### Tasks

- [x] `pi install git:github.com/dionridley/ai-tools` — record the full output. This is restructure AC (a)'s install leg, run verbatim against released main. — *Done: exit 0; full git clone at `518671c` under `~/.pi/agent/git/...`; registered in settings.json (log row 5, phase2-install.txt).*
- [x] Enumerate what Pi discovered (via `pi config` or the current listing mechanism): all 8 skills present with correct names and descriptions; note the on-disk layout of the installed package (needed for the sibling cross-skill ref check in Phase 3). — *Done: `pi config` is TUI-only, so enumeration = model-view (exactly the 4 manifest-visible skills) + settings.json + full-clone layout (all 8 dirs on disk, repo structure preserved → sibling refs plausible, live check in Phase 3). Log row 6.*
- [x] Verify explicit-only behavior: skills whose manifests at `518671c` set `disable-model-invocation: true` are hidden from auto-discovery yet invocable as `/skill:<name>`. Spot-confirm `/skill:dr-plan` loads its SKILL.md content (AC (a)'s invocation leg — full CREATE run belongs to Phase 3). — *Done: hidden set (mvp, dr-init, dr-research, dr-ship) absent from model view; `/skill:dr-ship` and `/skill:mvp` resolve while hidden; `/skill:dr-plan` → CREATE empty-args prompt with `_project/` paths — in-skill relative ref resolved from the clone. dr-init/dr-research invocations land in Phase 3. Log row 6, three transcripts.*
- [x] Apply the README `## Pi` settings-filter snippet verbatim; verify the experimental bundle's skill disappears from discovery while the other 7 remain (AC (b)); then revert the filter and confirm restoration. — *Done: mvp rejected under filter, visible 4 unchanged, hidden pm skill still resolves; revert restored mvp (log row 7).*
- [x] Annotate in the deviation log which Phase 0 matrix load-bearing rows this phase re-confirmed (spec discovery, `disable-model-invocation`, unknown-frontmatter tolerance) and any drift from the 0.80.3-stamped expectations. — *Done: all re-confirmed at 0.80.6, zero drift (log rows 5–7); two README defects found in passing (rows 8–9, cosmetic, Phase 5).*

#### Verification

- [x] Install command exits 0 — expected: package registered; output captured to transcripts. — *Exit 0; phase2-install.txt.*
- [x] Discovery enumeration — expected: 8/8 skills, names matching directory names. — *8/8 registered (full clone, all skill dirs; names = dir names per validator baseline); 4 model-visible by design, 4 hidden — of which dr-ship + mvp invocation-verified now, dr-init + dr-research verified by their Phase 3 exercises.*
- [x] `/skill:dr-plan` invocation — expected: skill content loads; the session transcript shows the SKILL.md routing text. — *Better than routing text: the response IS create-mode.md's empty-args prompt — the route was followed end-to-end (phase2-explicit-invocation.txt).*
- [x] Filter test — expected: exclusion while filtered, full set after revert. — *Confirmed both directions (log row 7).*

#### Acceptance Criteria

- Both deferred restructure-PRD acceptance criteria hold with evidence in the log, or their failures are logged as deviations with severity.

#### Phase Exit Gate

<!-- verifier-recommendation: no — every check is a directly observable command/session result captured in transcripts; the Phase 5 verifier re-derives the whole trail. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — *DoD struck (no suite); substitute satisfied: six transcripts + log rows 5–9.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. — *Self-review 2026-07-12: all 5 tasks flipped; both restructure ACs hold with evidence; the two deferred hidden-skill invocations (dr-init, dr-research) are explicitly scheduled as Phase 3 exercises, not silently assumed.*

### Phase 3: Exercise the dr-* Skills (Fixture Journey)

One realistic project journey in `S:/dev/scratch/pi-phase8/journey/` — git init'd, **no remote** (verify `git remote -v` is empty before dr-ship). Each exercise runs once; per-skill verdict rows go in the deviation log with transcript references.

#### Tasks

- [x] **dr-init fresh:** run `/skill:dr-init` in the empty fixture. Expect: AGENTS.md with section markers, thin CLAUDE.md pointer, `_project/` scaffolding, plain-text questions. Then start a new Pi session in that dir and confirm Pi loads the AGENTS.md content with both files present (matrix both-files precedence check) — log how Pi handles the pair. — *Done: one-shot, 9 files, markers v3/v3/v1, pointer verbatim (log row 10). Precedence probe: Pi loaded AGENTS.md only, content reached the model, no duplication (row 11).*
- [x] **dr-prd create:** `/skill:dr-prd` with a tiny feature idea. Expect: discovery questions fall back to plain text (AskUserQuestion convention line), PRD lands in `_project/prd/`. — *Done: 3 plain-text discovery rounds → 12-section PRD (row 12).*
- [x] **dr-plan create:** `/skill:dr-plan` with a plain toy request (crafted without overlay keywords so the flow stays single-pass). Args arrive appended as `User: <args>` — confirm the no-`$ARGUMENTS`-substitution tolerance holds and a plan lands in `_project/plans/draft/`. Note trigger-gate behavior on Pi. — *Done, with a deliberate variation: passed the PRD as an `@`-ref (still single-pass — user-facing PRD → standard-feature silently) to also exercise the no-expansion tolerance. Skill read the file itself (Related PRD populated); DoD escape hatch fired correctly; plan 001 in draft/; trigger gate treated the /skill: invocation as genuine. Sub-finding: false "created plans dir" note — model slip, logged (row 13).*
- [x] **Simulate completion:** move the toy plan to `in_progress/` and hand-flip its checkboxes — this tests the ship ritual, not toy-plan execution. — *Done: all boxes flipped via sed, Status → in_progress.*
- [x] **dr-ship with `--verify`:** run `/skill:dr-ship --verify`. Expect: inline-verifier fallback (no subagents on stock Pi), Ship Report with plain-text gate, close-out (retro backfill + move to `completed/`), a commit in the fixture repo, and push/PR degrading to display-only per dr-ship's compatibility claim. Confirm no push was attempted. Confirm the cross-skill sibling read (`../dr-plan/references/summary-mode.md`) resolves in the installed layout — cite the layout fact from Phase 2. — *Done, everything confirmed (row 14): main-guard fired; inline verifier re-derived truth (13 FAIL vs hand-flips); waiver flow exercised (13 dated tags); commit `acedbb9`, no remotes, no push; PR + commit message in summary-mode's exact shape → sibling ref resolved in the full-clone layout; temp files cleaned.*
- [x] **dr-research, leg 1 (mandatory):** invoke on stock Pi (no web package). Expect: up-front web-requirement declaration naming a remedy, graceful stop. — *Exercised; expectation FAILED — model bypassed the SKILL.md L15 guard and fabricated a complete research product from memory, incl. an 8-source bibliography (log row 16, severity mismatch, fix-phase-5: promote the check to a blocking flow step).*
- [x] **dr-research, leg 2 (decided: attempt, degrade on friction):** `pi install npm:pi-web-access`, re-run with a small research question. Expect: standard-path outputs under `_project/research/<topic>-<date>/`. If skipped per the friction rule, log the partial-coverage note instead. — *Done: zero-config install (Exa MCP, no keys); real searches; full canonical outputs incl. microsite (row 17). Per-skill verdicts for the whole journey: rows 10–17.*

#### Verification

- [x] Read fixture artifacts — expected: AGENTS.md + CLAUDE.md pointer + `_project/` tree; PRD file; toy plan in `completed/` after ship; research outputs if leg 2 ran. — *All present, incl. both research trees (leg-1's fabricated tree kept as row-16 evidence).*
- [x] Run `git log` and `git remote -v` in the fixture — expected: the dr-ship commit exists; remotes empty; no push occurred. — *`acedbb9` on `plan-001-exif-photo-renamer`; remotes empty; nothing to push to.*
- [x] Read transcripts — expected: one per exercise under `.research/pi-phase8/transcripts/`, each cited by a deviation-log verdict row. — *22 transcript files; session index maps them to rows 10–17.*

#### Acceptance Criteria

- Five dr-* skills exercised in Pi with per-skill verdicts (works / degrades-as-documented / deviation) and evidence; the dr-ship→dr-plan sibling reference is confirmed working in the installed layout; nothing escaped the fixture.

#### Phase Exit Gate

<!-- verifier-recommendation: no — outcomes are on-disk artifacts plus transcripts, all re-derivable; the single Phase 5 verifier audits the full evidence trail rather than paying per-phase. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — *DoD struck (no suite); substitute satisfied: 13 new transcripts + log rows 10–17 + fixture artifacts preserved in place.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. — *Self-review 2026-07-12: all 8 tasks exercised and flipped; the leg-1 task is flipped as "exercised", with its failed expectation explicitly logged as the campaign's most serious deviation (row 16) and batched to Phase 5 per the deviation policy — testing was able to continue, so it is not a blocker.*

### Phase 4: mvp on a Toy App + the Two Deferred Capability Probes

#### Tasks

- [x] **Background-exec probe (first — it shapes mvp expectations):** in a Pi session, attempt `sleep 30 & echo $!`, then a ps/kill sweep. Expected per matrix: absent ("No background bash. Use tmux."). If absent: confirm mvp's prose + compatibility string + README capability notes already present user-managed-server as the Pi mode (document-only disposition). If present: log a matrix correction; agent-managed server test becomes optional extra credit. — *Done: **PRESENT at 0.80.6** — PID captured, process survived across tool calls (log row 18). Matrix correction recorded; extra-credit path taken: agent-managed mode exercised live in the mvp build.*
- [x] **MCP-analog probe:** check current Pi docs/config for a project-scoped MCP configuration analog. Expected: absent in core → mvp start.md Phase 5b's skip-path stands (document-only). If an analog exists: Phase 5 fix — extend the 5b conditional to name it (experimental bump). — *Done: absent in core by design (usage.md); skip-path stands, live-confirmed via `playwrightEnabled: false` + HTTP-check fallback note (row 19). No edit needed.*
- [x] **mvp start:** in `S:/dev/scratch/pi-phase8/mvp-app/`, invoke mvp with a deliberately tiny brief (single-page static web app, one interactive element). Expect: one continuous session (no settings-write/restart fork — that's the Claude Code path), `.mvp/` state bookkeeping, plain-text questions. — *Done: non-Claude fork taken explicitly; state.json canonical; sub-incident — a silent zero-stdout turn mid-scaffold, fully recovered via state-driven resume (row 20).*
- [x] **mvp build:** expect Reduced Sequential Mode — main agent as orchestrator+worker, locks/agent-logs bookkept, `agentSpawns` = 0, status/summary rendering "N/A" ratios. Run to a working toy app or a well-understood stop; log everything. — *Done to a working app: 29/29 tasks, agentSpawns 0, 6 agent-logs, 7 commits, tests pass, app live-verified; status/summary render N/A (row 21). One bookkeeping miss: devServer PID not stored in state, servers left running — cleaned up, logged (row 22).*
- [x] Write per-verdict deviation-log rows for both probes and both mvp stages. — *Done: rows 18–22.*

#### Verification

- [x] Read probe transcripts — expected: definitive evidence for both probes (command output / doc citation), each mapped to its workstream-doc `[?]`. — *Background exec: live PID evidence (phase4-probe transcript). MCP: usage.md doc citation. Both mapped in rows 18–19; workstream `[?]` flips happen in Phase 5's doc task.*
- [x] Read `S:/dev/scratch/pi-phase8/mvp-app/.mvp/state.json` — expected: exists; fields consistent with Reduced Sequential Mode (agentSpawns 0 unless real dispatches happened). — *`agentSpawns.total: 0`; v1.1.0 schema; one inconsistency: devServer pid null while servers ran (row 22).*
- [x] Read the built app artifact — expected: exists and matches the tiny brief. — *`src/components/DiceRoller.tsx` + `src/lib/dice.ts` with tests for both; dev server answered 200 during verification.*
- [x] Read captured status/summary output — expected: "N/A" ratios on zero spawns (or real ratios if spawns occurred). — *status: "Agents spawned: N/A (Reduced Sequential Mode)"; summary.html contains the N/A render.*

#### Acceptance Criteria

- Both deferred `[?]` probes answered with evidence strong enough to flip the workstream doc's checkboxes.
- mvp exercised start→build in its documented Pi mode, with a verdict on whether Reduced Sequential Mode behaved as written.

#### Phase Exit Gate

<!-- verifier-recommendation: no — probes are binary with captured evidence; mvp verdicts rest on artifacts and transcripts the Phase 5 verifier re-audits. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — *DoD struck (no suite); substitute satisfied: 8 new transcripts, log rows 18–22, mvp-app fixture preserved with all artifacts.*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. — *Self-review 2026-07-12: all 5 tasks flipped; both `[?]` probes answered (one overturning the matrix — background exec present); the PID-bookkeeping miss and silent-turn quirk are logged, not hidden; acceptance criteria met — Reduced Sequential Mode behaved as written wherever the model followed instructions, and the two model slips are attributed as such.*

### Phase 5: Triage, Fix-or-Document, Release, and Workstream Close-Out

#### Tasks

- [x] Sweep the deviation log: every row gets a final disposition — fixed / documented / accepted-expected. No empty dispositions. — *Done: 24 rows, zero empty dispositions (awk check); 2 fixed-with-release, 1 README-only fix, 1 retracted (row 8 — search-tool display artifact), rest accepted/documented.*
- [x] Apply fixes (if any) to skill/doc content. Per changed bundle: version bump in all three locations + CHANGELOG entry per the release ritual. Re-verify each fix in Pi before shipping (expected mechanism: `pi install <local path>` — probe its live-vs-copy semantics when first used; a branch git install is the fallback). — *Done: 3 content fixes (dr-research Phase 0 guard; mvp null-PID sweep fallback; README explicit-only list). pm 3.1.1 + exp 0.10.1, triple equality verified, CHANGELOGs dated. Local-path install confirmed live-reference (row 23); dr-research fix retested in Pi — guard stops correctly (row 24). Exception, stated plainly: the mvp fallback was NOT Pi-retested — its trigger is a nondeterministic model bookkeeping slip that can't be reproduced on demand; verified by review only.*
- [x] Re-run `npx -y skills-ref@0.1.5 validate` on any changed skill dirs — baseline expectations must still hold (accepted-deviation message only, or exit 0). — *Done: both changed dirs exit 1 with exactly the accepted message.*
- [x] Update the README `## Pi` capability notes if observed reality diverged from any claim. — *Done: no capability-note claims diverged (all verified accurate); the one README fix was the explicit-only skill list (row 9).*
- [x] Update `.research/skill-portability-plan.md`: flip the two deferred `[?]` checkboxes with evidence; Phase 8 heading → ✅ COMPLETE with date and evidence pointers; header Status → all phases complete, workstream CLOSED. — *Done: both `[?]`s flipped (background exec PRESENT — matrix correction; MCP absent as expected); Phase 8 section rewritten with evidence; header reads WORKSTREAM COMPLETE.*
- [x] Append final Pi facts to `.research/pi-releases.md` (tag-decision outcome from Phase 1 stands; add any new install/pinning facts learned). — *Done: "Phase 8 facts" section (git install verified, local-path = live reference, tag skip stands).*
- [x] If the branch has zero committable diff (all dispositions document-only into gitignored paths), record that explicitly in the log and Retro: the plan closes without a release or PR. — *N/A — real 10-file diff (2 bundle releases + README + 2 skill files); the plan ships normally via /dr-ship.*

#### Verification

- [x] Grep the deviation log for empty disposition cells — expected: none. — *24 rows, none empty.*
- [x] If bumps happened: per changed bundle, `plugin.json` = `package.json` = `marketplace.json` version (triple equality) and a CHANGELOG entry dated today. — *pm 3.1.1 ×3, exp 0.10.1 ×3, et untouched at 0.4.1; both entries dated 2026-07-12.*
- [x] Read `.research/skill-portability-plan.md` — expected: Phase 8 ✅, no remaining unflipped inherited checks, header shows workstream complete. — *Confirmed; both inherited `[?]`s are `[x]` with evidence.*
- [x] Validator re-run output on changed dirs (if any) — expected: baseline holds. — *Holds on both.*

#### Acceptance Criteria

- Every inherited Phase-8 obligation (Current State list items 1–7) is closed with evidence.
- Repo state is releasable — or the no-release outcome is explicitly recorded with its rationale.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — whole-plan evidence audit: re-derive the deviation log against transcripts and on-disk artifacts, confirm every inherited obligation is dispositioned, validate release-ritual consistency (or the no-release rationale), and judge whether evidence actually supports each "works-as-documented" verdict — semantic evaluation beyond command-level checks. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — *DoD struck (no suite); substitute satisfied: 31 transcripts, 24-row log, two preserved fixtures, verifier re-derivation.*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number (scope: whole plan — single-gate pattern). Wait for its report. — *Spawned 2026-07-12 with whole-plan scope; report received.*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — *Verifier: PASS on every task, verification item, and Success Criterion across all 5 phases; zero FAIL/UNVERIFIED; "nothing to un-flip." It independently re-ran the validator (8/8 baseline), verified clone HEAD `518671c`, release triple-equality, both fixtures' ground truth, and spot-read 17 transcripts incl. the fabrication and retest evidence. Both declared exceptions judged honestly labeled. Two observations applied at close-out: recurred stray `nul` at fixture root removed + log note added; workstream-doc transcript count corrected 24→31.*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in the Retro. — *Confirmed: gate items flipped per the report's recommendation; no UNVERIFIEDs exist; the verifier's two cosmetic observations are resolved, not deferred.*

## Refinement History

- **2026-07-12:** Initial plan creation.
- **2026-07-12:** Resolved 1 blocking + 2 non-blocking questions, verified 0 assumptions; Verification Policy unchanged (Adaptive).

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. **Exception:** if Phase 5 recorded the zero-committable-diff outcome, skip the `/dr-ship` suggestion — there is nothing to ship; close out locally and say so.

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- Agent-driven headless Pi (`-p` / `-p -c`) carried all 31 sessions; the only user action in the entire campaign was pasting the API key. The Phase 1 drive-mode probe that decided this took two trivial sessions.
- The deviation-log discipline (expected-with-source | observed | severity | disposition, model always noted) kept model slips cleanly separated from portability defects — five model artifacts documented, none misfiled as skill bugs.
- Testing found exactly what it exists to find: one real guard bypass (dr-research fabricating research incl. a bibliography on web-less Pi) that seven phases of docs-derived work could never have caught. Fixed, Pi-retested same-day.
- The hand-flipped-plan ship test doubled as a live inline-verifier test: it re-derived the fake completion (13 FAIL) and exercised the waiver flow — machinery plans 004/005 never touched.
- Fixtures outside the repo tree (parent AGENTS.md bleed rationale) proved out: journey sessions loaded only the fixture's own AGENTS.md — which also cleanly answered the both-files precedence question.
- mvp's canonical-state-on-disk design absorbed a real mid-flow failure (silent zero-stdout turn) with a one-line resume.

### What didn't

- Row 8 logged a "typo" off a search-tool display artifact; a byte-faithful Read at triage retracted it. Text-level defects must be confirmed with Read before logging.
- A Pi `-p` turn can end with zero stdout mid-flow (observed once, mvp scaffold) — transcript capture has a hole for such turns; the work happened on disk regardless.
- Windows `> nul` litter recurred at the fixture root after the first cleanup; row 15 predicted it but the follow-up sweep was missed until the verifier flagged it.
- The verifier brief said "24 transcripts" (conflating the log's row count with the file count, 31) — harmless, but briefs should re-count, not recall.

### Learnings

- **Imperative preamble prose is not a guard on weaker models.** Safety-relevant checks must be numbered blocking flow steps (the pm 3.1.1 pattern). If another skill's guard gets bypassed in the wild, audit all preamble-only imperatives the same way.
- Pi facts go stale fast: the "no background bash" matrix row was wrong within five weeks (plain POSIX `&`/`$!` works and persists at 0.80.6). Re-verify capability claims empirically at point of use; don't trust audits older than a few Pi releases.
- Local-path Pi installs are live references — the ideal fix-loop mechanism (edit → retest, no reinstall). Recorded in `.research/pi-releases.md` (repo root, gitignored).
- Evidence-heavy plans verify well with a single whole-plan gate: the verifier re-derived five phases from transcripts + fixtures in one pass; per-phase gates would have added cost without coverage.
