---
name: typescript-patterns
description: TypeScript type safety patterns including strict no-any rules, discriminated unions, type guards, utility types (Pick/Omit/Partial), and const assertions. Use when user asks to "define a type", "should I use interface or type", "how do I avoid any", or "add a type guard". Also use when narrowing unknown data, choosing between enum and union types, avoiding type assertions, or ensuring strict type safety across the codebase.
summary: Strict types — no `any`
---

<!--
Adapted from heatseeker-next/.ai/skills/typescript-patterns/SKILL.md
Universal TypeScript guidance — no noted-specific changes needed except
referencing Convex's `Doc<>` and `Id<>` types where examples benefit.
-->

# TypeScript Patterns

## ABSOLUTELY NEVER use `any`

**There is no valid reason to use `any`. Ever. Period.**

`any` defeats the entire purpose of TypeScript. It's a virus that spreads through your codebase — one `any` infects everything it touches.

```typescript
// ❌ FORBIDDEN — never do this under any circumstances
function process(data: any) { ... }
const result: any = getData();
arr.map((item: any) => ...);

// ✅ GOOD — define proper types
function process(data: DocumentPayload): Result { ... }

// ✅ GOOD — use unknown for truly unknown data, then validate
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}

// ✅ GOOD — use Zod for external data
const data = schema.parse(externalData);
```

**When you think you need `any`, you actually need:**

- `unknown` + type guards/validation
- A proper interface or type definition
- Generics (`<T>`)
- A union type
- A Convex-generated type from `convex/_generated/dataModel`

**No exceptions. No "just this once." No "I'll fix it later."**

## Convex types are your friend

For data shapes that come out of Convex, prefer the generated types over hand-writing them:

```typescript
import type { Doc, Id } from '@/convex/_generated/dataModel';

type Document = Doc<'documents'>;       // full row from `documents` table
type DocumentId = Id<'documents'>;       // branded id type, not just string
```

`Id<"documents">` is **not** assignable to `Id<"files">`. The branding catches "I passed a doc id where a file id was expected" mistakes at compile time. Use it.

## Interface vs type

```typescript
// Interface — for object shapes, can extend
interface User {
    id: string;
    email: string;
}

interface AdminUser extends User {
    permissions: string[];
}

// Type — for unions and utility compositions
type Status = 'pending' | 'active' | 'completed';
type UserDTO = Omit<User, 'password'>;
```

## Discriminated unions

```typescript
// ✅ GOOD — exclusive states
type RequestState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

function handle<T>(state: RequestState<T>) {
    switch (state.status) {
        case 'success':
            return state.data; // TS knows data exists
        case 'error':
            return state.error; // TS knows error exists
    }
}
```

## Type guards

```typescript
interface User {
    id: string;
    email: string;
}
interface Admin extends User {
    permissions: string[];
}

function isAdmin(user: User): user is Admin {
    return 'permissions' in user;
}

// Usage
if (isAdmin(user)) {
    console.log(user.permissions); // TS knows it's Admin
}
```

## Utility types

```typescript
interface User {
    id: string;
    email: string;
    name: string;
    password: string;
}

// Partial — all optional
type UpdateUser = Partial<User>;

// Pick — select fields
type Credentials = Pick<User, 'email' | 'password'>;

// Omit — exclude fields
type UserDTO = Omit<User, 'password'>;

// Record — key-value
type Cache = Record<string, User>;
```

## Const assertions

```typescript
// Narrow literal types + immutable
const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
} as const;
// Type: { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }

// Union from array
const statuses = ['pending', 'active'] as const;
type Status = (typeof statuses)[number]; // "pending" | "active"
```

## Null handling

```typescript
// Optional chaining
const name = user?.profile?.name;

// Nullish coalescing
const displayName = user?.name ?? 'Guest';

// Optional properties
interface User {
    id: string;
    email?: string; // not: email: string | undefined
}
```

## Generic constraints

```typescript
interface WithId {
    id: string;
}

function updateEntity<T extends WithId>(entity: T, updates: Partial<T>): T {
    return { ...entity, ...updates };
}
```

## Avoid type assertions — deduce types first

**Type assertions (`as`) tell TypeScript "trust me" — but you're probably wrong.**

Before reaching for `as`, ALWAYS try to deduce the correct type:

1. **Can you fix the source?** Make the function return the correct type.
2. **Can you narrow the type?** Use type guards, `typeof`, `instanceof`, `in`.
3. **Can you validate?** Use Zod to parse and get proper types.
4. **Can you use generics?** Let TypeScript infer the type.

```typescript
// ❌ BAD — lying to TypeScript
const user = getData() as User;
const element = document.getElementById('btn') as HTMLButtonElement;
const items = data.filter((x) => x.active) as ActiveItem[];

// ✅ GOOD — fix the source function to return correct type
function getData(): User { ... }

// ✅ GOOD — validate with Zod
import { z } from 'zod';
const user = UserSchema.parse(getData());

// ✅ GOOD — type guard for narrowing
if (isUser(data)) {
  console.log(data.email);  // TS knows it's User
}

// ✅ GOOD — null check instead of assertion
const element = document.getElementById('btn');
if (element instanceof HTMLButtonElement) {
  element.click();
}

// ✅ GOOD — type guard filter instead of casting
const items = data.filter((x): x is ActiveItem => x.active);
```

**Common Convex pitfall:** when calling `ctx.db.get(args.id)` you get `Doc<"foo"> | null`. Don't cast — guard with `if (!doc) throw new Error('Not found')` and the rest of the function sees `Doc<"foo">`.

**If you MUST assert (rare), ask yourself:**

- Why doesn't TypeScript know the type?
- Can I fix the upstream code instead?
- Am I hiding a bug?

## Enums

**Use string enums for named constants:**

```typescript
// ✅ GOOD — string enums
enum DocumentStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Archived = 'ARCHIVED',
}

// Usage
const status = DocumentStatus.Published;       // autocomplete, refactorable
if (status === DocumentStatus.Draft) { ... }

// Can iterate
Object.values(DocumentStatus); // ['DRAFT', 'PUBLISHED', 'ARCHIVED']
```

**Why enums are great:**

- IDE autocomplete with namespace (`DocumentStatus.` shows all options)
- Refactoring-safe (rename enum value, all usages update)
- Self-documenting code
- Can iterate over values with `Object.values()`

**Union types are fine for simple cases:**

```typescript
// ✅ Also fine — simple inline unions
type Direction = 'left' | 'right' | 'up' | 'down';
```

## Quick reference

| Need              | Use                                         |
| ----------------- | ------------------------------------------- |
| Object shape      | `interface`                                 |
| Union/composition | `type`                                      |
| Named constants   | `enum` (string enums)                       |
| Convex row shape  | `Doc<"tableName">`                          |
| Convex id         | `Id<"tableName">`                           |
| Unknown data      | `unknown` + validation (Zod or type guard)  |
| Exclusive states  | Discriminated union                         |
| Type narrowing    | Type guard function                         |
| Immutable         | `as const`                                  |
| Select fields     | `Pick<T, keys>`                             |
| Exclude fields    | `Omit<T, keys>`                             |
