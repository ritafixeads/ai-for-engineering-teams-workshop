# Spec: Production-Ready Dashboard

## Feature: Production-Ready Dashboard
Harden the Customer Intelligence Dashboard with multi-level error boundaries, CSV/JSON data export, performance optimisation, WCAG 2.1 AA accessibility, and security headers for enterprise deployment.

### Context
- Transitions the dashboard from workshop prototype to a production-grade application suitable for business-critical CSM operations
- Affects every existing component and page — this is a cross-cutting concern, not a single new component
- Target users: internal engineering teams deploying the app and end users (CSMs, support staff) who require reliability, accessibility, and data portability
- Delivery risk: changes must not break existing widget functionality; all enhancements are additive or wrapping

### Requirements

**Functional — Error Handling**
- `DashboardErrorBoundary` (class component, app-level) wraps the root layout; catches unhandled errors and renders a full-page recovery UI with a "Reload" button
- `WidgetErrorBoundary` (class component, widget-level) wraps each dashboard widget in isolation; a single widget failure does not unmount the rest of the dashboard
- Both boundaries log errors to `console.error` in development and to a stub `errorReporter.report()` function in production (no real external service required)
- Retry logic: `WidgetErrorBoundary` exposes a "Retry" button that resets its error state and remounts the child

**Functional — Data Export**
- `ExportUtils` module (`src/lib/exportUtils.ts`) with:
  - `exportToCSV(customers: Customer[]): void` — triggers a browser download of `customers-<ISO-date>.csv`
  - `exportToJSON(customers: Customer[]): void` — triggers a browser download of `customers-<ISO-date>.json`
- Export button added to `CustomerList` (or dashboard toolbar) using the existing `Button` component
- Exported CSV includes headers: `id,name,email,company,healthScore,subscriptionTier,domains`
- Large-dataset safety: exports are synchronous for ≤1000 records; a progress indicator is shown for larger sets

**Functional — Performance**
- `CustomerCard` and `CustomerList` wrapped with `React.memo` to prevent unnecessary re-renders
- Expensive derived values computed with `useMemo`; stable callbacks with `useCallback`
- Lazy-load heavy widgets (MarketIntelligenceWidget, future PredictiveAlerts) with `React.lazy` + `Suspense` fallback skeletons
- Home page Core Web Vitals targets: LCP < 2.5 s, CLS < 0.1, FCP < 1.5 s (measured via Next.js built-in analytics)

**Functional — Accessibility**
- All interactive elements reachable and operable via keyboard (Tab, Enter, Space, Escape)
- Visible focus rings on every focusable element (minimum 2px solid outline, 3:1 contrast ratio)
- Skip-to-content link at the top of every page
- `role="alert"` live regions for async status messages (form submission results, export completion)
- Color is never the sole conveyor of information (all badges include text labels — already implemented in CustomerCard and HealthScoreCalculator)
- All images and icon-only buttons have descriptive `alt` / `aria-label`

**Functional — Security**
- `next.config.ts` updated with `headers()` returning:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP header (report-only in development, enforced in production): restrict `script-src` to `'self'`
- All existing API routes already sanitize input; verify no stack traces are returned in 5xx responses

**Data / Props**
- `DashboardErrorBoundaryProps`: `children: React.ReactNode; fallback?: React.ReactNode`
- `WidgetErrorBoundaryProps`: `children: React.ReactNode; widgetName: string`
- `ExportUtils`: pure functions, no React dependency

**Integration**
- `src/components/DashboardErrorBoundary.tsx`
- `src/components/WidgetErrorBoundary.tsx`
- `src/lib/exportUtils.ts`
- `next.config.ts` updated with security headers
- `src/app/layout.tsx` wraps children with `DashboardErrorBoundary`
- Each widget in `src/app/page.tsx` wrapped with `WidgetErrorBoundary`

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **Error boundaries must be class components** (React error boundaries cannot be function components)
- **No new runtime dependencies** — use only React built-ins, Next.js APIs, and browser `Blob`/`URL.createObjectURL` for export
- **Accessibility standard:** WCAG 2.1 Level AA
- **Performance budget:** bundle size increase from optimisation work must be ≤ 5 kB gzipped
- **Security:** CSP must not break existing inline Tailwind styles — use `'unsafe-inline'` for `style-src` only if Tailwind requires it; prefer external stylesheet approach

### Acceptance Criteria
- [ ] Throwing an error inside any widget renders `WidgetErrorBoundary` fallback for that widget only; other widgets remain functional
- [ ] `WidgetErrorBoundary` "Retry" button resets the error state and remounts the child widget
- [ ] Throwing an unhandled error above all widget boundaries renders `DashboardErrorBoundary` full-page fallback
- [ ] `exportToCSV` downloads a valid CSV file with correct headers and one row per customer
- [ ] `exportToJSON` downloads a valid JSON file containing an array of customer objects
- [ ] Downloaded filenames include the current ISO date (e.g. `customers-2025-03-11.csv`)
- [ ] `CustomerCard` and `CustomerList` do not re-render when unrelated parent state changes (verified via React DevTools Profiler)
- [ ] Lazy-loaded widgets show a skeleton while loading; no layout shift occurs on load
- [ ] All four security headers are present on every page response (verified via `curl -I`)
- [ ] Every interactive element on the dashboard is reachable and activatable using only the keyboard
- [ ] A skip-to-content link appears at the top of the page and moves focus to `<main>` when activated
- [ ] All form inputs and icon buttons have accessible names (verified via axe-core or browser accessibility tree)
- [ ] Color contrast of all text meets WCAG AA (4.5:1 normal, 3:1 large text)
- [ ] No TypeScript errors introduced by the new files or modifications
