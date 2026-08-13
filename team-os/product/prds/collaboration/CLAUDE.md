# PRDs — Collaboration

| File                                                   | Stage               | Summary                                                                                                                          |
| ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [team-collaboration-prd.md](team-collaboration-prd.md) | 2 — Planning Review | Team workspaces, members, comments, real-time presence. Nothing shipped yet. Needs scoping to a realistic v1 before engineering. |

## Current state of collaboration in Noted

Live today: **publish-to-web only**. One-way public broadcast — anyone with the link can view a document read-only. Uses `isPublished` flag on the `documents` table ([`convex/schema.ts`](../../../../convex/schema.ts)) + the `publish` UI component.

Not live: multi-user editing, team workspaces, members, roles, comments, @mentions, real-time presence, guest access, templates, activity feed. The original spec promised all of these; code has none.

Any new PRD in this folder should be honest about that starting line. Don't pretend publish-to-web is "collaboration."
