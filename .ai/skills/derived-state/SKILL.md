---
name: derived-state
description: 'CRITICAL: Derive state during render — never sync props or computed values into state via useEffect. Use when user writes a useEffect that calls setState based on props or other state, syncs a prop into local state, or computes a value from existing state and stores it separately. Also use when writing or reviewing any component with useEffect. Applies implicitly whenever a component has useEffect + setState together — this combination is almost always wrong.'
summary: Derive during render — never sync props via useEffect
---

<!--
Adapted from heatseeker-next/.ai/skills/derived-state/SKILL.md
Universal React rule. No noted-specific changes — examples are domain-agnostic.
-->

# Derived State: Never Sync with useEffect

**CRITICAL: If a value can be computed from existing props or state, compute it during render. Do not store it in state. Do not sync it with useEffect.**

This is the single most common React anti-pattern. It causes redundant renders, state drift bugs, and unnecessarily complex components.

## The Rule

```
If value = f(props, state) → derive it inline
If you have useEffect(() => setSomething(...), [dep]) → you're doing it wrong
```

## Pattern 1: Computed Values

The most obvious case. A value is derived from other state — just compute it.

```typescript
// ❌ CRITICAL VIOLATION — extra render + state drift risk
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <span>{fullName}</span>;
}

// ✅ CORRECT — derived during render, zero overhead
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const fullName = firstName + ' ' + lastName;

  return <span>{fullName}</span>;
}
```

## Pattern 2: Syncing Props to Local State

This is extremely common and almost always wrong. If you're copying a prop into state just to "track" it, you don't need state at all.

```typescript
// ❌ CRITICAL VIOLATION — syncing prop into state via effect
function DocumentTitle({ serverTitle }: { serverTitle: string }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    setTitle(serverTitle);
  }, [serverTitle]);

  return <h1>{title}</h1>;
}

// ✅ CORRECT — just use the prop directly
function DocumentTitle({ serverTitle }: { serverTitle: string }) {
  return <h1>{serverTitle}</h1>;
}
```

**If you need to edit the prop locally** (e.g., a form pre-filled from server data), use the prop as the initial value and key the component to reset:

```typescript
// ✅ CORRECT — editable local copy, reset via key
function TitleEditor({ serverTitle }: { serverTitle: string }) {
  const [text, setText] = useState(serverTitle);
  return <input value={text} onChange={e => setText(e.target.value)} />;
}

// Parent resets by changing key when serverTitle changes:
<TitleEditor key={serverTitle} serverTitle={serverTitle} />
```

## Pattern 3: Filtering or Transforming Data

When you have data and need a filtered/sorted/mapped version, derive it — don't store it.

```typescript
// ❌ CRITICAL VIOLATION — storing derived list in state
function DocumentList({ documents }: { documents: Doc<'documents'>[] }) {
  const [items, setItems] = useState<Doc<'documents'>[]>([]);

  useEffect(() => {
    setItems(documents);
  }, [documents]);

  return items.map(d => <DocumentCard key={d._id} doc={d} />);
}

// ✅ CORRECT — data IS the items, no intermediate state
function DocumentList({ documents }: { documents: Doc<'documents'>[] }) {
  return documents.map(d => <DocumentCard key={d._id} doc={d} />);
}
```

```typescript
// ❌ CRITICAL VIOLATION — filtering in effect
function ArchivedList({ documents }: { documents: Doc<'documents'>[] }) {
  const [archived, setArchived] = useState<Doc<'documents'>[]>([]);

  useEffect(() => {
    setArchived(documents.filter(d => d.isArchived));
  }, [documents]);

  return archived.map(d => <DocumentCard key={d._id} doc={d} />);
}

// ✅ CORRECT — derive during render
function ArchivedList({ documents }: { documents: Doc<'documents'>[] }) {
  const archived = documents.filter(d => d.isArchived);
  return archived.map(d => <DocumentCard key={d._id} doc={d} />);
}
```

## Pattern 4: Syncing Convex Query Results

A specifically noted-flavored case: Convex `useQuery` is already reactive. Don't copy its result into local state — read it directly.

```typescript
// ❌ CRITICAL VIOLATION — syncing Convex result into state
function DocumentEditor({ id }: { id: Id<'documents'> }) {
  const document = useQuery(api.documents.getById, { id });
  const [doc, setDoc] = useState<Doc<'documents'> | null>(null);

  useEffect(() => {
    if (document) setDoc(document);
  }, [document]);

  return doc ? <Editor doc={doc} /> : null;
}

// ✅ CORRECT — useQuery is reactive; just use it
function DocumentEditor({ id }: { id: Id<'documents'> }) {
  const document = useQuery(api.documents.getById, { id });
  return document ? <Editor doc={document} /> : null;
}
```

## Pattern 5: Syncing Controlled Component State

```typescript
// ❌ CRITICAL VIOLATION — syncing controlled prop to local state
function Dropdown({ controlledIsOpen }: { controlledIsOpen: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(controlledIsOpen);
  }, [controlledIsOpen]);

  return <div>{open && <Menu />}</div>;
}

// ✅ CORRECT — use the prop directly
function Dropdown({ controlledIsOpen }: { controlledIsOpen: boolean }) {
  return <div>{controlledIsOpen && <Menu />}</div>;
}
```

## When useEffect + setState IS Legitimate

These are the **only** valid cases:

1. **Subscribing to external stores** — WebSocket, browser APIs, third-party libs (but prefer `useSyncExternalStore`)
2. **DOM measurements** — reading element dimensions after render (e.g., `ref.current.getBoundingClientRect()`)
3. **Timers/intervals** — countdown, polling, animation frame
4. **Data fetching** — but in `noted-main`, prefer Convex `useQuery` (always reactive) over `fetch` inside `useEffect`

```typescript
// ✅ LEGITIMATE — DOM measurement requires effect
useEffect(() => {
    if (textboxRef.current) {
        setTextboxWidth(textboxRef.current.offsetWidth);
    }
}, []);
```

## Decision Flowchart

```
You wrote: useEffect(() => setSomething(...), [deps])

Ask: Can I compute `something` from props/state without the effect?
├─ YES → Remove the effect. Derive it inline. DONE.
├─ Is it syncing a prop or useQuery result into state?
│  ├─ YES, read-only → Just use the prop / query result directly
│  └─ YES, editable → Use prop as initial value + key to reset
└─ NO, it's external data/DOM/timer → Keep the effect (legitimate)
```

## Quick Reference

| Anti-Pattern                                                 | Fix                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `useEffect(() => setX(prop), [prop])`                        | Use `prop` directly                                   |
| `useEffect(() => setX(f(a, b)), [a, b])`                     | `const x = f(a, b)` inline                            |
| `useEffect(() => setFiltered(data.filter(...)), [data])`     | `const filtered = data.filter(...)` inline            |
| `useEffect(() => setOpen(controlledOpen), [controlledOpen])` | Use `controlledOpen` directly                         |
| `useEffect(() => setDoc(useQuery(...)), [...])`              | Use `useQuery` result directly — it's reactive        |
| `useState(prop)` + effect to sync                            | `key={prop}` on parent to reset, or use prop directly |

## References

- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — React official docs
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies) — React official docs
