---
name: date-handling
description: Date handling conventions for noted-main — store as `Date.now()` numbers in Convex, format with date-fns at the render site, never mutate native Date objects. Use when user asks to "format a date", "show 'X ago'", "compare two dates", "add days/months", or any time a Convex `createdAt`/`updatedAt` field needs to render. Applies implicitly whenever a feature stores, displays, or computes with dates.
summary: Store numbers, format with date-fns
---

<!--
Adapted from heatseeker-next/.ai/skills/date-handling/SKILL.md
MAJOR adaptation: heatseeker has a `lib/date/constants.ts` file with
DATE_FORMAT constants. noted does not — formatting in noted today is
ad-hoc using date-fns format strings inline. This skill documents
that reality, gives format-string guidance, and proposes (but does
not require) a `lib/date.ts` constants file once the count of distinct
formats grows past ~3.
-->

# Date Handling

Two rules cover almost every case:

1. **Store dates as numbers** (milliseconds since epoch from `Date.now()`) in Convex. Never store ISO strings, never store mongo-style `{ $date: ... }`.
2. **Format with `date-fns`** at the render site. Never use native `Date.prototype.toLocaleDateString()` or string concatenation.

## Storage — `Date.now()` numbers in Convex

The shipped schema reflects this:

```typescript
// convex/schema.ts
aiSettings: defineTable({
  // ...
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"]),

coworkerMessages: defineTable({
  // ...
  createdAt: v.number(),
}).index("by_user_time", ["userId", "createdAt"]),
```

In handlers, set with `Date.now()`:

```typescript
const now = Date.now();
await ctx.db.insert("aiSettings", {
  userId,
  createdAt: now,
  updatedAt: now,
});
```

Convex also auto-adds `_creationTime: number` to every row — use that instead of declaring your own `createdAt` unless you need a *user-controlled* timestamp distinct from row creation (e.g., a scheduled-publish time, an event time that isn't the same as insert time).

## Formatting — `date-fns` at the render site

```typescript
import { format } from "date-fns";

// numeric timestamp from Convex → Date → formatted string
<span>{format(new Date(file.createdAt), "PPP p")}</span>
//                                       └────┴── locale-aware "Apr 29, 2025 at 2:14 PM"
```

`date-fns` is already a dependency (`^4.1.0`). Always import directly from `date-fns`; the package is already tree-shakable per import:

```typescript
// ✅ direct named import
import { format, formatDistanceToNow, addDays, isToday } from "date-fns";

// ❌ default import — date-fns has no default
import dateFns from "date-fns";
```

## Format strings to use

When in doubt, prefer the locale-aware tokens over fixed-format ones — they respect the user's locale automatically. (`PPP`, `PP`, `P`, `p` are date-fns's "localized" tokens.)

| Need | Token | Example output (en-US) |
|---|---|---|
| Long date | `PPP` | `April 29th, 2026` |
| Short date | `PP` | `Apr 29, 2026` |
| Numeric date | `P` | `04/29/2026` |
| Time only | `p` | `2:14 PM` |
| Long date + time | `PPP p` | `April 29th, 2026 at 2:14 PM` |
| Short date + time | `PP p` | `Apr 29, 2026 at 2:14 PM` |

If you need a fixed (locale-independent) format — e.g., for a filename, ISO export, or backend-comparable string:

| Need | Token | Output |
|---|---|---|
| ISO date | `yyyy-MM-dd` | `2026-04-29` |
| Compact stamp | `yyyyMMdd-HHmm` | `20260429-1414` |
| Month + year | `MMMM yyyy` | `April 2026` |

The shipped pattern (`components/modals/file-viewer-modal.tsx:113`) uses `format(new Date(file.createdAt), "PPP p")` — match it for consistency in user-visible date+time.

## Relative time

```typescript
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";

// "5 minutes ago", "about 2 hours ago"
formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

// custom branching when the relative wording matters more than precision
function relativeLabel(ts: number): string {
  const date = new Date(ts);
  if (isToday(date))     return `Today, ${format(date, "p")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "p")}`;
  return format(date, "PP");
}
```

## Manipulation

Every `date-fns` operation is **immutable** — they return a new `Date`. Never use `Date.prototype.set*()` methods.

```typescript
import { addDays, subMonths, startOfDay, endOfDay, differenceInDays } from "date-fns";

const nextWeek = addDays(new Date(), 7);
const lastMonth = subMonths(new Date(), 1);
const start = startOfDay(date);
const end = endOfDay(date);
const ageDays = differenceInDays(new Date(), new Date(doc._creationTime));
```

## When to extract a `lib/date.ts` constants file

If you find yourself writing the same format string in **three or more places**, extract it:

```typescript
// lib/date.ts (proposed — does not exist today)
export const DATE_FMT = {
  /** "Apr 29, 2026 at 2:14 PM" — used in file metadata, doc footer */
  DATE_TIME_LONG: "PPP p",
  /** "April 2026" — used in archive groupings */
  MONTH_YEAR: "MMMM yyyy",
} as const;
```

Don't create it preemptively — until the third repeat, inline format strings are fine and easier to grep.

## Anti-patterns

```typescript
// ❌ native formatting — locale-inconsistent, hard to test
new Date(ts).toLocaleDateString();
new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric" });

// ❌ mutating a Date — half the time the bug is "two components share this Date"
const d = new Date(ts);
d.setDate(d.getDate() + 7);   // mutates d
// ✅ immutable date-fns
const oneWeekLater = addDays(new Date(ts), 7);

// ❌ storing a date as an ISO string in Convex
documents: defineTable({ createdAt: v.string() }) // can't index range queries cleanly
// ✅ store as ms since epoch
documents: defineTable({ createdAt: v.number() })

// ❌ shipping a date string from the server pre-formatted
return { createdAtPretty: format(new Date(doc._creationTime), "PPP") };
// ✅ ship the number, format on the client at the render site
return { createdAt: doc._creationTime };

// ❌ string-concat a "5 minutes ago"
const mins = Math.round((Date.now() - ts) / 60000);
return `${mins} minutes ago`;
// ✅ formatDistanceToNow handles plurals, locale, edge cases
return formatDistanceToNow(new Date(ts), { addSuffix: true });
```

## Quick reference

| Need | API |
|---|---|
| Now (in Convex handler or client) | `Date.now()` → number |
| Convex column | `v.number()` |
| Format absolute | `format(new Date(ts), "PPP p")` |
| Format relative | `formatDistanceToNow(new Date(ts), { addSuffix: true })` |
| Add / subtract | `addDays`, `subMonths`, etc. (immutable) |
| Compare | `isBefore`, `isAfter`, `isSameDay`, `differenceInDays` |
| Boundary | `startOfDay`, `endOfDay` |
| Parse ISO | `parseISO("2026-04-29T14:14:00Z")` |

## Checklist

- [ ] Date columns in Convex are `v.number()`, not `v.string()`
- [ ] Timestamps written via `Date.now()`, not `new Date().toISOString()`
- [ ] Server returns numbers; the client formats with `date-fns` at render time
- [ ] No `toLocaleDateString()` or `toLocaleString()` — always `format(...)`
- [ ] No `date.set*()` mutations — always `addX`, `subX`, `set` (date-fns)
- [ ] Format string repeated ≥3× → extract into `lib/date.ts`
