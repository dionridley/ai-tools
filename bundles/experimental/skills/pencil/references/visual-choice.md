# Asking With Pixels — Drawing the Choices

When a design decision has genuine alternatives, draw them on the canvas and point the user
at them, instead of describing them in prose. A user in a terminal cannot picture "tighter
grid with a heavier rule" — they can look at two frames side by side.

Requires a bound document ([`preflight.md`](preflight.md)) and the write rules in
[`execute.md`](execute.md).

## When to draw — three tiers

Classify the change explicitly. This is a step, not an instinct: drawing costs a write, a
screenshot, and the user's attention, and doing it for everything is what makes the feature
infuriating rather than useful.

| Tier | What it covers | Action |
|---|---|---|
| **Minor** | Copy text, one colour or spacing token, a rename, a single value | **Never draw.** Do it, or ask in text. |
| **Component** | A reusable element's structure or variants — button, card, nav item; anything used in more than one place | **Draw 2–3 variants and ask.** |
| **Design** | Screen composition, a new screen, information hierarchy, flow between screens | **Draw 2–3 variants and ask.** |

**Cap at three variants.** More options on a canvas the user has to navigate to is worse
than fewer, and every variant is a write that must be cleaned up afterwards.

**Only one open decision per `(session, filePath)`.** If a second decision arises before the
first resolves, resolve or abandon the first. Without this rule the abandonment sweep below
cannot tell a stale frame from one the user is still looking at, and will offer to delete a
live decision.

## Drawing the frame

Place with `FindEmptySpace`, then build one container holding all the variants.

**Always insert the container into `document`, even if `FindEmptySpace` returns a
`parentId`.** The general write guidance says to honour `parentId` — for a decision frame,
override it. The sweep skips children and can only see top-level frames, so a
container nested anywhere else becomes permanently invisible to cleanup: it survives every
sweep and lands in the user's design the first time they save.

```
[decision] <topic>              frame, placeholder: true for its whole life
  ├── "Decision: <topic>"       white text on the dark container fill
  └── Options                   horizontal frame
        ├── A · <label>         frame — label text + the variant itself
        └── B · <label>         frame — label text + the variant itself
```

- **Reserved `[decision] ` name prefix — ASCII, not a decorative Unicode variant.** It is
  how the user finds the frame in a layers panel and how the sweep identifies abandoned
  frames. Do not vary it.

  A `⟦decision⟧` form was tested because distinctive glyphs scan better and need no regex
  escaping. **It renders as tofu** — the default font has no glyph for `⟦`/`⟧`, so the
  canvas showed replacement boxes. ASCII is the choice; the escaping cost is handled below.
  *(Tested on canvas text. Whether the layers panel, which may use a different system font,
  would render it is unverified — but a prefix that breaks anywhere is not worth the risk
  for a cosmetic gain.)*
- **`placeholder: true` for the frame's entire life.** It is always temporary.
- **Dark container fill, white text.** Annotation contrast has to hold in both themes —
  never rely on the canvas colour.
- **Variant labels must exactly match the option labels you will offer.** The user maps
  answer to pixels without translating.

**Key everything by `(filePath, id)`.** Node ids are not unique across documents — `bi8Au`
has been seen in four unrelated files. Capture the name→id map from the `execute`
response immediately; each call runs in its own scope, so an id not captured is an id lost.

## Verify before you send the user anywhere

Two independent checks, and they catch different things.

**1. The `issues detected:` block.** `execute` reports modelled defects itself,
including the classic one:

> `Node 'vtrZY' has no 'fill' set, so the text is invisible.`

Read it every time and fix before proceeding. **This is cheaper and more reliable than a
screenshot for anything the API models.**

**2. One `get_screenshot` of the container.** For everything the API does *not* model:

- **Contrast** — text with a `fill` that happens to match its background passes the issues
  check and is still unreadable.
- **Overlap and clipping** — content escaping or colliding inside the frame.
- **Collapsed layout** — a `fit_content` parent with all-`fill_container` children resolves
  to zero and reports no issue.
- **Variants that aren't actually distinguishable** — the failure that wastes the user's
  trip most reliably, and the one no API check can catch.

The agent looks at this image; the user never needs to. Cap fixes at **two attempts**; if
the frame is still defective, **abandon it** — delete the container, clear the slot, and
tell the user what went wrong. Never send someone to look at a frame you know is broken,
and never leave it sitting on the canvas.

**Refresh the memory anchor after every write in this flow** — the insert, any fix, the
apply, and the delete. `preflight.md` §4 requires it, and a decision round trip performs
four or more writes; skipping it leaves revalidation comparing against a pre-write snapshot.

> **Correction worth carrying:** the original design justified this screenshot on the belief
> that `execute` silently succeeds on invisible text. It does not — it names the node.
> The screenshot still earns its call, but for unmodelled visual defects, not for that one.

## Point the user at it

A frame name alone is useless on an infinite canvas. Emit **all three** elements:

```
Drawn into netflixhouse2.pen — unsaved.
  Frame:    [decision] CTA button style
  Position: x 6360, y 0 — immediately right of "V4 - Editorial Modern", 120px gap
  Options:  A · Solid    (left)
            B · Outline  (right)
```

**Computing the landmark.** Reuse the preflight's probe — the same `execute` + `Get`
top-level walk, which returns geometry **and** names. Find the top-level frame whose box is
nearest the decision frame's origin, and phrase the position relative to it: "immediately
right of X, 120px gap", "directly below Y", alongside the raw coordinates.

Names are what make this navigable — "immediately right of *V4 - Editorial Modern*" is
findable; "right of the node at x=4800" is not. Read the decision frame's *actual* box back
via `ctx.bounds` rather than reusing the size you requested from `FindEmptySpace`; a
`fit_content` frame is usually smaller.

**If the decision frame is in a non-active document, say so** — the user has to switch tabs
before panning, and will otherwise search the wrong canvas.

Then ask, using the harness's structured question tool where one exists and plain text
otherwise, with option labels matching the drawn variant names exactly.

## Resolve: apply first, then delete

**Order is not negotiable.** Deleting the container first destroys the winner along with the
losers.

1. **Apply** the winner to its real destination — `Copy` it into place, or `Update` the
   target element to match.
2. **Delete the whole `[decision]` container.** One `Delete` removes every variant,
   including the winner's copy inside it.
3. **Confirm** via the probe that the container id is gone.
4. **Report** what was applied, and that the document is unsaved.

## Abandonment

**"Abandon" is an action, not a state.** When the user answers "neither", changes topic, or
the fix cap below is hit, do this immediately — do not defer it to the session-end sweep:

1. **Delete the container now.** There is no winner, so apply-then-delete collapses to
   delete. Leaving it on the canvas is the state most likely to be saved over.
2. **Confirm removal** via the probe, as with a normal resolution.
3. **Clear the open-decision slot** for that `(session, filePath)`, so a new decision can
   be raised.

Without an explicit abandon action the slot deadlocks: the one-open-decision rule blocks
any new decision until the current one is "resolved or abandoned", and a frame merely
sitting on the canvas is neither. The same deadlock is reachable from the two-attempt fix
cap — a frame the agent gave up repairing is *not* awaiting an answer, so treat it as
abandoned and delete it rather than sending the user to look at something known-broken.

The session-end sweep below is a **backstop for frames that escaped this**, not the primary
mechanism.

If a decision is genuinely still awaiting an answer, the frame stays on the canvas.

At session end, sweep for top-level frames matching the reserved prefix — **excluding any
decision still awaiting an answer** — list them, and offer to delete. Warn that saving with
one present persists a scratch frame into the real design.

### Rebind before you delete — this is not optional

**A sweep is a delete path, and it must re-run the [`preflight.md`](preflight.md) §3 check
immediately before it, every time.**

The binding you made at the start of the session may no longer hold: Pencil is multiplayer
and the document can be closed underneath you. If it was, the sweep's `execute` silently
reads the **active** document instead — and the "show the user the list first" safeguard
does *not* save you here, because the names that come back are plausible decision-frame
names and nothing in the list reveals which document produced them. You would then `Delete`
by ids sourced from that document, in that document.

So: rebind, then sweep, then **state the bound document by name in the list you show the
user** — not just the frame names.

### The regex trap

```js
execute({ filePath, input:
  'Get((n,c)=>{c.skipChildren();n.name&&n.name.startsWith("[decision] ")&&Print(n.id,"|",n.name)})'
})
```

A plain JavaScript string check. `c.skipChildren()` keeps it to top-level frames, which is
sound only because the decision container is always inserted into `document` (see *Drawing
the frame*).

**A hazard that used to live here is now gone, and it is worth knowing why.** The previous
API swept with a regex pattern parameter, and the reserved prefix is not regex-safe:
`[decision]` is a **character class** matching any single `d`, `e`, `c`, `i`, `s`, `o`, or
`n`. Run unescaped against a real document it matched **every top-level node** — all four of
the user's actual screens — because every name contains one of those letters. A cleanup
routine built the obvious way would have offered to delete the entire design.

`Get` with a visitor takes no pattern, so there is nothing to escape and the bug is not
expressible. **If a pattern-matching read ever returns to the API, re-read this paragraph
before using it for the sweep.**

Two further safeguards, because this operation deletes things:

- **Never delete from a sweep without showing the user the list first**, by name, *and*
  naming the document it came from. The sweep proposes; the user disposes.
- **`c.skipChildren()`** keeps it to top-level frames — sound only because the decision
  container is always inserted into `document` (see *Drawing the frame*). An unbounded walk
  would match nested nodes that merely share the prefix, and on a large document returns an
  enormous response besides.
- **Sweep every document you bound this session**, not just the one you happen to be in.
  The one-open-decision rule is per `(session, filePath)`, so a second document can hold
  its own abandoned frame, and a sweep scoped to one `filePath` will never see it.

## Live verification

Run 2026-07-27 against `netflixhouse2.pen`, open but **not** the active document.

| Step | Result |
|---|---|
| Bind non-active document, then write to it | Correct — every node landed in `netflixhouse2.pen`, none in the active document |
| Insert container + 2 variants, one label deliberately given no `fill` | `issues detected` named node `vtrZY` — caught by the API, *before* any screenshot |
| **Contrast defect** — `#161616` text on a `#141414` frame, `fill` correctly set | `execute` returned clean, **no issues block**. The screenshot showed only the readable label; the second was invisible. **This is the case that justifies the screenshot** — a real defect the API reported as success |
| `Update` the fill, then screenshot | Rendered correctly; both labels legible, variants visually distinct |
| Apply winner, then delete container | Winner survived; container id `uZY0A` absent from the next probe |
| Abandonment sweep, unescaped `[decision]` pattern | Matched **every** top-level node including four real screens — the bug that forced the anchored escaped form |
| Abandonment sweep, `^\[decision\] ` | Matched exactly the intended frame |
| Unicode `⟦decision⟧` prefix | Rendered as tofu on canvas — rejected |
| Clean up, verify | Document back to its original 4 top-level nodes |
| Disk, across all write operations | Size and mtime **unchanged** |

**Two honest notes on this table.**

*Wayfinding.* The `x 6360, y 0 — immediately right of "V4 - Editorial Modern", 120px gap`
message was produced from geometry plus a frame name already in context from an earlier disk
parse — not from the single-probe path this document now prescribes. The probe was
separately confirmed to return names and geometry together for a non-active document, so
both halves are evidenced, but **the combined wayfinding path as specified here has not been
run end to end.** Treat it as sound-by-construction, not as tested.

*Disk.* "Size and mtime unchanged" comes from a `stat`, which the R6 prohibition does not
cover. A one-off parse of file *content* was also run to confirm no residue — that was
verification of the tool's behaviour, performed outside the skill's own operating rules,
and is not something the skill does or should do.
