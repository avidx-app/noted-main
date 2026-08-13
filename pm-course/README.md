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

## Before stage 1 — and this part is not optional

You need the product **running locally, deployed, and full of your own data.** That is a real afternoon,
and none of it is taught: nobody learns product judgment from pasting environment variables. It happens
before the course rather than during it, which is also the only way stage 7 works — you cannot deploy
_and_ ship a change through the deploy in the same sitting.

### Everything is yours. Nothing is shared.

Five free-tier accounts, all in your own name:

| Service       | What it gives you                 | Why it cannot be shared                                                |
| ------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Convex**    | Database and backend              | The cohort is seeded into _your_ deployment. Stage 2 queries it        |
| **Clerk**     | Sign-in                           | Auth is per-deployment; a shared app means signing in as somebody else |
| **EdgeStore** | File uploads                      | Cover images, and both keys are server-side                            |
| **Amplitude** | Analytics and experiments         | Forty people's fixtures in one project makes every funnel meaningless  |
| **Render**    | The staging and production deploy | Stage 7 verifies on a real URL, and it has to be yours to break        |

```bash
cp .env.example .env.local
```

`.env.example` is the canonical list and marks which values are server-side secrets. **Never paste a key
from a walkthrough, a screenshot, or a teammate.** Anything holding a secret key can act as your
application, and a key that reaches more than one laptop is a key somebody has to rotate.

```bash
npm run data -- --check
```

That reports which credentials are still unset, one line each, without ever printing a value.

### Run it, then deploy it

```bash
npx convex dev      # leave running
npm run dev         # second terminal
```

Sign in, create a document, upload a cover image. Then generate the AES key that encrypts the AI
provider key you will paste into Settings:

```bash
openssl rand -base64 32
```

Then **deploy to Render**, staging and production, following [`../DEPLOYMENT.md`](../DEPLOYMENT.md). The
`staging` branch deploys to Staging and `main` to Production, which is what makes stage 6's pull request
and stage 7's verification real rather than described.

Smoke-test the live URL: sign in, create a document, and confirm Convex and Amplitude both received
something. An app can look right and be writing nowhere.

**The gate is your staging URL.** Send it before you start stage 1.

### Then seed your data, because stage 2 has nothing to read without it

```bash
npm run seed:convex:plan     # then: npm run seed:convex
npm run seed:amplitude:plan  # then: npm run seed:amplitude
```

Two of stage 2's six evidence sources do not exist until you run these. The cohort was generated to plant
specific patterns, and each one carries a question a new PM should be able to answer from it:

```bash
npm run data
```

That prints the per-persona counts out of your own Convex — users, documents, publishes, Coworker
messages, and how many used AI and never published — followed by the four questions. It does **not**
print the answers. The fixture records what pattern each question should surface, and reading that
instead of querying your own data is exactly the habit this course is against.

One of the four is answerable from Convex only. That is not an oversight: it is the pattern behind the
top-ranked pain in the research, and no Amplitude event sees it, because publish intent is not
instrumented. Anyone working from charts alone will miss the most important thing in the dataset.

## Checking your work

Each stage has a checker. From the repo root:

```bash
npm run course -- 1 --file pm-course/my-work/orientation-map.md
```

It prints two lists: what it verified mechanically, and what it refuses to judge. **The second list is
the point.** A pass is the floor, not the bar.

**Three stages grade work, not just a document.** Stages 4, 6 and 7 read your actual diff, and stage 5
reads your `specs/` bundle. So `--expected` on those correctly fails in a clean checkout — there is
nothing to grade yet, and the checker says so rather than pretending. Their reference answers are proven
against a fixture repo by `npm run test:scripts`.

## If you are on your own

Most people will be. This course is self-paced by design — fork the repo and work through it at
whatever speed suits you. Nothing here waits on anyone else.

The one thing solitude costs you is a second reader, and the second list is exactly what a second
reader is for. So the reference answers do that job, in a specific order:

1. **Write your artifact.** All of it, including the parts you are unsure about.
2. **Run the checker.** Fix what it mechanically fails.
3. **Answer the "not checked" list yourself**, in writing, at the bottom of your own artifact. Four
   sentences. This is the step people skip and it is the whole exercise.
4. **Then** open the stage's `expected/` reference answer and compare **the reasoning, not the
   conclusions.** A different conclusion reached honestly is a pass. The same conclusion reached by
   guessing is not.

Reading the reference before step 1 makes the checker pass and teaches you nothing. It is right there
in the repo and nobody is stopping you — which makes it your call, honestly made, and the first of
many in this course that nobody will audit.

Each reference opens by saying _"one good answer, not the answer"_ and shows its working for that
reason.

## If you are running this as a workshop

The facilitator's material — decks, run sheets, captured demo transcripts — lives outside this repo.
This folder is the hands-on half, and it is self-contained on purpose.
