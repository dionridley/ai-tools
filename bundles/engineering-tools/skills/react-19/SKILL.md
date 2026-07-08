---
name: react-19
version: 0.1.0
description: This skill should be used when the user is building, modifying, or reviewing React components or applications. It provides React 19.x development patterns and APIs that should be preferred over legacy approaches. Covers Actions, useActionState, useFormStatus, useOptimistic, use() API, Form Actions, ref as prop, Context as provider, document metadata, Server Components, Server Actions, prerender(), Activity component, useEffectEvent, cacheSignal(), and Partial Pre-rendering.
---

# React 19.x Development

This skill provides guidance on React 19.x features that may not be in LLM training data. Focus is on new APIs, patterns, and migration from older React patterns.

## When to Apply React 19 Patterns

When generating or modifying React code, always prefer React 19 patterns over legacy equivalents:

- Replace `forwardRef` wrappers with `ref` as a regular prop
- Replace `<Context.Provider>` with `<Context>` directly
- Replace manual pending/error state management with `useActionState` and form actions
- Replace manual optimistic state with `useOptimistic`
- Replace conditional rendering (`{show && <Component />}`) with `<Activity>` when state preservation matters
- Use `use()` instead of `useContext()` when context is read conditionally
- Use `useEffectEvent` to prevent unnecessary effect re-runs from non-reactive values

Consult the decision tree below to select the appropriate API. For detailed patterns, consult the relevant reference file.

## Quick API Reference

### New Hooks (React 19)
| Hook | Purpose | Import |
|------|---------|--------|
| `useActionState` | Form state + pending + error handling | `react` |
| `useFormStatus` | Read parent form's pending state | `react-dom` |
| `useOptimistic` | Optimistic UI updates | `react` |
| `use` | Read promises/context conditionally | `react` |

### New Hooks (React 19.2)
| Hook | Purpose | Import |
|------|---------|--------|
| `useEffectEvent` | Stable event handlers in effects | `react` |

### New Components (React 19.2)
| Component | Purpose |
|-----------|---------|
| `<Activity>` | Control visibility/priority of subtrees |

### Enhanced in React 19
| API | Change | Import |
|-----|--------|--------|
| `useDeferredValue` | New optional `initialValue` parameter | `react` |

### New Utilities (React 19)
| Function | Purpose | Import |
|----------|---------|--------|
| `requestFormReset` | Programmatically reset a form after action | `react-dom` |

## Decision Tree: Which API to Use?

```
Handling form submission?
├── Need pending state in child component? → useFormStatus
├── Need optimistic updates? → useOptimistic
├── Need form state + error handling? → useActionState
└── Simple async action? → useTransition with async

Reading async data?
├── In render, with Suspense? → use(promise)
└── In effect/event handler? → Regular await

Reading context conditionally?
└── After early return? → use(Context) instead of useContext

Effect needs reactive value but shouldn't re-run?
└── → useEffectEvent

Conditional rendering with state preservation?
└── → <Activity mode="visible|hidden">
```

## Core Patterns

### 1. Form Actions (replaces manual submit handlers)

```jsx
// OLD: Manual state management
function OldForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    const result = await submitData(new FormData(e.target));
    setIsPending(false);
    if (result.error) setError(result.error);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// NEW: Form Actions with useActionState
function NewForm() {
  const [error, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await submitData(formData);
      if (result.error) return result.error;
      redirect('/success');
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <input name="field" />
      <button disabled={isPending}>Submit</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### 2. ref as Prop (no more forwardRef)

```jsx
// OLD: Required forwardRef wrapper
const OldInput = forwardRef(function OldInput({ label }, ref) {
  return <input ref={ref} aria-label={label} />;
});

// NEW: ref is just a prop
function NewInput({ label, ref }) {
  return <input ref={ref} aria-label={label} />;
}

// Both used the same way
<NewInput ref={inputRef} label="Name" />
```

### 3. Context as Provider

```jsx
// OLD
<ThemeContext.Provider value={theme}>
  {children}
</ThemeContext.Provider>

// NEW
<ThemeContext value={theme}>
  {children}
</ThemeContext>
```

### 4. use() API for Conditional Context

```jsx
// useContext cannot be called after early return
function Component({ show }) {
  if (!show) return null;
  // const theme = useContext(ThemeContext); // ERROR!
  const theme = use(ThemeContext); // OK!
  return <div style={{ color: theme.color }}>...</div>;
}
```

### 5. Activity Component (React 19.2)

```jsx
// OLD: Unmounts and loses state
{isVisible && <ExpensiveComponent />}

// NEW: Preserves state, defers updates when hidden
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <ExpensiveComponent />
</Activity>
```

### 6. useEffectEvent (React 19.2)

```jsx
// Problem: theme change causes reconnect
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const conn = connect(roomId);
    conn.on('connected', () => showNotification(theme));
    return () => conn.disconnect();
  }, [roomId, theme]); // theme shouldn't trigger reconnect!
}

// Solution: useEffectEvent
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification(theme); // Always reads latest theme
  });

  useEffect(() => {
    const conn = connect(roomId);
    conn.on('connected', onConnected);
    return () => conn.disconnect();
  }, [roomId]); // Only roomId triggers reconnect
}
```

## Common Pitfalls

### useActionState
- First param receives `(previousState, formData)` - don't forget `previousState`
- Returns `[state, action, isPending]` - order matters
- Renamed from `useFormState` in React DOM

### useFormStatus
- Must be used in a component that's a child of `<form>`
- Cannot be used in the same component that renders the form
- Returns `{ pending, data, method, action }`

### useOptimistic
- Automatically reverts on error - no manual rollback needed
- Use with `startTransition` or form actions

### use()
- Only for promises created outside render (from cache, loader, etc.)
- Never create promises in render and pass to `use()`
- Works with Suspense boundaries

### ref Cleanup Functions
```jsx
// NEW: Cleanup function syntax
<input
  ref={(node) => {
    // Setup
    node.focus();
    return () => {
      // Cleanup when ref changes or unmounts
    };
  }}
/>

// BREAKING: Implicit returns now fail TypeScript
<div ref={current => (instance = current)} />     // BAD
<div ref={current => { instance = current; }} />  // GOOD
```

### useEffectEvent
- Do NOT add to dependency array (it's stable)
- Only use for "event" logic, not to silence linter

## Migration Codemods

Available codemods for automatic migration from React 18 patterns:

```bash
npx codemod react/19/replace-forward-ref      # forwardRef → ref as prop
npx codemod react/19/replace-context-provider  # Context.Provider → Context
```

## References

For detailed documentation on specific topics:

- **[Actions & Forms](references/actions.md)**: useActionState, useFormStatus, useOptimistic, form actions
- **[use() API](references/use-api.md)**: Reading promises and context with use()
- **[Server Components](references/server-components.md)**: RSC, Server Actions, cacheSignal
- **[Rendering APIs](references/rendering.md)**: prerender, Activity, Partial Pre-rendering
- **[Syntax Improvements](references/improvements.md)**: ref as prop, Context provider, metadata, stylesheets, scripts
