# Plan: Pencil Design Skill

## Metadata

- **Number:** 012
- **Status:** completed
- **Created:** 2026-07-25
- **Last refreshed:** 2026-07-25
- **Refinement count:** 0
- **Plan type:** ai-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Build a `pencil` skill in the `experimental` bundle that lets an agent work safely with pen.dev / Pencil `.pen` design files through the Pencil MCP server. The skill exists because Pencil's MCP integration has one behaviour that turns an ordinary mistake into silent data corruption: `filePath` is required on every tool, looks authoritative, and **silently returns the active document** when pointed at a file the app hasn't opened. An agent told to edit `checkout.pen` — which nobody opened — reads and writes `homepage.pen` instead, and the transcript reads as complete success. Every rule in this skill exists to make that impossible.

The skill has three jobs. **Bind correctly:** resolve an explicit target and prove, via a content fingerprint, that MCP calls actually reached that document before the first write — `get_editor_state` cannot do this, because it reports the *active* editor and therefore fails precisely when you are correctly editing a non-active file. **Work safely:** carry the same `filePath` on every call, follow the `batch_design` gotchas that make writes land visibly rather than invisibly, and never claim a file was written, because MCP writes mutate memory only and the `.pen` on disk stays byte-identical until a human saves. **Ask visually:** when a design decision has genuine alternatives, draw them onto the canvas as labelled variants, verify with a screenshot that they actually rendered, then point the user at the frame by name and canvas position and ask — so the choice is made against pixels instead of prose.

A fourth job runs at a different time. Because plans and PRDs can execute unattended, and unattended plus silent fallback is exactly how the wrong design gets edited with nobody watching, the skill also fires while a planning document is being *authored* — the one moment the question "which `.pen` file?" is cheap, because a human is still present to answer it. That capture is description-routed on the *activity* of authoring a plan or spec, never on a named tool, so it works with `/dr-plan`, with any other planning skill, or with a plain markdown file, and creates no dependency between bundles in either direction.

## Current State

**The `experimental` bundle** (`bundles/experimental/`, v0.10.2) contains one skill, `mvp`. It carries the standard cross-harness shape: `.claude-plugin/plugin.json` for Claude, `package.json` for Pi, its own `README.md` and `CHANGELOG.md`. The root `.claude-plugin/marketplace.json` lists it at the same version, and the root `package.json` globs `bundles/*/skills/*` for Pi, so a new skill directory is picked up by Pi automatically but must be added to `plugin.json`'s `skills[]` array by hand for Claude.

**Nothing Pencil-related exists in this repo.** The knowledge lives in a sibling repo, `pendev-tools`, as a handover document (`_project/docs/pen-skill-info.md`) backed by a full research corpus (`_project/research/pen-multi-agent-and-viewer-2026-07-25/`). Every behavioural claim this plan relies on was tested directly against the Pencil desktop app on Windows on 2026-07-20/21; claims the research explicitly marks *Untested* are carried into Assumptions below as `[?]` rather than treated as fact.

**The Pencil MCP server is connected in the current session** — `mcp__pencil__batch_design`, `batch_get`, `snapshot_layout`, `get_screenshot`, `export_nodes`, `export_html`, `get_editor_state`, `get_variables`, `get_guidelines` are all available. Live end-to-end testing during implementation is therefore viable, not hypothetical, and several phases below depend on it.

**Distribution is already live.** Claude Code serves this marketplace directly from the working tree, so a skill added to `plugin.json` is loadable in a new session without publishing anything. That is what makes the "register early with auto-discovery off, flip it on at the end" sequencing in this plan work.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- `- [ ] Assumption text` — pending. Will be validated implicitly as implementation exercises it.
- `- [ ] [?] Assumption text` — uncertain. Surfaced by `/dr-plan answer questions` for explicit review.
- `- [x] Assumption text` — validated. Confirmed by evidence (cite the source in the bullet).

### Validated

- [x] `.pen` files are plain, unencrypted JSON, despite the MCP server's runtime instruction claiming otherwise — `.pen` files in public GitHub repos are indexed and returned as readable text by code search, which is impossible for encrypted content (`pen-skill-info.md` §2.1). **Superseded 2026-07-27:** this originally justified a disk-read fingerprint in the preflight. That fingerprint was removed entirely — `batch_get` supplies node names from live state, and disk goes stale on the first write. The fact remains true and still matters for *external* tooling (a diff renderer, a viewer), but the skill's binding path now touches no files.
- [x] `filePath` routes correctly to any document the app has **open** (active or not), and **silently returns the active document** for any path the app has not opened — verified in both directions, including a three-open-document write test with zero cross-contamination (§2.3, §2.4).
- [x] `get_editor_state` reports only the *active* editor and is therefore invalid as a target check — it fails exactly when you are correctly editing a non-active document (§1.4, §2.5). No tool can enumerate open documents.
- [x] MCP writes never reach disk. Three `batch_design` calls into three open documents all succeeded; all three files were byte-identical afterwards with unchanged mtimes (§2.4). `batch_design` has no persistence operation; `pen interactive` exposes a `save()` that the MCP surface does not.
- [x] Node IDs collide across documents — two unrelated files each contained a distinct top-level node with id `bi8Au` (§2.6). Everything must be keyed by `(filePath, id)`.
- [x] MCP cannot create a `.pen` file; pointing `filePath` at a non-existent path triggers the silent fallback rather than creating anything (§5.4).
- [x] `get_screenshot({filePath, nodeId})` and `export_nodes({filePath, outputDir, nodeIds})` are both node-scoped and both accept `filePath` — schemas read directly in this session. `get_screenshot` returns an image into the model's context; `export_nodes` writes image files to a directory and returns absolute paths.
- [x] The Pencil MCP server is connected in this session (tool list confirms all nine `mcp__pencil__*` tools), so live end-to-end verification is available to phases 3, 4 and 6.
- [x] Claude Code serves this marketplace live from the working tree, so registering the skill in `plugin.json` makes it loadable in a new session with no publish step.

### Pending / uncertain

- [x] **The desktop app does not autosave on a timer** — measured 2026-07-27: 12 minutes, six samples, zero change to size or mtime after four MCP writes, with the app running and untouched. Focus-change and quit behaviour remain unexercised. Supersedes the uncertainty below, which was §8's highest-priority open question. **Original:** [?] **The desktop app's autosave behaviour is unknown** (§8, listed as the highest-priority open question in the research). If the app autosaves on a timer or focus change, a `[decision]` scratch frame can reach disk without the user deliberately saving. Mitigation is in the design regardless — decision frames are always deleted after resolution, and a session-end sweep catches abandoned ones — but the completion-message wording depends on the answer. Verify with the cheap test in Non-Blocking questions below.
- [ ] [?] **Whether several MCP clients can drive one desktop app simultaneously is untested** (§8); all research testing was single-client and sequential. R7 (one agent per document) is therefore precautionary rather than measured.
- [ ] [?] **macOS behaviour is untested.** The research was conducted entirely on Windows and the transport it observed (a named pipe, `\\.\pipe\pencil-desktop`) is Windows-specific. This plan's response is to encode **no platform specifics whatsoever** — the transport is the MCP server's internal business and is invisible to a skill that only ever calls MCP tools. The only platform-touching logic is the R3 outside-the-working-tree check, handled by normalising separators to `/`, resolving to absolute, and comparing case-insensitively. A macOS verification checklist ships as an open item rather than a guess.
- [ ] [?] **Whether Pi exposes the Pencil MCP server at all is unknown.** The skill must degrade to a clear "Pencil MCP tools are not available in this session" message rather than failing obscurely, and must declare this in `compatibility` frontmatter following the precedent `mvp` set.
- [x] **Description-based routing fires reliably** — measured, not assumed. 75-prompt corpus: Tier 1 13/13, Tier 2 15/15, authoring 7/7, negatives **36/36 with zero false fires** across ten categories, half held out and written after tuning stopped. Corroborated live: five conclusive results, five matching, in real cold sessions. §5.1 called it a heuristic and it remains one — but it is now a measured heuristic with a regression suite, and the two-layer contract means a miss still degrades to a stop rather than a corruption.
- [x] **Terminal harnesses do not reliably render inline images to the user** — confirmed by the skill's owner, who works from a text terminal on Claude Code and Pi and judged inline images unrealistic. Display depends on the terminal's inline-graphics support (iTerm2/Kitty protocols, sixel), which a cross-harness skill cannot depend on. This is why delivery is text plus wayfinding, and why the screenshot exists for the *agent's* verification rather than the user's viewing — a justification that later survived its original premise being disproved.
- [x] **Unicode in Pencil node names renders as tofu** — tested live: `⟦`/`⟧` have no glyph in the default font and display as replacement boxes. ASCII `[decision] <topic>` confirmed as the prefix, with the regex-escaping cost handled explicitly in `visual-choice.md`. Caveat retained in the artifact: canvas rendering was tested; the layers panel, which is the prefix's actual use site, was not.
- [x] **This repo has no automated test, lint, or typecheck suite** — it is markdown and JSON only, with a root `package.json` carrying no `scripts` block. The Definition of Done below replaces those three commands with the manifest and frontmatter integrity checks that are the real gates here, per the base template's guidance for repos where a category does not apply.

## Open Questions & Decisions

### Resolved before drafting

These four were settled with the user on 2026-07-25 and are recorded so a later reader does not reopen them:

- **Decision canvas** — variants are drawn **in-place in the target file**, inside one container frame with a reserved name prefix and `placeholder: true`, deleted after the choice resolves. Rejected: a separate scratch `.pen` (MCP cannot create one, so it needs a manual open step and the silent-fallback hazard then applies to it too) and a surviving decision log (accumulates clutter).
- **Delivery** — **text description plus wayfinding**, not inline images. The user works from a text terminal on Claude Code or Pi, where an image in a tool result lands in the model's context rather than on screen. The pointer must name the frame *and* its canvas position, since a name alone is useless on an infinite canvas.
- **Self-check** — the agent takes **one `get_screenshot` of the decision frame and looks at it itself** before sending the user to Pencil. `batch_design` returns success for text drawn with no `fill`, which renders invisible (§6) — without this check the user alt-tabs to three blank rectangles.
- **Change tiers** — three tiers. Minor changes are done or asked in text and never drawn; component-level and design-level changes get 2–3 drawn variants.

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

*None.* The four design forks were resolved with the user before drafting, and every remaining uncertainty either degrades safely (fail closed) or is a post-ship verification item.

### Non-Blocking

Can resolve during implementation.

- [x] [RESOLVED 2026-07-27] **Does the desktop app autosave, and when?** — **No timer autosave observed.** A document was edited via MCP (4 write operations), then left completely untouched with Pencil running; size and mtime were sampled every 2 minutes for 12 minutes and never changed, and the inserted frames never reached the file. **Answered in the safe direction:** "unsaved until you save" is accurate wording, and decision-frame cleanup stays a tidiness discipline rather than becoming load-bearing. Two caveats kept in the artifacts rather than glossed: focus-change and application-quit behaviour were not exercised, so the skill still says *"unsaved — save in Pencil to persist"* rather than promising the file is protected indefinitely. This was the highest-priority open question in the source research (§8). **Original framing:** The cheapest test in the whole plan: make an MCP edit, then watch the file's mtime for several minutes without touching the app. If it never flushes, the completion message can say "unsaved until you save" flatly; if it does autosave, the decision-frame cleanup discipline becomes load-bearing rather than merely tidy, and the wording must warn that an abandoned decision frame can reach disk on its own. Worth running during Phase 3, since it costs minutes and changes wording in two phases.
- [ ] [OPEN] **macOS verification pass.** Ships as a checklist in Phase 6 rather than a guess. Needs a Mac with Pencil installed. Items: does the same skill bind a target without modification; does the R3 path comparison behave on case-insensitive-but-case-preserving HFS+/APFS; does `export_nodes`' `outputDir` accept a POSIX path unchanged.
- [ ] [OPEN] **Is the Pencil MCP server available under Pi?** Determines whether the `compatibility` frontmatter says "degrades" or "unavailable". Testable in one Pi session once the skill exists.
- [x] [RESOLVED 2026-07-27] **Should the reserved decision-frame prefix be distinctive Unicode (`⟦decision⟧`) rather than ASCII (`[decision]`)?** — **No. ASCII.** Both forms were drawn live and screenshotted: `⟦`/`⟧` render as tofu replacement boxes, the font having no glyph for them. The Unicode form's only real advantage — needing no regex escaping in the sweep — does not survive characters that cannot be drawn. Caveat kept in the artifact: this tested *canvas* rendering, and the prefix's actual use site is the frame name in the layers panel, which may use a different font; the decision is argued on risk, not on the untested site. **Original question:** Distinctive glyphs are easier to scan in a layers panel and much less likely to collide with a name a human would choose. Unknown whether Pencil's name field handles them cleanly. Default to ASCII; test the Unicode form during Phase 4 and switch if it renders correctly.
- [x] [RESOLVED by action] **Should `allowed-tools` be declared in frontmatter?** — **No.** `SKILL.md` omits it and documents the MCP requirement in `compatibility` prose instead, exactly as the default below proposed. Naming `mcp__pencil__*` tools explicitly would break the skill for any user whose server is registered under a different prefix. **Original question:** Naming `mcp__pencil__*` tools explicitly is brittle — the prefix depends on how the user registered the server, and a mismatch would silently deny the skill its own tools. Default to omitting `allowed-tools` and documenting the requirement in `compatibility` prose instead.
- [ ] [OPEN] **Follow-up plan: the tool-agnostic target invariant in `/dr-plan` and `/dr-prd`.** Deferred by decision on 2026-07-25 — build the skill first, then decide with evidence about whether description routing actually fires during plan authoring. If Phase 6's live check shows routing is reliable, the invariant is largely redundant; if it misses, the invariant earns its place. Revisit after this plan ships.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] [WAIVED 2026-07-27: mechanism verified live on both APIs; no agent has executed the abort end-to-end through SKILL.md. Carried as item 2 of the macOS checklist] **The corruption vector is provably blocked.** In a live session, pointing the skill at a `.pen` file the app has *not* opened causes it to abort before any write, naming the file and asking the user to open it — rather than silently editing the active document.

  **PARTIALLY MET — and left unticked deliberately, because the wording says "the skill" and that is not what was tested.** The *mechanism* is verified live: probing a never-opened `netflixhouse3.pen` returned the active document's frames under the active document's names, and the algorithm aborts on identical probes. But those MCP calls were made directly and the comparison applied by hand, during Phase 3, while the skill was still `disable-model-invocation: true`. **No agent following `SKILL.md` has ever executed that abort end to end**, and the Phase 6 live run contained no unopened-target prompt. The nearest evidence is live prompt 3, where the skill refused to guess a target at all (R1) and demanded permission for an out-of-tree document (R3) — strong, and adjacent, but not this criterion. Closing it needs one prompt naming a real `.pen` path the app has not opened; it is item 2 of the macOS checklist.
- [x] **Routing fires correctly and, more importantly, stays silent correctly.** The skill surfaces on `.pen`/Pencil/visual-design prompts and on plan-authoring prompts that involve visual design, and does **not** surface on "design the database schema", "design the API", "system design", or the unrelated `pen-lang` / `open-pencil` projects. Zero false fires on the negative corpus is a hard gate; misses are tolerable because they degrade to fail-closed.
- [x] **A visual choice completes end-to-end against the live MCP.** Bind a target, draw two labelled component variants into a reserved decision frame, catch and fix a rendering defect via the screenshot self-check, emit a wayfinding message naming the frame and its canvas coordinates, take the user's answer, apply the winner, delete the decision frame, and report the document as unsaved.
- [x] **No cross-bundle coupling exists in either direction.** The skill's content contains no occurrence of `dr-plan`, `dr-prd`, `project-management`, or any other skill name; routing is on the activity of authoring a plan/PRD/spec. `project-management` is unmodified by this plan.
- [x] **No platform-specific paths, transports, or binaries are encoded anywhere in the skill.** A grep for `\\.\pipe`, `C:\`, `S:\`, and `~/.pencil` over the skill directory returns nothing.
- [x] **`experimental` 0.11.0 is consistent** across `plugin.json`, the bundle `package.json`, and the `marketplace.json` entry, with a CHANGELOG entry, and the skill is listed in `plugin.json`'s `skills[]`.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- **Manifest integrity:** every JSON file touched parses; the `experimental` version string is identical in `bundles/experimental/.claude-plugin/plugin.json`, `bundles/experimental/package.json`, and the `experimental` entry in `.claude-plugin/marketplace.json`; `plugin.json`'s `skills[]` lists every directory present under `bundles/experimental/skills/`.
- **Frontmatter validity:** every `SKILL.md` touched has `name` and `description`; `name` matches its own directory name.
- **Reference integrity:** every relative path referenced from `SKILL.md` resolves to a file that exists.
- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — **struck.** This repo is markdown and JSON with no `scripts` block and no automated suite; the three checks above are the real gates. Justified in Assumptions.

## Implementation Plan

### Phase 1: Routing Eval Corpus

The description is the entire routing mechanism, and "design" is one of the most overloaded words in software. Before writing a single line of it, define what firing correctly means — including, especially, what *not* firing means.

#### Tasks

- [x] Create `_project/docs/pencil-routing-corpus.md` as a durable regression corpus (repo development material, not skill runtime content — it must not ship inside the skill directory).
- [x] Write the **Tier 1 positive** set (explicit, must always fire): a literal `.pen` path; the words `pencil`, `pen.dev`, `pencil.dev`, "Pencil MCP"; the MCP tool names `batch_design`, `batch_get`, `snapshot_layout`, `export_html`, `export_nodes`. Minimum 8 prompts. — **10 written (P1.1–P1.10).**
- [x] Write the **Tier 2 positive** set (visual design work, tool unstated): mockup, wireframe, prototype, screen, page layout, artboard, frame, canvas, design system, style guide, component library, visual spec; and the verbs applied to them — "add a screen", "restyle the nav", "match the mockup", "update the design system". Minimum 10 prompts. — **12 written (P2.1–P2.12).**
- [x] Write the **authoring-time positive** set: plan/PRD/spec-authoring prompts that involve visual design — e.g. "write a plan for redesigning the onboarding screens", "draft a PRD for the new dashboard layout". Minimum 5 prompts. These must fire even though no `.pen` file is named. — **7 written (P3.1–P3.7), deliberately mixing prompts that name a planning skill with prompts that do not, since the skill routes on the activity rather than the tool.**
- [x] Write the **negative** set — the hard gate, and the reason this phase leads. Minimum 12 prompts covering: non-visual uses of "design" (`design the database schema`, `design the API surface`, `system design for the queue`, `this design pattern`); plan authoring with no design content at all (`write a plan for the auth refactor`); design metaphors (`sketch out the endpoints`, `let's whiteboard the data flow`); and the §9 terminology traps — `pen-lang/pen` (a programming language), `open-pencil` and `ZSeven-W/openpencil` (unrelated OSS editors whose `.pen` is a Kiwi/Zstd binary, not this format). — **18 written across all four categories (N4.1–N4.18); largest set at 38% of the corpus.**
- [x] Define thresholds and record the asymmetry that justifies them: **0 false fires on the negative set (hard gate)**, 100% on Tier 1, ≥80% on Tier 2 and authoring positives. A miss degrades to the fail-closed preflight and merely annoys; a false fire injects a design skill into unrelated engineering work and erodes trust in the whole bundle.
- [x] Specify the eval method: for each prompt, present a judge the candidate `description` alongside 3–4 decoy skill descriptions from this repo and ask which, if any, it would invoke. Run judges as parallel subagents where the harness supports it; otherwise evaluate sequentially in-session against the same corpus. Record fire/no-fire per prompt in a results table in the corpus file. — **Decoys named (`frontend-design`, `react-19`, `mvp`, `dr-plan`); judge must not see the skill body or the expected-outcome column.**

#### Verification

- [x] Read `_project/docs/pencil-routing-corpus.md` — expected: four labelled sets meeting the stated minimums (8/10/5/12), a thresholds section, and an empty results table ready for Phase 2. — **PASS: 10/12/7/18 against minimums of 8/10/5/12; thresholds table with hard/soft gates present; results section has an empty revision log, per-prompt table, and failure-notes block.**
- [x] Confirm the negative set contains at least one prompt from each of the four negative categories (non-visual "design", design-free plan authoring, design metaphor, terminology trap). — **PASS: 4a non-visual "design" (6), 4b design-free plan authoring (4), 4c design metaphors (4), 4d terminology traps (4).**
- [x] Confirm no file was created under `bundles/experimental/skills/` in this phase. — **PASS: `bundles/experimental/skills/` contains only `mvp/`; `git status` shows just the two `_project/` additions.**

#### Acceptance Criteria

- The corpus is runnable by someone who did not write it: each prompt has an expected outcome (fire / no-fire) recorded next to it.
- The negative set is the largest set in the corpus, reflecting that false fires are the dominant risk.
- Thresholds are explicit and the fire/no-fire asymmetry is written down, so a future reader does not "helpfully" relax the negative gate.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — rubric errors cascade into every later phase, and judging whether a negative corpus genuinely covers the ways "design" is overloaded requires semantic evaluation that no command can perform. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — **PASS: all four manifests parse; `experimental` version consistent at 0.10.2 across plugin.json / package.json / marketplace.json; every skill directory on disk listed in `skills[]`. No SKILL.md or reference path touched this phase.**
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. — **SPAWNED (retroactively, after the user authorised subagent dispatch).** Initially blocked by a standing session directive; the self-review fallback ran first and passed, then the verifier ran and **found substantially more**. Its material findings, all acted on: (1) **the negative set had no frontend-implementation-in-code category**, so a description firing on *all* UI work would have scored 18/18 and lost nothing — the single most important finding in either verification, and independently reached by the Phase 2 verifier; (2) enumerated-vocabulary gaps — `batch_get`, `export_html`, "Pencil MCP", `prototype`, `style guide` were all named in the task but tested by no prompt; (3) **the asymmetry argument was wrong for Tier 1** — a Tier 1 miss is not benign, because the fail-closed preflight lives *inside* the skill, so if it never fires there is no preflight; (4) `N4.17` carried `N4.18`'s unfairness with no annotation; (5) no held-out set, so the description could pass by enumerating the corpus's own disambiguators; (6) missing categories — meta/self-referential, rival design tools, real drawing in other media, `pen` homographs, and compound authoring × non-visual. **The self-review pass found two things; the verifier found eleven.** That gap is the argument for the verifier, recorded here so a future reader does not treat the fallback as equivalent.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — **Applied from the self-review pass. It surfaced two real gaps, both fixed in the corpus rather than passed over: (1) Tier 2's designed behaviour is *conditional* on a Tier 3 amplifier (§5.2), which a judge given no context cannot infer — added an explicit evaluation-context rule, plus a rule that co-firing with `frontend-design` is a pass rather than a false fire, since the two address different layers. (2) N4.18 stacks a Tier 1 signal and a Tier 3 amplifier against one disambiguating word and sits inside a hard gate — kept in the gate, but annotated with its benign failure mode so a Phase 2 evaluator can weigh a rationale on evidence.**
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. — **Both gaps are reflected in the corpus. One UNVERIFIED carried forward: the corpus has never been executed, so its discriminating power is asserted, not measured. Phase 2 is the first real evidence.**

---

### Phase 2: Skill Scaffold and Description

The description is this skill's load-bearing prompt — the analogue of model-and-prompt selection in a conventional AI feature. Register the skill now so later phases can test it live, but keep `disable-model-invocation: true` so an incomplete skill cannot fire on its own.

#### Tasks

- [x] Create `bundles/experimental/skills/pencil/SKILL.md` with frontmatter: `name: pencil`, the drafted `description`, `disable-model-invocation: true` **for now** (flipped in Phase 6), and a `compatibility` field following `mvp`'s precedent — requires the Pencil MCP server with the desktop app running and the target file open; degrades to a clear unavailability message otherwise.

  **DEFECT FOUND AND FIXED — the frontmatter did not parse as YAML.** Verification caught that both the `description` and `compatibility` values were unquoted plain scalars containing `": "` (`…on-canvas designs: screens…` and `…harness-neutral: uses…`), which terminates a YAML plain scalar. `js-yaml` rejected the block at line 2 col 155; the other eight `SKILL.md` files in the repo parsed fine. Consequence had it shipped: `name`, `description`, `compatibility`, and `disable-model-invocation` would all have been unavailable to a standard parser — taking out both the routing contract this phase exists to establish *and* the suppression guarantee the register-early sequencing rests on. Fixed by double-quoting both scalars, matching the existing precedent in this repo where descriptions containing colons are quoted. **Re-parsed all nine `SKILL.md` files: 9/9 OK**, `pencil` yielding `name,description,compatibility,disable-model-invocation`.
- [x] Draft the description to gate on **visual design nouns OR `.pen`/Pencil terms**, AND to cover authoring — with an explicit negative clause. Starting point to refine against the corpus:

  > Work with Pencil / pen.dev `.pen` design files — reading, editing, or creating visual designs, mockups, screens, and components through the Pencil MCP tools. Also use when authoring a plan, PRD, spec, or task list that involves visual design work, to capture the target `.pen` file before the document can run unattended. Not for database schema design, API design, system design, or other non-visual senses of the word "design".

  **Shipped wording is rev 2**, after the starting point above failed both soft thresholds. The change that mattered: *"Applies whenever a design artifact is wanted rather than shipped code, and applies alongside frontend implementation skills for UI work that could be either."* Also added `page layouts` and `style guides` to the noun list. Full evidence in the corpus revision log.

- [x] Write the SKILL.md body as a **router**, not a manual: the seven mandatory operating rules in condensed form, plus pointers to the reference files that later phases create. Keep reference paths relative to the skill root per the Agent Skills spec — no `${CLAUDE_PLUGIN_ROOT}`, no `${CLAUDE_SKILL_DIR}`.

  **DEVIATION — forward pointers dropped.** As written this task conflicts with the plan's own Definition of Done, which requires that *every relative path referenced from SKILL.md resolves to a file that exists*. Pointers to `references/preflight.md`, `references/batch-design.md`, `references/visual-choice.md`, and `references/authoring-time.md` would all dangle from the end of this phase until Phase 5, breaking the DoD at three consecutive phase boundaries.

  Resolved by inverting it: R1–R7 are written **inline** in SKILL.md (they are short, and always needed regardless of mode), with **no forward pointers**. Each later phase adds its own pointer at the moment it creates its reference file. The DoD stays green at every boundary, and a SKILL.md carrying R1–R7 with no references is still correct — merely less detailed — so the bundle remains shippable if work stops early.
- [x] Record R1–R7 in the body, each with the failure it prevents: R1 explicit target always; R2 prove the target before writing; R3 confirm before touching a file outside the working tree; R4 capture the target at authoring time; R5 never claim a file was written; R6 don't Read/Grep `.pen` files as a matter of course; R7 one agent per document.
- [x] Add the skill to `bundles/experimental/.claude-plugin/plugin.json` `skills[]` as `./skills/pencil`. (Pi needs no change — the root `pi.skills` glob `bundles/*/skills/*` already covers it.) — **Also added `design`, `pencil`, `pen.dev` to the bundle `keywords`.**
- [x] Write a short **rationale note in SKILL.md** explaining why this skill will use description routing with no literal-token trigger gate, unlike `dr-plan`/`dr-prd` — because §5.1 requires the skill to surface during plan authoring, which a token gate would prevent. Without this note a future reader will "fix" it back to the repo's dominant convention. State the rule in terms of the convention, not the other bundle's skill names. — **Written as "Why this skill is description-routed"; states the convention generically and names no skill, per the no-coupling gate.**
- [x] Run the Phase 1 corpus against the drafted description. Record results in the corpus results table. — **9 fresh-context judge batches across 2 revisions; each judge saw only the six skill descriptions and an unlabelled mixed batch, never the skill body or the expected-outcome column.**
- [x] Iterate the description until thresholds are met — with priority on eliminating false fires. Record each revision and its effect in the results table, so the final wording carries evidence rather than taste. — **MET at rev 4, and the route there is the evidence.** Two description revisions (rev 1 → rev 2) followed by two measurement revisions with no wording change at all (rev 3 expanded the corpus, rev 4 applied the scope decision). The false-fire priority was honoured throughout: the negative gate went from 18 prompts in four categories to 36 across ten, half held out, and never lost a single prompt. One tracked instability remains — `N4.38` flips between identical runs — recorded in Set 5 rather than folded into a passing total.

  **Superseded reading (before the scope decision):** NOT MET — Tier 1 92%, Tier 2 79%; escalated rather than wordsmithed, because closing Tier 2 by widening would have endangered the negative gate `N4.20` now guards. Rev 1 → rev 2 is recorded with the single-cause diagnosis and the prompts deliberately not chased; the false-fire priority was honoured and the negative gate is now 36/36 across ten categories. But rev 3 leaves Tier 1 at 92% (hard gate, requires 100%) and Tier 2 at 79%. **Further iteration is blocked on a scope decision that is not the author's to make** — see the rev-3 failure notes: closing Tier 2 requires firing on bare UI-styling language with no artifact named, which directly endangers the negative gate that `N4.20` now guards. Escalated rather than wordsmithed.

#### Verification

- [x] Read `bundles/experimental/skills/pencil/SKILL.md` — expected: valid frontmatter with `name: pencil`, `disable-model-invocation: true`, a `compatibility` field, R1–R7 present, and the routing-departure rationale. — **PASS: all present; `name` matches directory; no dangling relative reference paths (see the forward-pointer deviation above).**
- [x] Read `bundles/experimental/.claude-plugin/plugin.json` — expected: `./skills/pencil` present in `skills[]`, file parses as JSON. — **PASS: parses; `skills` = `["./skills/mvp","./skills/pencil"]`; both on-disk directories listed.**
- [x] Read the corpus results table — expected: 0 false fires on the negative set; Tier 1 at 100%; Tier 2 and authoring positives ≥80%. — **PASS at rev 4: Tier 1 13/13 (100%), Tier 2 11/11 (100%), authoring 7/7 (100%), negatives 36/36 with zero false fires.** Plus Set 5 (boundary, tracked and non-blocking) at 3/4. Read this together with the rev-3 row, which is deliberately preserved: rev 3 recorded a *failed* Tier 1 hard gate and a missed Tier 2 bar under exactly this wording. The description is byte-identical across revs 2–4 — what changed was a scope decision taken by the skill's owner, applied consistently, and re-measured. Without rev 3 on the record, rev 4's clean sweep would be indistinguishable from drawing the categories around the results.

  **Superseded reading (rev 3, kept for audit):** FAIL on two of four against the expanded corpus. Negatives **36/36, zero false fires** ✅ (hard gate, now including the frontend-implementation category that was previously unmeasurable). Authoring **7/7** ✅. Tier 1 **12/13 (92%)** ❌ — hard gate requires 100%; `P1.13` missed. Tier 2 **11/14 (79%)** ❌ — one prompt short of the ≥80% bar. The earlier "all gates pass" reading was against the pre-expansion corpus; the description is byte-identical and did not regress, the instrument got honest. See the rev-3 failure notes for the `P1.13` label contradiction and the shared property of the three Tier 2 misses.
- [x] Grep the skill directory for `dr-plan`, `dr-prd`, `project-management` — expected: no matches. — **PASS: zero matches (also grepped `/dr-`). Separately grepped for `\\.\pipe`, `C:\`, `S:\`, `~/.pencil` — zero matches, so the Phase 3 platform-neutrality gate is already clean.**
- [x] Start a new session and confirm the skill is listed and explicitly invocable as `/experimental:pencil`. — **PASS, confirmed by the user in a cold session on 2026-07-27: `pencil` appears in the skills list under `experimental`.** This closes three things that had been unverifiable from inside the authoring session: the `plugin.json` `skills[]` entry is honoured, the frontmatter parses as far as the harness is concerned (a block the loader rejected would not surface a named skill), and the live-from-working-tree marketplace reload works without any publish step. **Superseded reading:** UNVERIFIED, cannot be checked from inside the session that created the skill.
- [ ] [WAIVED 2026-07-27: the suppressed state no longer exists once the flag was flipped; never verified and now unverifiable] **CLOSED AS UNTESTABLE — the state it would have measured no longer exists.** `disable-model-invocation` was flipped to `false` in Phase 6, so the suppressed condition is gone and cannot be re-created without reverting the release. Recording the honest outcome: **this was never verified, and now cannot be.** The register-early sequencing therefore rested on the flag being honoured as a harness contract rather than on an observation — which was the stated fallback position, and which carried no risk in practice because every mutating path was gated behind a preflight that did not exist yet during those phases. Left `[ ]` deliberately; a closed-as-untestable item is not a passed one. **Original task:** Establish whether suppression is observable before relying on it. Send a Tier 1 positive prompt and check whether the transcript can actually distinguish "the flag suppressed invocation" from "the model saw the description and chose not to invoke". If the harness surfaces skill descriptions to the model regardless and the flag gates only automatic *invocation*, this test cannot show what it appears to show. Record which it is. If suppression turns out not to be observable, the register-early sequencing rests on `disable-model-invocation: true` being honoured as a harness contract rather than on a transcript check — note that limitation here and treat Phase 6's live confirmation run as the first real routing evidence. — **UNVERIFIED, same blocker.** Recording the limitation now as the task instructs: the register-early sequencing rests on `disable-model-invocation: true` being honoured as a harness contract. That is a safe thing to rest on — the failure mode if it is *not* honoured is that a half-built skill surfaces early and does less than it should, not that it damages a design, since every mutating path is gated behind the Phase 3 preflight that does not yet exist. **Phase 6's live run remains the first real routing evidence.**

#### Acceptance Criteria

- The description names the activity of authoring planning documents without naming any skill that performs it.
- The negative clause is present and the negative corpus passes with zero false fires.
- The skill is registered and loadable, but cannot surface on its own yet.
- The routing-convention departure is documented in the artifact itself, not only in this plan.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the description is the user-visible contract for the entire skill, and the no-coupling constraint is exactly the kind of thing a fresh-context reader catches and a self-review rationalises away. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — **PASS: manifest integrity (four JSON files parse, `experimental` consistent at 0.10.2 across all three locations, both on-disk skill directories listed); frontmatter validity (9/9 `SKILL.md` blocks parse as YAML after the fix below); reference integrity (no relative paths emitted, per the forward-pointer deviation).**
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. — **SPAWNED. Returned a blocking FAIL that self-review had missed entirely: the `SKILL.md` frontmatter was not valid YAML.** Both `description` and `compatibility` were unquoted plain scalars containing `": "`; `js-yaml` rejected the block at line 2 col 155 while the repo's other eight skills parsed. Had it shipped, all four frontmatter keys would have been unavailable to a standard parser — voiding both the routing contract this phase establishes and the suppression guarantee the register-early sequencing depends on. Also flagged: the R7 "verified failure mode" overstatement against the plan's own Assumptions, and that the rev-2 co-application clause had widened along an axis the negative corpus could not measure.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — **Applied. YAML fixed by double-quoting both scalars (matching this repo's existing precedent for descriptions containing colons); re-parsed all nine skills, 9/9 OK. R7 framing softened to distinguish R1–R6 (directly verified) from R7 (precautionary — concurrent MCP clients untested). The corpus blind spot drove the rev-3 expansion and the rev-4 scope decision recorded above.**
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. — **Two UNVERIFIEDs carried to Phase 6, both needing a harness restart: new-session skill listing, and whether `disable-model-invocation` suppression is observable at all. The verifier judged both honestly deferred. Note for the Retro: the verifier's own caveat that it was verifying a moving artifact — Phase 2 had begun while Phase 1's gate was open — is a real process fault. Phases 3–6 should close their gate before the next phase starts writing files.**

---

### Phase 3: Preflight and Target Binding

This is the phase that prevents silent corruption. Everything else in the skill is convenience; this is the part that stops an agent editing the wrong design and reporting success.

#### Tasks

- [x] Create `references/preflight.md` specifying the binding sequence, run once per `(session, filePath)` before the **first write** to any document.
- [x] Specify **target resolution**: the target is always explicit — from the user, or inherited from a plan/PRD design block. Never inferred, never "whatever is active". Missing target and unattended → fail immediately with a message naming what was needed.
- [x] Specify the **fingerprint check** as the primary method: read the target from disk, `JSON.parse`, extract top-level `children[].name`; probe via `snapshot_layout({filePath: target, maxDepth: 0})`; compare. Match → bound and correctly routed. Mismatch → you are talking to some other document, almost certainly the active one → **abort before any write**.

  **DEVIATION — the name-based fingerprint this plan specified is not implementable, and neither is the source doc's §4 as written.** Live testing found `snapshot_layout` returns only `id`, `x`, `y`, `width`, `height` — **no names**. A name fingerprint has nothing on the probe side to compare against. Two further candidates also fail against real documents:

  | Candidate | Result on the live pair |
  |---|---|
  | Compare names | Not implementable — probe carries no names |
  | Compare `height` | `undefined` on disk for auto-sized frames; computed only at layout time |
  | Compare node **count** | 5 vs 5 — **passes, and is wrong** |
  | Check a known node **exists** | Both documents open with an identical `bi8Au` / "Frame" / 800×600 @ (0,0) — **passes, and is wrong** |

  **First correction — compare the ordered tuple of top-level `(id, x, y, width)`** from disk against the probe. Verified to bind and abort correctly on the live trio. **Verification then showed this is still unsound as a *primary* check**, and the reasoning was sharp enough to act on immediately:

  - **It degenerates into its own rejected alternative.** Every fresh `.pen` has exactly one top-level node — `bi8Au` / "Frame" / 800×600 @ (0,0), confirmed identical across unrelated documents. Two new files fingerprint identically, so the check MATCHES and binds to the wrong one. Reachable through this plan's own Phase 5 `create_via: cli` path.
  - **Copies defeat it.** Duplicating a `.pen` preserves ids and geometry byte-for-byte; on real documents the discriminating power is almost entirely the id sequence, and ids survive duplication.
  - **It goes stale on first write.** MCP edits never reach disk, so after any `batch_design` a disk comparison reports mismatches on a correctly bound document. Phase 4 guarantees this — a `[decision]` container is a new root frame — and the mismatch branch would have emitted a *false* "your file isn't open" message mid-flow.

  **Final algorithm — probe-versus-active-probe, primary; disk, secondary and informational.** If the active editor path equals the target, routing is trivially correct → bind. Otherwise probe both target and active: identical responses mean fallback (or an identical copy) → **abort, fail closed**; different responses mean the target resolved to a genuinely distinct document → **bind**, caching that probe as the memory anchor. Revalidation compares against the anchor, refreshed after each of our own writes, never against disk.

  **All three branches verified live**, and the abort case matched down to computed heights (4784/4594/5073/4895) — fields the disk comparison must discard, so the replacement is strictly richer, not merely fresher. Also fixed from the same report: equal-length requirement before element-wise comparison (a truncated probe was otherwise a false match), `width` string sentinels (`fill_container`) skipped rather than compared against a number, a refusal to bind on a degenerate single-node fingerprint, and a three-cause mismatch table so the skill never tells a user a file isn't open when it is.

  Worth escalating to the source research: `pen-skill-info.md` §4 recommends the name comparison, which cannot run at all; and its pure-MCP fallback lacks a `target == active` carve-out, so it false-aborts on the most common case of all.
- [x] Specify the **pure-MCP fallback** for contexts where reading the file is unacceptable: `snapshot_layout` the target *and* the active editor's path from `get_editor_state`; identical responses mean the target is almost certainly not open. Document that this is strictly weaker — two genuinely identical documents would fool it — and that the disk fingerprint is preferred.
- [x] State prominently that **`get_editor_state` alone is not a valid target check** and explain why: it reports the active editor, so asserting on it fails whenever you are correctly editing a non-active file. This is the single most likely mistake for an agent to make, because the tool looks purpose-built for the job.
- [x] **[SUPERSEDED 2026-07-27 — the exception was removed entirely]** Specify the **R6 narrow exception**

  Prompted by a user question — *why are you reading the file from disk at all, given MCP edits never land there?* — which exposed that the exception rested on an assumption nobody had tested. The disk read existed as an **independent oracle**: MCP is the untrustworthy party (it silently substitutes the active document), so verifying it seemed to require a second source of truth, and the file was the only other one available.

  **Two read-only calls settled it.** `batch_get({filePath, readDepth: 0, searchDepth: 1})` returns `id`, **`name`**, `type`, geometry, `fill` and `layout` — for a *non-active* document, ~600 bytes for four frames. Run against the unopened `netflixhouse3.pen` it returned the active document's frames *under the active document's names*, so it discriminates exactly as well as the disk fingerprint did, and produces a better abort message besides.

  **So the oracle was never needed, and it was actively harmful:** disk reflects the last human save, so it goes stale on the first write — mid-run the bound document held 5 top-level nodes in memory against 4 on disk, and a disk check would have reported "mismatch" on a document we were correctly connected to. It also cannot distinguish a duplicated file, and every fresh `.pen` carries the same lone default frame.

  **R6 is now absolute in the skill: no exception, no carve-out, no filesystem access in the binding path at all.** This is strictly simpler, cheaper, and honours the vendor guardrail rather than negotiating with it. Reading a `.pen` remains legitimate only for tooling outside an agent session — a diff renderer or viewer.: reading a `.pen` from disk is permitted for fingerprinting and diffing only — a targeted parse of top-level names, never slurping the document into context, never hand-editing. Note that the vendor's "encrypted" guardrail is factually wrong but operationally sound, and that this exception is the one place the distinction matters.
- [x] Specify the **R3 outside-the-working-tree check** with cross-platform path handling: normalise separators to `/`, resolve to absolute, compare case-insensitively, and never encode a drive letter or a POSIX root. Outside the tree and not explicitly allowed → ask which file the user means before any mutation; reads are fine. Unattended → fail.
- [x] Specify **caching and invalidation**: cache the bound result per `(session, filePath)`; re-run the check if any call returns something unexpected, because Pencil is a multiplayer environment and documents can be closed underneath you.
- [x] Specify the **bind report** the skill emits on success: which document is bound, how it was proven, and that edits will be in-memory and unsaved.
- [x] Specify R5 completion wording and forbid the phrase "written to `<path>`" outright. Correct form: *"Applied to the open document `<name>` — unsaved. Save in Pencil to persist."*
- [x] **Live test — the corruption vector.** With a `.pen` open in Pencil, run the preflight against a *different* `.pen` the app has not opened. Expected: mismatch detected, abort before any write, message asks the user to open the file. Record the actual transcript in the phase notes.
- [x] **Live test — the good case.** With two files open and one active, bind the non-active one. Expected: fingerprint matches, bind report names the correct document.
- [x] **[RUN IN PHASE 4 — result recorded at the Non-Blocking question above]** No timer flush over 12 minutes, six samples, app running and untouched after four MCP writes. Original task: **Run the autosave test** from Non-Blocking questions while the app is open anyway: make one MCP edit, leave the app untouched, watch the file's mtime for several minutes. Record the result — it determines wording in Phase 4 and Phase 6.

#### Verification

- [x] Read `references/preflight.md` — expected: the five-step fingerprint sequence, the pure-MCP fallback with its stated weakness, the explicit `get_editor_state` warning, R3 path normalisation, cache invalidation, and the forbidden-phrasing rule. — **PASS: all present, plus a rejected-alternatives table and a live-verification appendix.**
- [x] Live: preflight against an unopened `.pen` — expected: abort, no `batch_design` call issued, user-facing message names the file and asks for it to be opened. — **PASS. `snapshot_layout` naming `netflixhouse3.pen` (never opened) returned `bi8Au, 3FOUK, sKRiu, ZQfb4, MQSjm` — verbatim the *active* document's nodes, with no error or warning. The corrected fingerprint returns MISMATCH → ABORT. Cross-checked: that probe matches `netflixhouse.pen`'s disk fingerprint exactly, confirming the fallback target. Zero `batch_design` calls were issued in this phase.**
- [x] Live: preflight against an open non-active `.pen` — expected: bind succeeds and names that document, not the active one. — **PASS. `netflixhouse2.pen` (open, not focused) returned its own four frames (`touNs, 1yQch, smvqD, J09x0`); fingerprint MATCH → BIND. No contamination from the active document.**
- [x] Grep the skill directory for `\\.\pipe`, `C:\`, `S:\`, `~/.pencil` — expected: no matches. — **PASS after a fix. The first pass caught a real violation the narrow pattern nearly missed: the R3 example message carried `S:/dev/repos/acme/web` and `C:/Users/you/…` (inherited from the source doc's suggested phrasing). Replaced with elided, platform-free paths. Re-grepped with a broadened pattern (`[A-Za-z]:[/\\]`, `\\.\pipe`, `~/.pencil`) — zero matches.**
- [ ] [WAIVED 2026-07-27: needs a case-sensitive volume; the behaviour and its limitation are documented in preflight.md §2] **R3 normalisation exercised on Windows against synthetic paths** *(added — the plan specified the rule but no test for it).* Backslash and forward-slash forms of the same path both resolve inside; mixed-case resolves inside; a POSIX path, a different drive, and a sibling repo all correctly trigger ASK. — **Deliberately NOT claimed as "verified cross-platform", which is what this line said before verification called it out.** Every check ran on Windows against strings; the platform-dependent property — filesystem case-sensitivity — was never exercised, and it is the only part that can actually differ. Stays `[ ]` pending the macOS pass already scheduled in Phase 6.
- [x] Autosave test result recorded in the phase notes (either "no flush observed after N minutes" or the observed interval). — **DONE in Phase 4: no flush observed over 12 minutes.** Propagated into `SKILL.md`, `preflight.md`, the bundle README, and the macOS checklist, each carrying the same caveat that focus-change and quit behaviour were not exercised. **Superseded reading:** DEFERRED to Phase 4. The test requires an MCP edit, and this phase was scoped to reads and aborts only (stated to the user before their files were opened). Phase 4 writes anyway; the test costs nothing there. Its result still gates R5's completion wording and the decision-frame cleanup language, exactly as recorded.

#### Acceptance Criteria

- An agent following `references/preflight.md` cannot reach a `batch_design` call without having proven document identity by content.
- The `get_editor_state` trap is called out explicitly enough that an agent reaching for it is corrected.
- Path handling contains nothing that would behave differently on macOS.
- The abort path produces a useful message, not a bare failure — the user learns which file to open.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this is the corruption-prevention surface and the highest-blast-radius content in the plan; a subtly wrong preflight reads as correct and fails silently, which is the exact failure mode the whole skill exists to prevent. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — **PASS, re-run after every edit: four manifests parse, `experimental` consistent at 0.10.2, `skills[]` matches both on-disk directories, 9/9 `SKILL.md` frontmatter blocks parse with `name` matching directory, and the one relative reference (`references/preflight.md`) resolves.**
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. — **SPAWNED. Independently re-parsed all three test documents and reproduced every disk-side claim in the appendix, then found three critical soundness defects in the algorithm this phase had just "verified".**
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — **Applied in full. The three criticals drove a rewrite of the core check from disk-primary to probe-versus-active-probe primary (see the fingerprint task above): (F1) the disk fingerprint degenerates on fresh documents into the very check the document itself lists as rejected; (F2) file copies preserve ids and geometry, so it false-matches; (F3) after any write, memory diverges from disk and revalidation aborts with a false "not open" message — which Phase 4 would have triggered on its first `[decision]` frame. Also fixed: (F4) pure-MCP fallback false-aborted when target *is* the active document, the most common case; (F5) R6 in SKILL.md still referenced a "top-level-name parse", pointing readers back at the unimplementable check; (F6) the R3 case-insensitivity justification was inverted — widening containment *suppresses* prompts, it does not add them; (F7) `width` can be a string sentinel; (F8) no equal-length requirement, so a truncated probe was a false match; (F9) the autosave claim shipped unhedged against the plan's own `[?]` assumption. All nine corrected in `preflight.md` and `SKILL.md`; residual-name grep now clean.**
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. — **Two items deliberately left `[ ]`: the autosave test (deferred to Phase 4, which writes anyway) and R3 cross-platform behaviour (exercised on Windows against synthetic strings only; the case-sensitivity property that can actually differ was never tested — carried to Phase 6's macOS pass). Retro note: this phase is the strongest evidence in the plan for the adaptive verifier policy. Phase 4's `verifier-recommendation` was set to `no` on the reasoning that live testing beats a fresh read — Phase 3 just demonstrated the opposite, since live testing *passed* an algorithm that was unsound in three ways. Phase 4's gate was already flipped to `yes` during drafting; that decision is now evidenced rather than precautionary.**

---

### Phase 4: Canvas Writes and the Visual Choice Flow

The write guidance and its first real consumer ship together, so the guidance is validated by an actual use rather than by reading. This is the phase that delivers the feature the user asked for: when a decision has genuine alternatives, draw them.

#### Tasks

**Write guidance** (`references/batch-design.md`):

- [x] Require `get_editor_state({include_schema: true})` before any `batch_design` work when the schema is not already in context — it returns the authoritative `.pen` TypeScript schema plus the batch_design docs, and the API is not stable enough to work from memory.
- [x] Document the gotchas that cost time in testing: **text has no `fill` by default and renders invisible** — always set it; never place text, icons, shapes or cards directly in `document` (root children are screen/component frames only); it is **not CSS** (no percentages, no `margin`, no `alignItems: stretch/baseline`, no `calc()`); `layout` and `padding` exist only on `frame`; `x`/`y` are ignored under a flex parent unless `layoutPosition: "absolute"`; sizing sentinels are `fit_content` / `fill_container`, optionally `fit_content(100)`; text sizing follows `textGrowth` (`auto` / `fixed-width` / `fixed-width-height`).
- [x] Document the mechanics: set a human-readable `name` on every node (the call returns a name→id map needed for follow-ups); never set `id` — Pencil generates them; new root frames carry `placeholder: true` while under construction; each call runs in its own scope, so values persist across calls only by assigning without `const`/`let`; errors roll back the whole call.
- [x] Add the annotation contrast rule: white text on an explicit dark backing frame rather than relying on the canvas colour, so labels hold in both light and dark themes.
- [x] Prefer `snapshot_layout` over `batch_get` for structure, and use `readDepth`/`searchDepth` conservatively — an unbounded `batch_get` on a 118-frame document returned 128 KB in a single response.

**Visual choice flow** (`references/visual-choice.md`):

- [x] Specify the **three tiers** and make the classification an explicit step, not an instinct:
  - **Minor** — copy text, a single colour or spacing token, a rename, one value. Do it, or ask in text. **Never draw.**
  - **Component** — a reusable element's structure or variants (button, card, nav item; anything used in more than one place). Draw 2–3 variants and ask.
  - **Design** — screen composition, a new screen, information hierarchy, flow between screens. Draw 2–3 variants and ask.
- [x] Cap variants at 3. More options on a canvas the user has to navigate to is worse than fewer, and each variant is a write that must later be cleaned up.
- [x] Specify **placement**: use `FindEmptySpace` and capture the returned coordinates; where exact placement matters, compute from `snapshot_layout({maxDepth: 0})` as max of `y + height` across top-level nodes, plus a gap.
- [x] Specify the **container frame**: one frame named `[decision] <topic>`, `placeholder: true` for its whole life, containing one child frame per option named `A · <label>`, `B · <label>`. Reserved prefix so the user can find it in a layers panel and so the session-end sweep can identify abandoned frames.
- [x] Specify **`(filePath, id)` keying** and why it is mandatory: node ids collide across documents (§2.6), so a variant is only ever identified by the pair. Capture the name→id map returned by the `batch_design` call into the skill's working notes immediately — each call runs in its own scope, so an id not captured is an id lost.
- [x] Specify the **screenshot self-check**: after drawing, call `get_screenshot({filePath, nodeId: <container id>})` and inspect it.

  **CORRECTION — the premise for this check was false, and it was tested rather than assumed.** Both the source research (§6) and this plan asserted that `batch_design` reports success for text drawn with no `fill`, leaving invisible labels undetected. That was the stated reason for spending an MCP call on a screenshot. **It is wrong.** A text node was deliberately inserted with no `fill`, and the response carried an `## issues detected:` block naming the offending node: *"Node 'vtrZY' has no 'fill' set, so the text is invisible."*

  Two consequences, both now in the artifacts. First, a **new and cheaper rule** the source doc never mentions: *read the `issues detected:` block on every `batch_design` response and fix before proceeding* — it catches modelled defects faster and more reliably than any screenshot. Second, the screenshot is **re-justified rather than removed**: it earns its call on defects the API does not model — contrast (text whose `fill` matches its background passes the issues check and is still unreadable), overlap, clipping, collapsed layout, and variants that simply aren't visually distinguishable. That last one is the failure that wastes the user's trip most reliably and that no API check can catch.

  The correction is recorded in `visual-choice.md` in-line, so a reader who inherits the original justification is corrected at the point of use. Check every option label is legible (the invisible-text failure), variants are visually distinct, nothing is clipped or overlapping. On a defect, fix via `batch_design` and re-screenshot — **cap at 2 fix attempts**, then describe the problem to the user rather than looping.
- [x] Specify the **wayfinding message**, and require all three elements — frame name alone is useless on an infinite canvas:

  ```
  Drawn into onboarding.pen — unsaved.
    Frame:    [decision] Nav placement
    Position: x 2400, y 1180 — directly below "02 · Signup", ~200px gap
    Options:  A · Sidebar   (left)
              B · Top bar   (right)
  ```

- [x] Specify **landmark computation**: from `snapshot_layout({maxDepth: 0})`, find the top-level frame whose bounding box is nearest the decision frame's origin, and phrase the position relative to it ("directly below X", "to the right of Y") alongside the raw coordinates.
- [x] Specify **asking**: use the harness's structured question tool where available (`AskUserQuestion` on Claude Code); otherwise ask in plain text, list the options, and wait. Option labels must match the drawn variant names exactly, so the user can map answer to pixels without translating.
- [x] Specify **resolution order — apply first, then delete.** Apply the winner to the real design; then delete the entire `[decision]` container (which removes all variants, winner copy included); then confirm deletion via `snapshot_layout` — the frame name is gone. Deleting first would destroy the winner.
- [x] Specify **one open decision at a time**: at most one `[decision]` frame may exist per `(session, filePath)`. A second decision arising before the first resolves must resolve or abandon the first. Without this rule the reserved-prefix sweep below cannot distinguish an abandoned frame from a live one and will offer to delete a decision the user is still looking at.
- [x] Specify **abandonment handling**: if the user changes topic or answers "neither", the decision frame is still on the canvas.

  **The sweep mechanism is `batch_get({patterns: [{name: ...}]})` — and testing it surfaced a bug that would have been catastrophic in a delete path.** `patterns[].name` is a **regex**, and the reserved prefix is not regex-safe: `[decision]` is a character class matching any single `d`, `e`, `c`, `i`, `s`, `o`, or `n`. Run unescaped against the live document it returned **every top-level node** — all four of the user's real screens, because every name contains one of those letters. A cleanup routine built on the obvious implementation would have offered to delete the entire design.

  Fixed by mandating the escaped, anchored form `^\[decision\] ` (verified to match exactly the intended frame), plus two safeguards proportionate to an operation that deletes things: the sweep must always show the user the list by name before deleting, and must use `searchDepth: 1` so it cannot reach nested nodes that merely share the prefix. At session end, sweep for frames matching the reserved prefix, list them, and offer to delete — excluding any decision still awaiting an answer. Warn that saving with one present persists it into the real design — and if the autosave test in Phase 3 showed the app flushes on its own, state that the frame can reach disk without a deliberate save.
- [x] **Live test — full round trip.** On a real `.pen`: bind, classify a component-tier change, draw two variants, run the self-check, emit wayfinding, take an answer, apply the winner, delete the container, confirm removal, report unsaved. — **PASS, end to end, against `netflixhouse2.pen` — deliberately the *non-active* document, so the run also proves writes route correctly to a document nobody is looking at.** Bound via the corrected preflight; drew `[decision] CTA button style` with two variants via `FindEmptySpace`; screenshot confirmed both legible and distinct; wayfinding computed as `x 6360, y 0 — immediately right of "V4 - Editorial Modern", 120px gap`; user chose `A · Solid`; winner copied out **before** the container was deleted; `snapshot_layout` confirmed container id `uZY0A` absent; document restored to its original 4 top-level nodes with zero residue. Every node landed in the target document; none in the active one.
- [x] **Live test — the invisible-text catch.** Deliberately draw one option's label with no `fill`, and confirm the screenshot self-check detects it and the fix path repairs it. This is the test that proves the self-check earns its extra MCP call. — **RAN, and produced the opposite of the expected result — which is why it was worth running.** The defect was caught *before* the screenshot, by `batch_design`'s own `issues detected:` block, which named node `vtrZY` directly. The fix path repaired it and the screenshot then confirmed the repair. So this test did **not** prove the self-check earns its call on invisible text; it disproved the premise and forced the re-justification recorded above. The self-check keeps its place on unmodelled defects only.
- [x] Test whether Pencil renders the Unicode prefix `⟦decision⟧` cleanly; if it does, switch from the ASCII default and close that Non-Blocking question. — **It does not. Stays ASCII.** Both prefix forms were drawn into a live document and screenshotted: `⟦` and `⟧` render as **tofu replacement boxes** — the default font has no glyph for them. The Unicode form's one advantage (needing no regex escaping in the sweep) does not survive glyphs the font cannot draw. Recorded in `visual-choice.md` with the caveat that this tested *canvas* rendering; the layers panel may use a different system font, but a prefix that breaks anywhere is not worth a cosmetic gain.

#### Verification

- [x] Read `references/batch-design.md` — expected: the schema-first requirement, the invisible-text rule, the not-CSS warning, sizing sentinels, name/id rules, scope persistence, and rollback-on-error.
- [x] Read `references/visual-choice.md` — expected: three tiers with concrete cut lines, the 3-variant cap, `(filePath, id)` keying, the self-check with its 2-attempt cap, the three-element wayfinding format, apply-then-delete ordering, and the abandonment sweep.
- [x] Live: full round trip completes and `snapshot_layout` confirms the decision frame is gone afterwards.
- [ ] [WAIVED 2026-07-27: the test disproved its own premise — the API caught the defect first. Criterion closed instead by a contrast defect the API cannot model] Live: the invisible-text case is caught by the self-check and repaired within the attempt cap. — **DELIBERATELY LEFT UNCHECKED. The test ran and disproved its own premise**, so ticking it would assert something false: the defect was caught by `batch_design`'s `issues detected:` block *before* any screenshot, not by the self-check. The repair-within-cap half did happen. The criterion it was written to serve was closed instead by a defect the API provably cannot model — `#161616` text on a `#141414` frame, `fill` correctly set, API clean, screenshot caught it. This box stays `[ ]` as the record that the original hypothesis was wrong.
- [x] Confirm the target file's mtime is unchanged after the whole round trip — proving R5's "unsaved" claim is accurate and not merely asserted. — **PASS. Baseline captured before the first write; re-checked after all four write operations (`Insert` ×11, `Update`, `Copy`+`Delete`, `Delete`). Size and mtime byte-identical throughout, and a targeted parse confirmed no `[decision]` residue ever reached the file.** The conditional below is resolved in the simple direction: no flush was observed, so the immediate-check form applies. A longer unattended watch is running to answer the separate autosave question. **Incidental confirmation of the Phase 3 verifier's F3:** mid-run the in-memory document held 5 top-level nodes while disk held 4 — a disk-based revalidation would have mismatched on a correctly bound document and emitted a false "your file isn't open" message. The anchor-based revalidation avoids it. **Superseded conditional:** if no flush was observed there, check mtime immediately after the round trip and treat any change as a failure. If the app *was* found to autosave, this check cannot prove anything on its own — instead state the observation window explicitly (check within the interval Phase 3 measured) and record that R5's wording must be softened from "unsaved until you save" to name the autosave behaviour.

#### Acceptance Criteria

- A minor change never triggers a drawing; a component or design change always offers one.
- The wayfinding message contains frame name, canvas coordinates, and a relative landmark — all three.
- After resolution, the canvas contains the applied winner and no trace of the decision frame.
- **The screenshot self-check demonstrably catches a rendering defect that `batch_design` reported as success — DEMONSTRATED 2026-07-27.** The first attempt at this (invisible text, no `fill`) *disproved* its own premise: the API caught it. Rather than tick the criterion on a re-justification, a defect the API provably cannot model was run instead — text at `#161616` on a `#141414` frame, with `fill` correctly set. `batch_design` returned clean with **no issues block**; the screenshot showed only the readable label, the second invisible. Criterion now rests on evidence, not assertion.
- Unicode prefix question is closed either way, with the result recorded.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase produces the user-visible contract (tier boundaries, wayfinding format) and issues deletes against a live design, and its correctness lives in prose an executing agent must follow: apply-then-delete ordering, (filePath, id) keying, the attempt cap, the abandonment sweep. The live round trip proves one path works; it says nothing about the paths not run, which is exactly what a fresh reader checks. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — **PASS: four manifests parse, `experimental` consistent at 0.10.2, `skills[]` matches both on-disk directories, 9/9 `SKILL.md` frontmatter blocks parse, all relative references resolve, platform and coupling greps clean.**
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. Direct the verifier specifically at the paths the live test did not exercise: the user answering "neither", a second decision arising before the first resolves, and `FindEmptySpace` returning coordinates with no nearby landmark to phrase against. — **SPAWNED with those directions. Its single most valuable finding was one I had not asked about: the abandonment sweep could delete from the wrong document.**
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — **Applied. Material fixes, in severity order:**

  **D1 — the sweep could delete from a document nobody asked it to touch.** It ran a bare `batch_get` with no re-binding. If the document was closed between bind time and session end — which the preflight explicitly warns can happen — the sweep silently reads the *active* document and deletes by ids sourced from it. The stated safeguard ("show the user the list first") does **not** catch this, because the returned names are plausible decision-frame names and nothing reveals which document produced them. Fixed: rebind via preflight §3 immediately before any sweep-driven `Delete`, and name the bound document in the list shown to the user.

  **D3/C3 — a nested container would be invisible to cleanup forever.** The write guidance says to honour `FindEmptySpace`'s `parentId`; the sweep uses `searchDepth: 1` and only sees root frames. Fixed by requiring the decision container to be inserted into `document`, overriding `parentId`, with the reason stated.

  **G1/G4 — "abandon" was a state, not an action, and deadlocked the slot.** The one-open-decision rule blocks new decisions until the current one is "resolved or abandoned", but nothing defined abandoning. Reachable twice over: a "neither" answer, and the two-attempt fix cap. Fixed with an explicit abandon action — delete now, confirm, clear the slot — and the sweep demoted to a backstop.

  **C2 — the evidence table contradicted its own prescription.** It credited `snapshot_layout` with producing a *named* landmark, which that tool cannot do. The truth: geometry came from `snapshot_layout`, the name from an earlier disk parse still in context. Corrected, with the combined `batch_get` wayfinding path explicitly marked sound-by-construction rather than tested.

  Also fixed: the ambiguous doubled-backslash regex form; the missing `placeholder: true` general rule; `snapshot_layout`-vs-`batch_get` preference scoped where an agent acts on it; a third mismatch cause (nonexistent path is indistinguishable from unopened, so offer both); the null-active-editor branch the rewrite newly made load-bearing; the anchor-refresh requirement restated at its consumer; cross-document sweep coverage; the `bi8Au` count reconciled to four; and a stat-versus-content-read distinction so the skill does not cite evidence its own R6 forbids gathering.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. — **AC4 was closed with evidence rather than argument:** the verifier correctly noted the screenshot's re-justification was *asserted*, since the one test run had disproved its own premise. Rather than rewrite the criterion, a defect the API provably cannot model was executed — `#161616` text on `#141414`, `fill` correctly set — and `batch_design` returned clean while the screenshot caught it. **Retro note:** across Phases 3 and 4 the verifier found defects in work that live testing had passed, twice. Live tests confirm the path you thought to run; a fresh reader finds the paths you didn't. The plan's `verifier-recommendation: no` on this phase, set during drafting on the reasoning that live testing was stronger, was wrong — and was corrected before it could do harm.

---

### Phase 5: Authoring-Time Capture

The one moment "which `.pen` file?" is cheap is while a planning document is being written, with a human present. By the time it executes, nobody is there to answer and the only available action is to fail. This phase makes the skill notice.

#### Tasks

- [x] Create `references/authoring-time.md` covering detection, capture, and the lint line.
- [x] Restate the **ownership boundary** at the top of the file, because it is the constraint most likely to be eroded by a later well-meaning edit: this skill knows what plans are; planning skills never learn what Pencil is. Knowledge flows specific → general. This file must never name a planning skill, test for one's existence, or assume one is installed — skills are descriptions surfaced by a model, not modules with a stable presence API.
- [x] Specify **Tier 1 detection** (explicit — always require a target): a literal `.pen` filename or path anywhere in the document; the words `pencil`, `pen.dev`, `pencil.dev`, "Pencil MCP"; named MCP tools; a reference to this skill.
- [x] Specify **Tier 2 detection** (design work, tool unstated): the visual-design nouns and the verbs applied to them, matching the Phase 1 corpus vocabulary so detection and routing cannot drift apart. — **Aligned, and the alignment check found one real gap.** A programmatic comparison of Tier 2 vocabulary against the corpus flagged `re-skin` as claimed-but-never-tested — the same class of hole the Phase 1 verifier found for `batch_get`, `export_html`, `prototype`, and `style guide`. Closed by adding held-out prompt `P2.15` ("Re-skin the settings screen for the new brand") and measuring it. **Beyond the plan's text:** the artifact also propagates the 2026-07-26 scope decision into detection — a plan step describing UI work with no artifact and no medium named ("restyle the nav", "build out the component library") is code work and does not require a design target. Without this, authoring-time detection would fire on prompts that runtime routing deliberately ignores, which is precisely the drift this task exists to prevent.
- [x] Specify **Tier 3 amplifiers** (raise sensitivity, never sufficient alone): the repo contains `.pen` files; a `design/`, `designs/` or `_designs/` directory exists; the source PRD already carries a design target; previous completed plans carried one; the Pencil MCP server is connected in the current session.
- [x] Specify the **resolution rule**: Tier 1 → require. Tier 2 + any Tier 3 → require. Tier 2 alone → ask once, and accept "not a Pencil task" as a dismissal **recorded in the document** so it is never asked again. — Rendered as a table, with a fourth row the plan omitted: **Tier 3 alone → do nothing.** Amplifiers are never sufficient, and leaving that implicit invites an agent to fire on "the repo contains `.pen` files" alone. Dismissal is required to live in the document, not the conversation, so a later agent on a different pass does not re-ask.
- [x] Specify the **capture block**, per-phase when a document touches several designs, because one global target is wrong for a multi-design plan:

  **`exists:` turned out to be more load-bearing than the source doc implies, and the artifact says why.** The Phase 3/4 rewrite established that at execution the preflight *cannot* distinguish an unopened file from a nonexistent one — both produce the identical silent fallback, and the preflight now reads nothing from disk that could tell them apart. So `exists: false`, recorded at authoring time, is the **only** thing that lets a run-time failure say "this file was never created" instead of guessing "open it in Pencil". A field that looked like bookkeeping is now the sole disambiguator for a whole class of failure message.

  ```yaml
  design:
    tool: pencil
    target: <path>/onboarding.pen
    exists: true          # false => the file must be created before any MCP work
    create_via: cli       # cli | user-opens-it
    open_required: true   # MCP mode needs the file OPEN in the app
    frames:               # optional, sharpens the preflight
      - "03 · Onboarding"
  ```

- [x] Specify the **new-file trap** and force the decision at authoring time: MCP cannot create a `.pen`, and pointing `filePath` at a non-existent path triggers the silent fallback — so "create a new design" via MCP quietly edits whatever is active. Either `create_via: cli` (headless `pen` writes a real file) or `create_via: user-opens-it` (an explicit human step that must complete before the agent step runs). Record the decision; never let it be discovered at run time.
- [x] Specify the **authoring-time question**, asked once, concretely, with the reason included — the user needs to know *why* a design tool is asking for a path before a single line of the plan is written: the document can run unattended, and Pencil silently falls back to whichever design is active when handed a file it does not have open. Offer three answers: existing file (give the path), new file (give the path plus who creates it), not a Pencil task (recorded, stop asking).
- [x] Specify **lint, don't block**: at authoring time a document that mentions design work but carries no `design:` block gets a **warning embedded in the document itself**, so it survives to whoever runs it — `⚠ This plan references design work but declares no design.target. A Pencil step will fail closed rather than guess.` The hard failure belongs at execution, not here, because the user may simply be mid-draft.
- [x] Specify the **two-layer contract** explicitly: best-effort detection here, fail-closed preflight at execution. A detection miss degrades into a *stop*, never a corruption — and that tolerance is exactly what makes imperfect heuristics acceptable. Build both; rely on neither alone.
- [x] Wire the authoring-time path into SKILL.md's router as a distinct mode from design work, so the skill can fire during document authoring without attempting any MCP call.
- [x] Note why PRDs matter even though they never execute: plans inherit from them, so a target captured once at the PRD stage removes the question from every downstream plan.

#### Verification

- [x] Read `references/authoring-time.md` — expected: the ownership-boundary statement, three detection tiers, the resolution rule with recorded dismissal, the capture block, the new-file trap with both `create_via` values, the question wording, the lint line, and the two-layer contract. — **PASS: all present.**
- [x] Grep the entire skill directory for `dr-plan`, `dr-prd`, `project-management`, `/dr-` — expected: no matches. This is the no-coupling gate. — **PASS, and widened.** Also grepped `dr-init`, `dr-ship`, `dr-research`, `experimental:`, `marketplace` — zero matches. A second grep confirms `authoring-time.md` names no plan-authoring tool of any kind (`claude code`, `pi`, `slash command`, `plugin`) — the boundary holds against *any* tool, not just this repo's.
- [x] Confirm Tier 2 detection vocabulary matches the Phase 1 corpus vocabulary — expected: the same noun and verb sets, so routing and detection cannot drift. — **PASS, but only after the check itself was replaced.**

  **First pass (term presence):** flagged `re-skin` as claimed-but-never-tested. Closed by adding held-out `P2.15`, which fires. A second flag, `match the mockup`, was a line-wrap artifact in the checker.

  **Verification then showed the check was structurally incapable of detecting the drift it exists to prevent.** `prototype`, `restyle`, and `component library` were all listed as Tier 2 vocabulary while the *only* corpus prompts containing them (`N4.40`, `N4.37`, `N4.38`) expected **no-fire** after the scope decision. A term-presence check passes *precisely* in that situation — the terms are in both files; it is their expected behaviour that diverged.

  **Resolved by measuring, not by deleting vocabulary.** The corpus was testing only half of each term. Three held-out prompts pair against the existing negatives — `P2.16` "Prototype the checkout screens **as wireframes**", `P2.17` "Restyle the onboarding **mockup**", `P2.18` "**Mock up** the component library" — and all six were judged in one batch by one judge, separating cleanly on the artifact signal. So the terms belong in Tier 2 and the scope rule is what discriminates, now with paired evidence rather than assertion. `N4.38`, previously unstable, also held this round.

  **The check is replaced by an outcome-based one:** verify expected outcome per corpus prompt, never term presence. The artifact carries that instruction so a future maintainer does not reintroduce the weaker form, along with a fires/does-not table using examples drawn from *outside* the vocabulary lists, and an explicit statement that the scope filter runs **before** the resolution table (without which "make the pricing page responsive" in a repo with `.pen` files would be Tier 2 + Tier 3 → require).
- [ ] [WAIVED 2026-07-27: half closed live — surfacing and capture confirmed; ask-once and dismissal-suppresses-reask not exercised] Live: in a session, begin authoring a plan that involves visual design work with no `.pen` named, and confirm the skill surfaces and asks for a target once. Then confirm a dismissal is recorded and the question is not repeated. — **HALF CLOSED by Phase 6's live prompt 6, and left `[ ]` because the other half is the part that matters.** Confirmed live: the skill **surfaced** on plain-English "Draft a PRD for the new dashboard layout" with no command token, cited the Tier 3 amplifier to justify escalating, emitted the capture block and the ⚠ lint line to spec, and offered `dismissed: true` as option 3. **Not confirmed:** that it asks *once* (the run stopped at the question), and that a recorded dismissal actually suppresses re-asking on a later pass — which is the whole point of making dismissal durable. Phase 5's own self-review predicted exactly this shortfall; the prediction held. Closing it needs a two-turn test: answer "not a Pencil task", then re-open the document in a fresh session and confirm silence. **Superseded reading:** DEFERRED to Phase 6. The skill cannot auto-surface until then, by design. **Proxy evidence already recorded:** authoring-time positives measured 7/7 across the corpus, including forms that name a planning tool and forms that do not.
- [ ] [WAIVED 2026-07-27: the design-free authoring conjunction was not among the six live prompts; corpus proxy only] Live: begin authoring a plan with no design content and confirm the skill stays silent. — **STILL OPEN.** Phase 6's live run contained no design-free *authoring* prompt: its three negatives were meta bookkeeping, frontend implementation, and schema design. So the specific conjunction this item tests — authoring activity present, design content absent — has still never been exercised live. It is the one that guards against the skill firing on every plan and PRD in the repo, so it deserves a real test rather than adjacency. **Corpus proxy (recorded as proxy, not as closure):** negative category 4b (design-free plan authoring, 4 prompts) held at zero false fires across every revision, as did the compound category 4j ("write a plan for redesigning the database schema").

#### Acceptance Criteria

- Detection and capture are entirely inside this skill; no other bundle is modified by this plan.
- The skill fires on the activity of authoring a planning document, regardless of which tool is producing it — including a plain markdown file written by hand.
- A dismissal is durable: recorded in the document, not re-asked.
- The lint warning is embedded in the authored document, so it reaches whoever executes it rather than evaporating with the session.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the §5.1 ownership boundary is the constraint a self-review is most likely to rationalise away ("naming dr-plan is just clearer"), and a fresh-context reader checking for leaked coupling is exactly the right instrument. -->

- [x] Run Definition of Done commands (see plan header). All must pass. — **PASS: four manifests parse, `experimental` consistent at 0.10.2, `skills[]` matches both on-disk directories, 9/9 frontmatter blocks parse with `name` matching directory, all relative references across five files resolve, platform and coupling greps clean.**
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. — **SPAWNED. Confirmed the ownership boundary holds (re-running the coupling grep independently rather than trusting the self-report), and then found a defect in the verification method itself rather than in the artifact.**
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. — **Applied. Four fixes:**

  **The Tier 2 drift** — resolved by measurement, detailed above. The verifier's insight that a term-presence check *passes precisely when the drift it targets has occurred* is the sharpest methodological point in the plan so far.

  **The `exists:` claim was false as written.** It asserted the field was "the only thing" letting a run-time failure say *never created* — but `preflight.md` mentioned `exists: false` only in a Cause column and prescribed the same hedged message regardless, so nothing consumed it. And "only" was wrong anyway: a `stat` would distinguish the cases, and the skill's own rules place `stat` outside R6. Fixed both ends — the preflight now **branches** on the field with a distinct assertive message, and the claim is downgraded to accurate.

  **Dismissal had no durable form.** The rule required recording "not a Pencil task" in the document so a later agent never re-asks, but the capture block had no field for it. Added `dismissed: true` with a `reason`, in the same block so there is one place to look.

  **Two Tier 3 amplifiers were unlocatable by design** — "the source PRD already carries a target" and "previous plans carried one" specify no location, *because* genericising the path was what satisfied the ownership boundary. Rather than hide the tension, it is now stated: check them only if the document names its source; the boundary wins over sensitivity, and since any one amplifier suffices and three are cheaply checkable, the rule stays executable. Also clarified that listing `.pen` *filenames* is outside R6, which prohibits reading content — otherwise a conservative agent declines the cheapest amplifier available.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. — **Two live items remain `[ ]`, correctly deferred to Phase 6, which flips `disable-model-invocation`. The verifier's judgement on the proxy evidence is recorded honestly: the negative-side proxy genuinely covers what the live test would show, but the positive-side proxy covers only "surfaces" and not "asks once" or "dismissal recorded and not re-asked" — those are unexercised, and the Phase 6 confirmation run should include them. Retro note: three phases running, the verifier has found defects that live testing passed; here it found a defect in the *verification method* that no amount of live testing would have surfaced.**

---

### Phase 6: Enable Auto-Discovery, Document, Release

Everything the skill needs now exists. Flip routing on, confirm it live, and make the bundle shippable.

#### Tasks

- [x] Re-run the full Phase 1 corpus against the final description, now that the skill's body exists and can influence judgement. Record results. — **Done, and the corpus grew rather than merely being re-run.** The shipped description is unchanged since rev 2; revs 3–5 are all re-measurements under a progressively harder instrument. Final standing: **Tier 1 13/13, Tier 2 15/15, authoring 7/7, negatives 36/36 with zero false fires**, plus Set 5 (boundary, tracked and non-blocking) at 3/4. The corpus went from 47 prompts in four categories to 74 across eleven, half of them held out and written after tuning stopped. Nine judge batches across five revisions.
- [x] Flip `disable-model-invocation` to `false` in `SKILL.md`. **Rollback if it misfires:** flip back to `true` — the skill remains fully usable as `/experimental:pencil` while the description is retuned. — **Flipped and confirmed live: the skill is listed in a cold session.**
- [x] **Live confirmation run** — 5 prompts in fresh sessions: 3 positives (one Tier 1, one Tier 2, one authoring-time) and 2 negatives (one non-visual "design", one design-free plan authoring). Every one must match its expected outcome. A single false fire on a negative blocks the phase and sends the description back for retuning. — **PASS. Six prompts run by the user on 2026-07-27; five conclusive, all five matching expectation, zero false fires.** Prompts 2, 3 and 6 ran cold; 4 and 5 ran with the skill already loaded in context (see the Condition column and the caveats below). **Two shortfalls against this task's own stated composition, recorded rather than smoothed over:** the Tier 1 positive slot came back inconclusive, so only 2 of the 3 required positive tiers produced conclusive evidence; and only **one** of the three negatives ran cold, making cold-routing negative evidence n=1 rather than n=3. The blocking condition — a false fire on a negative — did not trigger. **The negative gate is carried by the corpus's 36/36, not by this run.**

  | # | Prompt | Expected | Result | Condition |
  |---|---|---|---|---|
  | 1 | "What can the pencil.dev MCP server actually do with my design files?" | fire | **inconclusive** | confounded — see below |
  | 2 | "Bump experimental to 0.11.0 for the pencil skill" | no-fire | **silent** ✅ | cold, skill not yet loaded |
  | 3 | "Create a wireframe for the checkout flow" | fire | **fired** ✅ | cold |
  | 4 | "Style the nav bar with Tailwind" | no-fire | **silent** ✅ | skill loaded in context |
  | 5 | "Design the database schema for multi-tenant orgs" | no-fire | **silent** ✅ | skill loaded in context |
  | 6 | "Draft a PRD for the new dashboard layout" | fire | **fired** ✅ | cold (session restarted) |

  **Prompt 3 did far more than route.** It refused to guess a target (R1); noticed the active document sat outside the working tree and demanded explicit permission before writing there (**R3 — first live exercise ever**; Phase 3 only tested it against synthetic strings); applied the new-file trap ("the MCP surface has no create-file tool, so only you can make it"); and stated the corruption vector against the user's *actual* situation rather than reciting it — naming the specific harm of dropping a checkout flow into their Netflix House canvas.

  **Prompt 6 exercised the entire authoring-time path for the first time.** Fired on plain-English "Draft a PRD" with no `/dr-prd` token — keying on the activity, as designed. Cited the Tier 3 amplifier by name to justify escalation. Gave the R4 rationale including PRD inheritance. Emitted the capture block and the ⚠ lint line to spec. **Used the `dismissed: true` field** that had not existed until the Phase 5 verifier found the dismissal rule unenforceable without one. And explained the `exists:` disambiguation correctly — the exact claim verification had caught as overstated.

  **The no-coupling boundary held under live conditions.** Prompt 6's agent noted that a fuller PRD treatment was available via a token-gated command and that it had deliberately not fired it — knowledge it held independently, from its own skill list. The pencil skill named nothing. Two skills coexisting, neither referencing the other, each honouring its own trigger contract.

  **Caveats recorded rather than glossed:**
  - **Prompt 1 is structurally confounded and this is a flaw in the test design, not the skill.** The run happened *inside the repo containing the skill's source*, so any informational question about Pencil is answerable by grepping and reading `SKILL.md` — no invocation required. The transcript showed a search plus two file reads, consistent with either path. **Routing can only be measured cleanly in a repo that does not contain the skill.** The corpus judges avoided this by seeing descriptions and no filesystem at all.
  - **Prompts 4 and 5 measure a different thing than 2, 3 and 6.** The skill loads into context at prompt 3 and stays, so 4 and 5 test *"with every rule in front of it, does the model correctly decline"* rather than *"does the description surface it"*. That is arguably the harder test and it passed — prompt 4's agent volunteered the scope rule verbatim ("Tailwind styling is implementation, not a design artifact") — but it is not cold routing and is not recorded as such.
- [x] Bump `experimental` to **0.11.0** in all three locations: `bundles/experimental/.claude-plugin/plugin.json`, `bundles/experimental/package.json`, and the `experimental` entry in `.claude-plugin/marketplace.json`. Minor bump — new skill, no breaking change to `mvp`.
- [x] Add a `## [0.11.0] - <date>` entry to `bundles/experimental/CHANGELOG.md` under `### Added`, describing the skill and naming the behaviour that motivates it (the silent `filePath` fallback), so a reader of the changelog alone understands why the skill is defensive.
- [x] Update `bundles/experimental/README.md` with a section for the skill — restructured rather than appended: the README was entirely MVP-scoped, so the skills table now covers both, a `# Pencil` section leads with the two operational facts, and the MVP content sits under its own heading.: what it does, the Pencil MCP requirement, and the two things a user must know up front — the target file must be **open** in Pencil, and MCP edits are **unsaved** until they save.
- [x] Update the repo `AGENTS.md` "Current Bundles" line for `experimental` to mention the Pencil skill alongside the MVP builder.
- [x] Create `_project/docs/pencil-macos-verification.md` — a short, runnable checklist for closing the macOS gap: bind a target without modifying the skill; confirm the R3 path comparison behaves on case-insensitive-but-case-preserving APFS; confirm `export_nodes`' `outputDir` accepts a POSIX path unchanged; confirm the fingerprint disk read works against a macOS path. Each item states what to run and what result closes it.
- [x] Record the open questions this plan deliberately leaves open in that same doc or a sibling — six carried forward in the macOS checklist, including two the 12-minute autosave test does **not** cover (focus-change and quit flush). — Original scope:: concurrent MCP clients, `pen interactive -a desktop` document switching, whether any MCP path to `save()` exists, whether `export_html` works with no app running — so the next person inherits the list rather than rediscovering it.

#### Verification

- [x] Read `SKILL.md` — expected: `disable-model-invocation: false`.
- [x] Live: all 5 confirmation prompts match expected outcomes, with 0 false fires on the 2 negatives.
- [x] Read all three manifests — expected: `0.11.0` in each, all parse as JSON, `./skills/pencil` present in `plugin.json` `skills[]`.
- [x] Read `bundles/experimental/CHANGELOG.md` — expected: a `0.11.0` entry dated today under `### Added`.
- [x] Read `bundles/experimental/README.md` and repo `AGENTS.md` — expected: both mention the Pencil skill; the README states the open-in-Pencil and unsaved requirements.
- [x] Read `_project/docs/pencil-macos-verification.md` — expected: each checklist item states a command or action and a pass condition.
- [x] Confirm `git status` shows no modifications under `bundles/project-management/` — the no-coupling gate at the repo level.

#### Acceptance Criteria

- Auto-discovery is on and confirmed live against both positive and negative prompts.
- Version 0.11.0 is consistent across all three manifests, with a CHANGELOG entry.
- A user reading only the bundle README learns the two operational facts that would otherwise bite them.
- The macOS gap is documented as a runnable checklist rather than an assumption.
- `project-management` is untouched.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — flipping auto-discovery on is the user-visible contract for the whole plan, and version consistency across three manifests plus a changelog is precisely the mechanical drift a fresh-context verifier catches reliably. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

## Refinement History

- **2026-07-25:** Initial plan creation.
- **2026-07-27:** **Post-Phase-6 retarget — the Pencil MCP tool surface changed during the ship run.** Five of nine tools were removed (`get_editor_state`, `batch_design`, `batch_get`, `snapshot_layout`, `get_variables`), three added (`get_app_state`, `execute`, `browser`), four unchanged. The skill as shipped-ready would not have run: its preflight called two removed tools and its write guidance was entirely about a third.

  **Investigated before acting, and the findings were reassuring.** The silent `filePath` fallback persists — an `execute` call naming a never-opened `.pen` returned ~130 frames of the active document, no error. Enumeration is still impossible: `get_app_state` reports one active editor, and opening two extra documents changed nothing in its output. `get_screenshot` survives untouched. So **the hazard is a property of the app's document dispatch, not of any tool**, and the skill's logic needed no rethinking — only its call sites.

  **Retargeted:** `references/batch-design.md` → `references/execute.md` (rewritten for the new API); `preflight.md` probe rewritten to `execute` + `Get` + `skipChildren` + `Print`, with a new fast path that uses `get_app_state`'s node preview to settle most bindings in two calls instead of three; `SKILL.md` R2, tool table and R6 updated; `visual-choice.md` sweep, landmark and confirmation calls updated. Verified live: the new probe returns `id | name | x y width height` per top-level node against a 130-frame document.

  **Two things improved and one new gotcha found.** The abandonment sweep's regex trap is *gone* — `Get` takes a visitor rather than a pattern, so the character-class bug that would have offered to delete a user's whole design is no longer expressible (the history is kept in the artifact in case a pattern API returns). Reading structure and names now takes one call rather than a choice between two tools. And newly discovered: bare assignment persists globals across `execute` calls, but *reading* an undefined bare identifier throws `ReferenceError` and rolls the call back — not in the vendor docs, now recorded.

  Unaffected by the change: the routing corpus, the scope rule, the tier logic, authoring-time capture, and the screenshot self-check. None of them name a tool. Tier 1 detection vocabulary now lists **both** old and new tool names deliberately, since someone writing a plan from older notes will use the superseded ones with identical intent.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- **The adaptive verifier, overwhelmingly.** Five of six phases spawned `plan-verifier`, and in every case it found defects that self-review and live testing had passed. Phase 2: `SKILL.md` frontmatter was not valid YAML — all four keys, including the flag the whole release sequencing depended on, would have been unavailable to a standard parser. Phase 3: three critical soundness holes in an algorithm live tests had just confirmed. Phase 4: a delete path that could target the wrong document. Phase 5: a verification method structurally incapable of detecting the drift it existed to catch. Phase 6: a wrong prompt count in a shipped changelog. Rough tally — self-review found two issues in Phase 1; the verifier found eleven.
- **Building against the live tool.** Six things the source research treated as settled were overturned by actually using the MCP surface: §4's preflight cannot run as written (`snapshot_layout` returns no names); the disk-read "oracle" is unnecessary *and* stale-prone; `batch_design` reports its own issues rather than silently succeeding; the app does not autosave on a timer; `bi8Au` is a deterministic creation artifact rather than a collision; Unicode prefixes render as tofu.
- **Writing failures down.** The corpus preserves rev 3 as a *failed* hard gate under the same wording that later passed. Without that row, rev 4's clean sweep would be indistinguishable from drawing the categories around the results. The same applies to the invisible-text test that disproved its own premise, and to the Phase 2 item closed as untestable rather than passed.
- **Held-out prompts.** Adding 23 prompts written *after* tuning stopped turned "the description enumerates its own answers" from a suspicion into a measurable property. The paired-contrast set (`P2.16`–`P2.18` against `N4.37`/`N4.38`/`N4.40`) is the strongest single artifact in the corpus.
- **Escalating rather than wordsmithing.** When Tier 2 sat one prompt below threshold, widening the description would have endangered a negative gate that `N4.20` guards. Putting the scope question to the owner produced a rule that then held across every later measurement.

### What didn't

- **Phase gates were closed with their own boxes unflipped — twice.** Phase 2 began while Phase 1's gate was open (the Phase 1 verifier had to note it was auditing a moving artifact). Phase 4's exit gate was marked complete with 19 of its own boxes still `[ ]`. The same self-review that caught the fault the first time did not catch it the second.
- **The first routing eval measured the wrong thing.** A term-presence check between the skill's vocabulary and the corpus passes *precisely when* a term has been kept while its expected behaviour moved to the opposite value — which is the drift it was written to catch.
- **The live confirmation run was designed badly.** It ran inside the repo containing the skill's source, so the Tier 1 prompt was answerable by grepping files and came back inconclusive. Prompts were run sequentially in one session, so the skill stayed loaded and prompts 4–5 measured discrimination rather than routing. Net effect: cold-routing negative evidence is n=1, not n=3, and the Tier 1 slot is still unfilled.
- **Claims outran evidence more than once.** "The screenshot self-check demonstrably catches what `batch_design` reports as success" was asserted after the one test disproved it. The `exists:` field was described as "the only thing" that disambiguates when nothing consumed it and a `stat` would also do. A shipped changelog carried a prompt count matching neither the corpus nor its own summary table.
- **SC1 is still not met.** No agent following `SKILL.md` has executed the corruption-vector abort end to end. The mechanism is verified; the skill path around it is not.

### Learnings

- **Live tests confirm the path you thought to run; a fresh reader finds the paths you didn't.** Phase 3's live tests passed an algorithm that was unsound in three ways, because they exercised documents in their saved state — the one condition where the disk oracle works. This is the single most transferable lesson here, and it is an argument for the verifier being the default rather than the exception.
- **A verification method can be structurally incapable of detecting its target.** Ask of any check: *what would it look like if the thing I fear had already happened?* If the answer is "it would still pass", the check is decoration.
- **Routing cannot be measured inside the repo that contains the skill.** The agent can always read the source. Judge batches avoid this by seeing descriptions and no filesystem; live runs must happen elsewhere.
- **Prefer a question to the owner over a cleverer sentence.** Two of the plan's better outcomes — the Tier 2 scope rule and the decision to keep `N4.38` out of the hard gate — came from surfacing a trade-off rather than resolving it by wording.
- **Reclassifying a failure is the move that most needs evidence.** It was right for `P2.4`/`P2.6`/`P2.13` because measured behaviour never changed and the owner set the rule deliberately; it would have been wrong for `P1.13` had it been done quietly. The distinguishing test is whether the reclassification is measured afterwards and the original failure preserved.
- **A hard gate must contain unambiguous cases.** `N4.38` flips between identical runs; behind a zero-tolerance bar it would fail a third of the time for reasons no one can act on, and a gate that fails unactionably gets ignored.
- **Separate what a tool is called from how it behaves, and write them down separately.** The MCP surface was replaced during the ship run — five of nine tools removed. Every *behavioural* finding transferred intact; only call sites broke. The phases that documented *why* a rule exists survived; a skill that had only documented *what to call* would have been a total loss. When integrating against a fast-moving vendor API, the durable artifact is the hazard model, not the call list.
- **A verification gate is worth having at the very end, not just per phase.** The final verifier caught a wrong prompt count already written into a shipping changelog. Cheap to fix then; embarrassing to discover later.
- **Close a phase's boxes before the next phase writes a file.** Both process faults above trace to the same root, and the cost lands on the verifier, which then cannot tell what it is auditing.
