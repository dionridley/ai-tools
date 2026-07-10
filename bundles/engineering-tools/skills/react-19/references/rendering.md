# Rendering APIs in React 19

## Table of Contents
- [prerender() for Static Generation](#prerender-for-static-generation)
- [Activity Component (React 19.2)](#activity-component-react-192)
- [useEffectEvent (React 19.2)](#useeffectevent-react-192)
- [Partial Pre-rendering (React 19.2)](#partial-pre-rendering-react-192)
- [Performance Tracks (React 19.2)](#performance-tracks-react-192)

## prerender() for Static Generation

New API for generating static HTML that waits for all data to load.

### Web Streams API

```jsx
import { prerender } from 'react-dom/static';

async function generatePage(request) {
  const { prelude } = await prerender(<App />, {
    bootstrapScripts: ['/main.js']
  });

  return new Response(prelude, {
    headers: { 'content-type': 'text/html' }
  });
}
```

### Node.js Streams API

```jsx
import { prerenderToNodeStream } from 'react-dom/static';
import { pipeline } from 'stream/promises';

async function generatePage(request, response) {
  const { prelude } = await prerenderToNodeStream(<App />, {
    bootstrapScripts: ['/main.js']
  });

  response.setHeader('content-type', 'text/html');
  await pipeline(prelude, response);
}
```

### With Suspense Boundaries

```jsx
// prerender waits for ALL Suspense boundaries to resolve
async function Page() {
  return (
    <html>
      <body>
        <Header />
        <Suspense fallback={<Loading />}>
          <SlowContent /> {/* prerender waits for this */}
        </Suspense>
      </body>
    </html>
  );
}

const { prelude } = await prerender(<Page />);
// prelude contains complete HTML including SlowContent
```

### Difference from renderToString

| Feature | renderToString | prerender |
|---------|---------------|-----------|
| Suspense | Shows fallbacks | Waits for resolution |
| Streaming | No | Yes |
| Async data | Not supported | Fully supported |
| Use case | Simple SSR | Static generation |

## Activity Component (React 19.2)

Controls visibility and update priority for component subtrees.

### Modes

- **`visible`**: Shows children, mounts effects, processes updates normally
- **`hidden`**: Hides children, unmounts effects, defers updates until idle

### Basic Usage

```jsx
import { Activity } from 'react';

function TabContainer({ activeTab }) {
  return (
    <div>
      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>

      <Activity mode={activeTab === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>

      <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
        <SettingsTab />
      </Activity>
    </div>
  );
}
```

### State Preservation

Unlike conditional rendering, Activity preserves component state:

```jsx
function App() {
  const [showForm, setShowForm] = useState(true);

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>Toggle</button>

      {/* OLD: State lost when hidden */}
      {showForm && <FormWithInputs />}

      {/* NEW: State preserved when hidden */}
      <Activity mode={showForm ? 'visible' : 'hidden'}>
        <FormWithInputs />
      </Activity>
    </div>
  );
}
```

### Pre-rendering Hidden Content

Load data and render components before they're visible:

```jsx
function Navigation({ currentRoute }) {
  return (
    <div>
      {/* Visible page */}
      <Route path={currentRoute} />

      {/* Pre-render likely next pages in background */}
      <Activity mode="hidden">
        <Route path="/likely-next-page" />
      </Activity>
    </div>
  );
}
```

### Effect Lifecycle with Activity

```jsx
function TrackedComponent() {
  useEffect(() => {
    console.log('Mounted / Became visible');
    analytics.trackView();

    return () => {
      console.log('Unmounted / Became hidden');
    };
  }, []);

  return <div>Content</div>;
}

// Effects run when Activity mode changes
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <TrackedComponent />
</Activity>
```

### Deferred Updates

When hidden, updates are deferred until React is idle:

```jsx
function RealTimeData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('/data');
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);

  return <DataDisplay data={data} />;
}

// When hidden, WebSocket updates are batched and deferred
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <RealTimeData />
</Activity>
```

## useEffectEvent (React 19.2)

Creates stable event handlers that can read the latest props/state without triggering effect re-runs.

### The Problem

```jsx
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(roomId);

    connection.on('connected', () => {
      // Problem: This needs `theme`, but theme changes
      // shouldn't reconnect to the chat room!
      showNotification('Connected!', theme);
    });

    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // theme change causes reconnect!
}
```

### The Solution

```jsx
import { useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  // Event always reads latest theme without being a dependency
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      onConnected(); // Stable reference, reads latest theme
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Only roomId triggers reconnect
}
```

### Key Rules

1. **DO NOT** add effect events to dependency arrays
2. **DO NOT** call effect events during render
3. Only define in the same component/hook as the effect

```jsx
// WRONG: Effect event in dependency array
useEffect(() => {
  onConnected();
}, [onConnected]); // Never do this!

// CORRECT: Effect event not in dependencies
useEffect(() => {
  connection.on('connected', onConnected);
}, []);
```

### Valid Use Cases

```jsx
// Analytics that shouldn't trigger re-subscription
function useAnalyticsEvent(eventName, metadata) {
  const onEvent = useEffectEvent(() => {
    analytics.track(eventName, {
      ...metadata,
      timestamp: Date.now()
    });
  });

  useEffect(() => {
    window.addEventListener('click', onEvent);
    return () => window.removeEventListener('click', onEvent);
  }, []); // Empty deps - never re-subscribes
}

// Notification with latest theme
function useNotifications(channel) {
  const { theme } = useContext(ThemeContext);

  const showNotification = useEffectEvent((message) => {
    toast(message, { theme: theme.name });
  });

  useEffect(() => {
    const unsubscribe = subscribe(channel, showNotification);
    return unsubscribe;
  }, [channel]); // Only channel triggers resubscribe
}
```

### ESLint Configuration

Requires updated eslint-plugin-react-hooks:

```bash
npm install eslint-plugin-react-hooks@latest
```

The plugin recognizes that effect events shouldn't be in dependency arrays.

## Partial Pre-rendering (React 19.2)

Pre-render static shells ahead of time, then hydrate with dynamic content.

### Step 1: Pre-render with Postponed State

```jsx
import { prerender } from 'react-dom/static';

async function buildPage() {
  const controller = new AbortController();

  const { prelude, postponed } = await prerender(<App />, {
    signal: controller.signal
  });

  // Save postponed state for later resume
  await savePostponedState(postponed);

  // Send prelude (static shell) to CDN
  await uploadToCDN(prelude);
}
```

### Step 2: Resume at Request Time

#### Resume to Streaming SSR

```jsx
import { resume } from 'react-dom/server';

async function handleRequest(request) {
  const postponed = await getPostponedState(request);

  // Resume rendering with dynamic content
  const stream = await resume(<App />, postponed, {
    bootstrapScripts: ['/main.js']
  });

  return new Response(stream);
}
```

#### Resume to Static HTML (SSG)

```jsx
import { resumeAndPrerender } from 'react-dom/static';

async function generateDynamicPage(request) {
  const postponed = await getPostponedState(request);

  // Generate complete static HTML
  const { prelude } = await resumeAndPrerender(<App />, postponed);

  // Cache the complete page
  await cachePage(prelude);

  return new Response(prelude);
}
```

### Node.js Stream APIs

For better performance in Node.js:

```jsx
import { resumeToPipeableStream } from 'react-dom/server';
import { resumeAndPrerenderToNodeStream } from 'react-dom/static';

// Streaming resume
const { pipe } = await resumeToPipeableStream(<App />, postponed);
pipe(response);

// Static resume
const { prelude } = await resumeAndPrerenderToNodeStream(<App />, postponed);
pipeline(prelude, response);
```

### Use Case: Edge + Origin

```jsx
// At build time (CI)
const { prelude, postponed } = await prerender(<App />);
// Deploy prelude to CDN edge
// Store postponed in database

// At edge (CDN)
async function edgeHandler(request) {
  // Serve cached static shell immediately
  const staticShell = await getCachedPrelude();

  // Stream dynamic parts from origin
  const dynamicStream = await fetchFromOrigin(request);

  return new Response(
    combineStreams(staticShell, dynamicStream)
  );
}

// At origin
async function originHandler(request) {
  const postponed = await getPostponedState();
  return resume(<App />, postponed);
}
```

## Performance Tracks (React 19.2)

New Chrome DevTools performance tracks for React profiling.

### Scheduler Track (⚛)

Shows what React is working on and at what priority:

- **blocking**: User interactions (clicks, typing)
- **transition**: Updates inside `startTransition`
- **idle**: Low-priority background work

### Components Track (⚛)

Shows component tree rendering:

- **Mount**: Component or effects mounting
- **Blocked**: Rendering blocked/yielded

### How to Use

1. Open Chrome DevTools
2. Go to Performance tab
3. Record a session
4. Look for "⚛ Scheduler" and "⚛ Components" tracks

### Interpreting Results

```
Scheduler Track:
[blocking: click handler] → [transition: data fetch] → [idle: prefetch]

Components Track:
[Mount: App] → [Mount: Header] → [Blocked: Suspense] → [Mount: Content]
```

Use this to:
- Identify why transitions are slow
- Find components that block rendering
- Understand priority splitting
- Debug Suspense boundary behavior
