# Spec: Code Quality Standards

## Feature: Code Quality Standards
Project-wide coding conventions, TypeScript practices, and React patterns that all components and libraries in the Customer Intelligence Dashboard must follow.

### Context
- Applies to every file in `src/` — new components, service libraries, API routes, and tests
- Codified here so that AI-assisted generation produces consistent, maintainable output without requiring repeated correction
- Target audience: developers (human and AI) authoring or reviewing code in this repository
- This is a standards document, not a runtime component; compliance is enforced via TypeScript strict mode, ESLint, and code review

### Requirements

**Naming Conventions**
- Components: PascalCase (`CustomerCard`, `HealthScoreCalculator`)
- Files: kebab-case matching the default export (`customer-card.tsx`, `health-calculator.ts`) — exception: Next.js required filenames (`page.tsx`, `layout.tsx`, `route.ts`)
- Variables and functions: camelCase; no abbreviations (`customer` not `cust`, `button` not `btn`, `user` not `usr`)
- TypeScript interfaces and types: PascalCase with a descriptive noun (`CustomerCardProps`, `HealthScoreResult`)
- Constants: SCREAMING_SNAKE_CASE for module-level primitives (`CACHE_TTL_MS`, `MAX_RETRIES`)

**TypeScript**
- Strict mode enabled (`"strict": true` in `tsconfig.json`) — no `any`, no unchecked index access
- All props interfaces exported from the component file (e.g. `export interface CustomerCardProps`)
- Return types annotated on all exported functions
- Custom error classes extend `Error` with a descriptive `name` property set in the constructor
- Prefer `interface` over `type` alias for object shapes; use `type` for unions and mapped types

**React Patterns**
- `'use client'` directive at the top of any component that uses hooks, event handlers, or browser APIs
- Prefer named exports for utilities and hooks; default export for the primary component in each file
- Use custom hooks (`useFetch`, `useCustomerSelection`) to extract reusable stateful logic from components
- All async data fetching must handle loading, error, and success states explicitly
- Use `React.memo` for components that receive stable props but re-render often (list items, cards)
- `useCallback` for event handlers passed as props; `useMemo` for expensive derived values

**Component Structure (order within file)**
1. `'use client'` (if needed)
2. Imports (React, then third-party, then local — grouped with blank lines)
3. Type / interface definitions
4. Helper functions and constants (pure, non-component)
5. Sub-components (small, file-private)
6. Main exported component
7. Default export statement (if separate from declaration)

**Documentation**
- JSDoc required on all exported functions and classes; include `@param`, `@returns`, and a one-line description
- Inline comments only where the logic is non-obvious; avoid restating what the code already says
- No TODO comments committed to `main`; use GitHub Issues for deferred work

**Error Handling**
- API routes: always return `{ error: string }` on failure; never expose stack traces or internal implementation details
- React components: use error boundaries (`WidgetErrorBoundary`) rather than try/catch in render
- Service layer: throw typed custom errors; let API route handlers catch and convert to HTTP responses

**Testing**
- Test files co-located with the source file they test (`healthCalculator.test.ts` alongside `healthCalculator.ts`)
- Describe blocks named after the exported function/component; `it` descriptions written as behaviour statements ("returns 100 for a perfect payer")
- No mocking of the module under test; mock only external I/O (fetch, Date.now)
- Each test file must import from the source file using a relative path, not an alias

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS, Vitest
- **Linting:** ESLint with `eslint-config-next`; no `eslint-disable` comments without an explanatory note
- **Formatting:** Prettier with default settings; enforced via `pre-commit` hook
- **Bundle impact:** no new runtime dependencies without explicit approval; prefer built-in browser/Node APIs

### Acceptance Criteria
- [ ] All component filenames are PascalCase and match their default export
- [ ] No variable, parameter, or function name uses an abbreviation (checked via ESLint `id-length` or naming-convention rule)
- [ ] All exported functions and components have JSDoc comments with at least a one-line description
- [ ] All props interfaces are exported and named `<ComponentName>Props`
- [ ] No `any` types present in `src/` (TypeScript strict mode + `@typescript-eslint/no-explicit-any`)
- [ ] Every React component that uses hooks or event handlers has the `'use client'` directive
- [ ] All async operations in components have loading, error, and success state handling
- [ ] Custom error classes (`HealthScoreValidationError`, `MarketIntelligenceError`) extend `Error` and set `this.name`
- [ ] API routes never return stack traces or file paths in error responses
- [ ] Test files use `describe` + `it` with behaviour-style descriptions
- [ ] `npx tsc --noEmit --strict` exits with zero errors
- [ ] `npx eslint src/` exits with zero errors
