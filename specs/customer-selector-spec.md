# Spec: CustomerSelector

## Feature: CustomerSelector
Container component that renders a searchable, scrollable grid of `CustomerCard` components and manages single-customer selection state for the dashboard.

### Context
- Acts as the primary customer-browsing surface of the Customer Intelligence Dashboard — CSMs use it to scan the list and pick the account they want to investigate
- Owns the selection state; broadcasts the selected customer upward via `onCustomerSelect` so downstream widgets (HealthScoreCalculator, MarketIntelligenceWidget, PredictiveAlerts) can react
- Must handle 100+ customers efficiently — search/filter is client-side to avoid round-trip latency
- Target users: internal CSMs and support staff who need to quickly locate a customer by name or company

### Requirements

**Functional**
- Render a grid of `CustomerCard` components, one per customer in the `customers` prop
- Maintain a `selectedCustomerId` state; pass `isSelected` and `onSelect` to each `CustomerCard`
- Clicking a card sets it as selected; clicking the same card again has no effect (no toggle/deselect)
- Search input filters the visible cards in real time by customer `name` or `company` (case-insensitive, substring match)
- When the search query matches no customers, show an empty-state message: "No customers match your search"
- When `customers` prop is empty, show an empty-state message: "No customers found"
- Notify the parent whenever selection changes via `onCustomerSelect(customer: Customer)`

**User Interface**
- Search bar at the top of the component: full-width text input with a placeholder "Search by name or company…", a clear (×) button when the field is non-empty
- Customer grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` responsive layout, consistent `gap-4` spacing
- Selected card visually distinguished (handled by `CustomerCard`'s `isSelected` prop)
- Container has a defined max-height with `overflow-y-auto` scroll for long lists
- Loading skeleton (matching `CustomerCard` dimensions) when `loading={true}`
- Consistent white background card wrapper with Tailwind shadow and rounded corners

**Data / Props**
```ts
interface CustomerSelectorProps {
  customers: Customer[];          // required; list to display and filter
  loading?: boolean;              // default false; show skeletons when true
  onCustomerSelect?: (customer: Customer) => void;  // called on selection change
  initialSelectedId?: string;     // pre-select a customer on first render
}
```

**Integration**
- Default export from `src/components/CustomerSelector.tsx`
- Imports `Customer` from `src/data/mock-customers.ts`
- Uses `CustomerCard` from `src/components/CustomerCard.tsx` (with `isSelected` / `onSelect` props from the enhancement spec)
- Used in `src/app/page.tsx` (or a dedicated `/customers` page); passes the selected customer to sibling widgets

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **File:** `src/components/CustomerSelector.tsx`
- **`'use client'`** directive required (manages local state)
- **Performance:** filter with `useMemo` so the grid does not re-compute on every render; `CustomerCard` children already use `React.memo`
- **Accessibility:** search input has an associated `<label>` or `aria-label`; grid region has `role="list"` or is a `<ul>` with `<li>` wrappers; selected card state communicated via `aria-pressed` (handled in `CustomerCard`)
- **No external dependencies** beyond React and Tailwind CSS

### Acceptance Criteria
- [ ] All customers in the `customers` prop are rendered as `CustomerCard` components on initial load
- [ ] Typing in the search input filters cards to only those matching name or company (case-insensitive)
- [ ] Clearing the search input restores the full customer list
- [ ] The clear (×) button empties the search field and restores the list
- [ ] Clicking a card marks it as selected (`isSelected={true}`) and deselects all others
- [ ] `onCustomerSelect` is called with the correct `Customer` object when a card is clicked
- [ ] `initialSelectedId` pre-selects the matching card on first render
- [ ] When no customers match the search, "No customers match your search" is displayed
- [ ] When `customers` is empty, "No customers found" is displayed
- [ ] When `loading={true}`, skeleton placeholders appear instead of cards
- [ ] The grid is responsive: 1 column on mobile, 2 on sm, 3 on lg
- [ ] The component handles 100+ customers without noticeable lag (filter runs in < 16 ms)
- [ ] Search input has an accessible label; the customer grid is navigable by keyboard
- [ ] No TypeScript errors; `CustomerSelectorProps` interface is exported
