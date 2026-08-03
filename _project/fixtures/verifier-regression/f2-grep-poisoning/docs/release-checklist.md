# Release checklist

<!-- FIXTURE — intentionally defective. See ../../README.md. Do not repair. -->

Run before cutting a release.

1. All tests green.
2. Version bumped in the manifest.
3. Changelog entry written and dated.
4. **No outstanding deferrals.** Run the audit from `audit-guide.md` and confirm it returns
   nothing. A release must not ship with an unresolved deferral.
5. Tag the release commit.

Steps 1–3 and 5 are mechanical. Step 4 is the only one that requires reading the output.
