# Pattern: Adding a Pi Extension to This Repo

**Status:** mechanism proven, no production extension shipped yet
**Verified:** 2026-07-16 by the Pi extension spike (plan 008) against pi 0.80.7 / pi-mono `b8575f6` (coding-agent v0.80.9). Local working notes and full evidence transcripts live in `.research/pi-extension-spike/` (gitignored).

Pi extensions are TypeScript modules that extend the Pi agent itself — lifecycle event handlers, model-callable tools, slash commands, UI. They are a distinct artifact type from skills and have no Claude Code equivalent, which is why they live behind the `pi/` escape hatch.

## Where the file lives (ownership rule)

- **Cross-cutting extension** (not tied to one bundle): `pi/extensions/<name>.ts`
- **Bundle-owned extension**: inside its bundle, e.g. `bundles/<bundle>/extensions/<name>.ts`

Either way, discovery is driven by the **root** `package.json` — on a whole-repo `pi install git:…`, the root manifest is the only one Pi reads (per-bundle `package.json` files are inert, same as for skills). So the location follows ownership, but the wiring is always the root Pi catalog.

## Manifest wiring (exclusivity rule)

Add an `extensions` array to the existing `pi` object in the root `package.json`, next to `pi.skills`:

```json
"pi": {
  "skills": ["bundles/*/skills/*"],
  "extensions": ["./pi/extensions"]
}
```

- Paths are relative to the package root; arrays support globs and `!exclusions`.
- A directory entry loads its direct `*.ts`/`*.js` files; subdirectories load via `index.ts` or their own `package.json` `pi` manifest. **No recursion beyond one level.**
- Declaring it explicitly is required here: Pi's convention-directory auto-discovery (a bare `extensions/` folder) only applies to packages with **no** `pi` manifest, and ours has one.
- Nonexistent declared paths are skipped **silently** — a typo'd path produces no error, just a missing extension. Verify with a live load (below).
- The spike confirmed `pi.skills` and `pi.extensions` coexist with no interference (skill discovery unchanged with the extension present).

## File shape

A module whose default export is a factory (sync or async) receiving `ExtensionAPI`. This is the spike's demo verbatim (archived copy with the demo comment header: `.research/pi-extension-spike/ai-tools-ping.ts`) — a known-working starting point:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.notify("ai-tools demo extension loaded (pi/extensions escape hatch works)", "info");
	});

	pi.registerCommand("ai-tools-ping", {
		description: "Demo: prove the ai-tools pi/extensions mechanism executes",
		handler: async (_args, ctx) => {
			ctx.ui.notify("pong — served from ai-tools pi/extensions", "info");
		},
	});

	pi.registerTool({
		name: "ai_tools_ping",
		label: "ai-tools ping",
		description: "Demo tool: returns a static pong proving the ai-tools pi/extensions escape hatch executes",
		parameters: Type.Object({}),
		async execute() {
			return {
				content: [{ type: "text", text: "pong — served from ai-tools pi/extensions" }],
				details: {},
			};
		},
	});
}
```

- `import type` from `@earendil-works/pi-coding-agent` is erased at runtime; Pi aliases/bundles its core packages for extensions, so a self-contained extension has zero runtime dependencies to install.
- Third-party npm deps, if ever needed, go in root `dependencies` (Pi runs `npm install` on package install/reconcile); pi core packages go in `peerDependencies` with `"*"`.
- Full API surface (events, tools, commands, shortcuts, flags, renderers): pi-mono `packages/coding-agent/docs/extensions.md`.

## Build step

**None.** Pi loads TypeScript at runtime via jiti — no `tsc`, no `dist/`, no bundling. Ship the raw `.ts` file.

## Install and test paths

| Purpose | Command | Notes |
|---|---|---|
| Quick test, one file | `pi -e ./pi/extensions/<name>.ts` | One run only, nothing persisted; a bad path fails loudly (exit 1) before any model call |
| Test whole repo as a package | `pi -e S:/dev/repos/dionridley/ai-tools` | Exercises the manifest + discovery exactly like an installed package; expect benign `[Skill conflicts]` notices if the repo is also installed via git — the temp (`-e`) copies win for that run |
| Agent-drivable smoke test | `pi -e <path> -p "Call the <tool> tool …"` | Print mode runs extensions but `ctx.ui` is a no-op — use a registered tool for observable output |
| Production (existing channel) | already installed: `git:github.com/dionridley/ai-tools` | Unpinned → tracks main; after merging, `pi update --all` reconciles the clone and the extension goes live |

Not verified by the spike: git installs pinned to a branch ref (docs allow tags/commits only) and the npm channel (out of scope — the root package is private).

## Post-spike state

The spike's demo was removed per the Stage 3 disposition decision (mechanism proven, no production use case yet): `pi/` holds a `.gitkeep`, and the root manifest carries no `pi.extensions` entry. To add the first real extension, restore the wiring above and drop the file in `pi/extensions/` — everything in this doc is the verified recipe. The post-merge git-channel confirmation (extension arriving via `pi update --all`) is deferred until a real extension ships, since no extension rides the git channel today.
