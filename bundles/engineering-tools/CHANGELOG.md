# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-02-09

### Changed

- **react-19 skill description** rewritten to third-person format per skill guidelines, broadened trigger to activate on any React development work (not just explicit React 19 questions)
- **Server Components reference** made framework-agnostic — Next.js imports now labeled as framework-specific with notes about equivalent APIs in other frameworks

### Added

- **"When to Apply React 19 Patterns"** procedural section in SKILL.md — instructs Claude to prefer React 19 patterns over legacy equivalents when generating or modifying React code
- **Enhanced in React 19 table** — documents `useDeferredValue` with new `initialValue` parameter
- **New Utilities table** — documents `requestFormReset` from `react-dom`
- **Migration Codemods section** — lists available `npx codemod` commands for `forwardRef` and `Context.Provider` migration
- **Version field** added to SKILL.md frontmatter

## [0.3.0] - 2026-01-08

### Added

- **react-19 skill** - React 19.x development patterns and APIs
  - Covers new hooks: useActionState, useFormStatus, useOptimistic, use()
  - Covers React 19.2 additions: useEffectEvent, Activity component
  - Includes Form Actions, Server Components, Server Actions guidance
  - Documents breaking changes: ref as prop (no forwardRef), Context as provider
  - Decision tree for choosing the right API
  - Common pitfalls and migration patterns from older React

## [0.2.0] - 2026-01-06

### Added

- **frontend-design skill** - Moved from project-management plugin
  - Creates distinctive, production-grade frontend interfaces
  - Focuses on web components, pages, dashboards, and UI design
  - Generates creative, polished code avoiding generic AI aesthetics

## [0.1.0] - 2026-01-06

### Added

- Initial plugin scaffold
- Empty commands/ directory for future slash commands
- Empty skills/ directory for future skills
