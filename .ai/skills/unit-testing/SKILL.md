---
name: unit-testing
description: Concise unit testing patterns with Jest + React Testing Library — readable individual tests, minimal mocking, helper factories, and clear structure for noted-main. Use when user asks to "write a test", "add unit tests", "test this hook/component/util", or "how should I test this". Also use when creating .test.ts(x) files, deciding what to test, mocking Clerk/Convex, or structuring test cases. Applies implicitly whenever creating or modifying utility functions, hooks, services, data transformations, or any extractable logic — these MUST have unit tests.
summary: Jest + RTL patterns
---

<!--
Adapted from heatseeker-next/.ai/skills/unit-testing/SKILL.md
Noted-specific adjustments: npm (not pnpm), `.test.ts(x)` colocated naming
(not `.dot.separated.test.ts`), Clerk + Convex mocking patterns instead of
Mongo/DAL examples, paths in @/* (not @repo/common).
-->

# Unit Testing Patterns

## Principle: only write tests that earn their keep

**Every test must justify its existence by catching a bug that would actually matter.** A test that verifies a one-liner wrapper, or that a builder produces a string containing a substring you hard-coded two lines above, is not protecting you from anything — it's slowing the build, consuming memory, and creating maintenance drag.

Before writing a test, ask: **"What real mistake would this catch?"** If the answer is "none — the code is too simple to break" or "only if someone deletes the function entirely," skip the test and spend the effort on logic that can actually fail in subtle ways.

**High-value tests** cover:

- Branching logic (if/else, switch, ternary with real consequences)
- Data transformations that reshape, filter, or aggregate
- Edge cases where inputs can be null, empty, malformed, or out of range
- Error paths where the wrong behavior would silently corrupt data or mislead users
- Hooks with stateful behavior beyond a trivial getter/setter

**Low-value tests to avoid:**

- Trivial getters, setters, or pass-through wrappers
- Functions whose entire body is a single library call with no branching
- Asserting that a template string contains a literal you just pasted into the assertion
- Tests that exist only because "every exported function must have a test"

## What MUST be tested

- Utility/helper functions in `lib/` **with meaningful logic**
- Hooks with state and side effects (see `hooks/use-search.test.ts` as a reference)
- Components with conditional rendering, form logic, or branching props
- Convex handlers with non-trivial logic (the auth + ownership + recursion in `convex/documents.ts` archive is a good example of what's worth testing — the simple read-by-id is not)

## Run tests

```bash
npm run test                # all tests
npm run test:watch          # watch mode
npm run test:coverage       # coverage report
```

## File naming and placement

Test files live next to the source file. Pattern: `<source>.test.ts(x)`.

```
hooks/
├── use-search.tsx
├── use-search.test.ts        ← right next to it
├── use-cover-image.tsx
└── use-cover-image.test.ts
lib/
├── utils.ts
└── utils.test.ts
components/
├── modals/
│   └── settings-modal.tsx
│   └── settings-modal.test.tsx
```

The `lib/utils.test.ts` file in this repo is a good minimal reference for testing a utility.

## Tests are for humans

Tests should be **trivial to read, understand, and debug.** DRY does not apply — a bit of repetition is fine. Each test should be self-contained and obvious.

```typescript
// ✅ GOOD — each test is readable and self-explanatory
describe('useSearch', () => {
    it('initializes with isOpen false', () => {
        const { result } = renderHook(() => useSearch());
        expect(result.current.isOpen).toBe(false);
    });

    it('onOpen sets isOpen to true', () => {
        const { result } = renderHook(() => useSearch());
        act(() => {
            result.current.onOpen();
        });
        expect(result.current.isOpen).toBe(true);
    });

    it('toggle flips isOpen', () => {
        const { result } = renderHook(() => useSearch());
        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);
    });
});
```

(That's the actual shape of `hooks/use-search.test.ts`. Mirror it for new Zustand-based hooks.)

**Don't test the same thing multiple times:**

```typescript
// ❌ BAD — these all test "valid 6-char hex", just with different values
it('returns true for #000000', () => { ... });
it('returns true for #FFFFFF', () => { ... });
it('returns true for #FF0000', () => { ... });
// ✅ One test per behavior, not per value. Pick one representative input.
```

## Test structure

```typescript
import { myFunction } from './my-thing';

describe('myFunction', () => {
    it('returns formatted result for valid input', () => { ... });

    // Variations that test DIFFERENT behaviors
    it('handles empty input gracefully', () => { ... });
    it('trims whitespace before processing', () => { ... });

    // Error cases
    it('throws when resource missing', () => { ... });
});
```

**Rules:**

- One `describe` per function/hook/component under test
- Each `it()` tests a **distinct behavior** — not the same behavior with a different value
- Use nested `describe` only for genuinely different behavior categories
- Don't nest more than 2 levels: `describe` → `describe` → `it`
- Tests should not implement their own logic — no loops, no conditionals, no abstractions

## Mocking Clerk and Convex

Almost any component or hook in this repo touches Clerk (auth) or Convex (data). Mock them at the top of any test that imports such a file. Keep mocks minimal — only mock what the test actually exercises.

### Clerk

```typescript
jest.mock('@clerk/nextjs', () => ({
    useUser: jest.fn(() => ({
        isLoaded: true,
        isSignedIn: true,
        user: { id: 'user_123', firstName: 'Razii' },
    })),
    useAuth: jest.fn(() => ({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_123',
    })),
}));
```

### Convex

```typescript
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(() => jest.fn()),
    useAction: jest.fn(() => jest.fn()),
}));

import { useQuery } from 'convex/react';
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

beforeEach(() => {
    jest.clearAllMocks();
});

it('renders the document title once loaded', () => {
    mockUseQuery.mockReturnValue({ _id: 'doc_1', title: 'Hello', userId: 'u' });
    // ...
});
```

### Always `clearAllMocks` in `beforeEach`

```typescript
beforeEach(() => {
    jest.clearAllMocks();
});
```

## Helper factories

For domain objects (Convex `Doc<"documents">`, AI settings, etc.), build a factory with sensible defaults:

```typescript
import type { Doc, Id } from '@/convex/_generated/dataModel';

const makeDocument = (overrides: Partial<Doc<'documents'>> = {}): Doc<'documents'> => ({
    _id: 'doc_1' as Id<'documents'>,
    _creationTime: 0,
    title: 'Untitled',
    userId: 'user_1',
    isArchived: false,
    isPublished: false,
    ...overrides,
});

it('renders archived badge for archived docs', () => {
    const doc = makeDocument({ isArchived: true });
    // ...
});
```

## Don't import from heavy route or page files just to test helpers

If a `route.ts` or `page.tsx` contains a small pure helper you want to test, **extract the helper** to a sibling `*.utils.ts` file and test from there. Importing the route directly drags the entire Next.js runtime into the Jest test, slowing things down and forcing unnecessary mocks.

```text
app/api/ai/chat/
├── route.ts              # imports from route.utils
├── route.utils.ts        # the pure logic — exported and tested directly
└── route.utils.test.ts   # imports from route.utils only
```

## Keep tests small

- **Max ~150 lines per test file.** Split larger files by behavior group.
- **Each `it()` tests ONE behavior.** Multiple `expect` calls are fine if they assert the same concept.
- **Test names describe behavior, not implementation.**

```typescript
// ✅ GOOD — describes behavior
it('archives child documents recursively', () => { ... });
it('throws when document belongs to another user', () => { ... });

// ❌ BAD — describes implementation
it('should call ctx.db.patch with isArchived: true', () => { ... });
it('should call mockGetDocument once', () => { ... });
```

## Testing async / errors

```typescript
// Async throws (Convex handlers, hooks that wrap mutations)
await expect(archive({ id: 'doc_unauthorized' })).rejects.toThrow('Not authorized');

// Sync throws
expect(() => parseConfig(null)).toThrow('Invalid config');

// Error message contains
await expect(remove({ id: 'doc_missing' })).rejects.toThrow('Document not found');
```

## Anti-patterns

```typescript
// ❌ testing implementation details
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(exact, args, here);
// Only assert call details when the CALL IS the behavior under test

// ❌ duplicate setup in every test
it('test 1', async () => { mockUseQuery.mockReturnValue(doc); ... });
it('test 2', async () => { mockUseQuery.mockReturnValue(doc); ... });
// ✅ Move shared setup to beforeEach

// ❌ logic in tests (loops, conditionals, abstractions)
for (const status of ['draft', 'published'] as const) {
    it(`renders ${status}`, () => { ... });
}
// ✅ Write each as a flat, readable test

// ❌ low-value test that verifies a trivial wrapper
it('returns the user name', () => {
    const user = { name: 'Kate' };
    expect(getUserName(user)).toBe('Kate');   // getUserName is just `user.name`
});
// ✅ Skip trivial functions. Test the logic that can actually break.
```

## Checklist

- [ ] Does this test earn its keep? (Would a real bug slip through without it?)
- [ ] Is the test colocated as `<source>.test.ts(x)`?
- [ ] Are Clerk and Convex mocked at the top if the file touches them?
- [ ] Is each test self-contained and readable without scrolling?
- [ ] Does each `it()` test a distinct behavior (not the same thing with different values)?
- [ ] Are mocks minimal — only mock what's necessary?
- [ ] Is test data created via factory helpers with defaults (for non-trivial domain objects)?
- [ ] Is `beforeEach` used for shared mock setup with `jest.clearAllMocks()`?
- [ ] Is the test file under ~150 lines?
- [ ] Do test names describe behavior, not implementation?
- [ ] Are tests free of logic (no loops, no conditionals, no abstractions)?
