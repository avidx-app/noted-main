---
type: slack-thread
provenance: constructed
channel: "#engineering"
date: 2026-05-04
participants: [Hana, Sarah]
subject: comment-only share link — scope
---

# #engineering — comment-only share link, scope

> **Constructed thread.** This conversation did not happen. It comes from the Vibe PM @ Noted
> simulation. The estimate below is built on a premise that is wrong, and nobody in the thread opens
> the code to check it. See [`../CLAUDE.md`](../CLAUDE.md).

**Sarah** · 14:02

> Putting a scope on NOT-141 so it's a real option next time rather than a shrug. What is the
> smallest thing that lets one named person read a draft and leave a comment?

**Hana** · 14:40

> Smallest honest version, in order:
>
> 1. **A `shares` table.** `documentId`, `email`, `capability`, `createdAt`. Nothing works without
>    this — the `documents` table has one sharing field and it is a boolean.
> 2. **Auth for the recipient.** This is the expensive one. Every read goes through
>    `getUserIdentity()`, so the recipient has to be a Clerk user before they can see anything.
>    Either we invite them properly, or we build a token-based unauthenticated read path from
>    scratch and own the security review for it.
> 3. **A `comments` table** plus UI. BlockNote has no comment primitive in the version we're on, so
>    this is bespoke.
> 4. Notification of some kind, or the reviewer never knows.
>
> Two and three are where the time goes. Three weeks if nothing surprises us, and something will.

**Sarah** · 14:48

> Three weeks against a week for onboarding. That settles it for this cycle. Can we do anything in
> two days that isn't nothing?

**Hana** · 14:55

> Not really. The blocker is structural — it's the auth boundary, not the UI. Anything I build in two
> days is publish-to-web with a nicer button, and the whole finding is that publish-to-web is the
> wrong shape.

**Sarah** · 15:01

> Understood. Parking it.

---

_No code was written. `NOT-141` was cancelled two days later citing this thread._
