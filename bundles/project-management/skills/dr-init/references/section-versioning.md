# Section Versioning Reference

This document explains how plugin-managed sections in `CLAUDE.md` are version-tracked, and how `/dr-init` uses these versions to detect and update outdated content.

Read this when handling State B (already-initialized) or when maintaining the template.

## The Versioning Scheme

Plugin-managed sections in `CLAUDE-template.md` are marked with HTML comments placed immediately after their `##` heading:

```markdown
## Plan Management Workflow
<!-- section: plan-management-workflow v2 -->

Section content here...
```

**Marker format:**
- Must appear on the line immediately after the `##` heading
- Slug is lowercase kebab-case matching the section's purpose
- Version is a simple integer (`v1`, `v2`, `v3`, ...)

## Which Sections Are Versioned

As of the current template, these three sections have version markers:

| Section Heading | Slug | Current Version |
|---|---|---|
| `## Plan Management Workflow` | `plan-management-workflow` | `v2` |
| `## Available Commands` | `available-commands` | `v1` |
| `## Task Completion Protocol` | `task-completion-protocol` | `v1` |

Other sections in the template (`## Project Structure`, directory purpose subsections, etc.) are **not** version-tracked because their content is stable documentation that rarely changes. They are recreated on fresh init but never updated on existing projects.

## How `/dr-init` Uses the Markers (State B)

When the skill runs in State B (already initialized), it performs two tiers of checks against the user's `CLAUDE.md`:

### Tier 1 — Section existence

For each versioned section in the template, check whether the corresponding `##` heading exists in the user's CLAUDE.md.

- Heading found → proceed to Tier 2
- Heading not found → mark section as **✗ missing** (will be added if user approves)

### Tier 2 — Version check

For each section whose heading exists, look for the version marker:

- Marker absent → mark as **⚠ outdated** (pre-versioning content, likely from an older template)
- Marker version < template version → mark as **⚠ outdated** (user has an older version of this section)
- Marker version ≥ template version → mark as **✓ current** (nothing to do)

## Update Logic

When the user approves updates in State B:

1. **Outdated sections:** Use `Edit` to replace the section body. The body starts at the version-marker line (or the `##` heading if no marker) and ends at the next `##` heading or the `<!-- End of plugin-managed section -->` marker, whichever comes first.

2. **Missing sections:** Use `Edit` to insert the section from the template immediately before the `<!-- End of plugin-managed section -->` marker. If that marker doesn't exist in the user's file, append the section at the end.

3. **Preserve everything else:** Content outside the specific sections being updated is never touched. The user's customizations, additions, and project-specific content remain untouched.

## Adding a New Versioned Section (Maintainer Note)

When adding a new versioned section to `CLAUDE-template.md`:

1. Place the `##` heading where it belongs in the template
2. Add a version marker on the next line: `<!-- section: your-section-name v1 -->`
3. Write the section content
4. Update the table above in this file
5. Bump the plugin version in `plugin.json` and `marketplace.json`
6. Add a CHANGELOG entry noting the new section

When **modifying** content in an existing versioned section:

1. Keep the same slug
2. Bump the version number (`v1` → `v2`)
3. Update the table above to reflect the new version
4. Bump the plugin version and add a CHANGELOG entry

The version number is how `/dr-init` detects users who have the old content and offers to update them.

## Why This Approach

- **Surgical updates** — users keep their customizations in other sections
- **Cross-platform** — pure text markers, no external index, no hashes to maintain
- **Transparent** — users can read the markers to see which sections the plugin owns
- **Testable by inspection** — no runtime, no script, just string matching

The trade-off is that the approach relies on Claude's careful execution of the update logic rather than deterministic code. This is acceptable because:
- Updates are rare (only when template versions bump)
- State B shows a diff preview before applying any changes (see `state-b-update.md`)
- The user can always skip updates and handle them manually
