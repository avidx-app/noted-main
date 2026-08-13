---
type: prd
feature: paywall-subscription
stage: 2 # Planning Review
status: planning
owner: raziiabraham
last_updated: 2026-08-13
note: Blocked by team-collaboration. Noted has no revenue.
---

# PRD: Paywall & Subscription (v1 scope)

**Author:** raziiabraham
**Date (first draft):** 2025-12-25 (as `specs/03-paywall-subscription.md`, migrated into this rewrite on 2026-04-18; see git history before 2026-04-18 for the original)
**Date (rewrite):** 2026-04-18
**Status:** **Stage 2 — Planning Review** (nothing built; blocked on team-collab v1 shipping first)
**Feature index entry:** [`paywall-subscription` in team-os/feature-index.yaml](../../../feature-index.yaml)

---

## Honest starting line

- **Noted has no monetization infrastructure.** No Stripe, no plans, no tiers, no gates.
- The one limit in code is a 25 MB-per-file upload cap in [`convex/storage.ts`](../../../../convex/storage.ts). Not tied to any plan.
- The Dec 2025 spec proposed Free / Plus ($8) / Team ($15) / Enterprise with 14-day and 30-day trials. **None of this was built.**

This PRD replaces that spec and proposes a much tighter v1 that respects the reality: **Noted has nothing compelling to charge individuals for** (AI is BYOK). The hook is team features, which aren't live either.

## 1. Hypothesis

We believe pricing a **team plan at $15 / user / month** (monthly) and launching it the moment [team-collab v1](../collaboration/team-collaboration-prd.md) ships will convert 3–5% of free accounts with ≥2 members into paying teams within 90 days.

## 2. Problem

- **Who (not the user — us):** Noted has no revenue. We need a path to it that doesn't compromise the BYOK AI story.
- **Why now:** monetization infrastructure takes weeks. If we wait to start until after team-collab ships, we delay revenue by another month. Building paywall scaffolding in parallel makes sense.
- **Why not gate AI:** users bring their own OpenAI / Anthropic / Google keys. We pay nothing for the AI itself. Gating AI would require switching to a hosted-key model (a different product decision) and would erase our clearest differentiator.
- **What remains to charge for:** **team features.** Individual use stays free forever.

## 3. Strategic fit

- **Why teams:** matches Notion's playbook (free for individuals, $18/seat for business). Copy the shape, undercut on price ($15/seat), don't charge for AI.
- **Alternatives considered:**
  - _Charge for AI (drop BYOK)._ Rejected — it would erase our single positioning advantage.
  - _Charge for storage/uploads beyond a cap._ Rejected for v1 — too small a value prop, too annoying, inevitable support cost.
  - _Freemium on features (e.g., inline auto-complete for Plus)._ We don't have inline auto-complete. Rejected for v1.
  - _Sell support / SLA._ Reasonable long-tail — "Enterprise" line — but we have no enterprise demand today. Defer.

## 4. Proposed v1 solution

### Pricing (v1)

| Plan     | Price                                      | Who it's for      | What they get vs Free                                                                                         |
| -------- | ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Free** | $0 forever                                 | Individuals       | Everything Noted does today + a personal workspace. Unlimited pages, BYOK AI, publish-to-web, 25 MB file cap. |
| **Team** | $15 / user / month (or $144 / user / year) | 2–10 person teams | Free + **shared workspaces**, **invite members**, **workspace-level roles**. _(All team-collab v1 features.)_ |

No Plus tier at v1. No Enterprise tier at v1. Keep it tight.

### Scope

1. **Stripe integration**
   - Stripe Checkout for new subscriptions.
   - Stripe Customer Portal for payment method, downgrade, cancellation.
   - Webhooks processed by a Convex HTTP action for `subscription.created`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`.
2. **Plan state in Convex**
   - `subscriptions` table: `userId` (owner), `workspaceId` (billed entity), `stripeCustomerId`, `stripeSubscriptionId`, `status`, `currentPeriodEnd`, `seatCount`.
   - Plan flag on `workspaces` table.
3. **Feature gate at the workspace level**
   - The _create-workspace_ action or the _invite-member_ mutation checks the workspace's plan. If Free + already has ≥1 other member, block with an upgrade modal.
   - Gate implementation lives in one place (a `requireTeamPlan()` helper) — do not sprinkle across mutations.
4. **Upgrade UX**
   - Upgrade modal triggers when a Free-plan workspace tries to add a second member.
   - Pricing page at `/pricing` with a Stripe Checkout button.
   - Success redirect with a confetti animation (`sonner` toast is fine, no need for fancy libs).
5. **Downgrade + cancellation**
   - Handled entirely through Stripe Customer Portal at v1.
   - On `subscription.deleted` webhook: workspace reverts to Free, excess members lose write access (gracefully, not destructively — they stay listed, no delete).

### Explicit non-goals for v1

- ❌ Plus tier (no clear value prop without AI gating).
- ❌ Enterprise tier (no customers).
- ❌ Student / teacher / non-profit discounts (later, once we have support for applications).
- ❌ Referral program ("give $10, get $10") (later).
- ❌ 14-day / 30-day free trials (defer — measure conversion on paid-out-of-gate first, add trials only if conversion is weak).
- ❌ Prorated seat adjustments (Stripe handles; we don't expose a UI beyond the Portal).
- ❌ Usage-based billing or credits.

## 5. Success metrics

| Metric                                                         | Type      | Baseline | Target      | Timeframe            |
| -------------------------------------------------------------- | --------- | -------- | ----------- | -------------------- |
| % of multi-member workspaces on a paid plan                    | Primary   | N/A      | 3%          | 90 days after launch |
| MRR (gross)                                                    | Primary   | $0       | $5K         | 180 days             |
| Checkout → active subscription conversion rate                 | Secondary | N/A      | ≥85%        | ongoing              |
| Involuntary churn (failed payments that don't recover)         | Guardrail | N/A      | ≤5% monthly | ongoing              |
| Support tickets tagged `billing` per paying customer per month | Guardrail | N/A      | ≤0.2        | first 90 days        |

**Anti-metric:** Users creating workspaces, hitting the 2-member gate, and abandoning Noted (as measured by zero activity for 14 days post-gate-hit). If this fires, the gate is too aggressive.

## 6. Rollout plan

**Approach:** launch to 100% on day one — no gradual rollout. This is a net-new flow; no one's already paying.

**Prerequisites (blocking launch):**

1. Team collaboration v1 must be shipped.
2. Stripe account set up with products for "Team Monthly" and "Team Yearly" price IDs.
3. Webhook handler tested end-to-end in staging.

**Rollback:** if Stripe integration breaks, flip a feature flag that hides the upgrade modal and the pricing page. Existing subscriptions continue; no new ones can be created.

## 7. Open questions

| Question                                                                                                            | Owner           | Due                |
| ------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------ |
| Legal entity + tax setup for Stripe — who handles?                                                                  | `@raziiabraham` | before code starts |
| Do we want annual-only pricing, monthly-only, or both at launch? Monthly adds churn risk; annual reduces conversion | `@raziiabraham` | before Stage 4     |
| Which GitHub account is the "owner" for Stripe billing metadata?                                                    | TBD             | before Stage 4     |
| Refund policy — Stripe's default (30-day money-back) or stricter?                                                   | `@raziiabraham` | before launch      |
| `[NEED: data]` — how many Noted accounts _could_ become multi-member teams today? Unknown                           | `@raziiabraham` | before launch      |

## 8. Sequencing with other work

This PRD is **blocked** on:

- [team-collaboration-prd.md](../collaboration/team-collaboration-prd.md) landing — we need workspaces + invites to have something to charge for.

This PRD **blocks**:

- Any "growth" PRDs around landing page, onboarding funnel, pricing experiments. See [`team-os/growth/`](../../../growth/).

## 9. What to read next

- [`team-os/research/competitors/notion/teardown.md#4-generous-free-tier-priced-for-teams`](../../../research/competitors/notion/teardown.md) — Notion's pricing playbook, what to copy.
- [`team-os/product/positioning.md#vs-notion`](../../positioning.md) — pricing comparison block.

---

_Historical source: `specs/03-paywall-subscription.md` (removed 2026-04-18; see git history for the original Dec 2025 version). Superseded by this tighter rewrite._
