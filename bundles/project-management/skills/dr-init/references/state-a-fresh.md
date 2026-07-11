# State A — Fresh Project

Use this flow when the project has no AGENTS.md and no CLAUDE.md (or both are empty). You're building the plugin structure from scratch: canonical AGENTS.md, pointer CLAUDE.md, and the `_project/` directory tree.

No git-safety check is needed — there's nothing to overwrite.

## Steps

### 1. Get the current date

Use today's date from the conversation context, formatted as `YYYY-MM-DD`. Do not hardcode or guess. This will replace `{{CURRENT_DATE}}` in the template.

### 2. Read the templates

Read `templates/AGENTS-template.md` and `templates/CLAUDE-pointer.md` into memory.

### 3. Substitute placeholders

Replace `{{CURRENT_DATE}}` in the AGENTS-template content with today's date. The pointer template has no placeholders — use it verbatim.

### 4. Create all files in parallel

Issue these operations **in parallel** (single message, multiple `Write` tool calls). The `Write` tool creates parent directories automatically when writing to nested paths — no separate `mkdir` needed.

**Files to create (9 in parallel):**

| Path | Content |
|------|---------|
| `_project/docs/.gitkeep` | *(empty)* |
| `_project/plans/draft/.gitkeep` | *(empty)* |
| `_project/plans/in_progress/.gitkeep` | *(empty)* |
| `_project/plans/completed/.gitkeep` | *(empty)* |
| `_project/prd/.gitkeep` | *(empty)* |
| `_project/resources/.gitkeep` | *(empty)* |
| `_project/research/.gitkeep` | *(empty)* |
| `AGENTS.md` | *(processed AGENTS-template from step 3)* |
| `CLAUDE.md` | *(CLAUDE-pointer template, verbatim)* |

All paths use forward slashes. All `.gitkeep` files are empty — `Write` accepts an empty string.

### 5. Emit the success message

```
✅ Project structure initialized

Created:
  _project/docs/
  _project/plans/draft/
  _project/plans/in_progress/
  _project/plans/completed/
  _project/prd/
  _project/resources/
  _project/research/
  AGENTS.md   (canonical agent guidance — versioned plugin sections)
  CLAUDE.md   (pointer to AGENTS.md for Claude Code)

💡 Tip: Run your harness's project-bootstrap command next (Claude Code:
   /init) if you'd like the agent to scan your codebase and add
   project-specific documentation (architecture notes, build/test
   commands, coding conventions, etc.) — its output belongs in AGENTS.md
   alongside the plugin-managed sections we just added.

Next steps:
  1. Review AGENTS.md and add any project-specific context you want
  2. Commit the new structure when you're ready
  3. Start a workflow:
     - Research a topic: /dr-research [topic]
     - Define a feature: /dr-prd [description]
     - Plan implementation: /dr-plan [context]

Note: AGENTS.md is yours to customize. /dr-init will only update
plugin-managed sections (those with version markers), and only with
your approval after showing you the diff. CLAUDE.md stays a thin
pointer — put Claude-specific additions below its managed block.
```

Do not suggest or run any git commands — the user handles their own commits.
