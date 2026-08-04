# Shared approval block

<!-- FIXTURE — intentionally defective. See ../../README.md. Do not repair. -->

The following block is pasted verbatim into every workflow that requires a second approver. It
is maintained here and copied out; the copies must not be edited in place.

```
- [ ] **Second approver signed off.** The approver is not the author, and has read the change
  rather than the summary of it. Record the approver's name and the date.
  1. **Same-team approver (preferred)** — someone who owns the affected surface.
  2. **Cross-team approver** — acceptable when no same-team approver is available within the
     window; record which condition applied.
  3. **Never self-approve** — if no approver can be found, the change waits. An unapproved
     change that ships is the outcome this block exists to prevent.
- [ ] **Approval recorded.** Name and date written into the change log, not just the ticket.
```

Consumers: `deploy-workflow.md`, `schema-change-workflow.md`.
