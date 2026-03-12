# Spec: Predictive Alerts System

## Feature: Predictive Alerts System
Rule-based alert engine and dashboard widget that proactively surfaces high- and medium-priority customer risk signals to prevent churn.

### Context
- Proactive complement to the reactive `HealthScoreCalculator` — while health scores show current state, alerts fire when specific risk thresholds are crossed
- Alert engine is a pure-function library (`src/lib/alerts.ts`) so it can be tested independently and reused in future notification pipelines
- `PredictiveAlertsWidget` displays the active alert list in the dashboard and provides dismissal/action tracking
- Target users: CSMs and support leads who need to know which accounts require immediate attention before their next customer call

### Requirements

**Functional — Alert Rules Engine (`src/lib/alerts.ts`)**
- `evaluateAlerts(customers: CustomerWithMetrics[]): Alert[]` — main entry point; evaluates all rules against every customer and returns a deduplicated, priority-sorted list
- **High-priority rules:**
  - `PaymentRiskAlert`: fires when `daysSinceLastPayment > 30` OR `healthScoreDelta7d < -20` (health dropped > 20 points in 7 days)
  - `EngagementCliffAlert`: fires when `loginFrequencyPerMonth` has dropped > 50% compared to the 30-day rolling average
  - `ContractExpirationRiskAlert`: fires when `daysUntilRenewal < 90` AND `healthScore < 50`
- **Medium-priority rules:**
  - `SupportTicketSpikeAlert`: fires when `supportTicketsLast7Days > 3` OR `escalationCount > 0`
  - `FeatureAdoptionStallAlert`: fires when `daysSinceLastFeatureUse > 30` AND `accountGrowthRate > 0` (growing accounts only)
- Deduplication: one alert per (customer, alertType) pair at a time; re-firing is suppressed during a cooldown period (configurable, default 24 h)
- Priority scoring: High alerts sorted above Medium; within the same priority, sorted by customer ARR descending

**Functional — UI Component (`src/components/PredictiveAlertsWidget.tsx`)**
- Displays all active alerts grouped by priority (High / Medium sections)
- Each alert row shows: customer name, company, alert type label, a short description of the trigger condition, and a colored priority badge (red = High, yellow = Medium)
- "Dismiss" button on each alert removes it from the visible list (client-side only; does not mutate engine state)
- "Mark Resolved" button marks the alert as actioned (different visual state — muted, strikethrough)
- Empty state: "No active alerts — all customers are healthy 🎉"
- Loading and error states consistent with `HealthScoreCalculator` and `MarketIntelligenceWidget` patterns

**Data / TypeScript Interfaces**
```ts
type AlertPriority = 'high' | 'medium';
type AlertType =
  | 'PaymentRisk'
  | 'EngagementCliff'
  | 'ContractExpirationRisk'
  | 'SupportTicketSpike'
  | 'FeatureAdoptionStall';

interface Alert {
  id: string;                   // unique per (customerId, alertType)
  customerId: string;
  customerName: string;
  company: string;
  type: AlertType;
  priority: AlertPriority;
  description: string;          // human-readable trigger summary
  triggeredAt: string;          // ISO 8601
  cooldownUntil: string;        // ISO 8601; no re-fire before this time
}

interface CustomerWithMetrics extends Customer {
  healthScoreDelta7d: number;   // positive = improving
  loginFrequencyPerMonth: number;
  loginFrequency30dAvg: number;
  daysSinceLastPayment: number;
  supportTicketsLast7Days: number;
  escalationCount: number;
  daysUntilRenewal: number;
  daysSinceLastFeatureUse: number;
  accountGrowthRate: number;    // positive = growing ARR
  arr: number;                  // annual recurring revenue
}

interface PredictiveAlertsWidgetProps {
  customers: CustomerWithMetrics[];
  loading?: boolean;
}
```

**Integration**
- Logic: `src/lib/alerts.ts` — pure functions, no React imports
- Component: `src/components/PredictiveAlertsWidget.tsx`
- Tests: `src/lib/alerts.test.ts`
- Added to the dashboard widgets grid in `src/app/page.tsx`

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **Pure functions only** in `alerts.ts` — no side effects, no global state, no Date.now() calls inside rule functions (accept a `now: Date` parameter for testability)
- **Color coding** must match dashboard conventions: red (`bg-red-100 text-red-700`) for High, yellow (`bg-yellow-100 text-yellow-700`) for Medium
- **No external dependencies** — standard arithmetic and array operations only
- **Accessibility:** alert list uses `role="list"`; dismiss and resolve buttons have descriptive `aria-label` including the customer name

### Acceptance Criteria
- [ ] `evaluateAlerts` returns a `PaymentRiskAlert` when `daysSinceLastPayment > 30`
- [ ] `evaluateAlerts` returns a `PaymentRiskAlert` when health score dropped > 20 points in 7 days
- [ ] `evaluateAlerts` returns an `EngagementCliffAlert` when login frequency dropped > 50% vs 30-day average
- [ ] `evaluateAlerts` returns a `ContractExpirationRiskAlert` when `daysUntilRenewal < 90` AND `healthScore < 50`
- [ ] `evaluateAlerts` returns a `SupportTicketSpikeAlert` when `supportTicketsLast7Days > 3`
- [ ] `evaluateAlerts` returns a `FeatureAdoptionStallAlert` only for growing accounts (`accountGrowthRate > 0`)
- [ ] Duplicate alerts for the same (customerId, alertType) are deduplicated — only one entry in the result
- [ ] High-priority alerts appear before medium-priority alerts in the output
- [ ] Within the same priority, alerts are sorted by customer ARR descending
- [ ] `evaluateAlerts` is a pure function: same inputs always produce the same output
- [ ] `PredictiveAlertsWidget` renders all active alerts grouped under "High Priority" and "Medium Priority" headings
- [ ] Each alert row shows customer name, company, alert type, description, and a correctly colored priority badge
- [ ] Clicking "Dismiss" removes the alert row from the UI
- [ ] Clicking "Mark Resolved" changes the alert row to a muted/strikethrough visual state
- [ ] Empty state message renders when no alerts are active
- [ ] Loading and error states are consistent with other dashboard widgets
- [ ] Unit tests cover all five alert rule functions and the deduplication/sorting logic
- [ ] No TypeScript errors; all interfaces are exported from `alerts.ts`
