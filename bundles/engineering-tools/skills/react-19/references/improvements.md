# Syntax Improvements in React 19

## Table of Contents
- [ref as a Prop](#ref-as-a-prop)
- [Context as Provider](#context-as-provider)
- [ref Cleanup Functions](#ref-cleanup-functions)
- [useDeferredValue with initialValue](#usedeferredvalue-with-initialvalue)
- [Document Metadata Support](#document-metadata-support)
- [Stylesheet Support](#stylesheet-support)
- [Async Script Support](#async-script-support)
- [Resource Preloading APIs](#resource-preloading-apis)
- [Improved Error Handling](#improved-error-handling)
- [Custom Elements Support](#custom-elements-support)

## ref as a Prop

No more `forwardRef` wrapper needed. Pass `ref` as a regular prop.

### Before (React 18)

```jsx
import { forwardRef } from 'react';

const MyInput = forwardRef(function MyInput({ placeholder, className }, ref) {
  return (
    <input
      ref={ref}
      placeholder={placeholder}
      className={className}
    />
  );
});

// Usage
const inputRef = useRef(null);
<MyInput ref={inputRef} placeholder="Enter text" />
```

### After (React 19)

```jsx
function MyInput({ placeholder, className, ref }) {
  return (
    <input
      ref={ref}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Usage - same
const inputRef = useRef(null);
<MyInput ref={inputRef} placeholder="Enter text" />
```

### Migration

A codemod is available for automatic migration:

```bash
npx codemod react/19/replace-forward-ref
```

### Note on forwardRef

`forwardRef` still works in React 19 but will be deprecated in a future version.

## Context as Provider

Use the Context object directly as a provider.

### Before (React 18)

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Main />
    </ThemeContext.Provider>
  );
}
```

### After (React 19)

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext value="dark">
      <Main />
    </ThemeContext>
  );
}
```

### Migration

A codemod is available:

```bash
npx codemod react/19/replace-context-provider
```

### Note

`<Context.Provider>` still works but will be deprecated in a future version.

## ref Cleanup Functions

Ref callbacks can now return a cleanup function.

### Before (React 18)

```jsx
function Component() {
  const [element, setElement] = useState(null);

  // React calls with null on unmount
  const refCallback = (node) => {
    if (node) {
      // Setup
      node.addEventListener('click', handler);
      setElement(node);
    } else {
      // Cleanup - node is null
      element?.removeEventListener('click', handler);
    }
  };

  return <div ref={refCallback} />;
}
```

### After (React 19)

```jsx
function Component() {
  const refCallback = (node) => {
    // Setup
    node.addEventListener('click', handler);

    // Return cleanup function
    return () => {
      node.removeEventListener('click', handler);
    };
  };

  return <div ref={refCallback} />;
}
```

### TypeScript Breaking Change

Implicit returns are now rejected:

```jsx
// Before (worked in React 18, FAILS in React 19 with TypeScript)
<div ref={current => (instance = current)} />

// After (explicit block required)
<div ref={current => { instance = current; }} />
```

### No More null Calls

When a cleanup function is provided, React no longer calls the ref with `null` on unmount:

```jsx
// React 18: Called with node, then with null
// React 19 with cleanup: Called with node, cleanup called on unmount

<div ref={(node) => {
  console.log('Setup:', node); // Called once with node
  return () => {
    console.log('Cleanup'); // Called on unmount (node not passed)
  };
}} />
```

## useDeferredValue with initialValue

Specify an initial value for the first render.

### Before (React 18)

```jsx
function SearchResults({ query }) {
  // Always starts with query, even on first render
  const deferredQuery = useDeferredValue(query);

  // First render shows results for initial query immediately
  return <Results query={deferredQuery} />;
}
```

### After (React 19)

```jsx
function SearchResults({ query }) {
  // First render: '' (initial value)
  // Then deferred transition to query
  const deferredQuery = useDeferredValue(query, '');

  // First render shows empty state, then transitions to results
  return <Results query={deferredQuery} />;
}
```

### Use Case: Instant Feedback

```jsx
function Search() {
  const [query, setQuery] = useState('');

  // '' on first render allows instant display
  const deferredQuery = useDeferredValue(query, '');

  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <Suspense fallback={<Spinner />}>
          <SearchResults query={deferredQuery} />
        </Suspense>
      </div>
    </div>
  );
}
```

## Document Metadata Support

Render `<title>`, `<meta>`, and `<link>` tags anywhere in your component tree.

### Basic Usage

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="author" content={post.author} />
      <meta name="description" content={post.excerpt} />
      <meta name="keywords" content={post.tags.join(', ')} />
      <link rel="canonical" href={`https://blog.com/${post.slug}`} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

React automatically hoists these to `<head>`.

### With Nested Components

```jsx
function App() {
  return (
    <html>
      <head>
        {/* React merges metadata from components below */}
      </head>
      <body>
        <Layout>
          <ProductPage />
        </Layout>
      </body>
    </html>
  );
}

function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} | MyStore</title>
      <meta property="og:title" content={product.name} />
      <meta property="og:image" content={product.image} />

      <ProductDetails product={product} />
    </>
  );
}
```

### Works Everywhere

- Client-only apps
- Server-side rendering
- Server Components
- Streaming

## Stylesheet Support

Stylesheets with `precedence` are managed by React.

### Basic Usage

```jsx
function Component() {
  return (
    <div>
      <link rel="stylesheet" href="/styles/base.css" precedence="default" />
      <link rel="stylesheet" href="/styles/theme.css" precedence="high" />

      <div className="styled-content">
        Content
      </div>
    </div>
  );
}
```

### Features

1. **Automatic deduplication**: Same stylesheet referenced multiple times loads once
2. **Precedence ordering**: Stylesheets ordered by precedence, not render order
3. **Suspense integration**: Content waits for stylesheets before revealing

```jsx
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <link rel="stylesheet" href="/styles.css" precedence="default" />
      {/* Content waits for stylesheet to load */}
      <Content />
    </Suspense>
  );
}
```

### Precedence Levels

```jsx
// Low precedence (loads first, can be overridden)
<link rel="stylesheet" href="/reset.css" precedence="low" />

// Default precedence
<link rel="stylesheet" href="/base.css" precedence="default" />

// High precedence (loads last, overrides others)
<link rel="stylesheet" href="/theme.css" precedence="high" />
```

### Multiple Components

```jsx
function ComponentA() {
  return (
    <>
      <link rel="stylesheet" href="/a.css" precedence="default" />
      <div className="a">A</div>
    </>
  );
}

function ComponentB() {
  return (
    <>
      <link rel="stylesheet" href="/b.css" precedence="default" />
      <link rel="stylesheet" href="/a.css" precedence="default" /> {/* Deduped */}
      <div className="b">B</div>
    </>
  );
}
```

## Async Script Support

Async scripts are managed and deduplicated by React.

### Basic Usage

```jsx
function Analytics() {
  return (
    <div>
      <script async src="https://analytics.example.com/script.js" />
      <AnalyticsContent />
    </div>
  );
}
```

### Automatic Deduplication

```jsx
function App() {
  return (
    <div>
      <ComponentA />
      <ComponentB />
    </div>
  );
}

function ComponentA() {
  return (
    <>
      <script async src="/shared.js" />
      <div>A</div>
    </>
  );
}

function ComponentB() {
  return (
    <>
      <script async src="/shared.js" /> {/* Only loaded once */}
      <div>B</div>
    </>
  );
}
```

### SSR and Client Rendering

Works consistently across:
- Server-side rendering
- Client-side rendering
- Server Components

## Resource Preloading APIs

New APIs for preloading resources.

### Available Functions

```jsx
import {
  prefetchDNS,
  preconnect,
  preload,
  preinit
} from 'react-dom';
```

### Usage

```jsx
function App() {
  // DNS lookup only
  prefetchDNS('https://api.example.com');

  // DNS + TCP + TLS handshake
  preconnect('https://api.example.com');

  // Preload resource (download but don't execute)
  preload('https://example.com/font.woff2', { as: 'font' });
  preload('https://example.com/styles.css', { as: 'style' });

  // Preload AND execute/apply
  preinit('https://example.com/script.js', { as: 'script' });
  preinit('https://example.com/styles.css', { as: 'style' });

  return <MainApp />;
}
```

### Resource Types

```jsx
// Fonts
preload('/fonts/custom.woff2', { as: 'font', type: 'font/woff2' });

// Stylesheets
preload('/styles.css', { as: 'style' });
preinit('/critical.css', { as: 'style' }); // Immediately applied

// Scripts
preload('/app.js', { as: 'script' });
preinit('/critical.js', { as: 'script' }); // Immediately executed

// Images
preload('/hero.jpg', { as: 'image' });
```

### SSR Optimization

```jsx
// In Server Component
function Page() {
  // Hints added to <head> during SSR
  preload('/critical.css', { as: 'style' });
  preconnect('https://api.example.com');

  return <Content />;
}
```

## Improved Error Handling

New root options for granular error handling.

### Error Callback Options

```jsx
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'), {
  // Error caught by an Error Boundary
  onCaughtError: (error, errorInfo) => {
    console.log('Caught by boundary:', error);
    logToService(error, errorInfo);
  },

  // Error NOT caught by any boundary
  onUncaughtError: (error, errorInfo) => {
    console.log('Uncaught error:', error);
    showErrorModal(error);
    logToService(error, errorInfo);
  },

  // Error that React recovered from automatically
  onRecoverableError: (error, errorInfo) => {
    console.log('Recovered from:', error);
    logToService(error, errorInfo);
  }
});

root.render(<App />);
```

### Error Types

| Type | Description | Example |
|------|-------------|---------|
| Caught | Error caught by Error Boundary | Component throws, boundary shows fallback |
| Uncaught | Error not caught by any boundary | Root-level throw |
| Recoverable | Error React recovered from | Hydration mismatch auto-fixed |

### Better Hydration Errors

React 19 provides clearer hydration error messages:

```
// Before (React 18)
Error: Hydration failed
Error: Hydration failed
Error: There was an error while hydrating

// After (React 19)
Uncaught Error: Hydration failed because the server rendered HTML
didn't match the client.
<App>
  <span>
    + Client
    - Server
```

## Custom Elements Support

Full support for Web Components with proper property/attribute handling.

### Property vs Attribute Assignment

```jsx
function App() {
  return (
    <my-element
      // Strings → attributes
      stringProp="value"

      // Numbers → attributes
      numberProp={42}

      // true → attributes
      trueProp={true}

      // Objects → properties (not serializable)
      objectProp={{ key: 'value' }}

      // Functions → properties
      functionProp={() => console.log('clicked')}

      // false → properties (removed from SSR)
      falseProp={false}
    />
  );
}
```

### SSR Behavior

| Value Type | Client | SSR |
|------------|--------|-----|
| string, number, true | attribute | attribute |
| object, function, false | property | omitted |

### Event Handling

```jsx
function App() {
  return (
    <my-button
      onClick={(e) => console.log('React click')}
      onCustomEvent={(e) => console.log('Custom event', e.detail)}
    >
      Click me
    </my-button>
  );
}
```

### Refs with Custom Elements

```jsx
function App() {
  const ref = useRef(null);

  useEffect(() => {
    // Access custom element methods
    ref.current.customMethod();
  }, []);

  return <my-element ref={ref} />;
}
```
