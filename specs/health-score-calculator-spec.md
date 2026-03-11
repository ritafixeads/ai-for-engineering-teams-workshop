# Spec: Health Score Calculator

## Feature: Health Score Calculator

### Context
- Core business logic library for the Customer Intelligence Dashboard
- Provides a multi-factor, weighted algorithm that produces a 0–100 health score for any customer account
- Consumed by the `CustomerHealthDisplay` widget and any future components that need churn risk or account health data
- Designed for AI-assisted algorithm development: weighting rationale, edge cases, and business assumptions must be explicitly documented
- Target users: internal teams (CSMs, support, product) who act on health signals to prevent churn

### Requirements

**Functional — Core Algorithm**
- Calculate a health score on a 0–100 scale from four weighted factors:
  - Payment history: **40%**
  - Engagement metrics: **30%**
  - Contract status: **20%**
  - Support satisfaction: **10%**
- Classify the resulting score into three risk levels:
  - Healthy: 71–100
  - Warning: 31–70
  - Critical: 0–30
- Each factor is scored independently on 0–100, then combined via weighted sum

**Functional — Individual Factor Scoring**
- `scorePayment(data: PaymentData): number`
  - Inputs: `daysSinceLastPayment`, `averagePaymentDelayDays`, `overdueAmount`
  - Higher delay and overdue amounts reduce the score
- `scoreEngagement(data: EngagementData): number`
  - Inputs: `loginFrequencyPerMonth`, `featureUsageCount`, `supportTicketCount`
  - Higher logins and feature usage increase score; excessive support tickets reduce it
- `scoreContract(data: ContractData): number`
  - Inputs: `daysUntilRenewal`, `contractValue`, `recentUpgrade` (boolean)
  - Contracts close to renewal without upgrade signal risk; recent upgrades boost score
- `scoreSupport(data: SupportData): number`
  - Inputs: `averageResolutionTimeDays`, `satisfactionScore` (1–5), `escalationCount`
  - High satisfaction and fast resolution increase score; escalations reduce it
- `calculateHealthScore(inputs: HealthScoreInputs): HealthScoreResult`
  - Calls all four factor functions, applies weights, returns combined score + breakdown

**Functional — Input Validation & Error Handling**
- Validate all numeric inputs are non-negative and within expected ranges
- Throw descriptive custom errors (`HealthScoreValidationError`) for invalid inputs
- Handle new customers with missing/partial data by applying neutral (50) defaults per factor
- Clamp final score to [0, 100] to guard against edge cases in weighting math

**Data / TypeScript Interfaces**
```ts
interface PaymentData {
  daysSinceLastPayment: number;
  averagePaymentDelayDays: number;
  overdueAmount: number;
}

interface EngagementData {
  loginFrequencyPerMonth: number;
  featureUsageCount: number;
  supportTicketCount: number;
}

interface ContractData {
  daysUntilRenewal: number;
  contractValue: number;
  recentUpgrade: boolean;
}

interface SupportData {
  averageResolutionTimeDays: number;
  satisfactionScore: number; // 1–5
  escalationCount: number;
}

interface HealthScoreInputs {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}

interface FactorBreakdown {
  payment: number;
  engagement: number;
  contract: number;
  support: number;
}

interface HealthScoreResult {
  score: number;           // 0–100
  riskLevel: 'Healthy' | 'Warning' | 'Critical';
  breakdown: FactorBreakdown;
}
```

**UI Component Integration**
- `CustomerHealthDisplay` widget in `src/components/CustomerHealthDisplay.tsx`
- Displays overall score with color-coded ring/badge (red/yellow/green matching dashboard conventions)
- Expandable breakdown section showing all four factor scores
- Loading and error states consistent with other dashboard widgets
- Updates in real-time when `CustomerSelector` changes active customer

**Integration**
- Pure functions exported from `src/lib/healthCalculator.ts`
- No imports from React or Next.js — logic layer only
- `CustomerHealthDisplay` imports from `src/lib/healthCalculator.ts`

### Constraints
- **Stack:** TypeScript (strict mode), Next.js 15, React 19, Tailwind CSS
- **Files:**
  - Logic: `src/lib/healthCalculator.ts`
  - UI: `src/components/CustomerHealthDisplay.tsx`
- **Architecture:** Pure functions only — no side effects, no global state
- **JSDoc required** on all exported functions explaining the math and business rationale
- **Custom error class:** `HealthScoreValidationError extends Error`
- **No external math/stats libraries** — standard arithmetic only
- **Color coding** must match existing dashboard conventions (red 0–30, yellow 31–70, green 71–100)
- **Caching:** memoize `calculateHealthScore` by input hash if called in a tight render loop

### Acceptance Criteria
- [ ] `calculateHealthScore` returns a score in [0, 100] for all valid inputs
- [ ] Weighted combination matches: payment×0.4 + engagement×0.3 + contract×0.2 + support×0.1
- [ ] Risk level classifications are correct for boundary values (30, 31, 70, 71)
- [ ] Each factor scoring function returns a value in [0, 100]
- [ ] Invalid inputs (negative numbers, out-of-range satisfaction scores) throw `HealthScoreValidationError` with descriptive messages
- [ ] Missing/partial data (new customer) uses neutral defaults without throwing
- [ ] All functions are pure — same inputs always produce same outputs
- [ ] JSDoc comments explain weighting rationale and normalization strategy for each factor
- [ ] `CustomerHealthDisplay` renders score, risk level badge, and factor breakdown
- [ ] Widget handles loading and error states gracefully
- [ ] Color coding is consistent with CustomerCard health badge conventions
- [ ] Unit tests cover all factor functions, boundary conditions, and validation errors
