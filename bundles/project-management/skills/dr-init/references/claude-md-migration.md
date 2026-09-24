# Move CLAUDE.md into AGENTS.md

Use this flow when a root `CLAUDE.md` exists — with any content, including an empty file or a symlink. It runs before state classification, before the `_claude/` → `_project/` rename offer, and before any other write. Claude Code (v2.1.277+) reads AGENTS.md only when there is no CLAUDE.md in the working directory or above it, so a project set up by this plugin uses AGENTS.md alone: CLAUDE.md's content moves to the end of AGENTS.md, and CLAUDE.md is deleted. The user approves this once, up front. Declining stops /dr-init.

## Step 1: Git state (no prompt)

If the current directory is a git repository (`Glob .git/**` returns results), run:

```
Bash: git status --porcelain AGENTS.md CLAUDE.md
```

Remember any files it lists — the preview in Step 4 mentions them. Don't ask anything here.

## Step 2: Split CLAUDE.md into *moved* and *dropped*

Work from the CLAUDE.md content read during evidence gathering.

**Nothing to move** when any of these is true:

- the content is empty or only whitespace;
- the content is identical to AGENTS.md (one file is a symlink to the other, or a copy);
- the content is only the line `AGENTS.md` (a symlink that Git checked out as a plain text file, common on Windows);
- nothing is left after applying the drop rules below.

**Always drop**, whatever produced the file:

- the title line `# CLAUDE.md`;
- every line that is exactly `@AGENTS.md` (in AGENTS.md it would import itself);
- any paragraph that begins `The imported AGENTS.md above is the canonical instruction file` or `**Note for Claude Code:** keep this file a thin pointer`. A paragraph runs to the next blank line.

**Drop only when the file contains a `Plugin: project-management` comment.** That comment proves /dr-init generated the file or part of it, and AGENTS.md carries the current version of those pieces. In a file without it, nothing beyond the always-drop list is dropped — a user's own `## Project Structure` or `## Available Commands` is their content.

- (a) Every HTML comment that contains `Plugin: project-management`. A one-line comment is just that line. A multi-line comment runs from its `<!--` line through the first line that is exactly `-->` after trimming whitespace. Older headers close early on an inner `-->`; the stray lines up to the real closer still belong to the header.
- (b) The generated intro line beginning `This file provides guidance to Claude Code (claude.ai/code)`, and any paragraph beginning `Read AGENTS.md and follow all of its guidance.` (the 3.0.0 pointer wording).
- (c) The plugin sections `## Project Structure`, `## Plan Management Workflow`, `## Available Commands` and `## Task Completion Protocol` — **only where they sit between the plugin comment and `<!-- End of plugin-managed section -->`**. Each runs from its heading, through its `###` subsections, to the next `##` heading or the end marker. Any other `##` heading in that range is the user's, and moves. So is any `###` subsection other than the plugin's own three (`### Directory Purposes`, `### IMPORTANT: Plan Execution Rules`, `### Plan Status Workflow`): it moves, up to the next `##` or `###` heading or the end marker.
- (d) `<!-- End of plugin-managed section -->`, the one-line comment directly after it, the one-line comment `<!-- Plugin-managed sections added by /dr-init -->`, and any `---` line separated from a dropped comment or from the end marker only by blank lines.

**Move** everything else, verbatim and in its original order. That includes `@path` import lines (AGENTS.md expands them) and any user section sitting inside the old plugin-managed block. Trim leading and trailing blank lines from the result, and collapse runs of blank lines left by the drops to one.

**If unsure whether a piece is plugin-generated, move it.** A duplicate in AGENTS.md is easy to delete. A dropped line may be gone for good, because CLAUDE.md may not be tracked by git.

Keep a short name for each dropped piece for the preview: e.g. "plugin header comment", "`# CLAUDE.md` title", "`@AGENTS.md` import", "pointer paragraph", "## Plan Management Workflow", "end-of-managed-section markers".

## Step 3: Collect stale-text repairs

If AGENTS.md exists, detect each entry in **Stale-text repairs** below with Grep, as that section describes, and record a verdict for each: *applies* or *not found*. The verdicts are shown in the Step 4 preview, and the repairs that apply are made in Step 5 under the same Yes.

## Stale-text repairs

Text that /dr-init 3.x wrote into AGENTS.md outside the versioned sections, with its current replacement. Two flows use this section: the move above (Step 3), and State B (`references/state-b-update.md`) on every run.

**Detect with Grep, never by reading.** For each repair, run Grep on AGENTS.md with the repair's **Detect** text as the pattern — a single line, safe as a pattern. A hit means the repair applies; no hit means it doesn't. Do this for every repair on every run: eyeballing a long file for exact text is unreliable.

**Apply with `Edit`, replacing the full Old text with the New text byte for byte.** If `Edit` can't find the Old text even though Detect hit, the user changed that text on purpose: skip the repair and say so. Never rewrite text that only resembles it.

### Repair 1: intro sentence

A sentence inside the intro line under `# AGENTS.md`. Replace the sentence and keep the rest of the line.

Detect: `the generated CLAUDE.md is a pointer here`

Old:

```
It is the canonical instruction file for this project — the generated CLAUDE.md is a pointer here.
```

New:

```
It is the only instruction file for this project — record new repository guidance here.
```

### Repair 2: header comment advice

Four lines inside the header HTML comment at the top of the file, replaced by three. Keep the two-space indent.

Detect: `project-bootstrap command`

Old:

```
  We recommend running your harness's project-bootstrap command (Claude
  Code: the built-in `/init`) to scan your codebase and add that content
  to this file. It will integrate cleanly alongside the plugin-managed
  sections below.
```

New:

```
  Ask your coding agent to scan the codebase and add that content to
  this file. It will integrate cleanly alongside the plugin-managed
  sections below.
```

## Step 4: Preview and ask

Show this preview, filled in with the real content:

~~~markdown
## /dr-init — CLAUDE.md found

This project will use AGENTS.md as its only instruction file. Claude Code
reads AGENTS.md only when there is no CLAUDE.md, so /dr-init moves
CLAUDE.md into AGENTS.md before setting anything up.

**Moves to the end of AGENTS.md** [— AGENTS.md will be created]:

```diff
+ <!-- Moved from CLAUDE.md by /dr-init on YYYY-MM-DD -->
+
+ <every moved line>
```

**Dropped** (plugin-generated; AGENTS.md already carries the current version):
  <one line per dropped piece; for a plugin section, add its line count>
  [Plugin sections are dropped whole. If you added your own lines inside
  one, answer No, move them below the end-of-managed-section marker, and
  run /dr-init again.]

**Stale-text repairs in AGENTS.md:** Repair 1 (intro sentence) — <applies / not found> · Repair 2 (header comment advice) — <applies / not found>

**Deleted:** CLAUDE.md
~~~

- If there is nothing to move, replace the Moves block with `**Nothing to move** — CLAUDE.md holds only content the plugin generated.` (or `— CLAUDE.md is empty.` / `— CLAUDE.md is identical to AGENTS.md.` / `— CLAUDE.md is a link to AGENTS.md.` when that is the reason).
- Include `[— AGENTS.md will be created]` only when AGENTS.md doesn't exist.
- Omit the Dropped line when nothing was dropped. Include the bracketed plugin-sections note only when rule (c) dropped a section.
- Always include the Stale-text repairs line, with the Step 3 verdict for every repair, whenever AGENTS.md exists. Omit it only when AGENTS.md doesn't exist.
- If Step 1 found uncommitted changes, add `⚠ Uncommitted changes in <files> — they are carried into the result.`

Then use AskUserQuestion:

> **Question:** Move CLAUDE.md into AGENTS.md and continue? This happens right away, before the rest of /dr-init.
>
> **Options:**
> - **Yes** — move it, delete CLAUDE.md, and continue with /dr-init
> - **No** — stop; nothing is changed

Any answer other than **Yes** counts as No.

## Step 5: Apply (Yes)

**When there is content to move:**

1. Append the moved block to AGENTS.md: a blank line, the comment `<!-- Moved from CLAUDE.md by /dr-init on {{CURRENT_DATE}} -->` (today's date from the conversation context, `YYYY-MM-DD`), a blank line, then the moved content. Use `Edit` anchored on the file's last lines, or Read, concatenate and `Write` if a clean anchor is awkward. If AGENTS.md doesn't exist, is empty, or is only the line `CLAUDE.md` (a symlink checked out as text), `Write` it instead: the comment, a blank line, then the moved content.
2. Apply the repairs noted in Step 3 with `Edit`.
3. Confirm the move landed: run Grep on AGENTS.md for the provenance comment you just wrote (`Moved from CLAUDE.md by /dr-init on YYYY-MM-DD`, with today's date). **Only on a hit** delete CLAUDE.md. Never skip this Grep — it is the last check before a file is deleted. If a write failed or the Grep finds nothing, stop, report what happened, and leave CLAUDE.md in place.

**When there is nothing to move:**

1. Apply the repairs noted in Step 3, and only if AGENTS.md exists. Write nothing else. Never create AGENTS.md here: a file holding only the provenance comment would be classified as State C instead of getting State A's clean setup.
2. Delete CLAUDE.md.
3. If the content was identical to AGENTS.md, Read AGENTS.md again. If it can no longer be read, AGENTS.md was a symlink to CLAUDE.md: `Write` AGENTS.md with the content read in Step 2, with the Step 3 repairs applied, then `Glob CLAUDE.md`. If CLAUDE.md is back (the write followed the link), stop and tell the user: `⚠ AGENTS.md is a link to CLAUDE.md. Delete the AGENTS.md link, rename CLAUDE.md to AGENTS.md, then run /dr-init again.`

**Deleting.** Run exactly this command with the Bash tool, with nothing before or after it:

```
rm CLAUDE.md
```

`allowed-tools` grants that exact string. Any variant — a `cd … &&` prefix, `./CLAUDE.md`, quotes, flags, a chained command, or a different shell tool — makes the harness ask the user for permission.

**Then report and continue.** Emit one line:

```
✅ CLAUDE.md moved into AGENTS.md and deleted — continuing with /dr-init.
```

(or `✅ CLAUDE.md deleted — nothing to move. Continuing with /dr-init.`), and note that the move is complete: cancelling a later /dr-init prompt doesn't undo it. Keep the outcome line for the SKILL.md Phase 3 summary — `CLAUDE.md: moved <N> lines into AGENTS.md, then deleted` (N = non-blank moved lines, not counting the provenance comment) or `CLAUDE.md: nothing to move (plugin-generated only) — deleted` (or `(empty)` / `(identical to AGENTS.md)` / `(a link to AGENTS.md)` in place of `(plugin-generated only)`).

## Step 6: Stop (No)

Emit this, then end the run — no rename offer, no state handler, no summary:

```
ℹ️  Stopped — no changes made.
/dr-init sets up projects that use AGENTS.md as their only instruction
file. Run it again when you're ready to move CLAUDE.md into AGENTS.md.
```
