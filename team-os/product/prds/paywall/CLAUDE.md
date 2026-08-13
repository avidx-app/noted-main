# PRDs — Paywall & Subscription

| File                                                       | Stage               | Summary                                                                                                   |
| ---------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| [paywall-subscription-prd.md](paywall-subscription-prd.md) | 2 — Planning Review | Pricing tiers, Stripe integration, feature gates. Nothing built. Blocked on team-collab v1 landing first. |

## Current state of monetization in Noted

**Noted generates zero revenue today.** There is no Stripe, no subscription table, no pricing page, no upgrade flow. The only hard limit in code is a 25 MB-per-file upload cap ([`convex/storage.ts`](../../../../convex/storage.ts)) that isn't tied to any plan concept.

The original Dec 2025 spec proposed four tiers (Free / Plus / Team / Enterprise) with trials, feature gates, and Stripe billing. **0 of 5 major features were implemented.**

Any PRD in this folder should start from that reality and sequence carefully — paywall without multi-user workspaces doesn't have much to charge for (AI is BYOK, individual use is free).
