---
name: business-rules-authoring
description: Helps the founder/CEO capture their own business/commercial rules (pricing, outbound policy, valid outcome definitions, cadence SLAs, guardrails, compliance requirements) as skills the backend consults automatically. Load when the requester wants to add, update, or ask about "our rules for X" — pricing logic, what counts as a valid outcome, cadence timing rules, lockout thresholds, guardrail limits, LGPD/compliance requirements — even if they don't use the word "skill" themselves.
---

# Capturing business rules as skills

The founder knows things about how Comitai Dialer *should* behave that aren't in any code
yet — pricing tiers, what counts as a "qualified" outcome, how many failed calls before a
prospect gets skipped, what LGPD requires for this data, etc. Those rules matter every
time a backend feature gets built or changed. This skill is about **capturing them once,
as a skill, so every future session automatically knows them** — instead of the founder
re-explaining the same rule every time, or a future change silently violating it.

## When to use this skill

The founder doesn't need to say "let's write a skill." Any of these mean it's time:
- "Our rule is..." / "We always..." / "We never..."
- A pricing, discount, or billing rule mentioned in passing while asking for a feature.
- A definition of a domain term specific to this business ("a 'qualified lead' means...").
- A compliance/legal requirement ("we have to delete X after Y days for LGPD").
- A threshold or limit that isn't in the code yet ("no more than 3 calls before...").
- Correcting something you built ("actually, outcomes should also include...") — that
  correction is itself a rule worth capturing so it doesn't get re-broken later.

## How to capture one

1. **Ask only what's genuinely ambiguous.** If the founder states a clear rule, don't
   interrogate it — write it down. Only use AskUserQuestion for a real fork (e.g. "does
   this apply to existing prospects too, or only new ones going forward?").
2. **Write it as a skill**, not a code comment or a chat reply that will be forgotten:
   - Location: `apps/backend/.claude/skills/<short-kebab-name>/SKILL.md` — e.g.
     `outcome-definitions`, `pricing-rules`, `cadence-policy`, `lgpd-requirements`. One
     skill per coherent topic; don't dump every rule into one giant file, and don't
     create a new one-off skill per tiny fact — group related rules together the same
     way `outcome-definitions` would hold every rule about what a dialer outcome means,
     not just one.
   - Frontmatter `description`: written so future-you (or another session) knows to load
     it — name the concrete triggers ("load when building/changing anything related to
     dialer outcomes, cadence timing, or the outcome dropdown").
   - Body: the rule itself, in plain language, **plus** where it's currently enforced in
     code if it already is (file:line) so the skill stays a live cross-reference, not a
     stale duplicate. If it's not enforced anywhere yet, say that explicitly — it's a
     TODO, not a lie.
3. **Cross-link.** If the rule affects backend validation, mention it from
   `apps/backend/AGENTS.md` or the relevant feature's DTO comments so a future change to
   that DTO points back at the rule. If it also affects frontend copy/flow, note that too
   — a business rule usually isn't backend-only even though the skill lives in
   `apps/backend/.claude/skills/`.
4. **Confirm back in plain language** what you captured, so the founder can correct it
   immediately if you got a nuance wrong — don't let a misunderstood rule sit silently in
   a skill file.

## Example

Founder says: *"Calls only count as a real conversation if the prospect talks for at
least 30 seconds — voicemail or under 30 seconds doesn't count, no matter what outcome
gets picked."*

That becomes `apps/backend/.claude/skills/outcome-definitions/SKILL.md`:

```markdown
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

**Where this should be enforced:** not yet implemented — the current `dialer` feature
on the frontend (`apps/frontend/src/features/dialer`) is a UI-only simulation with no
backend call-duration tracking. When real Twilio call data lands (see the
`external-integrations` skill's Twilio section), the backend's call-completion handler
must check duration >= 30s before writing/counting an Interaction as a conversation —
this is the natural enforcement point, not the frontend outcome picker (a BDR shouldn't
be able to override it by clicking a different outcome button).

**Source:** founder, 2026-08-20.
```

## Reference: this pattern already exists once in this repo

`AGENTS.md`'s Security model section in `apps/backend/AGENTS.md` is itself a "rules" doc
in the same spirit (though authored as project conventions rather than business rules) —
same idea of writing the rule down once, in one place, with enough context that a future
session enforces it correctly instead of re-deriving or forgetting it.
