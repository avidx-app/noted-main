# Stage 7 · Verify

Check the thing you shipped in two places that behave differently.

You produce **`pm-course/my-work/verification-record.md`**. It is the last artifact and the one worth
rereading in a month.

|             |                                               |
| ----------- | --------------------------------------------- |
| Before this | A merged pull request                         |
| Check it    | `npm run course -- 7`                         |
| You need    | Your Render staging deploy, from the pre-work |

## Local is not the same as deployed, and that is the point

Everything before this produced a document. This asks whether the change works where the environment
variables are set by somebody else, the free tier spins down after fifteen minutes, and the data is not
the data you seeded this morning.

Two passes:

**Locally.** Name the command or the click. "Works" is not a method. Run the gate — `lint:check`,
`type:check`, `test`, `design:lint` — and run [`/smoke-diff`](../../../.ai/commands/smoke-diff.md) with
an actual probe. With no probe, `run` reports that the gates are green and nothing has been shown to
work, which is exactly what it should say.

**On staging.** Open the deployed URL. Sign in as a user who is not you if you can. Exercise the change.
Then check Convex and Amplitude actually received something — the app can look right and be writing
nowhere.

Expect them to differ. If your record says staging behaved exactly like local, that is sometimes true
and usually means only one of them was really checked. The cold start alone changes what a first-time
user experiences.

## The bar

**What did you not verify?**

There is always something: a browser you did not open, a state you could not reach, a user who is not
you, a path that needs data you do not have. Writing "nothing" fails, because it is the plausible answer
rather than the true one.

This is the only thing in the whole course worth checking four weeks later, and it is the habit Sarah
asked for on your first day.

## The artifact

```markdown
# Verification record — <the slice>

**By:** <you> · **Date:** <date> · **PR:** #<n> · **Staging:** <url>

## What shipped

(one sentence, in the words a user would use.)

## Verified locally

(the commands, the clicks, and the probe.)

## Verified on staging

(the URL you opened, what you did, and what Convex and Amplitude show.)

## What I did not verify

(there is always something.)

## What I will watch

(the signal that would tell you this worked, and when you will look.)
```

## What the checker does

```bash
npm run course -- 7
```

The unverified section is the bar and it is checked hardest. Beyond that: whether the local pass names a
method, whether the staging pass names a real deployed URL rather than localhost, whether the commands
you claim to have run exist in `package.json`, and whether a pull request you say merged actually appears
as a merge commit. If you mention smoke-diff without mentioning a probe, it says so.
