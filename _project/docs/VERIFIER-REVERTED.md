# ⚠ `plan-verifier.md` IS DELIBERATELY REVERTED RIGHT NOW

**If you are reading this file, the repo is mid-experiment and is NOT in its intended state.**

`bundles/project-management/agents/plan-verifier.md` has been rolled back to its pre-plan-014
version (`30ba775`) to run Arm B of the variance study described in `verifier-variance-study.md`.

## Restore it

```bash
git checkout HEAD -- bundles/project-management/agents/plan-verifier.md
git rm _project/docs/VERIFIER-REVERTED.md     # or plain rm if it is untracked
```

Then **ask the user to run `/reload-plugins`** — Claude Code caches the agent definition per
session, so the file on disk changing is not enough. Confirm the restore took by spawning one
verifier with the instructions-check appendix (see `verifier-variance-study.md`, Step 0) and
checking it reports **7** numbered steps. The reverted definition reports **6**.

## Why this file exists

The study reverts a live agent definition. If the session running it ends before the restore step,
the repo is left silently serving the old verifier — the plan-014 improvements would be inert with
nothing on disk saying why. This marker is the recovery path.

The restored file should be **10,548 bytes**. `git diff --stat` against `HEAD` should be empty.

**Deleting this file without doing the restore is the one thing you must not do.**
