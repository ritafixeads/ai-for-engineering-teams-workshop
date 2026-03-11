# Spec: CustomerCard Component

## Feature: CustomerCard

### Context
- Individual customer display card for the Customer Intelligence Dashboard
- Renders within the `CustomerSelector` container to present a list of customers
- Provides at-a-glance identification: who the customer is, what company they belong to, and how healthy their account is
- Foundation for domain health monitoring — surfaces the customer's associated domains so health checks can be initiated or displayed
- Primary users are internal team members (CSMs, support staff) scanning a customer list to triage accounts

### Requirements

**Functional**
- Display customer `name` and `company` prominently
- Show a color-coded health score badge:
  - Red (`bg-red-100 text-red-700`) for scores 0–30 (Poor)
  - Yellow (`bg-yellow-100 text-yellow-700`) for scores 31–70 (Moderate)
  - Green (`bg-green-100 text-green-700`) for scores 71–100 (Good)
- List the customer's `domains` array (website URLs) for health monitoring context
- When a customer has more than one domain, show the domain count (e.g. "3 domains")
- Gracefully handle customers with no `domains` (field is optional)

**User Interface**
- Card-based layout with a white background, rounded corners, and a subtle shadow
- Name and company in the card header; health badge aligned to the right of the header
- Domains listed below the header, styled as small monospace or muted text
- Responsive: full-width on mobile, fixed/flexible width on desktop
- Clean, minimal design consistent with the dashboard's Tailwind styling

**Data / Props**
- `customer: Customer` — required; the full customer object from `src/data/mock-customers.ts`

**Integration**
- Default export from `src/components/CustomerCard.tsx`
- Imports `Customer` interface from `src/data/mock-customers.ts`
- No external dependencies beyond React and Tailwind CSS

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **File:** `src/components/CustomerCard.tsx`
- **Data source:** `Customer` interface from `src/data/mock-customers.ts` — do not redefine the type locally
- **Health score ranges** must match exactly: 0–30 red, 31–70 yellow, 71–100 green
- **No interactivity required** in this iteration (no onClick, selection state, or hover expansion)
- **Accessibility:** health badge must convey meaning via text (not color alone)

### Acceptance Criteria
- [ ] Card renders customer `name` and `company`
- [ ] Health score badge displays the numeric score and applies the correct color for all three ranges (0–30, 31–70, 71–100)
- [ ] Each domain in the `domains` array is rendered as readable text
- [ ] When `domains` has more than one entry, a domain count is shown
- [ ] When `domains` is undefined or empty, the card renders without errors
- [ ] Component accepts a `Customer` object as its only prop and is TypeScript-valid
- [ ] Card is visually consistent with the dashboard (white background, rounded, shadowed)
- [ ] Layout does not break on narrow (mobile) screens
