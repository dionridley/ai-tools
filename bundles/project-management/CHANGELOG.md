# Changelog

All notable changes to the Project Management Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.3] - 2026-07-21

README accuracy pass (plan 010, Stage 3 install & discovery slice). No skill behavior changes.

### Fixed

- **README install link** — `../README.md#installation` pointed at a nonexistent `bundles/README.md` and an anchor the repository README never had; it now points at the repository README's per-harness install instructions (`../../README.md`).
- **Stale pre-marketplace troubleshooting entry** — the "commands not appearing" fix still told users to check the manual-install path `~/.claude/plugins/project-management/` and run `/plugin list`; replaced with the marketplace-era checks (`claude plugin list` / `/plugins` UI, `claude plugin marketplace update ai-tools`, session restart).

### Changed

- **Cross-harness framing** — title and footer no longer describe the plugin as Claude Code-only; it serves Claude Code and other Agent Skills harnesses (e.g., Pi).

## [3.1.2] - 2026-07-14

dr-init generated-output fixes, all found by dogfooding in this repo.

### Fixed

- **The generated CLAUDE.md pointer now uses the `@AGENTS.md` import instead of a prose instruction** — Claude Code never loads AGENTS.md natively; the import inlines it mechanically at load time, where the old "Read AGENTS.md and follow all of its guidance" relied on the model obeying prose. Both pointer forms are updated (the CLAUDE-pointer template and the State C append-note), and State C's "already points at AGENTS.md" recognition now also counts an `@AGENTS.md` import line, so re-runs don't append a redundant note.
- **The AGENTS-template header comment no longer terminates itself early** — it embedded a literal `<!-- section: name v1 -->` example, and since HTML comments cannot nest, the inner closer ended the header comment mid-sentence, leaving stray text (`).`, two orphaned lines, and a dangling closer) rendering at the top of every generated AGENTS.md. The example is now reworded delimiter-free.

### Added

- **A write-redirect note in both generated pointer forms**: new repository guidance — `/init` output, "add this to project memory" requests — belongs in AGENTS.md, not CLAUDE.md, so harnesses that read only AGENTS.md (e.g., Pi) see it too.

## [3.1.1] - 2026-07-12

Skill portability (test-in-Pi): live validation on Pi 0.80.6 found one guard a model could bypass; hardened.

### Fixed

- **dr-research: the web-access requirement is now Phase 0 — a blocking first step** — instead of a preamble note. Live Pi testing (plan 006) showed a model could sail past the prose guard and fabricate a complete research product — including a bibliography of sources never fetched — on a harness with no web tools. The check now runs before the research prompt is even read, with an explicit stop and a named remedy (Pi: `pi install npm:pi-web-access`).

## [3.1.0] - 2026-07-12

Skill portability (packaging polish): explicit environment requirements in spec-blessed frontmatter. All five skills validated against the Agent Skills reference validator (`skills-ref validate`); the three Claude Code extension fields (`argument-hint`, `disable-model-invocation`, `effort`) are documented accepted deviations — they are consumed by Claude Code from the top level and ignored by spec-lenient harnesses like Pi.

### Added

- **`compatibility` frontmatter** on the two skills with hard environment requirements, per the Agent Skills spec's optional field: dr-research (requires web search/fetch tools; other harnesses need a web-access package) and dr-ship (requires git; PR creation additionally requires the GitHub CLI and a GitHub remote, degrading to display-only output without them). dr-init, dr-plan, and dr-prd run on stock capabilities and deliberately carry no `compatibility` field.

## [3.0.0] - 2026-07-10

Skill portability, phases 4–5: harness-neutral output directories and a harness-neutral generated artifact. Two breaking changes, one migration path.

**Migration:** in an existing project, run `/dr-init` — it offers `git mv _claude _project` and the CLAUDE.md → AGENTS.md conversion (both diff-previewed, both declinable; the skills tolerate the old layout in the meantime).

### Changed

- **BREAKING: output directories renamed `_claude/` → `_project/`** — `_project/plans/`, `_project/prd/`, `_project/research/`, `_project/docs/`, `_project/resources/`. Every skill, template, and doc reference updated (183 occurrences across 22 files); leaf directory names unchanged.
- **BREAKING: dr-init now generates AGENTS.md as the canonical file** — the versioned plugin-managed sections live in AGENTS.md (from `templates/AGENTS-template.md`, renamed from `CLAUDE-template.md`); the generated CLAUDE.md is a thin pointer to it. One artifact serves Claude Code (via the pointer) and any harness that reads AGENTS.md natively (e.g., Pi). dr-plan's Definition-of-Done source scan now lists AGENTS.md first.

### Added

- **Old-path tolerance** in dr-plan, dr-prd, dr-ship, and dr-research — one line each: a project with `_claude/` and no `_project/` is recognized as pre-3.0.0, the rename is suggested, and the run proceeds against the old paths.
- **dr-init legacy migration offers** — State B detects a pre-3.0.0 project (plugin marker in CLAUDE.md, no AGENTS.md) and offers the conversion (plugin sections → AGENTS.md, pointer left behind, user content preserved; appends instead of overwriting when the project has its own AGENTS.md); every state offers `git mv _claude _project` when the legacy directory is present.
- **`templates/CLAUDE-pointer.md`** — the single source for the generated CLAUDE.md pointer.

### Fixed

- **`section-versioning.md`'s version table was stale** (claimed v2/v1/v1; the template actually carries plan-management-workflow v3, available-commands v3, task-completion-protocol v1).
- **Generated plugin marker no longer hardcodes a version** (was frozen at `v1.0.0` regardless of release) — detection matches the marker line `Plugin: project-management`, with or without a legacy suffix.

## [2.5.0] - 2026-07-10

Skill portability, phases 1–3: the skills now follow the Agent Skills spec's relative-path rule and degrade gracefully on harnesses without Claude Code's tool set (target: Pi.dev). No behavior change on Claude Code — every conditional names the Claude tool as the primary path.

### Changed

- **Relative paths per the Agent Skills spec** — all `${CLAUDE_SKILL_DIR}` references (48 across the five skills) replaced with skill-root-relative paths; each routing SKILL.md states the convention once. dr-research's Bash asset-copy uses a `<skill-dir>` placeholder resolved to an absolute path before running (shell cwd is the project root, not the skill). dr-ship's cross-skill reference to dr-plan's summary-mode is now a sibling-relative path with the bundle coupling documented.
- **Capability-conditional prose** — AskUserQuestion covered by a per-skill "structured questions, gracefully" principle (structured tool if available, else plain text + options); plan-verifier spawn instructions carry an inline-verification fallback for harnesses without subagents (dr-ship `--verify`, preflight, and the three rendered Exit Gate templates, kept word-identical); `$ARGUMENTS` first-use notes cover harnesses that don't substitute; `@file` expansion notes cover harnesses without it; branded prose reworded to "the agent"/"the harness" where Claude Code wasn't genuinely meant.
- **dr-research declares its web-access requirement up front** — stops with a clear message (and a Pi remedy: `pi install npm:pi-web-access`) instead of answering from memory when the harness has no web tools.
- **dr-prd AI-feature sections are provider-neutral** — model discovery question and example IDs no longer presume Anthropic; the exact-model-ID discipline rule is retained with provider-labeled examples.
- **Trigger Validation gates** (dr-plan, dr-prd) note that the `/dr-plan` / `/dr-prd` token is a message-text convention, independent of the harness invocation mechanism (Pi: `/skill:dr-plan`).

### Added

- **dr-ship Operating Principle 11** — the `allowed-tools` command allowlist restated as binding prose (the complete git/gh/rm surface; bans history rewrites, force pushes, branch deletion, other subcommands) for harnesses that parse but do not enforce `allowed-tools`.

## [2.4.0] - 2026-07-08

Cross-harness repo restructure: the plugin is unchanged in name and behavior, but its home and packaging grew a second harness.

### Changed

- **Folder moved** to `bundles/project-management/` (was `project-mgmt-plugin/`) as part of the ai-tools cross-harness restructure. Plugin name, skills, and agents are unchanged; file history preserved via `git mv`.

### Added

- **Pi package manifest** (`package.json`, `@dionridley/project-management`) — the bundle is now consumable from the Pi coding agent as part of the repo package (`pi install git:github.com/dionridley/ai-tools`) or standalone via a local-path install. Inert for Claude Code.

### Fixed

- **`argument-hint` frontmatter quoted** in dr-plan, dr-prd, and dr-ship — the unquoted `[...]` values were invalid YAML flow sequences flagged by `claude plugin validate` (strict parsers would drop all frontmatter, including dr-ship's `disable-model-invocation: true`). Behavior unchanged.

## [2.3.0] - 2026-07-05

`/dr-research` microsite v2: reader-selectable page width (the fix for crushed wide tables), two new palettes, and a legibility pass on every small-text tier. The view-settings bar now spans the top of the document with width controls on the left and appearance controls on the right; every choice persists per reader and carries across pages.

### Added

- **Width chooser** (template v2) — four reader-selectable modes on every page: `800` (the old fixed measure), `1000`, **`Breakout` (new default)** — 860px prose with tables that need more room automatically expanding out to 1500px — and `Full Width` (up to 1800px, keeping the Contents rail by anchoring the column beside it instead of hiding it). Persisted to localStorage and propagated across pages via `?width=` like the palette.
- **Two new palettes** — `Black & White` (pure grayscale, now first in the picker and the default) and `Mist & Indigo`; existing palettes re-lettered to a–e in display order. No-JS fallback now Black & White light.
- **Scroll-safe tables** — render.js wraps every table in an overflow container, so no table can ever be crushed below its minimum width in any mode.
- **Contrast audit** — all fg/bg pairs across the 10 palette variants now pass WCAG AA (4.5:1); Paper & Rust light's muted brown darkened to fix the one failure.

### Changed

- **Typography legibility pass** — table cells 15→17px, table headers 11.5→14px, callouts 15.5→16.5px, list items 17→18px (now matches paragraphs), code blocks 13→14px, TOC 13→14.5px, pills/footer/meta bumped ~1–1.5px.
- **Unified view-settings bar** — palette picker and light/dark toggle moved out of the separate top-right pill into a single bar spanning the document column (width left, appearance right); the bar follows the column as the width changes. Document top padding increased so the title clears the bar.
- **`figure.wide`** never renders narrower than the text column (matters in the wider modes).

## [2.2.0] - 2026-07-05

`/dr-ship` UX overhaul: the disjointed two-stage interaction (checkbox-audit prompts, then a flight plan crammed into AskUserQuestion text where markdown renders squished) is replaced by one read-only preflight → a deterministic **Ship Report** printed as normal output → one short gate question. Nothing touches the plan file or git until the gate approves, and a new **Ship anyway** escape hatch bulk-waives blocking items for a fast "just ship it" path.

### Added

- **Ship Report template** (`references/preflight.md` 1e) — a fixed-shape, code-fenced status panel shown before the gate: READINESS rows (Tasks / Success criteria / Verification / Open questions / Retro, plus Verifier with `--verify`) with ✅/⚠️/ℹ️ glyphs and `done/total` counts, SHIP PLAN rows (Branch / Stage / Push / PR), and a FILES list (predicted plan move first, porcelain entries capped at 10, no per-file commentary). Deterministic on purpose — identical shape every run.
- **Ship anyway escape hatch** — when blocking items exist, the gate offers bulk-waiving them all with `[WAIVED YYYY-MM-DD: shipped via /dr-ship escape hatch]` (checkboxes honestly stay `[ ]`; verifier verdicts on `[x]` lines get the tag with the verdict quoted). Individually-reasoned waivers remain available via Adjust.

### Changed

- **Flow restructure** — `references/verify-and-close.md` + `references/git-and-pr.md` replaced by `references/preflight.md` (readiness audit, `--verify`, git state, main/master guard, Ship Report, gate — all read-only) and `references/ship.md` (waivers, retro, metadata, move, summary generation, commit, push, PR, output — all post-approval).
- **Gate question shrunk to one line** — all state detail lives in the Ship Report above it; AskUserQuestion text never carries file lists, branch info, or PR actions again. Options adapt: clean run → Ship it / Adjust / Abort; blocking items → Ship anyway / Finish first / Adjust / Abort.
- **Abort now leaves no trace** — close-out (retro, waivers, status, move) moved from before the confirmation to after it, replacing the old "close-out survives an abort" principle. Aborting at the gate leaves the repository exactly as /dr-ship found it.
- **Retro question removed** — the retro backstop auto-drafts from plan content and conversation context with no "anything to add?" prompt; the thin-signal honesty rule is unchanged.

## [2.1.0] - 2026-07-03

New skill `/dr-ship`: the end-of-plan ritual as one pipeline — verify the plan is done, close it out, commit, push, open a PR populated from the plan summary, and hand back the squash-merge commit message.

### Added

- **`skills/dr-ship/`** (`SKILL.md` + `references/verify-and-close.md` + `references/git-and-pr.md`) — explicit-only (`disable-model-invocation: true`; it pushes and publishes, so it never fires from conversational drift). Flow:
  - **Plan discovery** — auto-detects the single plan in `_claude/plans/in_progress/` (asks when there are several), or takes an explicit `@plan-file`. Non-/dr-plan-format files degrade to a best-effort audit or abort, user's choice.
  - **Done audit** — done plans only, no WIP mode. Blocking: unchecked Tasks / Verification / Phase Exit Gate boxes, unchecked Success Criteria, unresolved `[AWAITING]` questions. Non-blocking: Assumptions, `[OPEN]` questions. Items the user declares unnecessary can be **waived** — the line gains a `[WAIVED YYYY-MM-DD: reason]` tag while the checkbox honestly stays `[ ]`.
  - **`--verify` flag** — additionally spawns the `project-management:plan-verifier` agent on the final phase; its FAIL/UNVERIFIED verdicts are treated as blocking, quoted verbatim.
  - **Close-out backstop** — if the executing agent didn't finish its Completion duties: backfill the Retro from plan-accumulated content + conversation context (one optional "anything to add?" prompt, no fabrication), set `Status: completed`, move the file to `completed/` via `git mv` (Read/Write fallback for untracked files) so the completed plan rides in the ship commit.
  - **One flight-plan gate** — a single confirmation covering branch, staged file list (`git add -A` default, adjustable), push target, and PR action. Mandatory stop when the branch is `main`/`master`, with branch creation (`git switch -c`) offered inline.
  - **Summary reuse** — reads `dr-plan/references/summary-mode.md` cross-skill and follows only its generation phase; the PR summary and commit-message formats have a single source of truth. The generated title+bullets message is written for the user's **squash-merge commit** and is always displayed at the end.
  - **Ship + graceful degradation** — commit (`git commit -F` temp file), push (`-u` when no upstream), then `gh pr create --body-file` (or the summary-mode update flow when an open PR already exists). Non-GitHub remote / missing gh / closed PR degrade to displaying the PR body (plus a GitHub compare URL when applicable) — never to failing the ritual.
  - **Cross-platform rules** — all git/gh via the Bash tool; multiline text reaches git/gh only via files (`-F` / `--body-file`, no heredocs, no multiline `-m`); temp files staged-around and deleted; native tools for all other filesystem work.

### Changed

- **`dr-plan/templates/plan-base.md`** — the Completion section gains step 3: suggest `/dr-ship` for commit/push/PR after the retro + move. Ownership is unchanged (backstop model): the executing agent still closes out when it can; `/dr-ship` verifies and backstops idempotently.
- **`dr-init/templates/CLAUDE-template.md`** — `plan-management-workflow` section bumped v2 → v3 (workflow step 7 is now "Complete & Ship: run `/dr-ship`", manual move still noted); `available-commands` section bumped v2 → v3 (adds the `/dr-ship` entry). Existing projects get both updates offered on their next `/dr-init`.
- **`plugin.json`** — `./skills/dr-ship` added to the skills array.

## [2.0.0] - 2026-07-01

Major upgrade to `/dr-research`: portable HTML microsites per report, and a two-path quality model (Standard/Deep) with mandatory output discipline. Markdown remains canonical — `/dr-prd` and `/dr-plan` consumption of `@_claude/research/.../index.md` is unaffected. Existing reports keep working untouched; the new format applies to research created from this version on (a deep dive onto an old-format parent adds the HTML view additively).

### Added

- **HTML microsite generation (Phase 3.5 in `dr-research/SKILL.md`)** — every `.md` page gets a portable `.html` sibling rendered client-side (embedded markdown + marked/highlight.js/mermaid, classic scripts, works offline over `file://`). Each report folder carries its own frozen copy of `assets/` (styles, scripts, 5 bundled woff2 fonts), so old reports never break when the template evolves; the template is stamped `<!-- template: dr-research v1 -->` for staleness detection.
  - **Theming:** 3 palettes (Stone & Teal / Slate & Amber default / Paper & Rust) × light/dark with an in-page picker, persisted to localStorage and carried across pages via `?palette=&mode=` URL params (file:// isolates storage per file); `prefers-color-scheme` default with an inline FOUC guard. Mermaid re-renders with theme-derived colors on palette/mode change.
  - **Reading experience:** Atkinson Hyperlegible body (18px) / Source Serif 4 headings / JetBrains Mono code, 800px measure; auto-generated in-page TOC with scroll-spy on pages with ≥3 sections (wide viewports); lead-paragraph styling; blockquotes render as callouts; `Confidence`/`Priority`/`Verdict` table columns auto-style as pills.
  - **Figures:** click-to-zoom overlay for all diagrams (Mermaid and SVG), `wide` breakout beyond the text column, horizontal-scroll fallback; hand-authored SVG conventions (`.dg` classes) theme automatically with the palette.
  - **Skill assets:** `skills/dr-research/assets/template/` (styles.css, render.js, theme.js, fonts/, vendor/) + `skills/dr-research/templates/page-template.html` with `{{TITLE}}/{{ASSETS}}/{{FOOTER}}/{{MERMAID_SCRIPT}}/{{CONTENT_MARKDOWN}}` placeholders. `mermaid.min.js` (~2.5 MB) is copied into a report only when a page actually renders a Mermaid diagram.
- **Deep research path** (user-requested, or suggested by the skill for decision-critical asks — user always decides):
  - **Discovery exchange** before planning: the decision this research feeds, priorities/constraints, out-of-scope, and what the user already believes.
  - **Collaborative question shaping** — key questions are the negotiable artifact: priority-ordered, disqualifiers first, each traceable to the decision.
  - **Claim ledger** — at synthesis, the 3–6 load-bearing claims ("if false, the verdict flips") are verified: primary source → causally-independent second source → one adversarial search → recency gate. Per-claim verdicts (Confirmed / Single-source / Contested / Estimated / Unverified) recorded in a findings table and cited by the index answer block. More than 6 load-bearing claims = research question too broad, surfaced to the user.
  - **Community Signal section** — standard for library/framework evaluations (maintenance cadence, license, issue health, bus factor, dated adoption numbers); metrics live once, comparisons reference them.
- **Mandatory output discipline on BOTH paths** (`SKILL.md` Phase 3 + `references/output-formats.md`) — previously good-but-optional behaviors are now structural requirements: direct answer block first in index.md (verdict + confidence + exceptions); citation at point-of-claim for decision-bearing facts; `(estimated, not measured)` tags on unmeasured decision-bearing numbers; mandatory Gaps & Limitations; confidence flags on load-bearing claims; ≥1 premise-level open question; no certainty adjectives on self-flagged unverified claims; supersession rule (later work that overturns a conclusion patches it where readers encounter it); verdict stated at most twice; risk table + decision gates + testable exit criteria for decision research.
- **`references/diagrams.md`** — replaces `mermaid-patterns.md`. Encodes the earn-your-place rubric (EARNS = flow/topology/sequence prose serializes poorly; DECORATION = re-linearizes the report's own argument; HARMFUL = fabricated precision), bans TOC-mindmaps and speculative Gantt charts, defaults the index to zero concept maps, and documents the dual representation model (markdown carries a Mermaid fence or prose; HTML shows rendered Mermaid or hand-authored themed SVG) plus SVG authoring conventions.

### Changed

- **Default file set collapsed** — `index.md` + `findings.md` + `resources.md`, plus `recommendations.md` only for decision research. Topic files only when they carry a standalone artifact (scored matrix, schema/DDL, runnable guide) or the user asks; findings.md must not summarize topic files; each claim single-sourced; verdict appears at most twice. Backstop: de-duplicated findings projected over ~1,500 lines proposes a split instead of silently producing one.
- **`references/output-formats.md`** — rewritten: answer block format, claim ledger table format, Community Signal format, mandatory Gaps/Open Questions formats, supersession markers, file defaults, and a "How markdown becomes HTML" authoring section.
- **`references/research-methodology.md`** — rewritten: the two paths and their triggers, discovery and question-shaping guidance, the claim verification protocol (independence test, adversarial search, recency gate, verdict vocabulary), premise questioning, and mandatory deep-dive reconciliation (supersession back-propagation to the parent).
- **Exemplars** (`examples/exemplar-index.md`, `examples/exemplar-findings.md`) — updated to demonstrate the answer block, claim ledger, point-of-claim citations, estimated-tags, Confidence-column tables, mandatory Gaps/Open Questions with a premise-level question, one earning diagram, and no index concept map.
- **Cross-page links** — canonical markdown links point at `.md` files; the HTML renderer rewrites relative `.md` hrefs to `.html` at view time.
- **`dr-init/templates/CLAUDE-template.md`** — `_claude/research/` directory description now mentions the HTML microsite view; `available-commands` section marker bumped to v2 with the updated `/dr-research` description.
- **`dr-research/SKILL.md` frontmatter** — `allowed-tools` gains scoped `Bash(cp:*)` and `Bash(mkdir:*)` for the per-report asset copy.

### Removed

- **`references/mermaid-patterns.md`** — replaced by `references/diagrams.md` (see Added).

## [1.10.0] - 2026-06-18

### Changed

- **Model invocation enabled for `dr-prd`** — flipped `disable-model-invocation` from `true` to `false` so `/dr-prd` fires when the token appears anywhere in the message (mid-message), not only at line-start. Stricter than `dr-plan`'s trigger by design: the literal `/dr-prd` token is **required** — there is no "explicitly asks to write a PRD" fallback — to keep the skill from over-triggering on general PRD discussion now that model invocation is on. Description rewritten with an anchored positive trigger (the `/dr-prd` token) plus an explicit negative clause (no general PRD discussion without the token). Root `CLAUDE.md` notes updated to match (`dr-plan` and `dr-prd` now use `disable-model-invocation: false` with a Trigger Validation gate; `dr-init` and `dr-research` remain explicit-only).
- **Commit-message bullet cap raised from 5 to 20 in `/dr-plan` SUMMARY mode** — `references/summary-mode.md` no longer caps the generated merge/squash commit message at ~5 bullets. The model applies the same "prioritize the most significant changes, skip trivia" judgment but may emit up to 20 bullets, without padding to hit the cap.

### Added

- **Trigger Validation block in `dr-prd/SKILL.md`** — runs before Mode Detection; proceeds only when the current message contains the literal `/dr-prd` token, otherwise briefly asks the user to confirm intent. Mirrors the `dr-plan` drift guard added in 1.9.0.

## [1.9.1] - 2026-05-13

### Fixed

- **Ambiguous assumption-marker wording in `/dr-plan` templates** — `plan-base.md`, `plan-bug-fix.md`, and `references/create-mode.md` described `[x]` and `[?]` as parallel markers ("Mark `[x]` when validated. Mark `[?]` when uncertain"), which led the plan-author Claude to write doubled-up forms like `- [ ] [x] text` and `- [ ] [?] text` for *both* validated and uncertain assumptions. Rewrote the Assumptions header in `plan-base.md` to spell out the three states explicitly: `- [ ] text` (pending), `- [ ] [?] text` (uncertain, surfaced by `/dr-plan answer questions`), `- [x] text` (validated). Clarified that `[x]` is the flipped checkbox, not a tag, and that validating a `[ ] [?]` line means flipping to `[x]` *and* dropping `[?]`. Updated `plan-bug-fix.md` and `create-mode.md` Phase 4 thinking-prompt with the same explicit forms.

## [1.9.0] - 2026-04-22

### Changed

- **Model invocation enabled for `dr-plan`** — flipped `disable-model-invocation` from `true` to `false` on `dr-plan` only, so it fires when `/dr-plan` appears mid-message (not only at line-start) or when the user explicitly asks to create, refine, or summarize a plan file under `_claude/plans/`. Description rewritten with an anchored positive trigger (the slash-token, or a request to write to `_claude/plans/`) and an explicit negative clause (general planning discussion, brainstorming, outlines) to minimize false positives. `dr-init`, `dr-prd`, and `dr-research` remain explicit-only — the noisier verbs ("research," "PRD") showed conversational-precedent drift in testing (once invoked explicitly, subsequent vague requests were incorrectly captured by the skill), and the prompt-to-copy workflow (agent suggests the explicit invocation, user runs it) is lower-friction than fighting that drift.

### Added

- **Trigger Validation block in `dr-plan/SKILL.md`** — runs before Mode Detection to guard against conversational-precedent drift. Proceeds only when the current message contains the literal `/dr-plan` token or explicitly requests a plan file under `_claude/plans/`; otherwise briefly asks the user to confirm intent. Insurance against the same drift pattern that pushed `dr-prd`/`dr-research` back to explicit-only.
- **Conversation-context harvest in CREATE mode** — `references/create-mode.md` Phase 1 now detects the mid-conversation trigger path. When `$ARGUMENTS` is empty, whitespace, or a trivial pronoun ("this") AND the preceding conversation has substantive context, the skill summarizes that context back to the user for confirmation instead of asking them to restate what they just discussed. Eliminates the jarring "what would you like to implement?" prompt after a user says *"ok, let's /dr-plan this."* Falls back to the original prompt when no prior context exists.

## [1.8.0] - 2026-04-20

### Changed

- **`/dr-plan` converted from command to Skill 2.0** (`skills/dr-plan/`) with substantive workflow improvements. This completes the project-mgmt command-to-skill migration started in #16, #17, #18, and #19. Invocation is unchanged (`/dr-plan`); internals are fully rewritten.
  - **Four-block per-phase structure** — every phase now has Tasks / Verification / Acceptance Criteria / Phase Exit Gate blocks. Replaces the old Tasks-only-plus-maybe-tests structure. Designed to prevent "false completion" where an agent reports done without actual verification.
  - **Three-layer criteria framing** — plan-level `Success Criteria` + per-phase `Acceptance Criteria` + universal `Definition of Done` block. DoD is populated at create-time from the project's config files (`CLAUDE.md`, `AGENTS.md`, `package.json`, `Cargo.toml`, etc.) and referenced by every Phase Exit Gate.
  - **Strict DoD discipline** — every phase must leave the codebase shippable (tests/lint/typecheck green at every phase boundary). CREATE mode restructures phases to satisfy this rather than allowing broken intermediate states. Rare interim phases (when restructuring is genuinely impossible) are marked with `<!-- interim-phase: ... -->` and a prominent "DO NOT MERGE BEFORE PHASE N" callout.
  - **Autonomous execution principle** — plans are designed to execute to completion without user intervention unless something goes wrong. Phase Exit Gates are self-discipline encoded in the artifact, not user checkpoints. Up to 2 retries (3 total attempts) before escalation.
  - **Adaptive template system** — default `standard-feature` applied silently. Four overlays (`ai-feature`, `migration/infra/refactor`, `bug-fix`, `spike`) announce-and-confirm only when detection signals are present. Overlays add phases (Eval Rubric Setup, Verify-in-Prod), add sections (Rollback Plan, Entry Preconditions), or omit sections (Dependencies for bug fixes).
  - **Auto-detect current-branch PR in SUMMARY mode** — `/dr-plan @plan summary` now runs `gh pr view --json ...` to detect an open PR on the current branch and prompts (Push to PR / Display only / Cancel) before generating the summary, saving tokens on Cancel. Explicit URL invocation preserved for back-compatibility.
  - **Time estimates removed** — the old `**Estimated Time:** [X hours]` per-phase marker is gone. Task granularity replaces time as the planning signal.
  - **Implementation Notes section removed** — `Actual Time / Key Decisions / Assumptions Validated / Lessons Learned` is replaced by the new `Retro` section (populated autonomously on completion) and `Refinement History` (captures decisions as they happen).
  - **Autonomous completion + retro** — plans carry their own completion instructions at the bottom. After the final Phase Exit Gate passes, the executing agent writes a three-slot retro (What worked / What didn't / Learnings) from observable signals and moves the file from `in_progress/` to `completed/`. No user prompt required.
  - **Old-template preservation on refine** — existing plans authored under the old template are refined without structural changes unless the user explicitly opts into migration. Default is surgical refinement.
  - **Native tools over Bash** — filesystem operations use `Read`, `Write`, `Edit`, `Glob`, `Grep`. Only `Bash(gh pr view:*)` and `Bash(gh pr edit:*)` remain for SUMMARY mode.
  - **Progressive disclosure** — mode-specific logic lives in `references/create-mode.md`, `references/refine-mode.md`, `references/summary-mode.md`, `references/questions-mode.md`. Shared logic in `references/template-variants.md`.

### Added

- **`skills/dr-plan/`** — Full Skill 2.0 implementation with `SKILL.md` + 5 reference files + 5 template files
  - `SKILL.md` — four-way mode routing (CREATE / REFINE / SUMMARY / QUESTION RESOLUTION)
  - `references/create-mode.md` — gather → detect plan type → analyze → populate DoD → structure phases → annotate gates → write
  - `references/refine-mode.md` — validate → detect template generation → back up → generate → diff → confirm → apply (with opt-in old-template migration)
  - `references/summary-mode.md` — auto-detect current-branch PR, prompt-before-generate, push-or-display routing
  - `references/questions-mode.md` — blocking Q&A → non-blocking + Execution Policy as a group → assumption verification → automatic Phase Exit Gate regeneration on policy change
  - `references/template-variants.md` — overlay detection signals (PRD type + keywords + repo signals) and overlay composition rules
  - `templates/plan-base.md` — standard-feature baseline
  - `templates/plan-ai-feature.md` — AI/LLM overlay (Eval Rubric Setup phase, Model/Prompt Selection phase, AI-specific Acceptance Criteria patterns)
  - `templates/plan-migration.md` — Migration/infra overlay (Rollback Plan section, Entry Preconditions per phase, Verify-in-Prod phase)
  - `templates/plan-bug-fix.md` — Bug-fix overlay (collapsed phases, Dependencies dropped)
  - `templates/plan-spike.md` — Spike overlay (Questions to Answer instead of Success Criteria, relaxed DoD, time-box)
- **`agents/plan-verifier.md`** — Fresh-context verifier subagent that independently evaluates whether a phase completed successfully. Reads code, runs verification commands, and reports PASS/FAIL/UNVERIFIED per task and acceptance criterion. Never modifies code or plans — reports only. Tool boundaries (`Read`, `Grep`, `Glob`, `Bash` only) enforce the "reports-only" contract at the tool level, not just the prompt level.
- **Execution Policy** — new subsection under `Open Questions & Decisions` in every plan. `Verification Policy` (Always / Adaptive / Never) is permanently tunable — it stays `[OPEN]` across the plan's life rather than terminally `[DECIDED]`. Changing it from QUESTION RESOLUTION mode automatically regenerates every Phase Exit Gate block to match, non-destructively of any `[x]` progress.
- **Per-phase verifier annotations** — in Adaptive policy (default), each phase's Phase Exit Gate carries an HTML-comment annotation `<!-- verifier-recommendation: yes|no — [reasoning] -->` written at create-time based on the phase's risk/complexity. The Spawn-verifier + Apply-report tasks render only when the recommendation is yes.

### Fixed

- **REFINE backup gap closed** — before writing refined content, the original plan is backed up to `.[filename].backup`. The old command removed backup behavior in v1.3.0; this restores it (single-level overwrite, consistent with `/dr-prd`'s backup behavior).

### Removed

- **`commands/dr-plan.md`** — replaced by the new skill
- **`commands/dr-plan/summary.md`** and **`commands/dr-plan/questions.md`** — replaced by `skills/dr-plan/references/summary-mode.md` and `skills/dr-plan/references/questions-mode.md`
- **`templates/plan-template.md`** (plugin root) — replaced by `skills/dr-plan/templates/plan-base.md`
- **`templates/` directory** (plugin root) — empty after the above moves
- **Bash permissions** no longer required by `/dr-plan`: `Bash(ls:*)`, `Bash(mkdir:*)` — replaced by native Claude Code tools (`Glob` for listing, `Write` auto-creates parent directories). Retained: `Bash(gh pr view:*)`, `Bash(gh pr edit:*)` (no native equivalent)

## [1.7.0] - 2026-04-18

### Changed

- **`/dr-prd` converted from command to Skill 2.0** (`skills/dr-prd/`) with substantive workflow improvements. Invocation is unchanged (`/dr-prd`); internals are fully rewritten.
  - **Clarifying-question phase in CREATE mode** — hybrid fixed core (problem, users, success metrics, feature type) plus adaptive follow-ups. Compresses automatically when the initial prompt is already rich. Designed to prevent generic, hallucinated, or shallow PRDs.
  - **Non-blocking nudge on thin answers** — when the user can't answer 2+ core questions clearly, the skill surfaces options (run `/dr-research`, brainstorm, share context, or proceed and flag assumptions) without blocking.
  - **Confidence checkpoint before drafting** — conversational, not numeric. Surfaces fuzzy areas and asks whether to clarify or flag.
  - **User-provided research/context only** — the skill does not proactively Glob `_claude/research/` or any other directory. Users reference material explicitly via `@path`.
  - **Problem → Hypothesis → Outcome framing** at the top of every PRD. Aligns with modern PRD practice (Cagan, Lenny).
  - **Adaptive template by feature type** — `user-facing`, `internal-tool`, `infra`, `ai-feature`, and `spike` each include/skip/replace sections appropriately. Feature type is inferred then confirmed with the user; falls back to asking if inference fails.
  - **Timeline & Milestones demoted** to a one-line `Release Strategy` section (delivery planning lives in `/dr-plan`, not the PRD).
  - **Top-level `Acceptance Criteria` section** — testable bullets that `/dr-plan` consumes directly as test-first tasks.
  - **AI-feature overlay** — for `ai-feature` type, adds `Model and Constraints`, `Prompt Spec`, `Eval Rubric` (replaces Acceptance Criteria for probabilistic outputs), `Performance Budgets`, and `Guardrails`. `/dr-plan` reads these to generate eval scaffolding, prompt-test, load-test, and red-team tasks.
  - **Open Questions format** — now `[ ] Question — owner: [name], needs by: [YYYY-MM-DD]` so the section stays actively useful rather than ritual.
  - **REFINE mode safety features preserved** — backup, diff preview, confirm gate (`AskUserQuestion`), status-aware warnings (Draft / Under Review / Approved / Superseded), bidirectional linked-plan detection. These remain the strongest parts of the original command.
  - **Old-template preservation on refine** — existing PRDs authored under the old template are refined without structural changes unless the user explicitly asks to migrate (e.g., "migrate this to the new template"). Migration maps old sections to new and flags inferred content in Open Questions.
  - **Cross-platform via native tools** — all filesystem operations use `Read`/`Write`/`Edit`/`Glob`/`Grep` instead of shell utilities. Works identically on Windows, macOS, and Linux.
  - **Progressive disclosure** — mode-specific logic in `references/create-mode.md` and `references/refine-mode.md`; shared logic in `references/template-variants.md` and `references/ai-feature-sections.md`.

### Added

- **`skills/dr-prd/`** — Full Skill 2.0 implementation with SKILL.md + 4 reference files + new base template
  - `SKILL.md` — mode detection and routing
  - `references/create-mode.md` — clarifying phase + drafting flow
  - `references/refine-mode.md` — validate + backup + diff + confirm + apply flow
  - `references/template-variants.md` — feature-type detection and section-inclusion rules
  - `references/ai-feature-sections.md` — AI/LLM overlay (model, prompt spec, eval rubric, performance budgets, guardrails)
  - `templates/prd-base.md` — new base template

### Removed

- **`commands/dr-prd.md`** — replaced by the new skill
- **`templates/prd-template.md`** (plugin root) — replaced by `skills/dr-prd/templates/prd-base.md` with a restructured section order and new Hypothesis / Acceptance Criteria / Release Strategy sections
- **Bash permissions** no longer required by `/dr-prd`: `Bash(ls:*)`, `Bash(cp:*)`, `Bash(mkdir:*)` — all replaced by native Claude Code tools (`Glob` for listing, `Read`+`Write` for backups, `Write` auto-creates parent directories)

## [1.6.1] - 2026-04-18

### Changed

- **`/dr-research` tool alignment** — `skills/dr-research/SKILL.md` now uses native Claude Code tools instead of shelling out. `Bash(mkdir:*)` removed from `allowed-tools` (Write creates parent directories automatically); `Glob` added for existence checks (deep-dive path verification and `_claude/research/` presence check). Phase 3 step renamed from "Create the directory" to "Determine the output path" to reflect that directory creation is implicit in the first Write.

### Removed

- **`Bash(mkdir:*)` permission** from `/dr-research` — no longer needed

## [1.6.0] - 2026-04-18

### Changed

- **`/dr-init` converted from command to Skill 2.0** (`skills/dr-init/`) with workflow and safety improvements. Invocation is unchanged (`/dr-init`); internals are fully rewritten.
  - **Scope narrowed to plugin-managed content only** — `CLAUDE-template.md` no longer includes `## Project-Specific Commands` or `## Development Principles` sections. Those are software-project concerns handled by Claude Code's built-in `/init` (or by the user directly). State A's success message now suggests running `/init` alongside `/dr-init` for codebase-specific documentation
  - **Diff preview before CLAUDE.md updates** — State B now shows a unified diff of every outdated or missing section before any write, so users can see exactly what will change
  - **Git safety preflight** — before modifying an existing CLAUDE.md (State B or State C), the skill runs `git status --porcelain CLAUDE.md` and warns if there are uncommitted changes. The skill never runs git commands that modify state — commits are entirely the user's responsibility
  - **Simplified State C flow** — appending to an existing CLAUDE.md is now a clean separator-based append rather than a crude concatenation with manual-reorganization guidance. Since plugin sections no longer overlap with typical project content, no merge is needed
  - **Cross-platform via native tools** — all filesystem operations use `Read`/`Write`/`Edit`/`Glob` instead of shell utilities. The skill works identically on Windows, macOS, and Linux without relying on `mkdir`, `touch`, `ls`, `wc`, or `test`
  - **Progressive disclosure** — state-specific logic lives in `references/state-a-fresh.md`, `references/state-b-update.md`, `references/state-c-uninitialized.md`. Section versioning scheme documented in `references/section-versioning.md` for maintainers and future contributors

### Removed

- **`commands/dr-init.md`** — Replaced by the new skill
- **`templates/CLAUDE-template.md`** (plugin root) — Moved to `skills/dr-init/templates/CLAUDE-template.md` since it is specific to the init skill
- **`## Project-Specific Commands` section** from `CLAUDE-template.md` — Out of scope for this plugin; users should run `/init` for codebase-specific documentation
- **`## Development Principles` section** from `CLAUDE-template.md` — Generic software advice not tied to plugin features
- **Bash permissions** no longer required by `/dr-init`: `Bash(mkdir:*)`, `Bash(ls:*)`, `Bash(touch:*)`, `Bash(wc:*)`, `Bash(test:*)` — all replaced by native Claude Code tools. The only Bash permission retained is `Bash(git status:*)` for the safety preflight

### Added

- **`skills/dr-init/`** — Full Skill 2.0 implementation with SKILL.md + 4 reference files + templates/

## [1.5.0] - 2026-04-14

### Changed

- **`/dr-research` converted from command to Skill 2.0** (`skills/dr-research/`) with major workflow and output improvements. Invocation is unchanged (`/dr-research [prompt]` or `/dr-research` for interactive mode); internals are fully rewritten.
  - **Interactive research plan approval** — Before any research runs, Claude presents a structured plan (research type, context, key questions, strategy, sources, planned output files) and waits for user approval or adjustments
  - **Research strategy selection** — Claude now picks an appropriate strategy (funnel, adversarial, temporal, multi-stakeholder) based on the research type, and asks the user when unclear
  - **Deep-dive follow-up support** — Reference an existing research path (e.g., `/dr-research follow-up questions _claude/research/existing-topic-2026-01-15/`) to create a `deep-dives/` subfolder within the original research, with back-links to the parent index and an updated "Deep Dives" section on the parent
  - **Adaptive output structure** — Output files are proposed in the plan and adapted to the research type. `recommendations.md` is only created when the research genuinely supports actionable next steps; topic-specific files (`comparison.md`, `implementation-guide.md`, `architecture.md`, etc.) are created when warranted rather than always
  - **Confidence flags only on uncertain findings** — High-confidence findings are not marked; only findings based on limited sources, single blog posts, or potentially outdated information get a callout. Conflicting sources are documented inline with direct links so the reader can evaluate competing claims
  - **Mermaid diagram support** — Encouraged for workflows, architecture, system interactions, comparisons, and dense technical concepts. Includes a reference file with 7 diagram patterns (flowchart, sequence, mindmap, block, quadrant, ER, gantt)
  - **Circuit breaker pattern** — Claude works to completion without interrupting for normal complexity (contradictions, diverse viewpoints). It stops and asks the user only if the research premise is wrong or a discovery fundamentally changes the direction, capped at 1-2 interruptions maximum
  - **Completion summary improvements** — Now includes a "What surprised me" insight, suggested deep-dive topics (only when genuinely warranted), and contextual follow-up actions tailored to the research type
  - **`index.md` written last** — Ensures the overview accurately reflects everything that was produced; encourages a visual concept map via Mermaid
  - **Extended thinking via `effort: max`** in skill frontmatter instead of inline instructions

### Removed

- **`commands/dr-research.md`** — Replaced by the new skill
- **`templates/research-*-template.md`** — The 4 research template files are replaced by flexible reference guides in `skills/dr-research/references/` (research-methodology, output-formats, mermaid-patterns) plus annotated exemplars in `skills/dr-research/examples/`

## [1.4.1] - 2026-02-22

### Fixed

- **PR validation before update** — strengthened instructions so Claude reliably runs `gh pr view` before any `gh pr edit`, with explicit CRITICAL/REQUIRED markers to prevent skipping the validation step

## [1.4.0] - 2026-02-22

### Added

- **GitHub PR auto-update** in `/dr-plan summary` mode
  - Optionally pass a GitHub PR URL: `/dr-plan @plan.md summary https://github.com/org/repo/pull/123`
  - Automatically updates the PR title (set to the commit message title) and description (set to the generated PR summary) via `gh pr edit`
  - Validates PR is open before updating — blocks update on merged/closed PRs with clear error message
  - Prompts for confirmation if the PR already has an existing description before overwriting
  - Falls back to display-only mode if the `gh` command fails
  - When no PR URL is provided, existing copy-paste behavior is unchanged

### Changed

- **Allowed-tools updated** in `/dr-plan` — added `Bash(gh pr edit:*)` and `Bash(gh pr view:*)` scoped to PR operations only
- **`summary.md` restructured** with conditional output paths (Path A: update PR directly, Path B: display for manual copy)

## [1.3.1] - 2026-02-09

### Changed

- **Date handling standardized** across all commands (`/dr-init`, `/dr-research`, `/dr-prd`, `/dr-plan`) to use conversation context instead of ambiguous "system environment" for cross-platform reliability
- **User confirmation prompts** in `/dr-init`, `/dr-prd`, and `/dr-plan` now use structured AskUserQuestion with labeled options instead of text-based `[y/n/diff]` prompts
- **Directory existence checks** added to `/dr-research`, `/dr-prd`, and `/dr-plan` CREATE modes — commands now suggest running `/dr-init` if `_claude/` directories don't exist
- **Allowed-tools trimmed** in `/dr-init` — removed unused `Bash(find:*)`, `Bash(cat:*)`, `Bash(sed:*)`, `Bash(echo:*)`
- **Allowed-tools updated** in `/dr-prd` — replaced `Bash(grep:*)` with `Bash(mkdir:*)` (search uses Grep tool instead)
- **Allowed-tools updated** in `/dr-plan` — added `Bash(mkdir:*)`

### Fixed

- **CLAUDE-template.md** — removed stale `/dr-move-plan` references (command was removed in v1.2.0), bumped plan-management-workflow section version to v2
- **dr-plan.md** — fixed duplicate step 4 numbering in Phase 4, fixed Important Notes numbering gap (7,9,10 → 7,8,9)
- **Template cleanup** — removed redundant `{{PLACEHOLDER}}` variables from `plan-template.md`, `prd-template.md`, and `research-index-template.md` that duplicated human-readable instructions

## [1.3.0] - 2026-02-08

### Added

- **Template section versioning** for `CLAUDE-template.md`
  - Sections now have version markers (`<!-- section: name v1 -->`) to track content changes
  - `/dr-init` detects outdated or missing sections in existing projects and offers to update them
  - Two-tier verification: Tier 1 checks section existence, Tier 2 checks content is current

- **CLAUDE.md verification in `/dr-init`** (STATE B)
  - Re-running `/dr-init` on an already-initialized project now verifies CLAUDE.md sections
  - Shows categorized results: current, outdated, or missing
  - Offers Update (apply changes), Show (display for manual copy), or Skip options
  - Replaces the previous "never modify CLAUDE.md" behavior

### Changed

- **Task Completion Protocol** - Claude now proactively checks plan checkboxes after completing each phase instead of waiting for user confirmation
  - Work through one phase at a time
  - Update the plan file immediately after completing a phase
  - Report what was completed and what phase is next

### Removed

- **Plan backup files** - Removed automatic `.backup` file creation during plan refinement and question resolution
  - Backup creation via `Bash(cp:*)` removed from `/dr-plan` REFINE mode
  - Backup creation removed from `/dr-plan` QUESTION RESOLUTION mode
  - Backup references removed from success/cancellation messages
  - `Bash(cp:*)` removed from `/dr-plan` allowed-tools
  - Troubleshooting section about backup files removed from README

## [1.2.0] - 2026-01-07

### Removed

- **`/dr-move-plan` command** - Removed to reduce token usage. Plans can now be moved using standard `mv` commands or Claude will move files automatically when contextually appropriate
- **`/dr-summary` reference** - Removed stale command reference from plugin.json (file never existed)

### Changed

- **Plan movement guidance** - Other commands now suggest using `mv` command directly or trusting Claude to move files automatically

## [1.1.0] - 2026-01-06

### Removed

- **frontend-design skill** - Moved to engineering-tools plugin for better organization

## [1.0.5] - 2025-12-23

### Added

- **Branch commit message generation** in `/dr-plan summary` mode
  - Generates a copyable commit message alongside the PR summary
  - Includes a short imperative title (3-6 words) and up to 5 bullet points
  - Format uses `*` prefix for bullets, past tense for completed actions
  - Displayed in separate code fence for easy copying
  - Useful for squash/merge commits when closing PRs

## [1.0.4] - 2025-12-22

### Changed

- **Replaced bash find/grep with Glob tool** in `/dr-plan` and `/dr-move-plan` commands
  - Plan number scanning now uses native `Glob` tool instead of `find | grep`
  - Plan search operations use `Glob` with filtering in Claude's reasoning
  - Eliminates user approval prompts for file search operations
  - Faster execution by using Claude's native file matching capabilities

### Fixed

- **Reduced permission prompts** - Users no longer need to approve bash commands for routine plan searches
  - `/dr-plan` CREATE mode: No longer prompts for `find` command when determining next plan number
  - `/dr-move-plan`: No longer prompts for `find` or `ls` commands when searching for plans

## [1.0.3] - 2025-12-21

### Added

- **SUMMARY mode** for `/dr-plan` - Generate GitHub-ready PR descriptions from plans
  - Creative formatting with tables, emojis, mermaid diagrams, and collapsible sections
  - Copyable markdown output wrapped in code fence (using tildes for nested code blocks)
  - Usage: `/dr-plan @plan-file.md summary`

- **QUESTION RESOLUTION mode** for `/dr-plan` - Interactive Q&A for plan refinement
  - Guides users through resolving uncertain assumptions and open questions
  - Prioritizes blocking questions marked `[AWAITING]`
  - Updates plan file with decisions marked `[DECIDED: date]`
  - Creates backup before making changes
  - Usage: `/dr-plan @plan-file.md answer questions`

### Changed

- **Modular command architecture** - Mode-specific logic extracted to `commands/dr-plan/` subfolder
  - `commands/dr-plan/summary.md` - SUMMARY mode instructions
  - `commands/dr-plan/questions.md` - QUESTION RESOLUTION mode instructions
  - Main `dr-plan.md` handles mode detection and delegates to subfolder files

## [1.0.0] - 2025-11-24

### Added

#### Core Commands
- `/dr-init` - Initialize project with standard directory structure and CLAUDE.md
  - Smart state detection (fresh, initialized, uninitialized)
  - Creates `_claude/` directory with docs, plans, prd, resources, research subdirectories
  - Creates `.gitkeep` files for git tracking of empty directories
  - Generates CLAUDE.md with project management guidelines
  - Handles existing CLAUDE.md files with append/show/cancel options
  - Idempotent - safe to run multiple times

- `/dr-research` - Conduct deep research with extended thinking
  - Accepts detailed multi-line research prompts
  - Interactive mode when no arguments provided
  - Creates timestamped research directory
  - Generates interconnected markdown files (index, findings, resources, recommendations)
  - Uses web search and extended thinking for comprehensive analysis

- `/dr-prd` - Create or refine Product Requirements Documents
  - **CREATE mode**: Generates comprehensive PRD from detailed feature description
  - **REFINE mode**: Intelligently updates existing PRD with `@file` reference
  - Extended thinking for requirements analysis
  - All sections thoughtfully populated (not just placeholders)
  - Automatic backup before refinement
  - Diff summary and confirmation before applying changes
  - Status-aware (Draft, Under Review, Approved, Superseded)
  - Detects and warns about linked plans

- `/dr-plan` - Create or refine implementation plans
  - **CREATE mode**: Generates detailed phase-based implementation plan
  - **REFINE mode**: Updates existing plan with extended thinking analysis
  - **QUESTION RESOLUTION mode**: Interactive resolution of blocking questions and assumptions
  - Sequential plan numbering (001, 002, etc.) across all folders
  - PRD linking via `@path/to/prd.md` syntax
  - `--in-progress` flag to create directly in in_progress folder
  - Automatic backup before refinement
  - Status-aware behavior (draft allows all changes, in-progress warns on major changes, completed refuses)
  - Assumptions and Open Questions sections for collaborative decision-making

- `/dr-move-plan` - Move plans between lifecycle stages
  - Three input methods: plan number, plan name (partial match), file reference
  - Searches all folders (draft, in_progress, completed)
  - Handles ambiguous matches with user clarification
  - Preserves plan number when moving
  - Clear confirmation with source and destination

#### Templates
- `CLAUDE-template.md` - Project guidelines template with plan workflow rules
- `plan-template.md` - Implementation plan template with phases, tasks, and tracking
- `prd-template.md` - PRD template with all critical sections
- `research-index-template.md` - Research documentation index template
- `research-findings-template.md` - Research findings template
- `research-resources-template.md` - Research resources and links template
- `research-recommendations-template.md` - Actionable recommendations template

#### Features
- **Extended Thinking Integration** - All commands use deep analysis for comprehensive output
- **Multi-line Prompt Support** - Commands accept detailed 10-15 line prompts for best results
- **PRD-Plan Linking** - Plans can reference PRDs via `@path` syntax
- **Automatic Backups** - Refinement creates `.backup` files before changes
- **Diff Summaries** - See what changed before confirming refinements
- **Confirmation Prompts** - Safety confirmations with `--no-confirm` override option
- **Sequential Numbering** - Plans auto-numbered across all folders
- **Collaborative Decision-Making** - Assumptions and Open Questions tracking in plans
- **Language Agnostic** - Works with any programming language or framework
- **Git-Friendly** - All output is markdown with `.gitkeep` for empty directories

#### Documentation
- Comprehensive README with installation, usage, and examples
- Troubleshooting guide for common issues
- Workflow guidelines and best practices
- Detailed command documentation with examples

### Technical Details
- Plugin manifest (`plugin.json`) with metadata
- Command files use frontmatter for description and allowed-tools
- All paths use forward slashes for cross-platform compatibility
- Date handling uses system environment (never hardcoded)

---

## [Unreleased]

### Planned for Future Releases

#### v1.1 Considerations
- `/dr-archive-plan` - Archive old completed plans
- Status badges in plan files
- Plan template variations (small change, large feature, migration)

#### v1.2 Considerations
- Hooks for automatic plan status updates
- MCP integration for external project management tools
- Custom template support per project
- Plan metrics and analytics

#### v2.0 Considerations
- Skills for autonomous plan creation
- Agent for code review against plans
- Interactive plan refinement
- Plan dependency visualization
