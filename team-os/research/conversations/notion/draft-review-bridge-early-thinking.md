---
type: notion-page
provenance: constructed
title: Draft review bridge — early thinking
author: Sarah
date: 2026-04-27
last_edited: 2026-05-02
status: never-moved-to-team-os
---

# Draft review bridge — early thinking

> **Constructed page.** This document was never in a real Notion workspace. It comes from the Vibe PM
> @ Noted simulation. See [`../CLAUDE.md`](../CLAUDE.md).

Notes from before the option was scoped and cancelled. Kept because one paragraph in it is right and
did not survive into anything else.

## The shape of the problem

Publishing is a single boolean. A document is private to its owner, or it is on the public internet at
a preview URL. There is no third state, and the third state is the one everybody describes wanting.

What people ask for, in their words, is *send it to one person*. What we keep hearing ourselves say is
*commenting*. Those are not the same request and we should stop merging them.

## Three framings, and they cost wildly different amounts

**1. It is an access problem.** The reviewer cannot get to the document. Fix: a sharing model —
recipients, capabilities, revocation. Weeks.

**2. It is a language problem.** The reviewer *can* get to the document, because a published document
is readable by anyone with the link. What stops the author is that the button says **Publish**, and
publishing sounds permanent and public. Mia said this almost exactly: it "already feels like a state
change", and "even if I technically only send the link to one person, the action itself feels too
final". Fix: different words, a visible way to un-publish, and possibly an unlisted-by-default
framing. Days.

**3. It is a feedback problem.** The reviewer can read it and has nowhere to respond, so the loop dies
in Slack. Fix: comments. Weeks, and nobody asked for it.

## Which one is it

Probably 2 and 3, and we have been treating it as 1 the whole time.

Framing 2 is the cheap one and it is the one with a direct quote behind it. It is also the one that
sounds least like product work, which I think is why it keeps losing — "rename a button and add an
undo" does not feel like a bet, so it never gets written into a PRD, so it never gets built.

Worth testing before anything is built: show someone the existing publish flow with the word changed
and an obvious way to reverse it, and see whether the hesitation goes away. That is an afternoon.

## Open question I could not answer

Can an unauthenticated visitor actually read a published document today, or does the preview page
require a session? I believe not, and I have not verified it. If they can, framing 2 gets much
cheaper, and framing 1 stops being a prerequisite for anything.

`[NEED: someone to read the query and tell me]`

---

_Nobody answered. Two days later the option was scoped as framing 1, estimated at three weeks, and
cancelled. The question above is answered in twenty lines of
[`convex/documents.ts`](../../../../convex/documents.ts)._
