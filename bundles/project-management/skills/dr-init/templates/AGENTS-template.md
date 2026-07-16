<!--
  Plugin: project-management
  Template generated: {{CURRENT_DATE}}

  This file is yours to customize for your project.

  Project-specific documentation (architecture, build/test/lint commands,
  coding conventions, etc.) is NOT the responsibility of this plugin.
  We recommend running your harness's project-bootstrap command (Claude
  Code: the built-in `/init`) to scan your codebase and add that content
  to this file. It will integrate cleanly alongside the plugin-managed
  sections below.

  Sections managed by the plugin have version markers — HTML comments
  like "section: name v1" placed directly under the section heading.
  Running /dr-init will check these markers and offer to update outdated sections.
  Content outside the plugin-managed sections is never modified by /dr-init.
-->

# AGENTS.md

This file provides guidance to coding agents when working with code in this repository. It is the canonical instruction file for this project — the generated CLAUDE.md is a pointer here.

## Project Structure

This project follows a structured approach to planning, documentation, and implementation.

```
_project/
├── docs/              # Technical documentation and architecture
├── plans/             # Implementation plans
│   ├── draft/         #   — being developed or refined
│   ├── in_progress/   #   — currently being implemented
│   └── completed/     #   — finished and archived
├── prd/               # Product Requirement Documents
├── resources/         # Reference materials and external docs
└── research/          # Structured research output
```

**Note:** Each leaf directory contains a `.gitkeep` file so empty directories can be committed to git.

### Directory Purposes

**`_project/docs/`**
Technical documentation, architecture decisions, API specifications, and development notes.

**`_project/plans/`**
Implementation plans following a structured template. Plans move through stages:
- **draft/** - Plans being refined, NOT ready for implementation
- **in_progress/** - Plans currently being actively worked on
- **completed/** - Finished plans for historical reference

**`_project/prd/`**
Product Requirement Documents defining features, user stories, and requirements.

**`_project/resources/`**
User-provided reference materials, external documentation, design specifications.

**`_project/research/`**
Structured research output per topic: canonical markdown files plus a portable HTML microsite view (`.html` siblings + bundled `assets/` — works offline, safe to share).

## Plan Management Workflow
<!-- section: plan-management-workflow v3 -->

### IMPORTANT: Plan Execution Rules

⚠️ **STRICT ADHERENCE REQUIRED** ⚠️

1. **NEVER execute or implement tasks from plans in the `draft/` folder**
   - Draft plans are for review and refinement only
   - If asked to work on a draft plan, inform the user that the plan must be moved to `in_progress` first

2. **Only work on plans in the `in_progress/` folder**
   - These are the only plans approved for active development
   - Always verify a plan is in the correct folder before starting work

3. **If a user asks you to work on a draft plan:**
   - Politely explain that draft plans cannot be executed
   - Offer to move the plan to `in_progress` if they approve
   - Wait for explicit confirmation before moving any plans

4. **Actions outside of existing plans require explicit permission**
   - If a request is NOT part of any existing plan, ASK THE USER before executing
   - Questions are for information gathering, NOT permission to act
   - Only proceed with implementation when the user explicitly says to do it

5. **Understanding user intent**
   - "Can you..." or "How would..." questions are requests for information, not action
   - "Please..." or "Go ahead and..." or "Implement..." are explicit action requests
   - When in doubt, clarify what the user wants before proceeding

### Plan Status Workflow

1. **Create Plan**: `/dr-plan [detailed context]` creates numbered plan in `draft/` (e.g., `001-plan-name.md`)
2. **Review**: Examine the plan to identify any improvements or missing details
3. **Refine** (optional but recommended): `/dr-plan @_project/plans/draft/001-plan.md [refinement request]` to enhance with extended thinking
   - Can be repeated multiple times
   - Shows diff summary before applying
4. **Move to Active**: Move the plan file from `draft/` to `in_progress/` when ready to implement
5. **Implement**: Work through plan phases systematically
6. **Minor Adjustments** (as needed): `/dr-plan @_project/plans/in_progress/001-plan.md [minor changes]` for small corrections
7. **Complete & Ship**: Run `/dr-ship` when the plan is finished — it verifies every checkbox, backfills the retro, moves the plan to `completed/`, commits, pushes, and opens a PR populated from the plan summary. (Moving the file manually still works if you prefer.)

**Plan Numbering:**
Plans are automatically numbered sequentially (001, 002, 003, ..., 999, 1000, ...) to track chronological order. The number is determined by scanning **all three folders** (draft/, in_progress/, completed/) to find the highest existing number, then incrementing by 1. The number stays with the plan when moved between folders.

Example: If your completed/ folder has plans 001-045 and in_progress/ has 046-047, the next plan created will be 048, even if draft/ is empty.

## Available Commands
<!-- section: available-commands v3 -->

This project uses the **project-management** plugin (dr- prefix) which provides:

- `/dr-init` - Initialize or update project structure
- `/dr-research [detailed prompt]` - Conduct research on a topic (Standard path, or Deep path with claim verification) producing markdown + a portable HTML view (supports multi-line prompts)
- `/dr-prd [detailed feature description OR @prd-file [refinement]]` - Create or refine comprehensive PRD with extended thinking
- `/dr-plan [detailed context OR @plan-file [refinement]]` - Create or refine implementation plan with extended thinking (dual-mode)
- `/dr-ship [@plan-file] [--verify]` - Ship a finished plan: verify completion, backfill the retro, move to `completed/`, commit, push, and open a PR populated from the plan summary

**Dual-Mode Refinement:**
Both PRDs and plans can be refined using the same commands. Use `/dr-prd @_project/prd/feature.md [changes]` to refine PRDs or `/dr-plan @_project/plans/draft/plan.md [changes]` to refine plans. Both commands use extended thinking and show diff summaries. They automatically detect whether you're creating or refining based on the `@` file reference.

**IMPORTANT - Date Handling:**
When creating any document with dates or timestamps, ALWAYS check the system environment for the current date/time. NEVER use hardcoded or assumed dates.

## Task Completion Protocol
<!-- section: task-completion-protocol v1 -->

When working on tasks from an implementation plan, follow this protocol **for each phase**:

1. **Work through one phase at a time** following the plan's phase order
2. **Complete all tasks in the phase** and verify each works (run tests, check behavior)
3. **Update the plan file immediately** after completing the phase:
   - Check the boxes (`[x]`) for all completed tasks in that phase
   - Check the boxes for completed test verification items
   - Update the "Actual Time" in Implementation Notes if time tracking is present
4. **Report to the user** with a summary of what was completed and what phase is next
5. **Proceed to the next phase** or wait for user direction

The plan file must always reflect the current state of implementation. Never leave completed tasks unchecked.

---

<!-- End of plugin-managed section -->
<!-- Content above this line is managed by /dr-init. Content below is yours. -->
