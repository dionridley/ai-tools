# Example: What a Great index.md Looks Like

This is an annotated example showing the quality standards for a research index file. Comments in `<!-- -->` explain why each section works.

---

# Research: Stripe Minimal Backend Integration

**Date:** 2025-12-16
**Research Question:** How to integrate Stripe with minimal backend code, leveraging hosted solutions for checkout and subscription management while connecting purchases to internal user accounts.

<!-- The research question is specific and scoped — not just "Stripe integration" but the specific angle being investigated. -->

> **Answer: Use Stripe's hosted surfaces (Pricing Table + Customer Portal) with a single webhook — the full integration is roughly one endpoint and one database column.** Confidence: High.
> **Exceptions:** usage-based billing and more than 4 products per billing interval both break the Pricing Table and force the Checkout Sessions API.
> **Verification:** rests on claims 1–3 Confirmed, claim 4 Single-source — see the [Claim Ledger](./findings.md#claim-ledger).

<!-- The answer block is the reason the index exists: a bolded verdict sentence that directly answers the research question, a confidence word consistent with the evidence, and the exceptions that flip the answer. Exceptions are part of the answer, not a footnote — a reader who hits the 1-of-N failure case was still served. The Verification line appears on the Deep path and cites ledger verdicts by number. Blockquote format renders as the highlighted callout in the HTML view. -->

## Scope

Researched: hosted checkout options, linking purchases to internal user accounts, the minimum webhook surface, and querying subscription status. Not researched: usage-based billing, marketplace/Connect flows, tax handling.

<!-- Scope states what was NOT researched. The reader learns the boundaries of the answer before trusting it. -->

## Key Takeaways

1. **Payment Links + Pricing Table = zero backend for checkout** — Products configured entirely in Stripe Dashboard, checkout UI hosted by Stripe, no card data touches your server
2. **Customer Portal eliminates subscription management UI** — Users self-serve upgrades, downgrades, cancellations, and payment method updates
3. **Only 1 webhook needed to start** — `checkout.session.completed` links Stripe customers to your users via `client_reference_id`
4. **Query Stripe API for status, don't cache locally** — Trades network latency for zero sync complexity; revisit only if volume makes rate limits real

<!-- Each takeaway is "X, therefore Y" — a fact plus why it matters / what to do about it. "Payment Links + Pricing Table" alone is a fact; adding "= zero backend for checkout" makes it an insight. -->

<!-- Note what is deliberately ABSENT here: a concept-map diagram. The index gets a diagram only when it passes the rubric in references/diagrams.md — a mindmap or flowchart that re-lists the report's own structure is decoration. The diagram this research earns (the checkout sequence) lives in findings.md, next to the flow it explains. The verdict is also stated exactly once here (and once more in recommendations.md) — findings presents evidence, not the verdict again. -->

## Research Files

- **[Findings](./findings.md)** — Stripe's hosted solutions, user-to-Stripe linking, webhook requirements, API status queries
- **[Resources](./resources.md)** — Bibliography of Stripe documentation, community guides, and library references
- **[Recommendations](./recommendations.md)** — Phased implementation plan starting with Pricing Table embed

<!-- File descriptions tell the reader what's IN the file, not just what the file IS. "Core research findings" is useless. "Stripe's hosted solutions, user-to-Stripe linking..." tells you whether to click. Note the default file set: index + findings + resources, plus recommendations because this is decision research. A topic file would appear here only if it carried a standalone artifact (a scored matrix, a schema) — not prose that belongs in findings. Links point to .md files — the HTML view rewrites them automatically. -->

## Deep Dives

- **[Webhook Reliability Patterns](./deep-dives/webhook-reliability-2026-01-15/index.md)** — 2026-01-15 — Retry strategies, deduplication, and monitoring for production webhook endpoints

<!-- Deep dive links MUST point to index.md, not the directory. Directory links break in markdown viewers. If a deep dive overturns a conclusion in this file, the claim gets patched here (supersession rule) — not just linked. -->
