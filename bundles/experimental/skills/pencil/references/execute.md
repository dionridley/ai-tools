# Writing to the Canvas — `execute`

Everything here assumes the preflight in [`preflight.md`](preflight.md) has already bound
the document. Never write before binding.

## Get the schema and the API docs first

Call `get_app_state({ include_schema: true, include_canvas_design: true })` before any
`execute` work when you don't already have them. It returns the authoritative `.pen`
TypeScript schema plus the full `execute` API documentation. The format is versioned and the
vendor ships quickly — do not write from memory.

The other two flags (`include_scripts_and_shaders`, `include_browser`) are opt-in; leave
them off unless the task needs them. All four are required parameters, so pass `false`
explicitly.

## Read the response. Always.

`execute` returns three things that matter:

**A name→id map** for every node created. Capture it immediately — you cannot read node
properties back outside the call, so this map is the handle you get.

**Whatever you `Print`ed.** `Print` is the only way data leaves an `execute` call. Each
argument is emitted raw if it's a string, JSON otherwise. **Values printed by a *failed*
call are not returned**, so a call that errors gives you nothing rather than partial output.

**An `## issues detected:` block, when something is wrong.** This is not decoration — the
call still reports `OK`, and the issues are listed underneath:

```
## issues detected:
- Node 'vtrZY' has no 'fill' set, so the text is invisible. Set a 'fill' to make the text visible.
```

**Fix every issue in the next call before doing anything else.** Verified live: a text node
inserted with no `fill` was caught and named by the API. Do not assume silence means
success — read the block.

## The API

Mutations: `Insert`, `Copy`, `Update`, `Replace`, `Move`, `Delete`, `SetVariables`,
`Generate`. Reading: `Get`, `GetVariables`. Placement: `FindEmptySpace`. Output: `Print`.

`document` is the predefined root. Targets are always id or path **strings** — never a node
object; when holding a node from `Get`, pass its `.id`.

## The gotchas that actually bite

These are properties of the `.pen` format, not of the tool, and they survived the API change
unchanged.

- **Text has no `fill` by default and renders invisible.** Always set it. Emoji too. The
  issues block catches this one, but catching it costs a round trip you can skip.
- **Never place text, icons, shapes, or cards directly in `document`.** Root children are
  screen frames, reusable component frames, and major containers only. Wrap annotations in
  a frame.
- **It is not CSS.** No percentages, no `margin`, no `calc()`, no `alignItems: stretch` or
  `baseline`. Check the schema before using any property; if it is not in the schema it is
  not supported and will error.
- **`layout` and `padding` exist only on `frame`.** Not on text, not on shapes.
- **`x`/`y` are ignored under a flex parent** unless the node sets
  `layoutPosition: "absolute"`.
- **Sizing sentinels** are `fit_content` and `fill_container`, optionally with a fallback:
  `fit_content(100)`.
- **Text sizing follows `textGrowth`:** `auto` (default — single line, ignores width),
  `fixed-width` (width required, wraps), `fixed-width-height` (both required). Never guess
  text dimensions.
- **Circular sizing collapses to zero.** A `fit_content` parent whose children are all
  `fill_container` has no size to resolve from. Common cause of an empty-looking frame.
- **Set a human-readable `name` on every node.** It is how the name→id map is keyed.
- **Never set `id`.** Pencil generates them and will override yours.
- **New or copied root frames carry `placeholder: true` while under construction**, cleared
  as soon as that frame is finished — not held until every frame is done.
  **Exception: a `[decision]` container keeps `placeholder: true` for its entire life**
  ([`visual-choice.md`](visual-choice.md)) — it is temporary by definition and never
  "finished", so the flag is never cleared.
- **Each call runs in its own scope.** Local variables *and helper functions* are not shared
  between calls. Persist across calls by assigning *without* `const`/`let`:
  `myNode = Insert(...)`.
- **But you cannot *read* a bare identifier that doesn't exist yet.** `k = (k || 0) + 1`
  throws `ReferenceError: 'k' is not defined` and rolls the whole call back — the
  bare-assignment trick creates a global on write, it does not make reads safe. Inside a
  single call use a normal `let`; across calls, assign before you read.
- **Errors roll back the entire call**, including any globals it created. A partial batch
  never lands, so prefer several focused calls over one large one.

## Placement

Use `FindEmptySpace({ width, height, padding })` when you do not have exact coordinates. It
returns `{x, y, parentId?}` — insert into `parentId` when present, otherwise `document`.

**The reserved region is not the resulting size.** A `fit_content` frame sizes to its
contents: a request for 900×420 produced a frame measuring 476×266. Use the returned `x`/`y`
for placement, then read the actual box back with `Get` if you need it — for a wayfinding
message, for instance.

## Annotation contrast

When adding annotations, put white text on an **explicit dark backing frame** rather than
relying on the canvas colour. Contrast then holds in both light and dark themes. A text node
with a `fill` that happens to match its background passes the issues check and is still
unreadable — the API models "no fill", not "poor contrast".

## Reading structure back

`Get` is the read path, and it lives *inside* `execute`. Three shapes:

```js
Get(id, {depth: 1})                    // one node, children nested
Get(id, visit, options)                // visit a subtree
Get(visit, options)                    // visit the whole document
```

**Always bound the walk.** `Get(visit)` descends the entire document by default — on a
130-frame file that is an enormous response. For top-level structure, call
`ctx.skipChildren()` on every visited node:

```js
Get((n,c)=>{c.skipChildren();Print(n.id,"|",n.name,"|",c.bounds.width)})
```

`ctx.bounds` gives resolved bounds in the parent's coordinate space — the same space as the
node's `x`/`y`, so it feeds straight back into `Update`. `ctx.problems` flags clipped nodes.
Use those rather than guessing at layout.

Reach for `get_screenshot` only when visual fidelity is the question. See
[`visual-choice.md`](visual-choice.md) for what a screenshot catches that the issues block
does not.

## Nothing you write reaches disk

Every mutation — `Insert`, `Copy`, `Update`, `Replace`, `Move`, `Delete`, `SetVariables`,
`Generate` — changes the app's in-memory document only. There is no save operation anywhere
on the MCP surface. Measured across four consecutive writes: the `.pen` file's size and
mtime were unchanged throughout, and the inserted frames never appeared in the file.

Report accordingly (R5). Never say "written to `<path>`".

---

## Note on the API change

This file was originally written against `batch_design`, which was replaced by `execute`
mid-build, along with `get_editor_state` → `get_app_state` and the separate read tools
(`batch_get`, `snapshot_layout`, `get_variables`) folding into `execute`'s `Get` and
`GetVariables`.

**Every behavioural finding transferred intact** — the silent `filePath` fallback,
memory-only writes, id collisions, the self-reported issues block. Only the call sites
changed. If the surface moves again, expect the same: retarget the calls, keep the rules.

The retargeted probe was re-verified live against a 130-frame document: the
`Get` + `skipChildren` + `Print` form returns `id | name | x y width height` per top-level
node, which is everything binding and wayfinding need from a single call.
