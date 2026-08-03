# Escalation rules

<!-- FIXTURE — intentionally defective. See ../../README.md. Do not repair. -->

## When to escalate

An on-call engineer escalates when any of the following holds:

- Customer-visible errors exceed 1% of requests for more than five minutes.
- A data-loss condition is suspected, however unlikely.
- The mitigation requires a change no one on shift is authorised to make.
- Two independent subsystems are degraded at once.

Escalation is cheap and a false alarm costs nothing but a phone call, so escalate on suspicion
rather than waiting for confirmation. The engineer who escalates keeps the incident until the
responder explicitly takes it.

## Who to escalate to

Page in this order, waiting three minutes between steps:

- The service owner on the rota.
- The platform lead.
- The duty director.
