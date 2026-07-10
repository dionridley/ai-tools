# Server Components & Server Actions in React 19

## Table of Contents
- [Server Components Overview](#server-components-overview)
- [Server Actions](#server-actions)
- [cacheSignal (React 19.2)](#cachesignal-react-192)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Server Components Overview

Server Components run on the server (at build time or request time) and are never sent to the client. They can:
- Access databases directly
- Read files from the filesystem
- Use server-only APIs
- Keep secrets secure

> **Framework Note:** Server Components require a compatible bundler/framework (Next.js App Router, Waku, etc.). The `'use server'` and `'use client'` directives are part of React 19. Utilities like route revalidation, cookie access, and redirects are provided by your framework — examples below use Next.js imports for illustration where noted.

### Basic Structure

```jsx
// page.jsx (Server Component - the default in frameworks like Next.js App Router)
import { db } from '@/lib/db';
import ClientInteractive from './ClientInteractive';

export default async function Page() {
  // Direct database access - safe, not exposed to client
  const posts = await db.posts.findMany();

  return (
    <div>
      <h1>Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          {/* Interactive parts use Client Components */}
          <ClientInteractive postId={post.id} />
        </article>
      ))}
    </div>
  );
}
```

### Marking Client Components

```jsx
// ClientInteractive.jsx
'use client'; // This directive marks a Client Component

import { useState } from 'react';

export default function ClientInteractive({ postId }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? 'Liked' : 'Like'}
    </button>
  );
}
```

### Composition Rules

```jsx
// Server Component can import and render Client Components
// Server Component
import ClientComponent from './ClientComponent';

export default async function ServerPage() {
  const data = await fetchData();
  return (
    <div>
      <h1>{data.title}</h1>
      <ClientComponent initialData={data} />
    </div>
  );
}

// Client Component CANNOT import Server Components directly
// But CAN receive them as children
'use client';
export default function ClientWrapper({ children }) {
  const [show, setShow] = useState(true);
  return show ? children : null; // children can be Server Components
}

// Usage
<ClientWrapper>
  <ServerComponent /> {/* This works! */}
</ClientWrapper>
```

## Server Actions

Functions that run on the server but can be called from Client Components.

### Defining Server Actions

```jsx
// actions.js
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache'; // Next.js-specific; other frameworks have equivalent APIs

export async function createPost(formData) {
  const title = formData.get('title');
  const content = formData.get('content');

  await db.posts.create({
    data: { title, content }
  });

  revalidatePath('/posts');
}

export async function deletePost(id) {
  await db.posts.delete({ where: { id } });
  revalidatePath('/posts');
}
```

### Using in Forms

```jsx
// PostForm.jsx
'use client';

import { createPost } from './actions';
import { useActionState } from 'react';

export default function PostForm() {
  const [error, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        await createPost(formData);
        return null;
      } catch (e) {
        return e.message;
      }
    },
    null
  );

  return (
    <form action={formAction}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Inline Server Actions

```jsx
// Can define inline in Server Components
export default function DeleteButton({ postId }) {
  async function handleDelete() {
    'use server';
    await db.posts.delete({ where: { id: postId } });
    revalidatePath('/posts'); // Framework-specific revalidation
  }

  return (
    <form action={handleDelete}>
      <button type="submit">Delete</button>
    </form>
  );
}
```

### Calling from Event Handlers

```jsx
'use client';

import { deletePost } from './actions';
import { useTransition } from 'react';

export default function DeleteButton({ postId }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### With Optimistic Updates

```jsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleLike } from './actions';

export default function LikeButton({ postId, initialLiked }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(initialLiked);

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked);
      await toggleLike(postId);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {optimisticLiked ? '❤️' : '🤍'}
    </button>
  );
}
```

## cacheSignal (React 19.2)

Allows cleanup when a cached function's lifetime ends (render completes, aborts, or fails).

### Basic Usage

```jsx
import { cache, cacheSignal } from 'react';

const cachedFetch = cache(async (url) => {
  // AbortSignal tied to cache lifetime
  const signal = cacheSignal();

  const response = await fetch(url, { signal });
  return response.json();
});

async function DataComponent() {
  // If render aborts, the fetch is cancelled
  const data = await cachedFetch('/api/data');
  return <div>{data.content}</div>;
}
```

### With Database Connections

```jsx
import { cache, cacheSignal } from 'react';

const getConnection = cache(async () => {
  const signal = cacheSignal();
  const connection = await db.connect();

  // Cleanup when cache lifetime ends
  signal.addEventListener('abort', () => {
    connection.close();
  });

  return connection;
});
```

### Cleanup Triggers

`cacheSignal()` abort triggers when:
1. React successfully completes rendering the tree
2. Render is aborted (e.g., navigation)
3. Render fails with an error

```jsx
const fetchWithCleanup = cache(async (url) => {
  const signal = cacheSignal();
  const controller = new AbortController();

  // Link React's signal to our controller
  signal.addEventListener('abort', () => {
    controller.abort();
  });

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('Request cancelled by React');
    }
    throw e;
  }
});
```

## Best Practices

### 1. Data Fetching in Server Components

```jsx
// GOOD: Fetch at the component that needs it
async function UserProfile({ userId }) {
  const user = await fetchUser(userId);
  return <Profile user={user} />;
}

// GOOD: Parallel fetching
async function Dashboard() {
  const [user, posts, stats] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchStats()
  ]);

  return (
    <div>
      <UserSection user={user} />
      <PostsSection posts={posts} />
      <StatsSection stats={stats} />
    </div>
  );
}
```

### 2. Keep Secrets Server-Side

```jsx
// GOOD: API keys in Server Component
async function PaymentSection() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({...});
  return <PaymentForm sessionId={session.id} />;
}

// BAD: Never expose secrets to Client Components
'use client';
function BadPayment() {
  // This would expose the key!
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}
```

### 3. Minimize Client JavaScript

```jsx
// GOOD: Static parts as Server Components
async function ArticlePage({ id }) {
  const article = await getArticle(id);

  return (
    <article>
      {/* All static - no JS needed */}
      <h1>{article.title}</h1>
      <p>{article.content}</p>
      <AuthorBio author={article.author} />

      {/* Only interactive part needs JS */}
      <CommentSection articleId={id} />
    </article>
  );
}
```

### 4. Error Handling in Server Actions

```jsx
'use server';

export async function createItem(formData) {
  try {
    const item = await db.items.create({...});
    return { success: true, item };
  } catch (e) {
    // Don't expose internal errors to client
    console.error(e);
    return { success: false, error: 'Failed to create item' };
  }
}
```

## Common Patterns

### Authentication in Server Components

```jsx
// Framework-specific imports (Next.js shown; adapt for your framework)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

async function ProtectedPage() {
  const token = cookies().get('session');
  const user = await verifyToken(token?.value);

  if (!user) {
    redirect('/login');
  }

  return <Dashboard user={user} />;
}
```

### Revalidation After Mutations

Revalidation APIs are framework-specific. The pattern is the same across frameworks: after a mutation, signal that cached data is stale.

```jsx
'use server';

// Next.js revalidation APIs (other frameworks provide equivalents)
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updatePost(id, data) {
  await db.posts.update({ where: { id }, data });

  // Revalidate specific path
  revalidatePath(`/posts/${id}`);

  // Or revalidate by tag
  revalidateTag('posts');
}
```

### Streaming with Suspense

```jsx
async function Page() {
  return (
    <div>
      {/* Fast - renders immediately */}
      <Header />

      {/* Slow - streams in when ready */}
      <Suspense fallback={<PostsSkeleton />}>
        <SlowPosts />
      </Suspense>

      <Footer />
    </div>
  );
}

async function SlowPosts() {
  const posts = await fetchPosts(); // Slow query
  return <PostsList posts={posts} />;
}
```

### Form with Server Action and Redirect

```jsx
'use server';

import { redirect } from 'next/navigation'; // Framework-specific redirect

export async function createAndRedirect(formData) {
  const item = await db.items.create({
    data: { name: formData.get('name') }
  });

  redirect(`/items/${item.id}`);
}
```
