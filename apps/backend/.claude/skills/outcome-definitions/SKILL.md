---
name: outcome-definitions
description: What counts as a real conversation vs. an attempt for Comitai Dialer's dialer
  outcomes, and other domain definitions for call/outcome data. Load when building or
  changing anything touching dialer outcomes, conversation counting, or performance
  metrics that report "conversations" (e.g. the Overview/Metrics pages' conversation
  counts).
---

# Outcome & conversation definitions

**A call only counts as a real conversation if the prospect talked for at least 30
seconds.** Voicemail, no-answer, or any connected call under 30 seconds must NOT be
counted as a conversation for metrics purposes, regardless of which outcome the BDR
selects in the Dialer UI.

**Where this is enforced:** `apps/backend/src/calls/calls.service.ts`'s
`updateOutcome` method computes `Call.isConversation` server-side from
`durationSeconds >= 30` — it is never set directly from the DTO's `outcome` field, so a
BDR can't override it by picking a different outcome button. Any future code that reports
"conversations" (Overview KPIs, Metrics/Performance) must read `isConversation`, not
infer it from `outcome`.

**Source:** founder, 2026-08-20.
