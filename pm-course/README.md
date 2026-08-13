# PM course

You have just been hired as the first product manager at Noted. This is your first week.

Everything happens in this repository. There is nothing else to clone, no second checkout, and no
handout that lives somewhere with a login — the briefs, the templates, the reference answers and the
checkers are all in here, and they travel with your fork.

**Start with [`onboarding/welcome.md`](onboarding/welcome.md).**

Then, before you cite anything: [`onboarding/what-is-real.md`](onboarding/what-is-real.md). Noted is a
real product with a real workflow and mostly constructed evidence. Knowing which is which is the
difference between practising product judgment and rehearsing a fiction.

## The chain

Seven stages, one artifact each, and each artifact is the input to the next. That is the whole course:
the failure being taught against is a PRD with no evidence behind it, or a pull request with no spec.

|     | Stage                             | You produce                              | Which the next stage needs because                   |
| --- | --------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| 1   | [Day one](stages/01-day-one/)     | `orientation-map.md`                     | You cannot test a claim you have not made            |
| 2   | [Evidence](stages/02-evidence/)   | `evidence-map.md`                        | A PRD without this is an opinion with headings       |
| 3   | [PRD](stages/03-prd/)             | `prd.md`                                 | A prototype without a question is a demo             |
| 4   | [Prototype](stages/04-prototype/) | `prototype-contract.md`, and a diff      | A spec for something nobody has seen work is a guess |
| 5   | [Spec](stages/05-spec/)           | a bundle under `specs/`                  | `feature-workflow` will not start without it         |
| 6   | [Ship](stages/06-ship/)           | a pull request, and `delivery-record.md` | Nothing is verified until it is somewhere            |
| 7   | [Verify](stages/07-verify/)       | `verification-record.md`                 | —                                                    |

Your own work goes in `pm-course/my-work/`, which is gitignored. That keeps the pull request you open
in stage 6 containing a slice rather than your notes.

## Before stage 1

You need the product running locally **and** deployed. That is a real afternoon of work and none of it
is taught — nobody learns product judgment from pasting environment variables, which is exactly why it
happens before the course rather than during it.

1. Fork this repository, clone your fork, `npm install`.
2. Free-tier accounts at **Convex**, **Clerk**, **EdgeStore**, **Amplitude** and **Render**.
3. `cp .env.example .env.local` and fill it in. That file is the canonical list and marks which values
   are server-side secrets. Your own keys, never anyone else's.
4. `npx convex dev`, then `npm run dev`. Sign in, create a document, upload a cover image.
5. Seed your working data: `npm run seed:convex` then `npm run seed:amplitude`. Two of the sources you
   will use in stage 2 do not exist until you do.
6. **Deploy to Render**, staging and production, following [`../DEPLOYMENT.md`](../DEPLOYMENT.md).
   `staging` branch deploys to Staging, `main` to Production.
7. Smoke-test the live URL: sign in, create a document, confirm Convex and Amplitude received it.

**The gate is your staging URL.** Stage 7 verifies a change on a real deploy, and you cannot deploy and
also ship through it in the same session.

## Checking your work

Each stage has a checker. From the repo root:

```bash
npm run course -- 1 --file pm-course/my-work/orientation-map.md
```

It prints two lists: what it verified mechanically, and what it refuses to judge. The second list is
the point. A pass is the floor, not the bar — trade artifacts with someone else and answer the second
list about each other's.

Every stage also has an `expected/` reference answer. You can read it before writing your own, and
some people will. Each one opens by saying _"one good answer, not the answer"_ and shows its reasoning
rather than its conclusions — but reading it first makes the checker pass and teaches you nothing, so
that is your call to make honestly.

## If you are running this as a workshop

The facilitator's material — decks, run sheets, captured demo transcripts — lives outside this repo.
This folder is the hands-on half, and it is self-contained on purpose.
