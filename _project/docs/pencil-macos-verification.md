# Pencil Skill — macOS Verification Checklist

**Created:** 2026-07-27
**Status:** unrun. Every claim below is Windows-verified only.
**Owner of the gap:** plan 012, Phase 6.

The `pencil` skill was built and tested entirely on Windows. This checklist closes the
macOS gap. It is short by design — the skill deliberately encodes **no** platform-specific
paths, transports, or binaries, so most of it should simply work, and the point of this
document is to prove that rather than assume it.

## Why this is expected to be cheap

The transport is the MCP server's internal business. The Windows research observed a named
pipe (`\\.\pipe\pencil-desktop`); macOS presumably uses a unix socket. **The skill never
touches either** — it only calls MCP tools. A grep of the skill directory for
`[A-Za-z]:[/\\]`, `\\.\pipe`, and `~/.pencil` returns zero matches, and that grep is part
of the plan's Definition of Done.

So the surface that can actually differ is small: path comparison, and whether the tools
behave identically.

## Checklist

### 1. The skill binds a target without modification

**Run:** open two `.pen` files in Pencil, focus one. Ask the agent to read the *non-focused*
one.
**Pass:** it binds to the file you named and reports that document, not the active one.
**Fails if:** it reports the active document, or errors on the path.

### 2. The corruption vector still aborts

**Run:** with one `.pen` open, ask the agent to work on a different `.pen` that is **not**
open.
**Pass:** it aborts before any write, names the document it was actually handed, and asks
you to open the target.
**Fails if:** it proceeds. This is the whole reason the skill exists — treat a failure here
as blocking.

### 3. R3 path comparison on a case-sensitive volume

**This is the only item where macOS is genuinely expected to differ.** The skill compares
paths **case-insensitively**, which is correct for Windows and for default APFS. On a
case-sensitive APFS volume it is wrong in the prompt-*suppressing* direction: two genuinely
different directories differing only in case compare equal, so the "this design is outside
your working tree" confirmation is skipped.

**Run:** on a case-sensitive volume, put a `.pen` in `~/Repos/acme/` and work from
`~/repos/acme/`.
**Pass:** the agent asks before mutating.
**Expected:** it does **not** ask — the known limitation.
**If it fails:** `preflight.md` §2 already documents this and instructs preferring an exact
comparison on case-sensitive volumes. Confirm that guidance is sufficient, or make the
comparison detect volume case-sensitivity.

*Most Macs use case-insensitive APFS, so this may be unreproducible on a stock machine. Note
that outcome rather than skipping the item.*

### 4. `export_nodes` accepts a POSIX `outputDir`

**Run:** export any node with `outputDir` set to a POSIX path.
**Pass:** files are written and absolute paths returned.
**Fails if:** the path is rejected or mangled.

### 5. Autosave, re-measured

**Run:** make an MCP edit, then leave Pencil completely alone and watch the file's mtime for
~12 minutes.
**Windows result:** no flush, six samples.
**Pass:** same.
**If macOS flushes:** the skill's completion wording needs strengthening and decision-frame
cleanup becomes load-bearing rather than tidy. Say so in `preflight.md` §8 and
`visual-choice.md`.

### 6. Frame names render in the layers panel

**Run:** create a frame named `[decision] test` and look at the layers panel.
**Pass:** the ASCII prefix is legible and scannable.
**Context:** the Unicode `⟦decision⟧` variant was rejected on Windows because it rendered as
tofu **on canvas**. The layers panel may use a different system font, and that was never
verified. If ASCII looks poor on macOS, this is where a better prefix would be chosen — but
only with the regex-escaping cost in mind (`visual-choice.md` documents why the raw prefix
is dangerous in a pattern).

## Open questions this checklist does *not* close

Carried from the source research and still unanswered on any platform:

| Question | Why it matters |
|---|---|
| Can several MCP clients drive one app simultaneously? | All testing was single-client and sequential. R7 (one agent per document) is precautionary, not measured. |
| Does `pen interactive -a desktop -i <file>` switch the app's document? | Would give a supported way to target a file in a running instance. |
| Is there any MCP path to `save()`? | Would remove the "unsaved" caveat entirely. `pen interactive` exposes one; the MCP surface does not. |
| Does `export_html` work with no app running? | Determines whether vendor-fidelity export is usable in CI. |
| Does a custom `-app` identity create a second pipe? | Would allow multiple addressable GUI instances. |
| Does the app flush on focus change or quit? | The 12-minute timer test does not cover either. |
| **Is the Pencil MCP server available under Pi at all?** | The skill ships to both harnesses via the Pi catalog glob, but was only ever exercised on Claude Code. Determines whether `compatibility` should say the skill *degrades* on Pi or is simply *unavailable* there — currently it says "report unavailability", which is safe either way but untested. One Pi session answers it. |
