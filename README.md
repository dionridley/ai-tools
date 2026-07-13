# AI Tools

Cross-harness AI agent tooling: one repo that serves as both a **Claude Code plugin marketplace** and a **Pi package**, built from shared, harness-neutral skill bundles. No skill file exists twice — each bundle under `bundles/` carries both harness manifests (`.claude-plugin/plugin.json` for Claude Code, `package.json` for Pi) over the same skills.

> This repo supersedes [`dionridley/claude-plugins`](https://github.com/dionridley/claude-plugins).

## Available Bundles

| Bundle | Plugin name | Description |
|--------|-------------|-------------|
| [Project Management](./bundles/project-management/README.md) | `project-management` | Structured project management with research, PRDs, and implementation plans |
| [Engineering Tools](./bundles/engineering-tools/README.md) | `engineering-tools` | Skills and commands to assist with software engineering and coding tasks |
| [Experimental](./bundles/experimental/README.md) | `experimental` | Work in Progress Tools — experimental capabilities under active development and testing |

## Claude Code

### Via the plugin manager UI

1. Open Claude Code and type `/plugins`
2. Add the marketplace: `dionridley/ai-tools`
3. Enable the plugins you want

### Via the CLI

```bash
# Add the marketplace (URL, path, or GitHub repo)
claude plugin marketplace add dionridley/ai-tools

# Install plugins — all optional, pick what you use
claude plugin install project-management@ai-tools
claude plugin install engineering-tools@ai-tools
claude plugin install experimental@ai-tools
```

Update and remove:

```bash
claude plugin marketplace update ai-tools      # refresh the catalog
claude plugin update project-management        # update one plugin
claude plugin uninstall project-management     # remove one plugin
claude plugin marketplace remove ai-tools      # remove the marketplace
```

### Verify

```bash
claude plugin list
```

With the project-management plugin enabled you should see skills like `/dr-init`, `/dr-research`, `/dr-prd`, `/dr-plan`, and `/dr-ship`. The experimental plugin provides `/mvp`.

## Pi

The root `package.json` declares this repo as a Pi package — its `pi.skills` manifest globs `bundles/*/skills/*`, so one install brings in every bundle's skills.

### Full install

```bash
pi install git:github.com/dionridley/ai-tools
```

Skills auto-discover by description; explicit invocation is `/skill:<name>` (e.g. `/skill:dr-plan`). Skills marked `disable-model-invocation: true` (`dr-init`, `dr-research`, `dr-ship`) load but are explicit-only — hidden from auto-discovery by design.

Update installed packages:

```bash
pi update --all
```

### Excluding a bundle (settings filter)

Filters layer on top of the manifest — they narrow what the install declared. To take everything except a bundle, use the object form of the `packages` entry in `~/.pi/agent/settings.json` (global) or `.pi/settings.json` (per project):

```json
{
  "packages": [
    {
      "source": "git:github.com/dionridley/ai-tools",
      "skills": ["!bundles/experimental/**"]
    }
  ]
}
```

Filter syntax: globs select, `!pattern` excludes, `[]` loads none of that resource type, an omitted key loads all. `pi config` edits the same settings interactively (Tab switches global ↔ project). Bundle boundaries are directory boundaries, so filters read like plugin names.

### Local development install

A directory install is a live reference, not a copy — working-tree edits are visible in the next Pi session:

```bash
# whole repo
pi install /path/to/ai-tools

# a single bundle (per-bundle manifests activate on direct installs)
pi install /path/to/ai-tools/bundles/project-management
```

### Capability notes

The skills are written capability-conditionally: Claude Code features are used when present, with documented degradations elsewhere. On Pi (and other Agent Skills harnesses), expect:

- **dr-research** — requires web search/fetch; install a web-access package before using it.
- **dr-ship** — requires git; the PR step needs the GitHub CLI (`gh`) and a GitHub remote, otherwise it displays the PR content for manual use.
- **mvp** — runs in Reduced Sequential Mode (tasks execute inline and sequentially instead of via parallel subagents/worktrees) with single-session setup; requires git.
- **Everything else** (dr-init, dr-plan, dr-prd, frontend-design, react-19) — runs on stock capabilities; structured-question and verifier-subagent steps fall back to plain text and inline self-review.

## Repository Layout

```
.claude-plugin/marketplace.json   # Claude catalog — sources point at ./bundles/*
package.json                      # Pi catalog (private) — pi.skills globs bundles/*/skills/*
bundles/<name>/                   # one bundle = one plugin: skills/, agents/, both manifests
pi/ · claude/                     # cross-cutting harness-exclusive artifacts (absent until needed)
```

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines, the repository structure, and the release ritual.

## License

MIT
