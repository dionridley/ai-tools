# Actions & Form Handling in React 19

## Table of Contents
- [Overview](#overview)
- [useTransition with Async](#usetransition-with-async)
- [useActionState](#useactionstate)
- [Form Actions](#form-actions)
- [useFormStatus](#useformstatus)
- [useOptimistic](#useoptimistic)
- [Migration Guide](#migration-guide)

## Overview

React 19 introduces "Actions" - a convention for functions that use async transitions. Actions provide:
- Automatic pending state management
- Automatic error handling with Error Boundaries
- Optimistic updates with automatic rollback
- Native form integration

## useTransition with Async

In React 19, `useTransition` now supports async functions:

```jsx
function UpdateProfile() {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      // Async operations now supported!
      const error = await updateProfile(name);
      if (error) {
        setError(error);
        return;
      }
      redirect('/profile');
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

**Key Points:**
- `isPending` is `true` during the entire async operation
- Error boundaries catch errors thrown in the transition
- State updates in transitions are batched

## useActionState

The primary hook for form handling. Manages form state, pending state, and errors.

### Signature

```ts
const [state, formAction, isPending] = useActionState(
  action: (prevState: State, formData: FormData) => State | Promise<State>,
  initialState: State,
  permalink?: string
);
```

### Basic Example

```jsx
import { useActionState } from 'react';

function LoginForm() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const email = formData.get('email');
      const password = formData.get('password');

      const result = await login(email, password);

      if (result.error) {
        return result.error; // This becomes the new state
      }

      redirect('/dashboard');
      return null;
    },
    null // Initial state (no error)
  );

  return (
    <form action={submitAction}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Log in'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### With Complex State

```jsx
function ProductForm() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        const product = await createProduct({
          name: formData.get('name'),
          price: parseFloat(formData.get('price')),
        });
        return { success: true, product, error: null };
      } catch (e) {
        return { success: false, product: null, error: e.message };
      }
    },
    { success: false, product: null, error: null }
  );

  return (
    <form action={submitAction}>
      <input name="name" placeholder="Product name" />
      <input name="price" type="number" step="0.01" />
      <button disabled={isPending}>Create</button>

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Created: {state.product.name}</p>}
    </form>
  );
}
```

### Progressive Enhancement with Permalink

For SSR with JavaScript disabled:

```jsx
const [state, action, isPending] = useActionState(
  async (prevState, formData) => {
    // Server action
  },
  null,
  '/api/submit' // Fallback URL for non-JS
);
```

## Form Actions

React 19 allows passing functions directly to form's `action` prop:

```jsx
// Simple form action
<form action={async (formData) => {
  await saveData(formData);
}}>
  <input name="field" />
  <button type="submit">Submit</button>
</form>
```

### formAction on Buttons

Different buttons can trigger different actions:

```jsx
function ItemForm({ item }) {
  async function updateItem(formData) {
    await api.update(item.id, formData);
  }

  async function deleteItem() {
    await api.delete(item.id);
  }

  return (
    <form action={updateItem}>
      <input name="name" defaultValue={item.name} />
      <button type="submit">Save</button>
      <button type="submit" formAction={deleteItem}>Delete</button>
    </form>
  );
}
```

### Form Reset

Forms automatically reset on successful action. For manual control:

```jsx
import { requestFormReset } from 'react-dom';

async function handleAction(formData) {
  const result = await submitData(formData);
  if (result.success) {
    requestFormReset(); // Programmatic reset
  }
}
```

## useFormStatus

Access the pending state of a parent form from within a child component.

### Signature

```ts
const { pending, data, method, action } = useFormStatus();
```

### Usage

```jsx
import { useFormStatus } from 'react-dom';

// Must be INSIDE a form (as a child component)
function SubmitButton() {
  const { pending, data } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Usage in parent
function MyForm() {
  return (
    <form action={submitAction}>
      <input name="email" />
      <SubmitButton /> {/* Has access to form's pending state */}
    </form>
  );
}
```

### Design System Components

Perfect for reusable form components:

```jsx
// In your design system
function FormButton({ children, loadingText = 'Loading...' }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={pending ? 'loading' : ''}
    >
      {pending ? loadingText : children}
    </button>
  );
}

function FormInput({ name, ...props }) {
  const { pending } = useFormStatus();
  return <input name={name} disabled={pending} {...props} />;
}
```

### Common Mistake

```jsx
// WRONG: useFormStatus in same component as form
function BadForm() {
  const { pending } = useFormStatus(); // Won't work!
  return <form action={action}>...</form>;
}

// CORRECT: useFormStatus in child component
function GoodForm() {
  return (
    <form action={action}>
      <ChildWithFormStatus />
    </form>
  );
}
```

## useOptimistic

Show immediate UI feedback while async operations complete.

### Signature

```ts
const [optimisticState, addOptimistic] = useOptimistic(
  state,
  updateFn?: (currentState, optimisticValue) => newOptimisticState
);
```

### Basic Example

```jsx
import { useOptimistic } from 'react';

function LikeButton({ likes, postId }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (current, increment) => current + increment
  );

  async function handleLike() {
    addOptimisticLike(1); // Immediate UI update
    await api.likePost(postId); // Server request
    // If this fails, optimisticLikes reverts to original
  }

  return (
    <button onClick={handleLike}>
      {optimisticLikes} likes
    </button>
  );
}
```

### With Form Actions

```jsx
function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  async function addTodo(formData) {
    const text = formData.get('text');
    addOptimisticTodo({ text, id: Date.now() });
    await api.createTodo(text);
  }

  return (
    <div>
      <form action={addTodo}>
        <input name="text" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Name Change Example

```jsx
function ChangeName({ currentName, onUpdate }) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async (formData) => {
    const newName = formData.get('name');
    setOptimisticName(newName); // Show immediately
    const updated = await updateName(newName);
    onUpdate(updated);
    // If updateName throws, optimisticName reverts to currentName
  };

  return (
    <form action={submitAction}>
      <p>Your name: {optimisticName}</p>
      <input
        name="name"
        defaultValue={currentName}
        disabled={currentName !== optimisticName}
      />
      <button type="submit">Change</button>
    </form>
  );
}
```

## Migration Guide

### From useFormState (React DOM)

```jsx
// OLD (deprecated)
import { useFormState } from 'react-dom';
const [state, formAction] = useFormState(action, initialState);

// NEW
import { useActionState } from 'react';
const [state, formAction, isPending] = useActionState(action, initialState);
```

### From Manual Pending State

```jsx
// OLD
function OldWay() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      await submitForm(new FormData(e.target));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// NEW
function NewWay() {
  const [error, action, isPending] = useActionState(
    async (prev, formData) => {
      try {
        await submitForm(formData);
        return null;
      } catch (err) {
        return err.message;
      }
    },
    null
  );

  return <form action={action}>...</form>;
}
```

### From Custom Optimistic State

```jsx
// OLD
function OldOptimistic({ items }) {
  const [optimistic, setOptimistic] = useState(items);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (item) => {
    setOptimistic([...optimistic, { ...item, pending: true }]);
    setSaving(true);
    try {
      await api.add(item);
      // Need to manually update on success
    } catch {
      // Need to manually rollback
      setOptimistic(items);
    }
    setSaving(false);
  };
}

// NEW
function NewOptimistic({ items }) {
  const [optimistic, addOptimistic] = useOptimistic(
    items,
    (state, item) => [...state, { ...item, pending: true }]
  );

  const handleAdd = async (item) => {
    addOptimistic(item); // Automatic rollback on error
    await api.add(item);
  };
}
```
