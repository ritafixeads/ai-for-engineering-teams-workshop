# Spec: Market Intelligence Widget

## Feature: Market Intelligence Widget

### Context
- Dashboard widget that surfaces market sentiment and recent news for a customer's company
- Helps CSMs and support staff quickly gauge external business conditions before a customer interaction
- Composed of three layers: API route, service class, and UI widget
- Sits alongside CustomerCard and CustomerHealthDisplay in the Customer Intelligence Dashboard
- Uses mock data generation to ensure reliable, predictable results without external API dependencies

### Requirements

**Functional — API Layer**
- Next.js Route Handler at `GET /api/market-intelligence/[company]`
- Validate and sanitize the `company` path parameter (non-empty, alphanumeric + spaces/hyphens, max 100 chars)
- Simulate realistic API latency (300–800ms random delay)
- Return a consistent JSON response:
```ts
{
  company: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;      // 0–100
  newsCount: number;
  lastUpdated: string;         // ISO 8601
  headlines: Headline[];
}

interface Headline {
  title: string;
  source: string;
  publishedAt: string;         // ISO 8601
  url: string;
}
```
- On validation failure return `400` with `{ error: string }`
- On internal error return `500` with sanitized message (no stack traces)

**Functional — Service Layer**
- `MarketIntelligenceService` class in `src/lib/marketIntelligenceService.ts`
- `getMarketData(company: string): Promise<MarketIntelligenceResponse>`
- In-memory cache with 10-minute TTL; keyed by normalised company name (lowercase, trimmed)
- Mock data generator produces deterministic-ish but varied headlines and sentiment per company name
- Custom `MarketIntelligenceError extends Error` with a `statusCode` field for API layer use
- Pure static methods for data generation (easy to unit test)

**Functional — UI Component**
- `MarketIntelligenceWidget` in `src/components/MarketIntelligenceWidget.tsx`
- Accepts optional `companyName` prop; falls back to a text input when not provided
- Fetches from `/api/market-intelligence/[company]` on mount (or when `companyName` changes)
- Displays:
  - Sentiment badge: green (`bg-green-100 text-green-700`) / yellow / red — matching dashboard conventions
  - Sentiment score as a progress bar (same `ScoreBar` pattern as `CustomerHealthDisplay`)
  - News article count and "Last updated" timestamp
  - Top 3 headlines with source name and relative publish date
- Loading skeleton consistent with `CustomerHealthDisplay`
- Error state with retry button

**Functional — Dashboard Integration**
- Add `MarketIntelligenceWidget` to `src/app/page.tsx` in the Dashboard Widgets grid
- Pass `companyName` from the selected customer when `CustomerSelector` is wired up
- Maintain responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` layout

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **Files:**
  - API route: `src/app/api/market-intelligence/[company]/route.ts`
  - Service: `src/lib/marketIntelligenceService.ts`
  - Component: `src/components/MarketIntelligenceWidget.tsx`
- **No external API calls** — all data is mock-generated server-side
- **Security:**
  - Sanitize `company` param: reject anything matching `/[^a-zA-Z0-9 \-]/`
  - Never expose internal error details or stack traces in API responses
  - Cache keys use normalised input to prevent cache-poisoning via casing tricks
- **Consistency:** color coding, loading skeletons, error states, and card layout must match `CustomerHealthDisplay` and `CustomerCard` patterns
- **Cache:** TTL-based in-memory cache only; no persistence layer required

### Acceptance Criteria
- [ ] `GET /api/market-intelligence/Acme Corp` returns a valid JSON response within 1s
- [ ] `GET /api/market-intelligence/` or an invalid company name returns `400`
- [ ] Repeated requests within 10 minutes return the same cached data
- [ ] Sentiment badge displays the correct color for `positive`, `neutral`, and `negative`
- [ ] Top 3 headlines are shown with source and publish date
- [ ] News count and last-updated timestamp are displayed
- [ ] Loading skeleton renders while the fetch is in progress
- [ ] Error state renders with a retry button when the fetch fails
- [ ] `companyName` prop auto-triggers fetch without manual input
- [ ] Widget fits the existing dashboard grid without breaking responsive layout
- [ ] Company name input sanitization rejects strings with special characters
- [ ] No stack traces or internal details leak in API error responses
