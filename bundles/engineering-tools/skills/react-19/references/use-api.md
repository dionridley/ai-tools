# The use() API in React 19

## Table of Contents
- [Overview](#overview)
- [Reading Promises](#reading-promises)
- [Reading Context](#reading-context)
- [Common Patterns](#common-patterns)
- [Pitfalls & Restrictions](#pitfalls--restrictions)

## Overview

`use` is a new React API that lets you read the value of resources like Promises or Context during render. Unlike hooks, `use` can be called conditionally and inside loops.

```ts
import { use } from 'react';

const value = use(resource);
```

## Reading Promises

### Basic Usage with Suspense

```jsx
import { use, Suspense } from 'react';

// Promise created outside render (e.g., from a loader or cache)
const commentsPromise = fetchComments(postId);

function Comments({ commentsPromise }) {
  // use() suspends until promise resolves
  const comments = use(commentsPromise);

  return (
    <ul>
      {comments.map(comment => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

function Post({ postId }) {
  const commentsPromise = fetchComments(postId);

  return (
    <article>
      <h1>Post Content</h1>
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </article>
  );
}
```

### With Data Fetching Libraries

Works with any Suspense-compatible data source:

```jsx
// With a cache/loader pattern
import { cache } from 'react';

const fetchUser = cache(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

function UserProfile({ userId }) {
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<Skeleton />}>
      <UserDetails userPromise={userPromise} />
    </Suspense>
  );
}

function UserDetails({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}
```

### Nested Suspense Boundaries

```jsx
function Dashboard() {
  const statsPromise = fetchStats();
  const notificationsPromise = fetchNotifications();

  return (
    <div>
      <Suspense fallback={<StatsLoader />}>
        <Stats statsPromise={statsPromise} />
      </Suspense>

      <Suspense fallback={<NotificationsLoader />}>
        <Notifications notificationsPromise={notificationsPromise} />
      </Suspense>
    </div>
  );
}
```

## Reading Context

### Conditional Context Access

The key advantage over `useContext`: `use` works after conditional returns.

```jsx
import { use } from 'react';
import ThemeContext from './ThemeContext';

function Heading({ children }) {
  // Early return
  if (children == null) {
    return null;
  }

  // use(Context) works after early return!
  // useContext(ThemeContext) would violate rules of hooks
  const theme = use(ThemeContext);

  return (
    <h1 style={{ color: theme.primaryColor }}>
      {children}
    </h1>
  );
}
```

### Inside Loops

```jsx
function MultiThemeDisplay({ themes }) {
  return (
    <div>
      {themes.map((ThemeContext, i) => {
        // use() can be called in loops
        const theme = use(ThemeContext);
        return <div key={i} style={{ background: theme.bg }}>{theme.name}</div>;
      })}
    </div>
  );
}
```

### With Try/Catch

```jsx
function OptionalFeature({ featureContext }) {
  try {
    const feature = use(featureContext);
    return <div>{feature.content}</div>;
  } catch {
    return <div>Feature unavailable</div>;
  }
}
```

## Common Patterns

### Server Component Data Passing

```jsx
// ServerComponent.server.jsx
async function ServerComponent() {
  const data = await fetchData();
  return <ClientComponent dataPromise={Promise.resolve(data)} />;
}

// ClientComponent.jsx
'use client';
function ClientComponent({ dataPromise }) {
  const data = use(dataPromise);
  return <div>{data.content}</div>;
}
```

### Parallel Data Fetching

```jsx
function Dashboard() {
  // Start all fetches in parallel
  const userPromise = fetchUser();
  const postsPromise = fetchPosts();
  const statsPromise = fetchStats();

  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserSection userPromise={userPromise} />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection postsPromise={postsPromise} />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection statsPromise={statsPromise} />
      </Suspense>
    </div>
  );
}
```

### Waterfall Avoidance

```jsx
// BAD: Sequential fetching (waterfall)
function Profile({ userId }) {
  const user = use(fetchUser(userId));
  // This doesn't start until user loads
  const posts = use(fetchPosts(user.id));
  return <div>...</div>;
}

// GOOD: Parallel fetching
function Profile({ userId }) {
  // Start both at same time
  const userPromise = fetchUser(userId);
  const postsPromise = fetchUserPosts(userId);

  return (
    <Suspense>
      <ProfileContent
        userPromise={userPromise}
        postsPromise={postsPromise}
      />
    </Suspense>
  );
}

function ProfileContent({ userPromise, postsPromise }) {
  const user = use(userPromise);
  const posts = use(postsPromise);
  return <div>...</div>;
}
```

### Error Handling with Error Boundaries

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorUI />}>
      <Suspense fallback={<Loading />}>
        <DataComponent dataPromise={dataPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}

function DataComponent({ dataPromise }) {
  const data = use(dataPromise); // Throws on rejection
  return <div>{data.content}</div>;
}
```

## Pitfalls & Restrictions

### Never Create Promises in Render

```jsx
// WRONG: Creates new promise every render
function Bad({ id }) {
  const data = use(fetch(`/api/${id}`).then(r => r.json()));
  return <div>{data.name}</div>;
}

// CORRECT: Promise from cache or prop
const fetchData = cache(async (id) => {
  const response = await fetch(`/api/${id}`);
  return response.json();
});

function Good({ id }) {
  const dataPromise = fetchData(id); // Cached
  const data = use(dataPromise);
  return <div>{data.name}</div>;
}
```

### use() is Not a Hook

Despite similar naming, `use` follows different rules:

| Feature | Hooks (useState, useEffect) | use() |
|---------|----------------------------|-------|
| Conditional calls | Not allowed | Allowed |
| Inside loops | Not allowed | Allowed |
| After early return | Not allowed | Allowed |
| Only in components | Yes | Yes |

### Suspense Boundary Required

For promises, you must have a Suspense boundary ancestor:

```jsx
// WRONG: No Suspense boundary
function App() {
  return <DataComponent dataPromise={promise} />; // Will error
}

// CORRECT: Suspense boundary present
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <DataComponent dataPromise={promise} />
    </Suspense>
  );
}
```

### Promise Identity Matters

```jsx
// WRONG: New promise object on every render
function Parent() {
  // This creates a new promise reference each render!
  return <Child dataPromise={Promise.resolve(cachedData)} />;
}

// CORRECT: Stable promise reference
const dataPromise = Promise.resolve(cachedData);

function Parent() {
  return <Child dataPromise={dataPromise} />;
}

// OR: Use useMemo
function Parent({ data }) {
  const dataPromise = useMemo(() => Promise.resolve(data), [data]);
  return <Child dataPromise={dataPromise} />;
}
```

### Context Must Exist

```jsx
// use(Context) requires the context to be provided somewhere above
function Component() {
  const theme = use(ThemeContext); // Throws if no provider!
  return <div>{theme.name}</div>;
}

// Must have provider
<ThemeContext value={theme}>
  <Component />
</ThemeContext>
```

### Cannot Read Promise Value Before Resolution

```jsx
// use() suspends - code after it only runs when resolved
function Component({ dataPromise }) {
  console.log('Before use'); // Runs multiple times during suspension
  const data = use(dataPromise);
  console.log('After use');  // Only runs after resolution
  return <div>{data}</div>;
}
```
