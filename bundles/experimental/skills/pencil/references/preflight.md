# Preflight — Binding to the Right Document

Run this before the **first write** to any document in a session. It is the only thing
standing between an agent and silently editing the wrong design.

Reads are safe before binding. Writes are not.

**This procedure never touches the filesystem.** Everything it needs comes from MCP.

## 1. Resolve the target (R1)

The target is always explicit — from the user, or inherited from a plan/PRD `design.target`
block. Never inferred, never "whatever is active".

- No target, human present → **stop and ask.**
- No target, unattended → **fail immediately**, naming what was needed. Do not proceed
  against the active document.

Normalise first: separators to `/`, resolve to absolute. Never encode a drive letter, a
POSIX root, or any platform-specific path in a decision.

## 2. Outside-the-working-tree check (R3)

If the resolved `.pen` sits outside the repo or folder currently being worked in:

- Human present, and not explicitly pre-authorised → **ask which file is meant, before any
  mutation.** Reads are fine.
- Unattended → **fail.**

> The design I'd be editing (`.../Downloads/xd-presentation.pen`) is outside the repo we're
> working in (`.../repos/acme/web`). Is that the file you want me to change, or did you
> mean one in this repo?

Use the user's real absolute paths when actually asking — the elision above is only so this
file encodes no platform-specific root.

A developer working in one repo with a design from another open is exactly the setup where
a mis-targeted write does invisible damage, and the silent fallback below makes it likely
rather than theoretical.

**Comparison rule.** Normalise both paths to `/`, resolve to absolute, compare
case-insensitively.

**Be clear about which way this errs, because the intuitive answer is backwards.** The test
is *containment* — "is the target inside the working tree?" — and "inside" is the branch
that **skips** the prompt. Case-insensitivity *widens* what counts as inside, so it can only
ever cause **fewer** prompts, never more. On a case-sensitive volume (Linux, case-sensitive
APFS) `/home/u/Repos/acme/web/x.pen` and `/home/u/repos/acme/web` are genuinely different
directories, and this comparison wrongly treats the file as inside and stays silent.

It is chosen anyway because Windows and default APFS are case-insensitive, where a
case-*sensitive* comparison would fire the prompt constantly on paths that are in fact the
same directory — and prompt fatigue is what makes users stop reading prompts. On a
case-sensitive volume, prefer an exact comparison. Do not "simplify" this back without
reading this paragraph.

## 3. Prove you reached the right document (R2)

### The failure has exactly one shape

Point `filePath` at a file the app has **not opened** and it silently returns the **active**
document — no error, no warning. So the only question worth answering is:

> *Am I being handed the active document when I didn't ask for it?*

That is answerable entirely inside MCP, by comparing two readings from the same live source.

### Why `get_app_state` cannot answer it alone

It reports the **active** editor. Asserting that it equals your target fails precisely when
you are correctly editing a non-active document — the common case this skill exists to
support. It is the most tempting wrong answer available, because the tool looks
purpose-built for the job. Confirmed live: opening two extra documents changed nothing in
its output — it still reported one active editor.

It is not useless, though. It supplies the *active path*, which the check needs, plus a
preview of that document's top-level nodes **with names** — which the fast path below uses.

### The probe

One call, used for both sides of the comparison:

```js
execute({ filePath: <path>, input:
  'Get((n,c)=>{c.skipChildren();Print(n.id,"|",n.name,"|",c.bounds.x,c.bounds.y,c.bounds.width,c.bounds.height)})'
})
```

**`c.skipChildren()` is mandatory.** Without it `Get` walks the entire document — on a
130-frame file that is an enormous response for a question about top-level structure. The
default is the expensive direction; make it cheap explicitly.

`Print` is what returns the data: each argument raw if a string, JSON otherwise, one line
per node. Values printed by a *failed* `execute` call are not returned, so a probe that
errors gives you nothing rather than partial results.

### The check

```
1. target = <explicit, normalised path>
2. state  = get_app_state()  ->  active editor path (normalised) + its top-level
                                 nodes, name-annotated, capped at ~10

3. If active == target:
       Routing is trivially correct — there is no other document it could be.
       BIND. Skip the comparison; comparing a document against itself would be
       trivially "identical" and would wrongly ABORT at step 6.

4. probe_target = the probe above, against target.

   FAST PATH: compare probe_target's first nodes against the node list
   get_app_state already gave you for the active document.
       differ  -> the target resolved to a genuinely distinct document. BIND.
       match   -> inconclusive; that list is truncated. Continue to 5.

5. probe_active = the same probe, against the active path. Compare in full.

6. If the two are identical:
       ABORT. Either the target is not open and you are seeing the fallback, or it
       is a byte-identical copy that IS open. Indistinguishable from here — fail closed.

   Else: BIND. Cache probe_target as the memory anchor (§4).
```

The fast path usually settles it in **two calls**, because two genuinely different documents
rarely agree on their first ten top-level nodes. The third call is only needed when they do.

### Live evidence, all three branches

- **Target open but not active** → returned its own four frames, differing from the active
  document's. **BIND**. Correct.
- **Target never opened** → returned the *active* document's frames under the *active*
  document's names, not the ones in the requested file. **ABORT**. Correct, and the names
  make the reason legible in the message.
- **Target is the active document** → step 3 → **BIND** without comparison.

**Re-confirmed after the API changed.** The tool surface moved mid-build:
`get_editor_state` → `get_app_state`, `batch_design` → `execute`, and the separate read
tools folded into `execute`'s `Get`. The fallback did not move with it — an `execute` call
naming a `.pen` the app had never opened returned ~130 frames belonging to the active
document, no error, no warning.

Worth knowing beyond this skill: **the hazard is a property of the app's document dispatch,
not of any particular tool.** When the surface next changes, expect the call sites to break
and this behaviour to survive.

### Rules for the comparison

- **Compare the responses whole.** Both sides come from the same source, so every field is
  meaningful — `id`, `name`, `type`, geometry, `fill`, `layout`.
- **Lengths must match first.** Comparing element-wise over the shorter list turns a
  truncated response into a false match.
- **Never substitute a weaker check.** Node *count* and single-node *existence* both pass on
  genuinely different documents: two files here have 5 top-level nodes each and both open
  with an identical `bi8Au` / "Frame" / 800×600 @ (0,0). Every fresh `.pen` starts that way,
  so any check keyed on one node degenerates the moment two new documents are in play. The
  identical-probe abort at step 5 handles that case correctly without special-casing it.

## 4. Cache, anchor, and revalidate

Cache the binding per `(session, filePath)`, storing **`probe_target` as the memory
anchor** — the document's structure *as the app holds it*, at bind time.

**Revalidate against the anchor.** After each of your own successful `execute` calls,
**refresh the anchor**, so the next revalidation compares against what you actually left
behind rather than a pre-write snapshot.

Re-run the full §3 check — not just an anchor comparison — if a call returns something you
cannot account for. Pencil is multiplayer: documents can be closed, or edited by someone
else, underneath you. A binding is a snapshot of a fact that can change.

Key every cache entry, and every node reference anywhere in the skill, by
**`(filePath, id)`** — never by id alone. Ids are not unique across documents; `bi8Au` has
now been observed in four unrelated files.

### Where this state actually lives — and why that means "re-derive, don't assume"

**There is no store.** The binding, the memory anchor, the name→id maps, and the
one-open-decision slot all live in the agent's own working context for the session. Nothing
is written to disk; nothing survives a new session; nothing is guaranteed to survive context
compaction in a long one.

That is a deliberate consequence of R6 — a skill that persisted state would need somewhere
to put it, and the obvious somewhere is beside the `.pen` file. It also means the rule
everywhere in this skill is the same:

**If you cannot see the state, re-derive it. Never assume it.**

- Anchor missing or uncertain → re-run the §3 check. It costs two MCP calls.
- Node id you did not capture in this context → you do not have it. Re-read.
- Unsure whether a decision is open on a document → sweep for the reserved prefix and look,
  rather than reasoning from memory.

**"Session end" is not a reliable event, so do not depend on it.** An agent rarely knows a
session is ending — the user may just stop typing. That is why abandoning a decision is an
**immediate action** rather than something deferred to a sweep, and why the sweep is a
backstop rather than the mechanism. Run it opportunistically: before any summary or
hand-off, whenever the user signals they are done, and whenever you notice a leftover frame.
A scratch frame that outlives the conversation is one the user may save into their real
design.

## 5. Say the right thing when something mismatches

| Signal | Cause | What to say |
|---|---|---|
| `probe_target == probe_active`, and `active != target` | Target is not open; you are seeing the fallback | Name what you got: *"I asked for `checkout.pen` but was handed frames named 'Hero', 'Pricing' — those belong to `homepage.pen`, the active document. Open `checkout.pen` in Pencil and I'll retry."* |
| Same signal, **and** the plan's `design` block declared `exists: false` | The file was never created — the plan said so at authoring time | **Assert it.** *"`checkout.pen` was declared `exists: false` with `create_via: <value>` and no file was created, so there is nothing to open. Create it first."* Do not offer "maybe it isn't open" — the document already answered that. |
| Same signal, no `exists:` declaration to consult | Unopened, or a typo'd path — **indistinguishable** | The fallback fires identically for both, and this procedure reads nothing from disk that could tell them apart. So *offer both*: *"…either it isn't open, or the path is wrong. Which is it?"* Do not assert "not open" as fact. |
| Probe differs from the **anchor** in ways you did not cause | Document changed underneath you | Re-run the §3 check from scratch. Do not guess. |

**No active editor at all.** If `get_app_state` reports nothing open, steps 3–4 have
nothing to compare against — it errors rather than returning a path. That is not a
mismatch; it means Pencil has no document open. Say so and ask the user to open the target.
Never treat an absent active editor as "different from the target" and bind on it.

Because names come back with the probe, the first message can state *which* document it was
actually handed, rather than asserting an unhelpful abstraction.

## 6. Do not read `.pen` files (R6)

The Pencil MCP server states `.pen` files are encrypted. That claim is factually wrong —
they are plain JSON, and public ones are indexed as readable text by code search. **Honour
the guardrail anyway, and without an exception:** this procedure needs nothing from disk.

Earlier drafts of this skill carved out a "narrow exception" for reading top-level node
names as an identity oracle. That exception is **removed**, because it was never necessary
and it was actively harmful:

- **It goes stale on the first write.** Disk reflects the last human save; MCP edits never
  reach disk. Mid-session, a correctly bound document had 5 top-level nodes in memory and 4
  on disk. A disk-based check reports "mismatch" on a document you are correctly connected
  to, and would tell the user their file isn't open while they are looking at it.
- **It cannot verify identity anyway.** A duplicated `.pen` preserves ids and geometry
  byte-for-byte, and every fresh document has the same single default frame.
- **The MCP probe supplies everything it was there for**, including names, from live state.

Reading a `.pen` remains legitimate only for tooling *outside* an agent session — a diff
renderer, a viewer. Never as part of doing design work, and never hand-edit.

## 7. Report the binding

State which document is bound, how identity was established, and that edits do not reach
disk:

> Bound to `netflixhouse2.pen` — it resolved to a document distinct from the active editor,
> so routing is confirmed. Edits apply to the open document in memory and are **unsaved**.

## 8. Never claim a file was written (R5)

MCP edits mutate the app's in-memory document only. Every `execute` write function
(`Insert`, `Copy`, `Update`, `Replace`, `Move`, `Delete`, `SetVariables`, `Generate`) is
memory-only; there is no save operation on the MCP surface at all.

**The phrase "written to `<path>`" is forbidden.** Correct form:

> Applied to the open document `tron_panel.pen` — unsaved. Save in Pencil to persist.

**Autosave: measured, not assumed.** A document was edited via MCP and then left untouched
for 12 minutes with the app running; the file's size and mtime never changed, and the
inserted frames never appeared on disk. So the app does **not** flush on a timer over that
window. Keep saying "unsaved — save in Pencil to persist", which is correct and actionable
either way; just don't claim the file is protected indefinitely, since focus-change and
quit behaviour were not exercised.
