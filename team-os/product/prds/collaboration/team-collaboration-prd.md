---
type: prd
feature: team-collaboration
stage: 2  # Planning Review
status: planning
owner: raziiabraham
last_updated: 2026-08-13
note: Nothing built. Blocked on user research: 0 of 8 originally specced features shipped.
---

# PRD: Team Collaboration (v1 scope)

**Author:** raziiabraham
**Date (first draft):** 2025-12-25 (as `specs/02-team-collaboration.md`, migrated into this rewrite on 2026-04-18; see git history before 2026-04-18 for the original)
**Date (rewrite):** 2026-04-18
**Status:** **Stage 2 — Planning Review** (nothing built; this PRD is here to define a realistic v1, not to hand to engineering yet)
**Feature index entry:** [`team-collaboration` in team-os/feature-index.yaml](../../../feature-index.yaml)

---

## Honest starting line

- **Today, Noted has no multi-user features.** The only "sharing" is publish-to-web (read-only public link).
- `convex/schema.ts` has a single-owner `documents` table (`userId` field), no workspace / member / permission / comment tables.
- The original Dec 2025 spec described 8 major collaboration features (workspaces, members, roles, sharing, comments, guest access, templates, activity). **0 of 8 were implemented.**

This PRD replaces that spec and proposes a _trimmed_ v1 that is realistic for a small team to build and maintain. We can expand later. We do not need Notion parity at v1.

## 1. Hypothesis

We believe shipping a **minimal team v1** — shared workspace, invite by email, two roles (editor, viewer), read-only sharing already covered — will unlock the small-team segment (2–10 people) and create the first real path to paid revenue. We'll measure success by: % of signups who invite at least one other user within 14 days.

## 2. Problem

- **Who:** small teams (2–10 people) who already use Notion or Coda but want lower AI cost and don't need databases. They tell us "I'd move my team over if Noted let me share a workspace."
- **How bad:** **we don't have data.** No user research has been run on this segment yet. This is a planning-stage PRD, not a solution-review. Before we build, run at least 5 user interviews — use [`/user-research`](../../../../.claude/commands/) to synthesize.
- **Current workaround for users who want Noted anyway:** publish-to-web + copy-paste + a side channel (Slack, email). Loses every advantage Noted has.
- **What happens if we don't solve it:** Noted stays a single-player app. No network effects, no team plan to sell, no compelling upgrade.

## 3. Strategic fit

- **Why this, why now:** the AI features are live and differentiated. Without a team story, we can't sell a team plan. Paywall (see [../paywall/paywall-subscription-prd.md](../paywall/paywall-subscription-prd.md)) is blocked on this.
- **Alternatives considered:**
  - _Skip collaboration, focus on individuals + creators._ Viable niche but smaller ceiling. Probably wrong for where we want to go.
  - _Full Notion-parity collab (everything in the old spec)._ Too much scope for a team of 3. Would take 4+ months and still be a worse Notion.
  - _This proposal — minimal v1._ Workspaces, invites, two roles, plus existing publish-to-web. 4–6 weeks scope.

## 4. Proposed v1 solution

### In scope

1. **Workspaces**
   - Each user auto-gets a personal workspace (migration from current single-tenant model).
   - Users can create additional workspaces (name + optional emoji icon).
   - Workspace switcher in the sidebar.
2. **Invite by email**
   - Workspace owner enters email → Noted sends invite (via Clerk's existing email infrastructure).
   - Invitee signs in / signs up → joins workspace automatically.
   - Invites expire after 7 days.
3. **Two roles per workspace**
   - **Owner** — full control, can delete workspace, manage members.
   - **Editor** — can create, edit, archive documents.
   - (No Viewer role at v1. Viewers are covered by the existing publish-to-web primitive.)
4. **Document ownership tied to workspace**
   - Documents belong to a workspace, not a user.
   - All workspace members can see and edit all workspace documents.
   - No per-document permissions at v1 (intentional — see Non-goals).

### Out of scope for v1 (explicit non-goals)

- ❌ Per-document sharing with specific people (workspace-level only).
- ❌ Comments, @mentions, comment threads, resolve/unresolve.
- ❌ Real-time presence, live cursors, simultaneous-edit conflict handling.
- ❌ Guest accounts (distinct from members).
- ❌ Activity feed / notifications / digest emails.
- ❌ Page templates and template library.
- ❌ Custom roles beyond owner/editor.
- ❌ Member activity logs or audit trails.
- ❌ Workspace-level branding.

Each of these is a reasonable v2 feature. Pick the one with the most user demand after v1 ships.

## 5. Success metrics

| Metric                                                        | Type      | Baseline           | Target         | Timeframe            |
| ------------------------------------------------------------- | --------- | ------------------ | -------------- | -------------------- |
| % of signups who invite ≥1 user within 14 days                | Primary   | N/A                | 15%            | 90 days after launch |
| Workspaces with ≥2 active members / total workspaces          | Primary   | N/A                | 10%            | 90 days              |
| Convex `documents` query error rate after workspace migration | Guardrail | 0.X% baseline, TBD | ≤1.5× baseline | from launch          |
| Support tickets tagged `workspaces` or `invites` per week     | Guardrail | 0                  | ≤10            | first 4 weeks        |

**Anti-metric:** invites-sent going up while invite-accepted going down — signals broken email flow or confusing onboarding.

Instrumentation requires new Convex events (`workspace_created`, `invite_sent`, `invite_accepted`, `member_joined`). Define these alongside the engineering RFC.

## 6. Rollout plan

**Approach:** gradual rollout with a migration.

**Migration risk is the big thing.** Existing users need their current documents moved into a new "Personal" workspace without data loss. Plan:

1. Ship workspace infrastructure (schema) without exposing UI.
2. Background migrate: every existing user's docs → auto-created personal workspace with the user as sole owner.
3. Verify migration on staging, then production.
4. Then enable UI (workspace switcher, invite button) behind a feature flag.
5. 10% → 50% → 100% rollout over 2 weeks.

**Rollback:** keep the single-tenant `userId` field on documents for at least 60 days post-launch so we can revert in emergency.

## 7. Open questions

| Question                                                                                                                                    | Owner                                                            | Due            |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------- |
| What does Clerk support for email invite flows? Can we use their existing invitation primitive, or do we need a custom Convex email action? | `@avidx-app`                                                     | before Stage 4 |
| How do we handle the user's _current_ documents during migration — auto-create one workspace, or prompt the user?                           | `@raziiabraham`                                                  | before Stage 4 |
| Do we charge for multi-user workspaces, or keep v1 free to drive adoption?                                                                  | blocked on [paywall PRD](../paywall/paywall-subscription-prd.md) | before launch  |
| `[NEED: 5 user interviews]` — do small teams actually want workspace-level sharing, or would they prefer per-doc sharing?                   | `@raziiabraham`                                                  | before Stage 3 |

## 8. What to read next

- [`team-os/research/competitors/notion/teardown.md`](../../../research/competitors/notion/teardown.md) — how Notion handles workspaces, pricing, what's weak.
- [`../paywall/paywall-subscription-prd.md`](../paywall/paywall-subscription-prd.md) — blocked on this PRD.

---

_Historical source: `specs/02-team-collaboration.md` (removed 2026-04-18; see git history for the original Dec 2025 version). Superseded by this planning-stage rewrite._
