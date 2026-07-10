# State A — Fresh Project

Use this flow when the project has no CLAUDE.md (or it's empty) AND no `_claude/` directory. You're building the plugin structure from scratch.

No git-safety check is needed — there's nothing to overwrite.

## Steps

### 1. Get the current date

Use today's date from the conversation context, formatted as `YYYY-MM-DD`. Do not hardcode or guess. This will replace `{{CURRENT_DATE}}` in the template.

### 2. Read the template

Read `${CLAUDE_SKILL_DIR}/templates/CLAUDE-template.md` into memory.

### 3. Substitute placeholders

Replace `{{CURRENT_DATE}}` in the template content with today's date.

### 4. Create all files in parallel

Issue these operations **in parallel** (single message, multiple `Write` tool calls). The `Write` tool creates parent directories automatically when writing to nested paths — no separate `mkdir` needed.

**Files to create (8 in parallel):**

| Path | Content |
|------|---------|
| `_claude/docs/.gitkeep` | *(empty)* |
| `_claude/plans/draft/.gitkeep` | *(empty)* |
| `_claude/plans/in_progress/.gitkeep` | *(empty)* |
| `_claude/plans/completed/.gitkeep` | *(empty)* |
| `_claude/prd/.gitkeep` | *(empty)* |
| `_claude/resources/.gitkeep` | *(empty)* |
| `_claude/research/.gitkeep` | *(empty)* |
| `CLAUDE.md` | *(processed template from step 3)* |

All paths use forward slashes. All `.gitkeep` files are empty — `Write` accepts an empty string.

### 5. Emit the success message

```
✅ Project structure initialized

Created:
  _claude/docs/
  _claude/plans/draft/
  _claude/plans/in_progress/
  _claude/plans/completed/
  _claude/prd/
  _claude/resources/
  _claude/research/
  CLAUDE.md

💡 Tip: Run /init next if you'd like Claude to scan your codebase and
   add project-specific documentation (architecture notes, build/test
   commands, coding conventions, etc.). /init's output will integrate
   cleanly alongside the plugin-managed sections we just added.

Next steps:
  1. Review CLAUDE.md and add any project-specific context you want
  2. Commit the new structure when you're ready
  3. Start a workflow:
     - Research a topic: /dr-research [topic]
     - Define a feature: /dr-prd [description]
     - Plan implementation: /dr-plan [context]

Note: CLAUDE.md is yours to customize. /dr-init will only update
plugin-managed sections (those with version markers), and only with
your approval after showing you the diff.
```

Do not suggest or run any git commands — the user handles their own commits.
