# Capturing the Target While a Human Is Still Here

A plan, PRD, or spec is being written, and it implies design work. **No MCP call happens in
this mode.** The job is to get the target `.pen` path *into the document now*, because by
the time that document executes there is nobody to ask.

## Why this exists at all

Plans run unattended. Pencil silently substitutes the active document when handed a file it
hasn't opened. Those two facts together are how the wrong design gets edited with nobody
watching.

The preflight fails closed at execution, so the damage is prevented either way — but a plan
that reaches a Pencil step with no declared target can only *stop*. The one moment the
question "which `.pen` file?" is cheap is while the document is being written, with a human
present. That moment is here.

## The ownership boundary — read this before changing anything

**This skill knows what plans are. Planning tools never learn what Pencil is.** Knowledge
flows specific → general, and this file is where that direction is enforced.

Three rules, none negotiable:

1. **Never modify a planning workflow to look for Pencil.** A general plan-authoring tool
   that grows a Pencil branch will grow a Figma branch, a Terraform branch, and a
   migrations branch after it. The generality is the whole value; spend it once and it's
   gone.
2. **Never test for another skill's existence.** Skills are descriptions surfaced by a
   model, not modules with a stable presence API. Names change, users fork them, they can
   be directory-scoped. A presence check is a guess dressed as a dependency.
3. **Never name a specific planning tool anywhere in this skill.** Detection keys on the
   *activity* — a plan, PRD, spec, or task list being authored — so it works with any
   planning tool, with someone else's, or with a plain markdown file written by hand. It
   degrades to "doesn't fire", never to "errors".

If a planning tool should *enforce* something, the only form that belongs in a general tool
is one true of every tool: *any step that mutates external state the document cannot itself
identify must declare an explicit, resolvable target.* That catches Pencil, the database,
the S3 bucket, and the Jira project equally — and contains no Pencil knowledge. Even that
is not this skill's to add.

## Detection

Tiered by confidence, and the bias runs in two directions that must not be conflated:

- **Within design work, bias toward asking.** A miss degrades into a run-time stop; asking
  once costs a sentence. Where it is genuinely unclear *which* `.pen` file, ask.
- **At the boundary of design work, bias toward silence.** The scope filter below is not a
  tie-breaker to be leaned past. A plan about database migrations that gets asked for a
  `.pen` path teaches the user to ignore the question, which disables the whole mechanism.

In short: liberal about *which target*, strict about *whether this is design work at all*.

### Tier 1 — explicit. Always require a target.

- A literal `.pen` filename or path anywhere in the document
- The words `pencil`, `pen.dev`, `pencil.dev`, "Pencil MCP"
- Named MCP tools, current or historical: `execute`, `get_app_state`, `get_screenshot`,
  `export_html`, `export_nodes` — and the superseded `batch_design`, `batch_get`,
  `get_editor_state`, `snapshot_layout`, `get_variables`. **Keep the old names.** Someone
  writing a plan from memory or from older notes will use them, and the intent is identical.
- A reference to this skill

### Tier 2 — visual design work, tool unstated.

Nouns: design, mockup, wireframe, prototype, screen, page layout, artboard, frame, canvas,
design system, style guide, component library, visual spec.

Verbs applied to those nouns: design, mock up, lay out, restyle, re-skin, redesign, update
the design. Phrases: "add a screen", "new page layout", "update the design system", "match
the mockup".

**Apply the same scope rule the runtime routing uses: a design *artifact* must be implied.**
A plan step describing UI work in a repo containing both `.pen` files and application code,
naming no medium and no artifact, is code work and does not require a design target —
*"make the pricing page responsive"*, *"tidy up the header spacing"*.

**The scope filter runs first, before the resolution table below.** A step that fails it is
not Tier 2 at all, so no amplifier can promote it. Without that ordering, "make the pricing
page responsive" in a repo containing `.pen` files would be Tier 2 + Tier 3 → require, and
detection would demand a design target for work that is purely code.

**The vocabulary above is not self-interpreting, and the same word falls on both sides.**
The term is not the trigger; the artifact is.

| Fires — an artifact is implied | Does not — code work |
|---|---|
| "Prototype the checkout screens as wireframes" | "Build a clickable prototype of the signup flow" |
| "Restyle the onboarding mockup for the new brand" | "Restyle the nav to match the new brand colours" |
| "Mock up the component library" | "Build out the component library" |

Detection and routing must not drift apart. **If one changes, change both — and verify by
expected outcome per corpus prompt, never by checking that a term appears in both files.** A
term-presence check passes precisely when a term has been kept in the vocabulary while its
expected behaviour moved to the opposite value, which is the drift it was meant to catch.

### Tier 3 — contextual amplifiers. Raise sensitivity; never sufficient alone.

- The repo contains any `.pen` files — **listing filenames is permitted.** R6 prohibits
  reading `.pen` *content*; a glob that never opens a file is outside it.
- A `design/`, `designs/`, or `_designs/` directory exists
- The Pencil MCP server is connected in the current session
- The source PRD already carries a design target — **check only if the document being
  authored names its source.** Do not go looking; there is no location to look in.
- A previous document in the same series carried one — **same condition.** The path to
  completed documents is deliberately not specified here, because specifying it would mean
  encoding one planning tool's directory layout, which rule 1 forbids.

The last two are **no-ops unless the document hands you the address.** That is the
ownership boundary and detection sensitivity pulling against each other, and the boundary
wins: an unlocatable amplifier costs a little sensitivity, whereas hardcoding a layout
costs the skill its portability. Since *any* Tier 3 signal suffices and the first three are
cheaply checkable, the resolution rule stays executable.

### Resolution rule

| Signal | Action |
|---|---|
| Tier 1 | **Require** a target |
| Tier 2 **+** any Tier 3 | **Require** a target |
| Tier 2 alone | **Ask once.** Accept "not a Pencil task" as a dismissal |
| Tier 3 alone | Nothing. Amplifiers are never sufficient |

**A dismissal must be recorded in the document**, not just in the conversation, so it is
never asked again — including by a different agent on a later pass.

## What to capture

A design block in the plan or PRD. **Per phase** when a document touches several designs —
one global target is wrong for a multi-design plan.

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

**`exists:` carries more weight than it looks, and the preflight consumes it.** At execution
the fallback fires *identically* for an unopened file and a nonexistent one, and the
preflight reads nothing from disk that would distinguish them. With `exists: false`
recorded here, a run-time failure can state plainly that the file was never created; without
it, the best available message offers both possibilities and asks. `preflight.md` §5 branches
on exactly this.

*Not* the only conceivable way to tell them apart — a path-existence `stat` would also do it,
and `stat` sits outside R6's prohibition on reading `.pen` content. The preflight simply
chooses not to touch the filesystem at all. This field is what makes that choice free.

**Recording a dismissal.** "Not a Pencil task" needs a durable form, or a later agent
re-asks. Use the same block, so there is one place to look:

```yaml
design:
  tool: pencil
  dismissed: true
  reason: "UI work is code-only; no design artifact involved"
```

A `design` block with `dismissed: true` and no `target` means *asked and answered* — never
re-ask, and never emit the lint warning below.

## The new-file trap

**MCP cannot create a `.pen` file.** `execute` only mutates a document the app already
has open, and pointing `filePath` at a non-existent path triggers the silent fallback — so
"create a new design" via MCP will quietly edit whatever is active instead.

A document that creates a new design must therefore choose **at authoring time**:

- **`create_via: cli`** — headless `pen` writes a real file; or
- **`create_via: user-opens-it`** — an explicit human step in the plan ("create/open `X.pen`
  in Pencil") that must complete before the agent step runs.

Record the decision. Never let it be discovered at run time, when neither option is
available.

## The question, asked once

When detection fires and no target is present, ask concretely — and include *why*, because a
design tool demanding a file path before a line of the plan is written is otherwise baffling:

> This plan includes design work in Pencil ("add the onboarding screen"), but no `.pen` file
> is specified. Because plans can run unattended — and Pencil silently falls back to
> whichever design is active when given a file it doesn't have open — I need the target up
> front.
>
> 1. **Existing file** — give me the path
> 2. **New file** — give me the path to create, and whether the CLI creates it or you'll
>    open it in Pencil
> 3. **Not a Pencil task** — I'll record that and stop asking

## Lint, don't block

At authoring time, a document that mentions design work but carries no `design:` block gets
a **warning, not a failure**. The user may simply be mid-draft.

Embed it in the document itself, so it survives to whoever runs it:

> ⚠ This plan references design work but declares no `design.target`. A Pencil step will
> fail closed rather than guess.

The hard failure belongs at execution, not here.

## The two-layer contract

**Best-effort detection here; fail-closed preflight at execution.** That pairing is what
makes imperfect heuristics acceptable — a detection miss degrades into a *stop*, never a
corruption.

Build both. Rely on neither alone. Detection that thinks it is the guarantee will be tuned
too aggressively; a preflight that assumes detection caught everything will be too trusting.

## Why PRDs matter, though they never execute

Plans inherit from them. A target captured once at the PRD stage seeds every plan derived
from it, and removes the question from all of them. It is the cheapest possible place to
answer it.
