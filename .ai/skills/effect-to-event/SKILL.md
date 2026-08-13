---
name: effect-to-event
description: 'CRITICAL: Put interaction logic in event handlers, not in useEffect. Use when a useEffect performs a side effect (API call, toast, navigation, analytics) in response to a user action modeled as state, or when a boolean flag triggers an effect. Also use when writing or reviewing any component with useEffect that contains side-effect logic. Applies implicitly whenever a component uses useEffect for anything other than synchronization with an external system — if a user action caused it, it belongs in the handler.'
summary: Side effects in handlers, not useEffect
---

<!--
Adapted from heatseeker-next/.ai/skills/effect-to-event/SKILL.md
Universal React rule. Examples updated to use noted's stack: Convex
mutations instead of Mongo DAL calls, Sonner toasts (used in noted),
Next.js useRouter.
-->

# Effect to Event: Side Effects Belong in Handlers

**CRITICAL: If a side effect is caused by a user interaction (click, submit, select), run it in the event handler. Do not model the interaction as state + useEffect.**

The pattern of `setState(true)` → `useEffect watches flag` → `performs side effect` is a misuse of effects. It causes duplicate side effects, re-runs on unrelated state changes, and makes control flow impossible to follow.

## The Rule

```
User clicked something → side effect should happen?
  → Put it in the onClick/onSubmit/onChange handler. Not in useEffect.

useEffect is for synchronization with external systems.
useEffect is NOT for "do something when X becomes true".
```

## Pattern 1: Convex mutations triggered by state flags

The most common violation. A flag is set, then an effect watches it and fires a mutation.

```typescript
// ❌ CRITICAL VIOLATION — mutation modeled as state + effect
function PublishButton({ documentId }: { documentId: Id<'documents'> }) {
  const [shouldPublish, setShouldPublish] = useState(false);
  const publish = useMutation(api.documents.publish);

  useEffect(() => {
    if (shouldPublish) {
      publish({ id: documentId });
      setShouldPublish(false);
    }
  }, [shouldPublish, documentId, publish]);

  return <Button onClick={() => setShouldPublish(true)}>Publish</Button>;
}

// ✅ CORRECT — call the mutation in the handler
function PublishButton({ documentId }: { documentId: Id<'documents'> }) {
  const publish = useMutation(api.documents.publish);

  return <Button onClick={() => publish({ id: documentId })}>Publish</Button>;
}
```

## Pattern 2: Toasts and notifications in effects

```typescript
// ❌ CRITICAL VIOLATION — toast triggered by error state change
function DocumentEditor() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  async function handleSave() {
    try {
      await save();
    } catch (e) {
      setError(e.message);  // Sets state to trigger the toast
    }
  }

  return <Button onClick={handleSave}>Save</Button>;
}

// ✅ CORRECT — toast in the catch block
function DocumentEditor() {
  async function handleSave() {
    try {
      await save();
    } catch (e) {
      toast.error(e.message);  // Direct, no state intermediary
    }
  }

  return <Button onClick={handleSave}>Save</Button>;
}
```

## Pattern 3: Navigation triggered by state

```typescript
// ❌ CRITICAL VIOLATION — navigation in effect
function NewDocumentForm() {
  const [created, setCreated] = useState(false);
  const router = useRouter();
  const create = useMutation(api.documents.create);

  useEffect(() => {
    if (created) {
      router.push('/documents');
    }
  }, [created, router]);

  async function handleSubmit(data: FormData) {
    await create(data);
    setCreated(true); // Sets flag instead of navigating
  }

  return <form onSubmit={handleSubmit}>...</form>;
}

// ✅ CORRECT — navigate in the handler
function NewDocumentForm() {
  const router = useRouter();
  const create = useMutation(api.documents.create);

  async function handleSubmit(data: FormData) {
    const newDoc = await create(data);
    router.push(`/documents/${newDoc._id}`); // Navigate directly
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Pattern 4: Auto-triggering Actions on Mount via Flags

```typescript
// ❌ CRITICAL VIOLATION — auto-open + mutation via flags
function AIChat() {
  const [autoOpened, setAutoOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!autoOpened) {
      setAutoOpened(true);
      setIsOpen(true);
      kickOffSomething();
    }
  }, []);

  return <div>...</div>;
}

// ✅ CORRECT — initialize once with a ref guard
function AIChat() {
  const [isOpen, setIsOpen] = useState(true);   // Start open
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      kickOffSomething();  // One-time init is a legitimate effect use
    }
  }, []);

  return <div>...</div>;
}
```

## Pattern 5: Analytics tracking via state flags

```typescript
// ❌ CRITICAL VIOLATION — tracking modeled as state + effect
function DocumentPage() {
  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  useEffect(() => {
    if (loaded && !hasTrackedPageView) {
      track('Document Viewed');
      setHasTrackedPageView(true);
    }
  }, [loaded, hasTrackedPageView]);

  return <div>...</div>;
}

// ✅ CORRECT — track with a ref guard, no unnecessary state
function DocumentPage() {
  const tracked = useRef(false);

  useEffect(() => {
    if (loaded && !tracked.current) {
      tracked.current = true;
      track('Document Viewed');
    }
  }, [loaded]);

  return <div>...</div>;
}
```

## Pattern 6: Completion callbacks in effects

```typescript
// ❌ CRITICAL VIOLATION — completion logic in effect
function useUploadFile() {
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (isComplete) {
            toast.success('Upload complete');
            onComplete(result);
        }
    }, [isComplete]);

    // ... polling logic that sets isComplete
}

// ✅ CORRECT — call completion logic where completion is detected
function useUploadFile() {
    async function pollUntilComplete() {
        while (!done) {
            const status = await checkStatus();
            if (status.complete) {
                toast.success('Upload complete');
                onComplete(status.result);
                return;
            }
            await sleep(interval);
        }
    }
}
```

## When useEffect IS legitimate

Effects are for **synchronization with external systems**, not for reacting to events:

| Legitimate                                         | Not legitimate                            |
| -------------------------------------------------- | ----------------------------------------- |
| Subscribe to a WebSocket / SSE                     | React to a button click                   |
| Set up an IntersectionObserver / ResizeObserver    | Fire a Convex mutation when flag changes  |
| Sync with browser API (resize, online/offline)     | Show a toast when error state changes     |
| DOM measurement after render                       | Navigate when boolean becomes true        |
| One-time initialization on mount (with ref guard)  | Track analytics via state flag            |

**Note for noted-main:** since Convex `useQuery` is reactive by default, you almost never need `useEffect` for "fetch data when the page loads" — just call `useQuery` and React re-renders when data arrives.

## Decision Flowchart

```
You wrote: useEffect(() => { doSomething() }, [someDep])

Ask: What CAUSED this side effect?
├─ A user interaction (click, submit, select, type)?
│  → Move it to the event handler. Remove the effect.
├─ A library / hook callback (onSuccess, onError, onComplete)?
│  → Move it to the callback. Remove the effect.
├─ A state flag that was set by a handler?
│  → Remove the flag. Do the work in the handler directly.
└─ An external system (mount, resize, WebSocket, DOM)?
   → Keep the effect. This is legitimate.
```

## References

- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — React official docs
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies) — React official docs
- [Should this code move to an event handler?](https://react.dev/learn/removing-effect-dependencies#should-this-code-move-to-an-event-handler) — React official docs
