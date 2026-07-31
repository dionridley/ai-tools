---
name: pencil
description: "Work with Pencil (pen.dev / pencil.dev) `.pen` design files via the Pencil MCP tools — reading, editing, or building visual on-canvas designs: screens, page layouts, mockups, wireframes, artboards, frames, components, design systems, style guides. Applies whenever a design artifact is wanted rather than shipped code, and applies *alongside* frontend implementation skills for UI work that could be either. Also use when authoring a plan, PRD, spec, or task list involving that visual design work, to capture the target `.pen` file while a human is present to name it. Requires visual design on a canvas — NOT database or API design, system design, design patterns, or sketching/whiteboarding non-visual things (endpoints, data flows, timelines). Not for pen-lang or open-pencil, unrelated projects sharing the `.pen` extension."
compatibility: "Requires the Pencil MCP server, with the pen.dev desktop app running and the target `.pen` file open in it. Without those tools, report unavailability — never fall back to hand-editing `.pen` files. Otherwise harness-neutral: uses the harness's structured question tool where one exists and plain text elsewhere."
disable-model-invocation: false
---

# Pencil (pen.dev) Design Files

Read and edit `.pen` design documents through the Pencil MCP tools, and capture the
design target when a planning document that implies design work is being written.

This skill is defensive to a degree that looks excessive until you know why. One
behaviour is responsible for nearly all of it.

## The behaviour everything here exists to contain

`filePath` is a parameter on `execute`, `get_screenshot`, `export_html`, and `export_nodes`
— schema-**required** on `execute`, while its own description calls it optional. That makes
it look authoritative.
It is not.

| Situation | Behaviour |
|---|---|
| The file is **open** in the app (active or not) | Routes correctly to that document ✅ |
| The file is **not open** | **Silently returns the active document** — no error, no warning ⚠ |

Writes behave exactly like reads. So an agent told to edit `checkout.pen` — which nobody
opened — will read and write `homepage.pen` instead, and **the transcript will read as
complete success**. Nothing surfaces the mistake. That is the failure this skill is built
to make impossible.

Two consequences that shape every rule below:

- **You cannot discover what is open.** `get_app_state` returns only the *active*
  document, and no tool lists open tabs. The file set is always an input, never an
  inference.
- **MCP writes never reach disk.** `execute` mutates the app's in-memory document
  only; the `.pen` file is byte-identical after a write. Anything watching files sees
  nothing. *(Measured: a document edited via MCP and then left untouched for 12 minutes
  with the app running never flushed — no timer autosave over that window. Focus-change and
  quit behaviour were not exercised, so keep reporting edits as unsaved and asking the user
  to save, which is correct either way.)*

## Modes

**Design work** — reading or editing a `.pen` document. Always begins with the preflight
in R2. Never begins by guessing a target. Write rules, the `execute` gotchas, and why you
must read the `issues detected:` block on every response:
[`references/execute.md`](references/execute.md).

**Visual choice** — a design decision has genuine alternatives. Draw 2–3 of them on the
canvas in a reserved `[decision]` frame, verify them, point the user at the frame *by name
and canvas position*, then apply the winner and delete the frame. Minor changes are never
drawn; component- and design-level changes are. Tiers, the wayfinding format, and the
apply-then-delete ordering: [`references/visual-choice.md`](references/visual-choice.md).

**Authoring-time capture** — a plan, PRD, spec, or task list is being written and it
implies design work. No MCP call happens in this mode. The job is to capture the target
`.pen` path into the document *now*, while a human is present to answer, because by the
time the document executes nobody is there and the only available action is to fail.
Detection tiers, the capture block, the new-file trap, and the ownership boundary that
keeps this logic out of general planning tools:
[`references/authoring-time.md`](references/authoring-time.md).

## Mandatory operating rules

R1–R6 each map to a directly verified failure mode. R7 is precautionary — whether several
MCP clients can drive one app at once has not been tested, so it is a bound on risk rather
than a measured limit. None is optional.

### R1 — Resolve the target explicitly, always

Never let `filePath` be implicit or inherited. Every tool call states its target. With no
target, stop and ask. Do not guess, and do not fall back to "whatever is active".

### R2 — Prove you reached the right document before writing

`get_app_state` is **not** a valid target check. It reports the *active* editor, so
asserting on it fails precisely when you are correctly editing a non-active file. This is
the most tempting mistake available, because the tool looks purpose-built for the job.

Use a positive identity check instead, before the **first write** to any document:

The failure has one shape: an unopened `filePath` silently returns the **active**
document. So the question to answer is *"am I looking at the active document when I didn't
ask for it?"* — and that is settled entirely inside MCP.

1. `target` = the explicit path, normalised. `active` = active editor path from
   `get_app_state`, normalised.
2. If `active == target` → routing is trivially correct. **Bind.** Stop here.
3. Otherwise probe both — target and active — with one `execute` call each:

   ```js
   execute({ filePath: <path>, input:
     'Get((n,c)=>{c.skipChildren();Print(n.id,"|",n.name,"|",c.bounds.x,c.bounds.y,c.bounds.width,c.bounds.height)})'
   })
   ```

   **`c.skipChildren()` is mandatory** — without it `Get` walks the whole document, which
   on a 130-frame file is an enormous response to a question about top-level structure.
4. **Identical responses → ABORT.** Either the target isn't open and you are seeing the
   fallback, or it is a byte-identical copy. Indistinguishable from here; fail closed.
5. **Different → bind**, and cache the target probe as the memory anchor.

The probe returns **`name`** alongside geometry, which makes the abort message diagnosable
("I was handed frames named 'Hero', 'Pricing' — those belong to the active document") and
supplies the names wayfinding needs. `get_app_state` also previews the active document's
top-level nodes, so step 3 can often skip the second probe — see the fast path in
[`references/preflight.md`](references/preflight.md).

**Never use a disk read as the check.** It goes stale on your first write, it cannot
distinguish a duplicated file, and every fresh `.pen` has the same single default frame.
This procedure needs nothing from the filesystem.

Revalidate against the **anchor**, never against disk, and refresh the anchor after each of
your own writes. Re-run the full check if a call returns something you cannot account for —
Pencil is multiplayer and documents can close underneath you.

**A mismatch has several causes; say the right one.** Never tell a user their file isn't
open when it is. Cause table, the full procedure, the rejected alternatives with evidence
against each, and the binding-report format: [`references/preflight.md`](references/preflight.md).

### R3 — Confirm before touching a file outside the working tree

If the resolved `.pen` sits outside the repo or folder currently being worked in, stop and
ask which file is meant before any mutation. Reads are fine; writes are not. Unattended,
this is a failure, not a prompt.

A developer working in one repo with a design from another repo open is the exact setup
where a mis-targeted write does invisible damage, and the silent fallback makes it likely
rather than theoretical.

Compare paths by normalising separators to `/`, resolving to absolute, and comparing
case-insensitively. Never encode a platform-specific root.

### R4 — Capture the target when the document is written, not when it runs

When this skill runs inside a plan, batch, or scheduled job, the target `.pen` path is a
**required input collected before execution starts**. The enforcement point is therefore
document-authoring time — the one moment the question is cheap.

If execution reaches a Pencil step with no declared target: **fail the step with a clear
message.** Do not proceed against the active document. Unattended plus silent fallback is
exactly how the wrong design gets edited with nobody watching.

### R5 — Never claim a file was written

MCP edits are in-memory. The phrase "written to `<path>`" is forbidden. Report as:

> Applied to the open document `tron_panel.pen` — unsaved. Save in Pencil to persist.

### R6 — Do not Read or Grep `.pen` files as a matter of course

The Pencil MCP server states that `.pen` files are encrypted. That claim is factually
wrong — they are plain JSON, and public ones are indexed as readable text by code search.
Honour the guardrail as an *operational* rule anyway: these are large minified documents
the editor owns, agents should not pull them into context, and hand-editing corrupts
structure the editor maintains.

**There is no exception.** An earlier draft carved one out for identity verification; it was
removed once the MCP probe proved it supplies everything that oracle was for — including
names — from live state. Disk additionally goes stale on your first write, so it reports
mismatches on documents you are correctly connected to.

Reading a `.pen` is legitimate only for tooling *outside* an agent session — a diff
renderer, a viewer. Never while doing design work, and never hand-edit.

### R7 — One agent per document

There is no merge story. If two agents must touch one file, serialise them.

## Node identity

Node IDs are **not unique across files** — `bi8Au` has been observed as a top-level id in
four unrelated documents, carrying an identical name ("Frame") and geometry (800×600 at
0,0) each time. It is the default frame every new `.pen` starts with, so this is a
deterministic artifact of document creation rather than a collision.

Key everything by `(filePath, id)`. Never use ID existence alone as a routing check, and
never treat a single matching node as proof of identity — compare whole responses.

## Why this skill is description-routed

This skill is surfaced by its `description` alone. It has no trigger-token gate — no rule
that the user must type a literal `/pencil` for it to apply.

That is a deliberate departure from the safer convention of gating explicit-invocation
skills behind a literal token, and it should not be "fixed" back. The reason is R4: the
skill has to notice while a planning document is being *authored* that the document
implies design work, so it can capture the target while a human is still present. A token
gate would require the user to already know this skill exists and to invoke it by name —
which is precisely the knowledge they lack at the moment it matters.

The cost is that routing is a heuristic, and heuristics miss. That is acceptable **only**
because of the two-layer design: best-effort detection at authoring time, backed by the
fail-closed preflight in R2 at execution time. A detection miss degrades into a *stop*,
never a corruption. Build on both; rely on neither alone.

Detection lives here and nowhere else. Knowledge flows specific → general: this skill
knows what plans and PRDs are; general planning tools never learn what Pencil is. Do not
add a Pencil branch to a general planning workflow, and do not test for another skill's
presence — skills are descriptions surfaced by a model, not modules with a stable
presence API.
