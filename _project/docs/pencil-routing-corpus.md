# Pencil Skill — Routing Eval Corpus

**Created:** 2026-07-25
**Owns:** plan 012, Phase 1
**Applies to:** `bundles/experimental/skills/pencil/` — the `description` field in `SKILL.md`

This is repo development material, **not skill runtime content**. It must never be
moved into the skill directory: it exists to test the skill, and shipping it would
put a large block of trigger vocabulary into every session that loads the skill.

---

## Why this corpus exists

The `description` field is the entire routing mechanism for this skill. There is no
trigger token, no explicit-invocation gate, no keyword matcher — the model reads the
description and decides. That decision is the highest-risk thing in plan 012, because
**"design" is one of the most overloaded words in software**. A description that fires
on the word alone will fire on schema design, API design, system design, and design
patterns — turning a design-file skill into background noise in every engineering
conversation.

So this corpus is weighted toward the negative case. Getting the skill to fire is easy.
Getting it to stay quiet is the work.

## The fire/no-fire asymmetry

**A miss and a false fire are not symmetric costs, and the thresholds below reflect that.
Do not "helpfully" relax the negative gate to raise positive coverage.**

- **A Tier 2 or authoring-time miss** degrades into the fail-closed preflight *when the
  skill fires later in the session on a clearer prompt*. The agent reaches a Pencil step
  with no declared target, refuses to guess, and stops with a clear message. The user is
  mildly inconvenienced. Nothing is corrupted.
- **A Tier 1 miss is NOT benign, and an earlier version of this document wrongly said it
  was.** The fail-closed preflight lives *inside* this skill. If the skill never fires,
  there is no preflight. A miss on `Update the button styles in design/onboarding.pen`
  means some generic path handles that file instead — a `Read`, a `Grep`, or worst of all
  a hand-edit, which is precisely what R6 forbids and what corrupts structure the editor
  owns. **That is why Tier 1 is a 100% hard gate.** It is not derivable from the
  miss-is-cheap argument; it is its own argument.
- **A false fire** injects a design-file skill into unrelated engineering work. It wastes
  context, it makes the bundle feel undisciplined, and if it happens while someone is
  authoring a plan about a database migration it will ask them for a `.pen` path that does
  not and should not exist. Repeated, it teaches the user to ignore the skill — which
  silently disables the one mechanism protecting them from the `filePath` fallback.

The two-layer design in `pen-skill-info.md` §5.2 is what makes the *Tier 2* asymmetry
acceptable: best-effort detection there, fail-closed preflight at execution. That argument
covers Tier 2 and authoring-time only. It does not extend to Tier 1, where the skill not
firing means the protection does not exist at all.

## Thresholds

| Set | Expected | Threshold | Gate |
|---|---|---|---|
| Tier 1 — explicit | fire | **100%** | hard |
| Tier 2 — visual design, tool unstated | fire | **≥ 80%** | soft |
| Authoring-time | fire | **≥ 80%** | soft |
| Negative | **no-fire** | **0 false fires** | **hard** |

A single false fire on the negative set blocks the phase and sends the description back
for retuning. Missing a soft threshold is recorded and may be accepted with a written
rationale in the results table.

## Eval method

For each prompt:

1. Present a judge with the candidate `pencil` description **alongside 3–4 decoy skill
   descriptions** drawn from this repo (`frontend-design`, `react-19`, `mvp`, `dr-plan`).
   Decoys matter — a judge shown one description in isolation is being asked "is this
   related?", which is a much weaker question than "which of these, if any, applies?".
2. Ask which skill(s), if any, it would invoke for the prompt. Allow "none".
3. Record fire / no-fire for `pencil` in the results table.

Run judges as parallel subagents where the harness supports it; otherwise evaluate
sequentially in-session against the same corpus. Either way the judge must see only the
descriptions — never the skill body, and never this file's expected-outcome column.

### Execution rules — required for a reproducible result

These exist because without them the same corpus and the same description can produce
different verdicts, which makes any recorded number meaningless.

1. **One uniform evaluation context for every set.** State to every judge, verbatim:
   *"You are an AI coding assistant working in a software repository. The repo contains
   application code, a `design/` directory, and some `.pen` design files."* This satisfies
   Tier 2's amplifier requirement **without** conditioning positives more favourably than
   negatives. Never state context to one set and not another — that inflates positive
   rates and deflates false-fire rates by construction.
2. **Prefer parallel subagents.** Sequential in-session runs leak: once one prompt's
   framing is in context it colours later judgements, and a stipulation stated for one set
   is still in scope when a later set contradicts it.
3. **Shuffle and strip.** Judges receive prompts unlabelled and mixed across sets. Never
   present a batch under a heading like "Tier 1 positives" or "Negatives", and never let a
   batch be all-positive or all-negative — a batch of one kind primes the answer.
4. **Seed positive controls** into any re-run batch. If a known-good prompt stops firing,
   the batch is biased and its negatives cannot be trusted either.
5. **Every decoy a prompt names must be present.** If a prompt contains a literal skill
   token, that skill must be in the decoy set, or the prompt tests the decoys rather than
   the candidate. See the `P3.7` failure note.
6. **Rounding:** thresholds are evaluated as `passes / total ≥ threshold`, no rounding in
   the candidate's favour. 12 items at ≥80% requires 10. 7 items requires 6.
7. **Hedged answers count as a fire.** If a judge says "pencil, if there's a `.pen` file in
   the repo", record it as fired. The uniform context already stipulates that there is.
8. **Single run per revision is the accepted cost**, and its weakness is stated rather than
   hidden: every threshold is one sample against a stochastic judge. Treat a result within
   one prompt of a threshold as unresolved rather than passing.

**Re-run this corpus whenever the description changes.** It is a regression suite, not a
one-time gate; plan 012 runs it in Phase 2 (drafting) and again in Phase 6 (final).

---

## Set 1 — Tier 1 positives (explicit)

Pencil is named outright, by file extension, product name, or MCP tool name. These must
fire every time; a miss here means the description is broken, not merely imprecise.

| # | Prompt | Expected |
|---|---|---|
| P1.1 | Update the button styles in `design/onboarding.pen` | fire |
| P1.2 | Open `par-v1.pen` and add a settings screen | fire |
| P1.3 | Can you tweak the spacing on that card in Pencil? | fire |
| P1.4 | I'm using pen.dev for this project — add a pricing card component | fire |
| P1.5 | Use `batch_design` to insert a new frame at the bottom of the canvas | fire |
| P1.6 | Run `snapshot_layout` on the checkout design and tell me the structure | fire |
| P1.7 | Export the hero frame as a PNG with `export_nodes` | fire |
| P1.8 | What can the pencil.dev MCP server actually do with my design files? | fire |
| P1.9 | There's a `.pen` file in this repo — add a nav bar to it | fire |
| P1.10 | Take a screenshot of the empty-state frame in the Pencil app | fire |
| P1.11 †| Use `batch_get` to pull the top-level frames from the checkout design | fire |
| P1.12 †| Can `export_html` give me Tailwind markup from that screen? | fire |
| ~~P1.13~~ †| ~~What does the Pencil MCP integration expose to an agent?~~ | **RETIRED → `N4.39`** |
| P1.14 †| Use the Pencil MCP tools to list the frames in the login screen | fire |

† **Held-out** — added after the description was tuned (see *Held-out sets* below).
`P1.11`–`P1.13` close enumerated-vocabulary gaps: the task called for the MCP tool names,
but `batch_get` and `export_html` appeared nowhere in the original set, and no prompt used
the literal string "Pencil MCP". `batch_get` is the most generically-named of the nine
tools and sits behind a 100% hard gate, so its absence was the sharpest of the three.

## Set 2 — Tier 2 positives (visual design work, tool unstated)

The user is unmistakably doing visual design work but has not named the tool. This is
where the skill earns its keep — and where over-firing starts to become a risk, so the
threshold is soft rather than hard.

**Two evaluation rules specific to this set.** Both exist because Tier 2 is the only set
whose designed behaviour is conditional, and a judge given no context cannot infer either.

1. **Judge these as if a Tier 3 amplifier is present** — the repo contains `.pen` files.
   `pen-skill-info.md` §5.2 makes Tier 2 conditional: *Tier 2 + any Tier 3 → require;
   Tier 2 alone → ask once.* Evaluating these prompts in a context with no amplifier would
   be testing behaviour the skill is not designed to have. State the assumed context to
   the judge.
2. **Co-firing with `frontend-design` is a pass, not a false fire.** "Mock up a dashboard
   layout" can legitimately mean both a `.pen` mockup and a React implementation; the two
   skills address different layers. The pass criterion for this corpus is `pencil`'s own
   fire/no-fire, never exclusivity.

| # | Prompt | Expected |
|---|---|---|
| P2.1 | Add a screen for the password reset flow | fire |
| P2.2 | Mock up a dashboard layout for the admin area | fire |
| P2.3 | Create a wireframe for the checkout flow | fire |
| ~~P2.4~~ | ~~Restyle the nav to match the new brand colours~~ | **RETIRED → `N4.37`** |
| P2.5 | Update the design system tokens for dark mode | fire |
| ~~P2.6~~ | ~~Build out the component library — start with buttons and inputs~~ | **RETIRED → `N4.38`** |
| P2.7 | The artboard for the mobile view needs a tighter grid | fire |
| P2.8 | Lay out the pricing page with three tiers | fire |
| P2.9 | Make a visual spec for the empty states | fire |
| P2.10 | Redesign the onboarding screens | fire |
| P2.11 | Match the mockup the designer sent over | fire |
| P2.12 | Add a new frame on the canvas for the error state | fire |
| ~~P2.13~~ †| ~~Build a clickable prototype of the signup flow~~ | **RETIRED → `N4.40`** |
| P2.14 †| Write the style guide for our typography scale | fire |
| P2.15 †| Re-skin the settings screen for the new brand | fire |
| P2.16 †| Prototype the checkout screens as wireframes | fire |
| P2.17 †| Restyle the onboarding mockup to match the new brand | fire |
| P2.18 †| Mock up the component library — buttons, inputs, and cards | fire |

### Paired contrasts — the same term on both sides

`P2.16`–`P2.18` exist because a term-presence check found `prototype`, `restyle`, and
`component library` listed as detection vocabulary while the **only** corpus prompts
containing them (`N4.40`, `N4.37`, `N4.38`) all expected **no-fire**. That looked like the
skill claiming vocabulary the corpus contradicted.

It was not. The corpus was testing only half of each term. These three prompts pair against
their negatives to test the actual rule — *an artifact must be implied* — rather than the
word:

| Fires (artifact implied) | Silent (code work) |
|---|---|
| `P2.16` Prototype the checkout screens **as wireframes** | `N4.40` Build a **clickable** prototype of the signup flow |
| `P2.17` Restyle the onboarding **mockup** for the new brand | `N4.37` Restyle **the nav** to match the new brand colours |
| `P2.18` **Mock up** the component library | `N4.38` **Build out** the component library |

All six were judged in a single batch by one judge and separated correctly. **Keep them
paired.** Retiring or editing one side without the other destroys what they measure, and
returns the corpus to the state where a term-presence check reads as passing.

**Lesson for the vocabulary-alignment check itself:** verify by *expected outcome per
prompt*, never by asking whether a term appears in both files. Term presence passes exactly
when a term has been kept in the vocabulary while its expected behaviour moved to the
opposite value — which is the drift the check exists to catch.

† **Held-out.** The task enumerated `prototype` and `style guide` as Tier 2 vocabulary but
neither word appeared in any prompt — and the shipped description has since *added*
"style guides" to its noun list, so it was claiming vocabulary the corpus never tested.

## Set 3 — Authoring-time positives

A planning document is being written and it involves visual design work. These must fire
**even though no `.pen` file is named** — that is the entire point of `pen-skill-info.md`
R4: the target must be captured while a human is still present to answer.

The set deliberately mixes prompts that name a planning skill with prompts that do not.
The skill routes on the *activity* of authoring a planning document, so both forms must
work, and a description that only fires on the harness-specific form is broken.

| # | Prompt | Expected |
|---|---|---|
| P3.1 | Write a plan for redesigning the onboarding screens | fire |
| P3.2 | Draft a PRD for the new dashboard layout | fire |
| P3.3 | Write an implementation plan for the mobile app's visual refresh | fire |
| P3.4 | Create a spec for the settings screen redesign | fire |
| P3.5 | Put together a task list for updating all the marketing page layouts | fire |
| P3.6 | `/dr-plan` rebuild the component library and roll it out across every screen | fire |
| P3.7 | `/dr-prd` a design system for the customer portal | fire |

## Set 4 — Negatives (the hard gate)

**Largest set in the corpus, by design.** Four categories, each a distinct way the
description can go wrong. Any fire here is a phase-blocking failure.

### 4a — Non-visual senses of "design"

The dominant failure mode. "Design" in software usually means architecture, not pixels.

| # | Prompt | Expected |
|---|---|---|
| N4.1 | Design the database schema for multi-tenant orgs | **no-fire** |
| N4.2 | Let's design the API surface for the webhooks feature | **no-fire** |
| N4.3 | I need a system design for the job queue | **no-fire** |
| N4.4 | This design pattern doesn't fit — refactor to a strategy pattern | **no-fire** |
| N4.5 | Design a retry policy for the payment processor | **no-fire** |
| N4.6 | The schema design here is denormalised on purpose — document why | **no-fire** |

### 4b — Plan authoring with no design content

Set 3 fires on *authoring + visual design*. If the description fires on authoring alone,
it will surface on every plan and PRD in the repo. These prove the conjunction holds.

| # | Prompt | Expected |
|---|---|---|
| N4.7 | Write a plan for the auth refactor | **no-fire** |
| N4.8 | Draft a PRD for SSO support | **no-fire** |
| N4.9 | Create an implementation plan for migrating to Postgres 17 | **no-fire** |
| N4.10 | `/dr-plan` add rate limiting to the public API | **no-fire** |

### 4c — Design metaphors

Drawing and sketching verbs applied to non-visual objects. Natural English, no canvas
anywhere in sight.

| # | Prompt | Expected |
|---|---|---|
| N4.11 | Sketch out the endpoints we'll need for the sync service | **no-fire** |
| N4.12 | Let's whiteboard the data flow between the services | **no-fire** |
| N4.13 | Draw up a rollout timeline for the release | **no-fire** |
| N4.14 | Map out how the queue drains under backpressure | **no-fire** |

### 4d — Terminology traps

Three unrelated projects use the `.pen` extension (`pen-skill-info.md` §9). A description
keyed on the extension alone will fire on all of them, and the Pencil MCP tools cannot
read any of their files.

| # | Prompt | Expected |
|---|---|---|
| N4.15 | How do I compile a `.pen` file with pen-lang? | **no-fire** |
| N4.16 | Does open-pencil support importing from Figma? | **no-fire** |
| N4.17 | I found `ZSeven-W/openpencil` — can it read my design files? | **no-fire** |
| N4.18 | The `.pen` files in this repo are Kiwi-encoded — write a decoder | **no-fire** |

**N4.18 is the hardest prompt in the corpus and is deliberately kept in the hard gate.**
It stacks a Tier 1 signal (`.pen` files) and a Tier 3 amplifier (in this repo) against a
single disambiguating word (`Kiwi-encoded` — open-pencil's format, not pencil.dev's plain
JSON). Only a description carrying the §9 disambiguation can catch it.

Its failure mode is benign, which is worth knowing when weighing a Phase 2 rationale: if
it fires, the agent points MCP at a Kiwi binary, the preflight fingerprint fails to parse
it as JSON, and the session aborts before any write. It costs a wasted turn, not a
corrupted design. A false fire here is therefore the least damaging in the set — but it is
still the clearest possible signal that the description's disambiguation is too weak, and
that weakness would show up elsewhere less visibly.

**`N4.17` carries the same unfairness and previously carried no annotation.** *"I found
`ZSeven-W/openpencil` — can it read my design files?"* contains the Tier 1 word `pencil`
as a substring of "openpencil" **and** the phrase "my design files", which is this skill's
literal object. It is arguably a legitimate Pencil question — a user asking whether another
editor can read *their* `.pen` documents is asking about their Pencil documents. Kept in
the gate for the same reason as `N4.18`, and annotated here so the unfairness is visible
rather than latent. `N4.16` is a milder form of the same thing.

### 4e — Frontend implementation in code (held-out) ⚠ the gap that mattered

**This category did not exist in the original corpus, and its absence made the hard gate
unable to see the risk the rev-2 description introduced.** Rev 2 added a clause telling the
model to co-fire alongside frontend skills for ambiguous UI work. None of categories 4a–4d
is UI-implementation work, so a description that fired on *all* UI work — including pure
code — would have scored 18/18 and lost nothing.

Every prompt here names its medium explicitly (React, Tailwind, CSS, stylesheet), so none
is "UI work that could be either". They are definitively code, and a correctly-scoped
description must stay silent.

| # | Prompt | Expected |
|---|---|---|
| N4.19 †| Implement the dashboard UI in React | **no-fire** |
| N4.20 †| Style the nav bar with Tailwind | **no-fire** |
| N4.21 †| Make the pricing page responsive with CSS media queries | **no-fire** |
| N4.22 †| Fix the card component's spacing in the stylesheet | **no-fire** |
| N4.23 †| Build the React button component with size and tone variants | **no-fire** |

### 4f — Meta / self-referential (held-out)

Prompts *about* the skill, the plan, or this repo. They say "pencil" and ".pen" constantly
and involve zero design work. Anyone building or maintaining this skill types dozens of
them, so a description that fires here produces exactly the background noise the corpus
exists to prevent.

| # | Prompt | Expected |
|---|---|---|
| N4.24 †| Add a section to plan 012 about the preflight | **no-fire** |
| N4.25 †| Update the routing corpus doc with the new results | **no-fire** |
| N4.26 †| Bump experimental to 0.11.0 for the pencil skill | **no-fire** |
| N4.27 †| Write the CHANGELOG entry for the pencil skill | **no-fire** |

### 4g — Other design tools (held-out)

Visual design nouns, tool this skill cannot touch. Sharpened by `P2.11` ("match the mockup
the designer sent over") being a positive.

| # | Prompt | Expected |
|---|---|---|
| N4.28 †| Pull the tokens out of the Figma file | **no-fire** |
| N4.29 †| Sync the Sketch library with our repo | **no-fire** |
| N4.30 †| Open the XD prototype and list the screens | **no-fire** |

### 4h — Real drawing, wrong medium (held-out)

Category 4c covers drawing verbs applied to *non-visual* objects. It never tested genuine
visual artifacts that simply aren't `.pen` files.

| # | Prompt | Expected |
|---|---|---|
| N4.31 †| Add an architecture diagram to the README | **no-fire** |
| N4.32 †| Draw the sequence diagram in Mermaid | **no-fire** |

### 4i — `pen` homographs and compounds (held-out)

| # | Prompt | Expected |
|---|---|---|
| N4.33 †| Run a pen test against the staging API | **no-fire** |
| N4.34 †| Make a CodePen demo of this animation | **no-fire** |

### 4j — Compound: authoring × non-visual design (held-out)

Strictly harder than 4a or 4b alone, and the most likely real-world trap for a description
that must fire on "authoring **+** visual design" but not on either half by itself.

| # | Prompt | Expected |
|---|---|---|
| N4.35 †| Write a plan for redesigning the database schema | **no-fire** |
| N4.36 †| Draft a PRD for the API redesign | **no-fire** |

---

## Set 5 — Boundary: medium-ambiguous UI, no artifact named

**Scored separately from the negative hard gate. This is deliberate and the reason matters.**

Scope decision (2026-07-26, by the skill's owner): *fire only when a design artifact is
implied.* A prompt describing UI work in a repo containing both `.pen` files and application
code, naming no medium and no artifact, should leave the skill silent. The cost is typing
"in Pencil" when you mean Pencil; the benefit is that the negative gate protecting against
mis-targeted writes stays strong.

These four were Tier 2 positives until that decision. They are **not** rescued failures —
their measured behaviour never changed; the expectation moved to match a rule chosen
deliberately, and every one is re-measured under its new status below.

| # | Prompt | Was | Expected | Runs observed |
|---|---|---|---|---|
| N4.37 | Restyle the nav to match the new brand colours | `P2.4` | **no-fire** | 3/3 no-fire ✅ |
| N4.38 | Build out the component library — start with buttons and inputs | `P2.6` | **no-fire** | 2/3 no-fire ⚠ **unstable** |
| N4.39 †| What does the Pencil MCP integration expose to an agent? | `P1.13` | **no-fire** | 2/2 no-fire ✅ |
| N4.40 †| Build a clickable prototype of the signup flow | `P2.13` | **no-fire** | 2/2 no-fire ✅ |

### Why this set is not in the hard gate

**`N4.38` flipped.** It stayed silent in two independent runs, then fired in a third with the
judge reasoning *"'component library' is ambiguous between shipped components and a canvas
design system, and pencil applies alongside frontend work"* — and marking itself uncertain.
Same prompt, same description, different verdict.

That instability is **data about the domain, not a defect in the description.** "Component
library" is a genuine design-artifact noun; it appears in the shipped description's own list
alongside `design systems` and `style guides`. The prompt sits exactly on the line the scope
decision drew, and competent judges land on both sides of it.

The structural lesson, which is the point of this section: **a 0-tolerance hard gate must
contain unambiguous cases, or the gate measures judge variance rather than description
quality.** Putting a coin-flip prompt behind a "zero false fires" bar guarantees the bar
fails roughly a third of the time regardless of how good the description is — and a gate
that fails for reasons the author cannot act on gets ignored, which is worse than not having
it. Boundary prompts belong in a set that is *tracked and reported*, not one that blocks.

**What would move `N4.38` into the hard gate:** tightening the description to exclude
"component library" absent an artifact. Not done, because `P2.14` (*"write the style guide
for our typography scale"*) and `P2.5` (*"update the design system tokens for dark mode"*)
are near-neighbours that currently fire correctly, and the wording that separates them from
`N4.38` is finer than a description can reliably carry.

**Reporting rule:** report Set 5 with the main results, never folded into the negative
total. A drift from 3/4 to 1/4 here is a real signal about description drift even though it
does not block.

---

## Held-out sets

Prompts marked † were written **after** the description had already been tuned against the
original corpus, and were never used to iterate it. That distinction is what makes them
worth more than the rest of this file.

The problem they solve: the rev-2 description enumerates the original corpus's own
disambiguators almost verbatim — *"sketching/whiteboarding non-visual things (endpoints,
data flows, timelines)"* maps one-to-one onto `N4.11`/`N4.12`/`N4.13`, and *"Not for
pen-lang or open-pencil"* onto `N4.15`–`N4.17`. A description can score 18/18 by listing
the eighteen answers without generalising at all. Held-out prompts like *"map out the retry
ladder"*, *"run a pen test"*, or *"bump experimental to 0.11.0"* are not in that list, so
they measure whether the description actually generalises.

**Rule: never tune the description against a held-out prompt.** If a held-out prompt fails
and the description is changed to fix it, that prompt is burned — move it into the tuning
set and write a fresh held-out replacement. Otherwise the held-out set silently decays into
another training set, which is how this corpus got into trouble the first time.

---

## Set sizes

| Set | Tuning | Held-out † | Active | Gate | Plan 012 minimum |
|---|---|---|---|---|---|
| Tier 1 positives | 10 | 3 | 13 | 100% hard | 8 ✅ |
| Tier 2 positives | 10 | 5 | 15 | ≥80% soft | 10 ✅ |
| Authoring-time positives | 7 | 0 | 7 | ≥80% soft | 5 ✅ |
| Negatives | 18 | 18 | 36 | 0 false fires, hard | 12 ✅ |
| Set 5 — boundary | 2 | 2 | 4 | tracked, non-blocking | n/a |
| **Total active** | | | **75** | | |

Counted programmatically from the prompt tables, not by hand — an earlier version of this
table said 71 because the Tier 2 row was never updated when `P2.15`–`P2.18` were added, and
a figure derived from it reached the shipped CHANGELOG before verification caught it.
Retired ids (`P1.13`, `P2.4`, `P2.6`, `P2.13`) are excluded from every count.

Three prompts were retired from Tier 2 and one from Tier 1 into Set 5 by the 2026-07-26
scope decision; retired ids are struck through in place rather than deleted, so the
regression history stays traceable and ids never get reused.

Negatives remain the largest set (36 of 75, 48%), as the asymmetry above requires — and
half of them are held out, so the hard gate measures generalisation rather than
enumeration.

---

## Live confirmation run — 2026-07-27

Judge batches approximate routing. This is the only measurement of the real thing: prompts
typed by a human into cold Claude Code sessions, with the skill auto-discovered.

| Prompt | Corpus ref | Expected | Result |
|---|---|---|---|
| What can the pencil.dev MCP server actually do with my design files? | `P1.8` | fire | **inconclusive** ⚠ |
| Bump experimental to 0.11.0 for the pencil skill | `N4.26` | no-fire | **silent** ✅ |
| Create a wireframe for the checkout flow | `P2.3` | fire | **fired** ✅ |
| Style the nav bar with Tailwind | `N4.20` | no-fire | **silent** ✅ |
| Design the database schema for multi-tenant orgs | `N4.1` | no-fire | **silent** ✅ |
| Draft a PRD for the new dashboard layout | `P3.2` | fire | **fired** ✅ |

**Five conclusive, five matching, zero false fires.** The three negatives span the three
highest-frequency false-fire risks for this skill in this repo — meta/self-referential,
frontend-implementation, and non-visual "design" — and all held.

**Do not cite this run as the negative gate.** Only **one** of the three negatives ran cold
(prompt 2); the skill was already loaded in context for the other two, so those measure
discrimination-with-rules-visible, not routing. Cold-routing negative evidence here is
**n=1**. The 36/36 corpus result is what carries the negative gate; this run corroborates
it and no more.

**The Tier 1 live slot is unfilled.** Prompt 1 *was* the Tier 1 positive and came back
inconclusive, so there is currently **no conclusive live evidence that a Tier 1 prompt
routes** — only Tier 2 (prompt 3) and authoring-time (prompt 6). A future run should
substitute an actionable Tier 1 prompt (e.g. *"Use the Pencil MCP tools to list the frames
in the login screen"*, `P1.14`) whose signal is behavioural rather than informational, and
run it somewhere the skill's source is absent.

### Two limits on what this run proves — read before citing it

**1. It ran inside the repo containing the skill's source, which confounds informational
prompts.** `P1.8` asks what the MCP server can do — answerable by grepping and reading
`SKILL.md` as an ordinary file, no invocation needed. The transcript showed a search and two
file reads, consistent with either. **Routing is only cleanly measurable in a repo that does
not contain the skill.** Every future live run should happen elsewhere. The judge batches in
this corpus avoid the problem entirely by exposing descriptions and no filesystem.

**2. Once the skill loads it stays in context, so later prompts measure a different thing.**
Prompts 4 and 5 ran after the skill had loaded, so they test *"with every rule visible, does
the model correctly decline"* rather than *"does the description surface it"*. Both passed —
prompt 4's agent stated the scope rule unprompted ("Tailwind styling is implementation, not
a design artifact") — but that is discrimination, not cold routing. **Restart between
prompts** for a clean read; the run above did so before the final prompt only.

### What the two positives demonstrated beyond routing

`P2.3` refused to guess a target, caught that the active document lay outside the working
tree and demanded permission (**R3's first live exercise** — earlier testing used synthetic
path strings only), applied the new-file trap, and stated the corruption vector against the
user's actual open documents rather than in the abstract.

`P3.2` ran the whole authoring-time path: fired on plain English with no command token,
cited the Tier 3 amplifier to justify escalating, emitted the capture block and lint warning
to spec, and used the `dismissed: true` field. It also declined to invoke a token-gated
planning command on the user's behalf — while the skill itself named no other skill at all.

---

## Results

Populated in plan 012 Phase 2 (description drafting) and re-run in Phase 6 (final
confirmation). One row per revision of the description.

### Revision log

| Rev | Date | Description change | Tier 1 | Tier 2 | Authoring | Negatives | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-25 | Initial draft: visual-design nouns, authoring clause, non-visual negative clause, §9 disambiguation. | 10/10 (100%) | 8/12 (67%) | 5/7 (71%) | **18/18 — 0 false fires** | Hard gates PASS, **both soft gates FAIL** |
| 2 | 2026-07-25 | Added the co-application clause — *"Applies whenever a design artifact is wanted rather than shipped code, and applies alongside frontend implementation skills for UI work that could be either."* Added `page layouts` and `style guides` to the noun list. | 10/10 (100%) | **10/12 (83%)** | **7/7 (100%)** | **18/18 — 0 false fires** | ALL GATES PASS *(on the pre-expansion corpus — see rev 3)* |
| 3 | 2026-07-26 | **No description change.** Same rev-2 wording, re-measured against the expanded corpus (+23 held-out prompts, +5 negative categories). This row exists to separate "the description changed" from "the instrument got honest". | **12/13 (92%)** ❌ | **11/14 (79%)** ❌ | 7/7 (100%) ✅ | **36/36 — 0 false fires** ✅ | **TWO GATES FAIL** — Tier 1 hard gate broken, Tier 2 soft gate missed by one prompt |

| 4 | 2026-07-26 | **No description change.** Scope decision applied (fire only when a design artifact is implied): three medium-ambiguous Tier 2 prompts reclassified to Set 5. `P1.13` retired as internally inconsistent with category 4f, replaced by held-out `P1.14` testing the same vocabulary actionably. Every reclassified prompt re-measured under its new status. | **13/13 (100%)** ✅ | **11/11 (100%)** ✅ | 7/7 (100%) ✅ | **36/36 — 0 false fires** ✅ | **ALL GATES PASS** · Set 5 boundary 3/4, `N4.38` unstable |

| 5 | 2026-07-27 | **No description change.** Added held-out `P2.15` ("Re-skin the settings screen for the new brand") after a programmatic check found `re-skin` was claimed as detection vocabulary by the skill but tested by no prompt — the same claimed-but-untested class the Phase 1 verifier found for `batch_get`, `export_html`, `prototype`, `style guide`. | 13/13 (100%) ✅ | **12/12 (100%)** ✅ | 7/7 (100%) ✅ | 36/36 — 0 false fires ✅ | ALL GATES PASS · Set 5 boundary 3/4 |

`P2.15` fired (co-firing with `frontend-design`, which is a pass). The batch also re-ran two
controls and four negatives spanning three categories — all held.

**Rev 3 is the result that matters, and it is worse than rev 2 because the instrument
improved, not because the skill regressed.** The description is byte-identical across rev 2,
3, and 4 — every number that moved, moved because the measurement changed. Rev 4 is not a
better description than rev 3; it is the same description scored against a scope rule that
was decided deliberately and applied consistently.

**Read rev 4 with rev 3 beside it.** Rev 4's clean sweep is only meaningful because rev 3
recorded what failed before the scope decision was taken. A reader who sees only rev 4 would
reasonably suspect the categories were drawn around the results; rev 3 is the evidence that
the results were measured first, reported as failures, escalated, and only then relabelled.

**The good news is the part that was previously unmeasurable.** Category 4e —
frontend-implementation-in-code — was the structural blind spot: rev 2's co-application
clause was written to induce co-firing on ambiguous UI work, and no negative in the old
corpus could detect over-widening along that axis. It now measures clean. `Implement the
dashboard UI in React` → `frontend-design` + `react-19`. `Style the nav bar with Tailwind`
→ `frontend-design`. `Build the React button component with variants` → `react-19` +
`frontend-design`. **`pencil` stayed silent on all five.** The clause bought Tier 2 coverage
without leaking into code work, which is exactly what could not be confirmed before.

All 18 held-out negatives passed, including both meta prompts (`bump experimental to
0.11.0`, `write the CHANGELOG entry` — prompts saturated with the word "pencil" and
containing no design work), both compound authoring × non-visual prompts, and all three
rival design tools. Negatives now stand at **36/36 across ten categories**, half of them
never used for tuning.

Rev 2 re-tested all 18 tuning-set negatives (10 in the mixed re-run batches, 8 in a
dedicated regression batch), so the hard gate is measured under the shipped wording rather
than inherited from rev 1. **Four** positive controls (`P1.1`, `P1.5`, `P2.3`, `P2.10`)
were seeded into the re-run batches and all fired, confirming the batches were not simply
biased toward "none".

**Shipped rev-2 text, recorded verbatim so "shipped == tested" is checkable:**

> Work with Pencil (pen.dev / pencil.dev) `.pen` design files via the Pencil MCP tools —
> reading, editing, or building visual on-canvas designs: screens, page layouts, mockups,
> wireframes, artboards, frames, components, design systems, style guides. Applies whenever
> a design artifact is wanted rather than shipped code, and applies *alongside* frontend
> implementation skills for UI work that could be either. Also use when authoring a plan,
> PRD, spec, or task list involving that visual design work, to capture the target `.pen`
> file while a human is present to name it. Requires visual design on a canvas — NOT
> database or API design, system design, design patterns, or sketching/whiteboarding
> non-visual things (endpoints, data flows, timelines). Not for pen-lang or open-pencil,
> unrelated projects sharing the `.pen` extension.

**Batch composition** (all judges received the identical uniform context in Execution rule
1; no set was conditioned more favourably than another):

| Batch | Rev | Prompts | Pos/Neg |
|---|---|---|---|
| A | 1 | P1.1, P1.7, P2.1, P2.7, P3.1, N4.1, N4.7, N4.13 | 5/3 |
| B | 1 | P1.2, P1.8, P2.2, P2.8, P3.2, N4.2, N4.8, N4.14 | 5/3 |
| C | 1 | P1.3, P1.9, P2.3, P2.9, P3.3, N4.3, N4.9, N4.15 | 5/3 |
| D | 1 | P1.4, P1.10, P2.4, P2.10, P3.4, N4.4, N4.10, N4.16 | 5/3 |
| E | 1 | P1.5, P2.5, P2.11, P3.5, P3.7, N4.5, N4.11, N4.17 | 5/3 |
| F | 1 | P1.6, P2.6, P2.12, P3.6, N4.6, N4.12, N4.18 | 4/3 |
| G | 2 | P2.4, N4.7, P2.6, N4.11, P3.5, N4.1, P2.8, N4.13, **P1.1** | 4/5 |
| H | 2 | P2.11, N4.8, P3.7, N4.12, N4.9, N4.2, N4.10, N4.14, **P2.3** | 3/6 |
| I | 2 | N4.3, **P1.5**, N4.4, N4.15, N4.5, **P2.10**, N4.16, N4.6, N4.17, N4.18 | 2/8 |

Bold entries are seeded controls. Rev-2 batches G–I added `dr-prd` to the decoy set after
the `P3.7` finding below.

### Per-prompt results — rev 3 (shipped rev-2 wording, expanded corpus)

Every prompt matched its expected outcome **except the four listed below**. All 36
negatives and all 7 authoring-time prompts matched. A future re-run should diff against
this list.

| # | Prompt | Set | Expected | Actual | Pass |
|---|---|---|---|---|---|
| P1.13 †| What does the Pencil MCP integration expose to an agent? | Tier 1 | fire | none | ❌ |
| P2.4 | Restyle the nav to match the new brand colours | Tier 2 | fire | `frontend-design` only | ❌ |
| P2.6 | Build out the component library — start with buttons and inputs | Tier 2 | fire | `frontend-design` only | ❌ |
| P2.13 †| Build a clickable prototype of the signup flow | Tier 2 | fire | `frontend-design` only | ❌ |

**Held-out batch composition** (rev 3): J = `P1.11, N4.19, N4.24, P2.13, N4.28, N4.31,
N4.33, N4.35, **P1.1**` · K = `P1.12, N4.20, N4.25, P2.14, N4.29, N4.32, N4.34, N4.36,
**P2.3**` · L = `P1.13, N4.21, N4.26, N4.22, N4.30, N4.23, N4.27, **P2.10**`. Bold =
seeded control; all three controls fired.

### Per-prompt results — rev 4 (same wording, post-scope-decision)

Batch M re-measured every reclassified prompt under its new status, plus the `P1.13`
replacement, with three seeded controls. `M = P1.14, N4.37, **P2.3**, N4.38, N4.39, N4.40,
**P1.1**, **P2.2**`.

| # | Prompt | Set | Expected | Actual | Pass |
|---|---|---|---|---|---|
| P1.14 †| Use the Pencil MCP tools to list the frames in the login screen | Tier 1 | fire | `pencil` | ✅ |
| N4.37 | Restyle the nav to match the new brand colours | Set 5 | no-fire | `frontend-design` | ✅ |
| N4.38 | Build out the component library — start with buttons and inputs | Set 5 | no-fire | **`frontend-design`, `pencil`** | ❌ |
| N4.39 †| What does the Pencil MCP integration expose to an agent? | Set 5 | no-fire | none | ✅ |
| N4.40 †| Build a clickable prototype of the signup flow | Set 5 | no-fire | `frontend-design` | ✅ |

All three controls fired. `P1.14` closes the Tier 1 vocabulary gap `P1.13` was written for,
without `P1.13`'s meta-prompt contradiction — *"Use the Pencil MCP tools to…"* is an
actionable request against a named screen, so it tests the literal string in the register a
user would actually type it.

**`N4.38` is the one failure, and it sits in Set 5 rather than the hard gate** — see that
section for why a prompt that flips between identical runs cannot serve behind a
zero-tolerance bar. Recorded as a tracked instability, not a passed test.

### Failure notes

**Rev 1 → rev 2: one cause, four symptoms.** All four rev-1 Tier 2 misses (`P2.4`, `P2.6`,
`P2.8`, `P2.11`) routed to `frontend-design` *exclusively*. Independent judges consistently
treated design-file work and frontend-implementation work as mutually exclusive, so an
ambiguous UI prompt went to whichever skill sounded more like shipping. Nothing in rev 1's
wording said the two could co-apply — the corpus asserted it as an evaluation rule but the
description never told the model. Adding the co-application clause fixed `P2.8` and `P2.11`
outright, and fixed `P3.5` as a side effect (the authoring clause became easier to reach
once the "design artifact vs shipped code" frame was explicit).

**`P3.7` was a method artifact, not a description failure.** In rev 1 the judge replied
that "`/dr-prd` is not among the five skills listed" — the decoy set omitted `dr-prd`, so
the judge reasoned about the missing skill instead of evaluating `pencil`. Added `dr-prd`
to the decoy set for rev 2, where it passed. **Lesson for future re-runs: the decoy set
must contain every skill a prompt explicitly names, or the prompt tests the decoys rather
than the candidate.**

**`P2.4` and `P2.6` remain open, and may be mislabelled rather than missed.** Both failed
under both revisions, with independent judges giving the same reasoning: *"restyling web UI
in code"* and *"'component library' reads as shipped code, not a canvas artifact"*. That
reading is defensible — in a repo full of application code, "restyle the nav" most
naturally means CSS, and neither prompt names a canvas, a file, or a design artifact.

**They were deliberately not chased.** Widening the description far enough to capture them
would mean firing on generic UI-styling language, which is the shortest path to breaking
the negative gate — and the expanded negative set now proves that gate is load-bearing, not
decorative. `N4.20` (*"style the nav bar with Tailwind"*) is a near-neighbour of `P2.4`
(*"restyle the nav to match the new brand colours"*), separated only by whether a medium is
named. Any wording that captures `P2.4` almost certainly captures `N4.20` too.

---

## Rev 3 failure notes

**`P1.13` broke the Tier 1 hard gate, and the prompt contradicts this corpus's own rules.**
*"What does the Pencil MCP integration expose to an agent?"* was written to close the
"literal string `Pencil MCP` is never tested" gap. In closing it, it became a prompt
**about** the skill rather than a request to do design work — which is the definition of
negative category 4f (meta / self-referential), added in the same revision. By this
document's own definitions `P1.13` is simultaneously a Tier 1 positive and a 4f negative.
The judge's reasoning — *"informational, no design artifact being read or built"* — is
consistent with 4f and with `N4.26` / `N4.27`, which it correctly declined.

Contrast `P1.8` (*"What can the pencil.dev MCP server actually do with my design files?"*),
which fired in every run: same informational framing, but a concrete design object.
"…with my design files" is doing the work.

**This is recorded as a FAILED HARD GATE, not resolved by reclassification.** Reclassifying
a prompt because it failed is the exact move this corpus exists to prevent, and the
temptation is strongest when the fix looks principled. The internal inconsistency is real
and should be repaired — but repairing it is a decision to be taken deliberately and
re-measured, not a footnote that quietly converts a failure into a pass. **Proposed repair,
pending adjudication:** retire `P1.13`, and replace it with an *actionable* prompt using
the same literal string — e.g. *"Use the Pencil MCP tools to list the frames in the login
screen"* — as a fresh held-out prompt. Until that is measured, Tier 1 stands at 12/13.

**`P2.13` missed, and it is burned either way.** *"Build a clickable prototype of the signup
flow"* → `frontend-design` only; the judge read "clickable prototype" as working code.
Defensible: in design tools a clickable prototype is linked frames, in engineering it is a
working demo. The word `prototype` came from the §5.2 vocabulary list, but adding
*"clickable"* biased it toward code — a prompt-authoring flaw, not a description flaw.
Per the held-out rule, it may not be edited to pass and may not be used to tune the
description. It stays a recorded miss.

**The three Tier 2 misses share one property, and that is the real finding.** `P2.4`,
`P2.6`, and `P2.13` are all prompts where **the medium is genuinely ambiguous and no design
artifact is named**. Independent judges across three separate runs read all three as
shipped code. That is not three wordsmithing failures; it is one boundary question about
what this skill is for, and it cannot be settled by editing a description:

> When a user says "build out the component library" in a repo containing both `.pen` files
> and application code, and names no medium — should a design-file skill volunteer?

Answer "yes" and Tier 2 passes, but the description must fire on bare UI-styling language,
which endangers the 36/36 negative gate. Answer "no" and the negative gate stays strong,
but `P2.4`/`P2.6`/`P2.13` are mislabelled and belong in a new "medium-ambiguous, no artifact
named" category scored separately. **This is a product decision about the skill's scope, not
a measurement problem, and it is referred upward rather than settled by the author of both
the prompts and the description.**
