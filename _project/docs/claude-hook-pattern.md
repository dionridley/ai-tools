# Pattern: Adding a Claude Code Hook to This Repo

**Status:** mechanism proven, no production hook shipped yet
**Verified:** 2026-07-16 by the Claude hook spike (plan 009) against the live `ai-tools` directory-marketplace install. Local working notes and full evidence transcripts live in `.research/claude-hook-spike/` (gitignored).

Hooks are event-driven commands Claude Code executes in response to session events (SessionStart, PreToolUse, Stop, …). They are executable configuration — a distinct artifact type from skills and agents (which are passive markdown) — and have no Pi equivalent, which is why they sit on the Claude side of the exclusivity rule.

## Where the file lives (ownership rule)

**Plugin-channel hooks are necessarily bundle-owned.** The plugin contract requires every component at the plugin root with `./`-relative manifest paths — there is no documented mechanism for a plugin to load an artifact from outside its own root (traversal was deliberately not attempted; an undocumented hack would be an unsupported foundation). So a hook served through the marketplace always lives inside a bundle:

```
bundles/<bundle>/hooks/hooks.json
```

Root `claude/` therefore does **not** serve the plugin channel. It remains the escape hatch for *non-plugin* Claude-exclusive artifacts — things wired through user/project settings rather than a bundle manifest (none exist yet). This is the Claude-side counterpart of plan 008's Pi nuance (where even bundle-owned extensions wire through the root manifest): here the asymmetry runs the other way — there is no root-level wiring at all.

## Wiring (exclusivity rule)

**No manifest change needed.** Claude Code auto-discovers `hooks/hooks.json` at the bundle's plugin root when the plugin is enabled — the spike ran with `plugin.json` untouched. (An explicit `"hooks": "./path/to/hooks.json"` field in plugin.json is the documented alternative for non-standard paths.)

Plugin hooks use a **wrapper format** — events nest under a `"hooks"` key (unlike user `settings.json`, where events sit at top level):

```json
{
  "description": "Plan 009 spike demo — inert SessionStart hook proving the mechanism; removed at disposition",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'ai-tools claude-hook-spike: pong — served from the experimental bundle (plan 009)'",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

This is the spike's demo verbatim (byte-identical archived copy: `.research/claude-hook-spike/hooks.json`) — a known-working starting point. Handler `type`s beyond `command` exist (`prompt`, and newer `http`/`mcp_tool`/`agent`); tool events additionally take a `matcher` filter.

## Windows execution

Shell-form hook commands run via **Git Bash on Windows by default** (PowerShell only when Git Bash is absent, or when `"shell": "powershell"` is set). Write hook commands as POSIX shell and they work on this machine and on Unix. Exec form (`command` + `args`) requires a real executable on Windows — `.cmd`/`.bat` shims won't spawn; invoke `node` directly for npm-installed tools.

## Reload and test story

- **Hooks load at session start — no hot-swap.** Editing `hooks/hooks.json` never affects a running session; any new session (including headless) picks it up.
- **A headless run is the agent-drivable smoke test** (the analog of Pi's `pi -e` channel): `claude -p "..."` is a fresh session by construction and loads plugin hooks — proven by the spike. For a SessionStart hook, stdout is injected as model-visible context, so the round-trip proof is asking the headless session to quote the injected line.
- Interactive inspection: `/hooks` lists loaded hooks; `claude --debug` is the documented debug surface (note: in `-p` mode the spike observed no debug output on stderr — rely on the context round-trip instead).

## Install path and blast radius

- **The directory marketplace serves plugins in place from this working tree.** An **uncommitted** `hooks/hooks.json` goes live in the next session — no commit, no version bump, no reinstall. (The versioned copies under `~/.claude/plugins/cache/ai-tools/` are not the serving path for a directory-source install; the spike's cache copy never contained the hook, yet it fired.)
- Normal (non-directory) marketplace installs deliver hooks with the plugin's installed version, like any other component — per the documented install model; not spike-tested.
- **Enablement scope = blast radius.** The ai-tools bundles are enabled at user scope on this machine, so a wired hook fires in **every** Claude Code session, all projects, until removed. Wiring a hook into a bundle here *is* enabling it globally on next session start.

## Safety discipline

Hooks execute shell commands. House rules from the Stage 3 PRD, applied by the spike:

1. Demo/experimental hooks stay **inert and read-only** (the spike's was a single static `echo` — no stdin use, no writes, no network, no secrets, explicit timeout).
2. Review the exact command as wired **before** any session loads it — with in-place serving, writing the file is enabling it.
3. Keep the wired window short for throwaway artifacts; deletion restores cleanly at the next session start.

## Version ritual

A hook inside a bundle is bundle content: shipping a **kept** hook requires that bundle's version ritual (plugin.json + package.json + marketplace.json + CHANGELOG). A spike demo removed before merge leaves every manifest net-unchanged — no version event (this spike's path).

## Post-spike state

The spike's demo was removed per the Stage 3 disposition convention (mechanism proven, no production use case yet): `bundles/experimental/hooks/` is gone, every manifest is net-unchanged, and `claude/` keeps its `.gitkeep`. To add the first real hook: drop a wrapper-format `hooks/hooks.json` into the owning bundle per the recipe above (convention path — no manifest change), review the command, and run the bundle's version ritual before shipping. Everything in this doc is the verified recipe.
