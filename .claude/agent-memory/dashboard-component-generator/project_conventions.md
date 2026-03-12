---
name: project_conventions
description: Core project conventions for the Customer Intelligence Dashboard — component patterns, TypeScript config, Tailwind usage, path aliases, and styling rules
type: project
---

## Stack
- Next.js 15 + React 19, TypeScript strict mode
- Tailwind CSS (v4 import syntax: `@import "tailwindcss"`)
- No external component library — all primitives hand-rolled

## Path aliases
- `@/*` maps to `./src/*` (tsconfig paths)
- Data: `src/data/mock-customers.ts` (exports `Customer` interface)
- Lib utilities: `src/lib/healthCalculator.ts`, `src/lib/marketIntelligenceService.ts`

## Component conventions
- `'use client'` is added only when hooks or event handlers are required
- Props interfaces are defined above the component, exported when reusable
- Class composition is done with array-join pattern: `[...classNames].filter(Boolean).join(' ')` — NO `cn()` or `clsx` utility exists yet
- PascalCase file names for components: `CustomerCard.tsx`, `Button.tsx`

## Tailwind color semantics for health/status
- Healthy / pass: `green-100/700` (badge), `green-500` (dot/bar)
- Warning / moderate: `yellow-100/700` (badge), `yellow-400/500` (dot/bar)
- Critical / fail: `red-100/700` (badge), `red-500` (dot/bar)
- Untested / neutral: `gray-100 text-gray-600` (badge), `gray-400` (dot)

## Accessibility rules already in place (Button.tsx)
- Uses `focus:ring-2 focus:ring-offset-2` (not `focus-visible:`) — spec says to migrate to `focus-visible:`
- `aria-busy={loading}` on loading buttons
- `aria-hidden="true"` on decorative SVG icons

## CustomerCard patterns
- Interactive cards: `role="button"`, `tabIndex={0}`, `aria-pressed`, `onKeyDown` for Enter/Space
- Health badge always includes numeric score + text label (not color alone)
- `aria-label` on the badge span with full context: "Health score: 72 out of 100 — Good"

## HealthScoreCalculator patterns
- `aria-expanded` + `aria-controls` on the breakdown toggle button
- `animate-pulse` used for loading skeleton — needs `prefers-reduced-motion` override (known gap)

## MarketIntelligenceWidget patterns
- The search input lacks a `<label>` element — known accessibility gap per the spec
- Loading uses `animate-pulse` skeleton — needs `prefers-reduced-motion` override
- Sentiment badges use text + color (compliant)

## Error boundary patterns (added in production-ready pass)
- `DashboardErrorBoundary` (class component, app-level): `src/components/DashboardErrorBoundary.tsx`
  - Props: `children: React.ReactNode; fallback?: React.ReactNode`
  - Logs via `console.error` in dev; delegates to stub `errorReporter.report()` in prod
  - Full-page recovery UI with "Reload page" button
- `WidgetErrorBoundary` (class component, widget-level): `src/components/WidgetErrorBoundary.tsx`
  - Props: `children: React.ReactNode; widgetName: string`
  - Retry pattern: `retryCount` state incremented in `handleRetry`; children rendered in `<React.Fragment key={retryCount}>` to force remount
  - Per-widget error isolation — other widgets remain functional

## Export utilities
- `src/lib/exportUtils.ts` — no React dependency, pure browser APIs
  - `exportToCSV(customers: Customer[]): void` → `customers-YYYY-MM-DD.csv`
  - `exportToJSON(customers: Customer[]): void` → `customers-YYYY-MM-DD.json`
  - CSV headers: `id,name,email,company,healthScore,subscriptionTier,domains`
  - Uses `Blob` + `URL.createObjectURL` + temporary `<a>` element pattern for download trigger

## Performance conventions (post production-ready pass)
- `CustomerCard` and `CustomerList` are both wrapped with `React.memo` as their default export
- `CustomerList` additionally uses `memo(CustomerCard)` internally as `MemoizedCustomerCard`
- Heavy widgets (`HealthScoreCalculator`, `MarketIntelligenceWidget`, `PredictiveAlertsWidget`, `AccessibilitySpec`) are lazy-loaded via `React.lazy` + `Suspense` with `WidgetSkeleton` fallback
- `WidgetSkeleton` uses fixed `min-h-[160px]` to prevent CLS during load

## Security headers (next.config.ts)
- Applied via `headers()` to `source: '/(.*)'` (all routes)
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP: `Content-Security-Policy-Report-Only` in dev, `Content-Security-Policy` in prod
- `style-src 'unsafe-inline'` required for Tailwind + Next.js critical CSS injection

## Accessibility patterns (post production-ready pass)
- Skip-to-content link in `layout.tsx`: `href="#main-content"`, uses `sr-only focus:not-sr-only` pattern
- Page root is now `<main id="main-content">` instead of `<div>`
- Export status feedback uses `role="status" aria-live="polite"` live region
- All new interactive elements use `focus-visible:ring-*` (not plain `focus:ring-*`)

## Known open accessibility gaps (from spec audit)
- `prefers-reduced-motion` CSS overrides not yet in globals.css
- MarketIntelligenceWidget search input missing `<label>`
- Loading state live regions (role="status") not present in HealthScoreCalculator or MarketIntelligenceWidget
- `focus:ring-*` should be migrated to `focus-visible:ring-*` in Button.tsx (not yet done)
