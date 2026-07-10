# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a cross-harness tooling repository: one repo serving as both a Claude Code plugin marketplace and a Pi package, built from shared, harness-neutral bundles under `bundles/`. Each bundle is one plugin, carrying both harness manifests over the same skills. The primary bundle is `bundles/project-management/` (plugin name `project-management`), which provides structured project management workflows.

## Repository Structure

```
ai-tools/
├── .claude-plugin/
│   └── marketplace.json           # Claude catalog (root-forced); sources → ./bundles/*
├── package.json                   # Pi catalog (root-forced, private): pi.skills → bundles/*/skills/*
├── bundles/
│   ├── project-management/        # Main project management bundle
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json        # Claude bundle manifest (path required by Claude)
│   │   ├── package.json           # Pi bundle manifest (inert in whole-repo installs)
│   │   ├── agents/                # Subagents (plan-verifier.md)
│   │   └── skills/                # Skill 2.0 directories
│   │       ├── dr-init/           # Project structure initialization (invoked as /dr-init)
│   │       ├── dr-research/       # Deep research with web search (invoked as /dr-research)
│   │       ├── dr-prd/            # PRD creation and refinement (invoked as /dr-prd)
│   │       ├── dr-plan/           # Implementation plans: CREATE, REFINE, SUMMARY, QUESTION RESOLUTION
│   │       └── dr-ship/           # Ship a finished plan: verify → close out → commit → push → PR (invoked as /dr-ship)
│   ├── engineering-tools/         # Same shape: skills/{frontend-design, react-19}
│   └── experimental/              # Same shape: skills/{mvp}
├── pi/                            # Cross-cutting Pi-only artifacts (extensions/, prompts/) — starts absent
└── claude/                        # Cross-cutting Claude-only artifacts (hooks/ …) — starts absent
```

Note: `/dr-init`, `/dr-research`, and `/dr-ship` are implemented as Skills 2.0 with `disable-model-invocation: true` — they are invoked explicitly via their slash-command names, not auto-discovered by Claude (`/dr-ship` especially, because it pushes and publishes). `/dr-plan` and `/dr-prd` are also Skills 2.0 but use `disable-model-invocation: false` paired with a **Trigger Validation** gate: the model invokes them only when the user writes the literal `/dr-plan` or `/dr-prd` token anywhere in their message (not only at the start), and the gate stops conversational drift from auto-firing them.

## Cross-Harness Packaging

Two root-forced catalogs anchor the repo; everything else lives in bundles:

- **Root `package.json` is the Pi catalog** — the only manifest Pi reads on a whole-repo `pi install git:…`. It is `"private": true` (the root never publishes to npm) and its `pi.skills` glob (`bundles/*/skills/*`) must cover exactly the skill directories.
- **Per-bundle `package.json` mirrors that bundle's `plugin.json`** — npm-scoped name (`@dionridley/<bundle>`), same version as the bundle's semver. These are inert during whole-repo installs and activate only for local-path installs or future npm publishing.
- **Escape hatches:** root `pi/` and `claude/` hold cross-cutting harness-exclusive artifacts. Rule: *exclusivity determines which manifest references an artifact; ownership determines where it lives* — bundle-owned harness-specific artifacts stay inside their bundle. Both folders start absent; create them only with their first content.

## Plugin Architecture

### Command Structure

Commands are markdown files with YAML frontmatter:

```markdown
---
description: Short description for /help
argument-hint: [arg1] [arg2] [--flag]
allowed-tools: Read, Write, Edit, Bash(specific:*)
---

# Command Title

Instructions for Claude to execute...
```

Key patterns:
- `<command-args>` tag contains user arguments at runtime
- `${CLAUDE_PLUGIN_ROOT}` resolves to the plugin's root directory
- `@file.md` references auto-expand file content into context (path disappears from args)
- Workaround: `@file.md keyword` keeps "keyword" in args while expanding file

### Multi-Mode Commands

For commands with multiple modes (like dr-plan), use subfolder delegation:

```
commands/
├── dr-plan.md           # Mode detection + routing
└── dr-plan/
    ├── summary.md       # SUMMARY mode logic
    └── questions.md     # QUESTION RESOLUTION mode logic
```

The main command detects mode from args and reads the appropriate subfolder file.

### Skills vs Commands

| Aspect | Slash Command | Skill |
|--------|---------------|-------|
| Structure | Single .md file | Directory with `SKILL.md` + optional `references/`, `templates/`, `scripts/`, `examples/` |
| Arguments | Supports `<command-args>` tag | Uses `$ARGUMENTS` in SKILL.md |
| Progressive disclosure | Single file loads fully | `SKILL.md` routes; reference files load on demand via `${CLAUDE_SKILL_DIR}/...` |
| Auto-discovery | N/A — always explicit | On by default; set `disable-model-invocation: true` to make the skill explicit-only (invoked via `/skill-name`) |
| Use when | Simple one-shot workflow with a single set of instructions | Multi-phase or multi-mode workflow that benefits from progressive disclosure; or a workflow Claude should be able to auto-discover |

The project-management plugin's `dr-init`, `dr-research`, and `dr-ship` Skills use `disable-model-invocation: true` — they behave like slash commands from a user's perspective (invoked explicitly as `/dr-init`, `/dr-research`, `/dr-ship`) but benefit from the Skill 2.0 directory structure and progressive-disclosure pattern internally. `dr-plan` and `dr-prd` use `disable-model-invocation: false` paired with a Trigger Validation gate, so the model invokes them only when the user includes the literal `/dr-plan` / `/dr-prd` token anywhere in the message — looser than a leading-only slash command, but still requiring the explicit token.

### Skill Structure

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: executable code
├── references/           # Optional: documentation loaded as needed
└── assets/               # Optional: templates, images for output
```

SKILL.md frontmatter must have `name` and `description` fields. The description is the primary trigger mechanism.

## Development Workflow

### Testing Commands

Commands are tested by using them in a project with the plugin installed. There's no automated test suite - validation is manual.

### Markdown Output for Copying

When generating content users need to copy (like PR summaries), use tildes for the outer fence to allow backticks inside:

````markdown
~~~markdown
## Summary
Content with `code` and:
```bash
commands
```
~~~
````

### Template Variables

Templates in `templates/` use placeholder patterns that commands fill in:
- `[YYYY-MM-DD]` - Current date
- `[Plan Name]` - Generated from context
- `${CLAUDE_PLUGIN_ROOT}` - Plugin root path (runtime)

### Template Section Versioning

The `CLAUDE-template.md` uses section version markers to track content changes. This allows `/dr-init` to detect outdated sections in existing projects and offer to update them.

**Marker format:** Place an HTML comment immediately after the `##` heading:
```markdown
## Section Name
<!-- section: section-name-slug v1 -->

Section content here...
```

**Rules:**
- When **modifying content** in a versioned section of `CLAUDE-template.md`, **bump the version number** (e.g., `v1` → `v2`)
- When **adding a new section** that should be tracked, add a version marker starting at `v1`
- The marker slug must be lowercase kebab-case matching the section purpose
- `/dr-init` reads these markers from the template and compares them against the user's CLAUDE.md to detect outdated or missing sections
- Sections without markers are not version-tracked (e.g., `## Project Structure`, `## Development Principles`)

## Plugin Manifest (plugin.json)

Required fields:
- `name`: kebab-case identifier
- `version`: semver string
- `description`: What the plugin does
- `commands`: Array of relative paths to command files
- `skills`: Array of relative paths to skill directories

## Version Management

When releasing a new version for any bundle:

1. **Check all three version declarations first:**
   - `.claude-plugin/marketplace.json` (parent marketplace catalog)
   - `bundles/<name>/.claude-plugin/plugin.json` (Claude bundle manifest)
   - `bundles/<name>/package.json` (Pi bundle manifest)

2. **Determine the new version:**
   - Find the highest of the current versions (they should already agree)
   - Increment appropriately (patch/minor/major based on changes)

3. **Update all four locations to the same version:**
   - Update `version` field in plugin.json
   - Update `version` field in the bundle's package.json
   - Update `version` field in the bundle's entry in marketplace.json
   - Add new entry to CHANGELOG.md

4. **CHANGELOG.md format** (follows [Keep a Changelog](https://keepachangelog.com/)):
   - Add new version section at top (below Unreleased if present)
   - Format: `## [X.Y.Z] - YYYY-MM-DD`
   - Categorize changes: Added, Changed, Deprecated, Removed, Fixed, Security
   - Use bullet points with brief descriptions

This ensures version consistency across the marketplace catalog, plugin manifest, and changelog.

## Key Files

### Repository-Level
- `.claude-plugin/marketplace.json` - Claude catalog listing all plugins with versions; sources point at `./bundles/*`
- `package.json` - Pi catalog (private); `pi.skills` globs `bundles/*/skills/*`

### Per-Bundle Files (each bundle folder contains these)
Each bundle is a self-contained folder (e.g., `bundles/project-management/`) with its own:
- `.claude-plugin/plugin.json` - Claude plugin manifest with version, commands, skills
- `package.json` - Pi bundle manifest mirroring plugin.json (`@dionridley/<bundle>`, same version)
- `README.md` - Documentation for that specific bundle
- `CHANGELOG.md` - Version history for that specific bundle only

**Important**: When making changes to a bundle, update that bundle's own CHANGELOG.md - not a different bundle's changelog. Each bundle maintains independent version history.

### Current Bundles
- `bundles/project-management/` - Project management with research, PRDs, and implementation plans
- `bundles/engineering-tools/` - Frontend-design and React 19 skills
- `bundles/experimental/` - Experimental capabilities (MVP builder)
