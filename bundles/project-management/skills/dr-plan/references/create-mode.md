# CREATE Mode — Draft a New Implementation Plan

This reference owns the full CREATE flow end-to-end. Follow each phase in order.

The flow is: gather → detect plan type → determine number → analyze → populate DoD → structure phases → annotate gates → write → report.

## Phase 1: Gather the Implementation Context

### Read `$ARGUMENTS` and conversation context

Determine the starting context using this precedence:

- **`$ARGUMENTS` has substantive content** → use it directly as the starting context.
- **`$ARGUMENTS` is empty, whitespace-only, or trivially short (a pronoun like "this" or "it") AND the preceding conversation contains substantive context about what's being planned** → summarize that context back to the user:

  > Based on our conversation, I understand you want to plan: [concise summary of the work from the preceding conversation — include any referenced PRDs, constraints, or decisions].
  >
  > Should I proceed with this as the starting context, or do you want to adjust it before I draft?

  Wait for confirmation or correction before continuing.

- **`$ARGUMENTS` is empty AND there's no useful prior conversation context** → ask:

  > What would you like to implement? Share as much or as little as you'd like — describe the work, the why, any constraints, and reference a PRD with `@_project/prd/[file].md` if you have one.

  Wait for the user's response before continuing.

### Check for flags and PRD reference

- **`--in-progress` flag** — if present, the plan will be created in `_project/plans/in_progress/` instead of `_project/plans/draft/`.
- **PRD reference** (`@_project/prd/[file].md`) — when the user includes one, the content is auto-expanded into the conversation by Claude Code. The `@path` token itself is removed from `$ARGUMENTS` after expansion. (On harnesses without `@` expansion, Read the referenced file yourself.) Use the expanded PRD content as input to the plan. Store the PRD path for the `Related PRD` metadata field.

## Phase 2: Detect Plan Type (Overlay Signals)

Load `references/template-variants.md` for detection rules and overlay composition.

The default plan type is **`standard-feature`** and it is used **silently**. Overlays only apply when detection signals are present.

### Signal sources (in precedence order)

1. **PRD Feature Type** — if a PRD was referenced, check its `Feature Type` metadata. If it's `ai-feature` → propose `ai-feature` overlay. If it's `infra` → propose `migration/infra/refactor`. If it's `spike` → propose `spike`. If it's `user-facing` or `internal-tool` → default to `standard-feature` (unless keywords suggest otherwise).
2. **Keyword scan** in `$ARGUMENTS` — look for:
   - `migrate`, `migration`, `refactor`, `upgrade`, `platform`, `infra` → `migration/infra/refactor`.
   - `fix`, `bug`, `regression`, `hotfix` → `bug-fix`.
   - `explore`, `spike`, `prototype`, `feasibility`, `investigate` → `spike`.
   - `llm`, `model`, `prompt`, `eval`, `agent`, `rag`, `embedding`, `summariz`, `classif` → `ai-feature`.
3. **Repo signals** (use `Glob` sparingly — only if keyword/PRD inference left it ambiguous):
   - `migrations/` or `schema.sql` present → lean toward `migration/infra/refactor`.
   - `evals/`, `prompts/`, or `prompt.md` files present → lean toward `ai-feature`.

### Decision

- **No signal detected → silently use `standard-feature`.** Do not prompt the user. Do not mention the plan type in any pre-draft message.
- **Signal detected → announce and confirm.** Use `AskUserQuestion` once:

  > This looks like a [detected type] — [one-line reasoning, e.g., "you mentioned migrating the users table"]. Should I use the [detected type] overlay?
  >
  > Options:
  > - Yes, use [detected type] overlay
  > - No, use standard-feature (no overlay)
  > - Use a different overlay: [list the other four]

### Multiple-signal case

If two overlays surface (e.g., `ai-feature` keywords AND `migration` keywords), propose the dominant one and mention the secondary as a note in the confirm prompt. AI features often use infra patterns underneath — `ai-feature` wins. Bug fixes with schema changes → `migration/infra/refactor` wins.

Store the confirmed plan type for Phase 5 (template composition) and Phase 8 (metadata).

## Phase 3: Determine Plan Number

Plans are numbered sequentially across ALL three folders.

1. Use `Glob` with pattern `_project/plans/**/*.md`.
2. Filter matches to files whose name starts with `NNN-` or `NNNN-` (one or more leading digits, then a hyphen).
3. Parse the leading number from each.
4. Next number = highest + 1.
5. Format: zero-padded to 3 digits if ≤ 999 (`001`, `042`, `999`); no padding if > 999 (`1000`, `1001`).
6. If no plans exist anywhere → start at `001`.

If `_claude/plans/` exists and `_project/plans/` does not, the project predates the 3.0.0 directory rename — tell the user and suggest `/dr-init` (which offers the `git mv _claude _project` migration), then use the old `_claude/` paths for this run.

Concurrent-create edge cases (two plans ending up with the same number) are acceptable — the slugs differ and nothing downstream breaks.

## Phase 4: Analyze the Implementation (Extended Thinking)

Use extended thinking. Think about:

- What exactly is being built, and how does it split into phases?
- What exists today that the work modifies or extends?
- What assumptions are you making — which are grounded in the PRD/codebase (write as `- [x] text` — checkbox flipped, evidence cited), which are uncertain (write as `- [ ] [?] text` — pending checkbox + uncertain tag)?
- What blocking questions must resolve before implementation can start (`[AWAITING]`)?
- What non-blocking questions can be answered during implementation (`[OPEN]`)?
- What could go wrong? Where do the risks concentrate?
- Where is verification hardest — and where should a fresh-context verifier be worth the cost?

### Critical-assumption escape hatch

If an assumption is so load-bearing that getting it wrong invalidates the whole plan shape, consider using `AskUserQuestion` *before* drafting to resolve it. Only for truly plan-shaping assumptions — not routine uncertainties. Most uncertainties belong in `Open Questions & Decisions`, not as pre-draft blockers.

## Phase 5: Populate Definition of Done

The DoD block in the plan's header references concrete project commands. Populate them by reading config in this precedence order:

1. `AGENTS.md` at repo root — look for Build/Test/Lint/Typecheck sections (the project's instruction file).
2. `package.json` — scripts section (`test`, `lint`, `typecheck`, `check`).
3. `Cargo.toml` — implies `cargo test`, `cargo clippy`, `cargo check`.
4. `go.mod` — implies `go test ./...`, `go vet ./...`.
5. `pyproject.toml` / `setup.py` — look for `pytest`, `ruff`, `mypy` configured.

If the stack is unclear (multi-language monorepo, no standard config found), ask once during the clarifying phase:

> I couldn't confidently identify the test/lint/typecheck commands for this repo. Can you share the commands for: run tests, run lint, run typecheck?

If a category genuinely doesn't apply (e.g., no type system in a pure JS repo, no tests in a docs-only repo), strike that line and add a note in the Assumptions section explaining why.

## Phase 6: Structure Phases (Strict DoD Discipline)

Every phase must leave the codebase shippable — tests, lint, and typecheck green at every phase boundary. This is the hard rule.

### Write phases that can be verified on their own

**A phase's Verification items and Acceptance Criteria must be interpretable without reading another phase.** Independent verification reads the target phase plus four named top-matter sections — not the whole plan — so a criterion that silently depends on a sibling phase's text is a criterion the verifier has to go hunting for, or gets wrong.

The distinction is **files versus phases**, and only one of them is a constraint:

- **Spanning files is normal and correct.** *"All six gate/apply sites carry identical three-branch logic"* is a good criterion. Say so plainly; the verifier will go and read all six.
- **Spanning phases needs the dependency stated inline.** *"The negative-test design for Phase 5 is fixed"* is not evaluable by someone who has not read Phase 5. Either restate what Phase 5 needs — *"…so Phase 5 can run its test without a settings edit"* — or name the cross-reference explicitly so the verifier knows to fetch it.

Where a genuine cross-phase dependency exists — an interim-phase marker, a restoration promised in a later phase, an artifact one phase hands to the next — **write it into the phase body as an entry condition**, in a sentence that stands alone. A reader who opens only that phase should be able to tell what it assumes.

This is a writing rule, not a prohibition. Cross-phase work is legitimate; leaving the dependency implicit is what costs.

### Restructure to satisfy strict DoD

Analyze your proposed phases. If Phase N as drafted leaves the codebase broken (failing tests, broken build, type errors) with Phase N+1 as the fix, **restructure them.** Combine into one larger phase, reorder work, or extract a prerequisite into an earlier phase. Prefer restructuring over interim phases in ~95% of cases.

### Interim phase escape hatch

Only when restructuring is genuinely impossible (e.g., a schema rename truly has to be split across commits, or a large rename cannot be done atomically):

- Add an HTML comment marker at the top of the phase: `<!-- interim-phase: [short reason] — SKIPPED, restored in Phase N -->`.
- Add a prominent callout at the top of the phase body: `**DO NOT MERGE BEFORE PHASE [N]**`.
- In the final phase's Acceptance Criteria, confirm the interim-phase condition has been restored.

## Phase 7: Annotate Phase Exit Gates (Adaptive Verifier)

For each phase, decide whether independent verification is worth the cost, given the Adaptive default Verification Policy. Judge the *outcome* — an independent pass over this phase's claims — not the mechanism: it runs as `project-management:plan-verifier` where the harness supports subagents, and inline against the plan's Inline Verification Rubric where it does not.

Write a single HTML comment in each phase's Phase Exit Gate block:

```
<!-- verifier-recommendation: yes — [one-line reasoning] -->
```

or

```
<!-- verifier-recommendation: no — [one-line reasoning] -->
```

### When to recommend `yes`

- The phase touches security-sensitive code (auth, crypto, input validation, permissions).
- The phase produces the user-visible contract for the plan (e.g., template files, config schemas, API shapes).
- The phase has a high blast radius if wrong (shared infrastructure, cross-service code, migrations).
- The work is subtle — naming/structural errors would not be caught by Verification commands alone.
- Acceptance Criteria include assertions that require semantic evaluation (e.g., "cost ≥ 12", "no fabricated references").

### When to recommend `no`

- Isolated new-file additions where Verification commands cover the surface.
- CSS-only or purely visual changes.
- Documentation edits.
- Trivial one-line fixes with a regression test.

### Rendering the Exit Gate tasks

Based on the recommendation and the Verification Policy (`Adaptive` by default):

**If `verifier-recommendation: yes`** (or Policy = Always), render the gate as:

```
#### Phase Exit Gate

<!-- verifier-recommendation: yes — [reasoning] -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.
```

**If `verifier-recommendation: no`** (and Policy is not Always), render the gate as:

```
#### Phase Exit Gate

<!-- verifier-recommendation: no — [reasoning] -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.
```

Leave the `Run this phase's independent verification` and `Apply the verification result` tasks out entirely when the recommendation is `no` — don't render them as skipped.

### Hold the gate blocks byte-identical across all three files

Both shapes above are reproduced in `references/questions-mode.md` (which regenerates gates when
Verification Policy changes) and in `templates/plan-base.md` (which the composing model loads).
That is **three files rendering the same instructions**, and every line of them is text an agent
will act on.

**State the invariant over the whole gate block, never over a list of lines.** Plan 013 held the
gate task and the Apply task identical under a criterion that named exactly those six sites. The
**Agent self-review** line was a seventh site that the list did not reach, and it drifted unseen:
by 3.3.0 there were five renderings with five distinct texts, including a `no`-shape line sitting
inside `plan-base.md`'s `yes`-shape gate — so the gate's *last* instruction keyed the `[x]` flip to
the Verification command block while the line above it keyed the flip to the verification's
verdict. A criterion scoped to a list stops at the end of the list.

> **Every line of a rendered Phase Exit Gate is byte-identical across every file that renders it,
> within its shape.**
>
> Two permitted differences, both structural: `questions-mode.md`'s uniform two-space indent
> (its copies sit in fenced blocks nested in list items), and a trailing `*(…)*` annotation in
> `templates/plan-base.md` addressed to the composing model, which never ships into a generated
> plan.

Checkable by `diff`, and not checkable by reading. From `skills/dr-plan/`:

```bash
# Normalisation is PER FILE, matching the exemptions above. A shared normaliser would apply
# plan-base.md's annotation exemption to create-mode.md too — and create-mode.md's block ships
# verbatim into generated plans, so a trailing annotation there is a defect, not an exemption.
cm() { grep -hE "$1" references/create-mode.md; }                             # no exemption
qm() { grep -hE "$1" references/questions-mode.md | sed 's/^ *//'; }          # structural indent
pb() { grep -hE "$1" templates/plan-base.md | sed 's/ \*([^)]*)\*$//'; }      # template annotation

YES='^ *- \[ \] \*\*Agent self-review\.\*\* Re-read Tasks above,'
NO='^ *- \[ \] \*\*Agent self-review\.\*\* Re-read all Tasks above\.'
APPLY='^ *- \[ \] \*\*Apply the verification result\.\*\*'

# Two assertions per line, not one. Identity alone passes when a site is DELETED.
check() { printf 'present %s (want %s) · distinct %s (want 1)\n' \
  "$(wc -l <<< "$1")" "$2" "$(sort -u <<< "$1" | wc -l)"; }

check "$( { cm "$YES";   qm "$YES";   pb "$YES";   } )" 3   # yes-shape self-review
check "$( { cm "$NO";    qm "$NO";                 } )" 2   # no-shape self-review
check "$( { cm "$APPLY"; qm "$APPLY"; pb "$APPLY"; } )" 3   # Apply line
```

Anything other than the wanted counts is drift. **Change a gate line in one file and you change it
in all of them in the same edit** — then run the checks. `refine-mode.md` is a third path that can
write gate text; if it grows a copy, it joins this list.

**Why two assertions.** `sort -u | wc -l` returning 1 means "every rendering that exists agrees."
It says nothing about how many exist, so deleting a site outright passes it. Presence and identity
are different properties and a single number cannot carry both — which is the same shape of error
as a criterion that names six sites when there are seven.

**The `## Inline Verification Rubric` section renders on the same condition, plan-wide.** Include it in the plan header if *any* phase carries the verification task; omit it entirely if none does (every phase `no`, or Policy = Never). It is what branch 2 points at, so a plan carrying the gate task without it would send a falling-back agent to a section that isn't there. Generate it from `references/verification-rubric.md` — everything above that file's `## Report` heading, with headings demoted one level — and **never retype it**; the two must stay verbatim-identical, which is checkable by `diff` and is not checkable by reading.

## Phase 8: Compose the Template

### Load the base

Read `templates/plan-base.md`.

### Apply the overlay (if any)

If an overlay was confirmed in Phase 2, read its file from `templates/plan-[type].md` and apply per that overlay's "Rendering note for CREATE mode" section. Overlays additively describe sections to add, replace, or omit.

### Fill placeholders

Replace the template placeholders:

- `{{PLAN_NAME}}` — a readable name derived from the implementation context (e.g., "Add User Authentication").
- `{{PLAN_NUMBER}}` — the number from Phase 3.
- `{{PLAN_TYPE}}` — `standard-feature`, `ai-feature`, `migration/infra/refactor`, `bug-fix`, or `spike`.
- `{{CURRENT_DATE}}` — today's date (`YYYY-MM-DD`) from conversation context.
- `{{RELATED_PRD}}` — the PRD path (if referenced) or `N/A`.
- `{{TEST_COMMAND}}` / `{{LINT_COMMAND}}` / `{{TYPECHECK_COMMAND}}` — from Phase 5.
- `{{PHASE_1_NAME}}`, `{{PHASE_2_NAME}}`, etc. — concrete phase names.

Populate every section with real content — do not leave bracketed placeholders in a final draft except for genuinely-open items in `Open Questions & Decisions`.

### Emit Completion and Retro sections

Always render these at the bottom of the plan. They are unconditional — every plan has autonomous completion instructions. Do not add a skip flag, do not condition on plan type (even bug-fix plans get them; the retro will be short but may still surface something).

## Phase 9: Derive the Slug

From `{{PLAN_NAME}}`:
- Lowercase.
- Spaces → hyphens.
- Strip punctuation and special characters.
- Keep it short but descriptive.

Example: `Add User Authentication` → `add-user-authentication`.

## Phase 10: Write the File

- Target: `_project/plans/draft/[NNN]-[slug].md` by default, or `_project/plans/in_progress/[NNN]-[slug].md` if `--in-progress` was provided.
- Use `Write` — it creates parent directories as needed.
- If `_project/plans/` does not exist before this write, add a one-line note in the completion summary suggesting the user run `/dr-init` for full scaffolding.

## Phase 11: Completion Summary

Emit:

```
✅ Plan created: _project/plans/[folder]/[NNN]-[slug].md

Plan #[NNN]: [Plan Name]
Plan type: [type]
Related PRD: [path or N/A]

Sections populated: [count]
Phases: [N]
Verification-recommended phases: [N of M]
Blocking questions ([AWAITING]): [count]
Non-blocking questions ([OPEN]): [count]
Uncertain assumptions ([?]): [count]

Verification Policy: Adaptive (default). Change with `/dr-plan @[path] answer questions`.
```

Conditional additions:

- **If any interim phases were emitted**, add:
  ```
  ⚠ Contains [N] interim phase(s): [list of phase names]. DO NOT MERGE before Phase [final restoration phase] completes.
  ```

- **If a plan-type overlay was applied**, add the overlay name on its own line near the top of the summary (e.g., `Overlay: migration/infra/refactor`).

- **If blocking questions exist**, add:
  ```
  Next step: /dr-plan @_project/plans/[folder]/[NNN]-[slug].md answer questions
  ```

- **If no blocking questions**, add:
  ```
  Next step: review the plan, then move to in_progress when ready.
  ```

- **If `_project/plans/` did not exist before this write**, add:
  ```
  Note: Created `_project/plans/` on the fly. Run `/dr-init` for full project scaffolding.
  ```
