# Spec: CustomerCard Enhancement

## Feature: CustomerCard Enhancement
Extend the existing `CustomerCard` component with click-to-select functionality and a clear visual selected state, enabling it to work within the `CustomerSelector` container.

### Context
- Builds incrementally on the already-implemented `CustomerCard` (see `specs/customer-card-spec.md`)
- Selection state is needed by `CustomerSelector` to drive the rest of the dashboard (health score widget, market intelligence, predictive alerts all respond to the currently selected customer)
- Single-selection model: only one customer can be selected at a time; the parent (`CustomerSelector`) owns the selection state
- Target users: CSMs scanning the customer list — they click a card to load that customer's full dashboard

### Requirements

**Functional**
- `CustomerCard` is clickable; clicking calls an `onSelect` callback with the customer object
- Only one card may appear selected at a time (controlled by the parent via an `isSelected` prop)
- Clicking an already-selected card does not deselect it (deselection is handled at the `CustomerSelector` level if needed)
- All existing `CustomerCard` functionality (health badge, domain list, domain count, responsive layout) is preserved unchanged

**User Interface**
- Selected state visual: `ring-2 ring-blue-500 bg-blue-50` on the card container — clearly distinguishable from the default and hover states
- Hover state (unselected): `hover:shadow-md hover:ring-1 hover:ring-blue-200` for affordance
- Hover state (selected): no additional change — ring already present
- Transition: `transition-shadow transition-colors duration-150` for smooth state changes
- Selected card retains the health badge and domain sections unchanged

**Data / Props**
- `isSelected?: boolean` — default `false`; when `true` applies the selected ring and background
- `onSelect?: (customer: Customer) => void` — called on click; replaces / extends the existing `onClick` prop (or renames it for clarity — prefer `onSelect` to communicate intent)
- `customer: Customer` — unchanged required prop

**Integration**
- Modified in place: `src/components/CustomerCard.tsx`
- Consumed by `CustomerSelector` (`src/components/CustomerSelector.tsx`) which manages the `selectedId` state and passes `isSelected={customer.id === selectedId}` and `onSelect` to each card

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS
- **File:** `src/components/CustomerCard.tsx` — modify in place; do not create a new file
- **Backward compatibility:** `isSelected` and `onSelect` are both optional; existing usages that pass neither prop continue to work as static display cards
- **Accessibility:** when `onSelect` is provided, card must have `role="button"`, `tabIndex={0}`, `aria-pressed={isSelected}`, and `onKeyDown` handler for Enter/Space
- **No external dependencies** beyond React and Tailwind CSS

### Acceptance Criteria
- [ ] Clicking a card calls `onSelect` with the correct `Customer` object
- [ ] Card with `isSelected={true}` renders with `ring-2 ring-blue-500` and `bg-blue-50`
- [ ] Card with `isSelected={false}` (or prop omitted) renders without selected styles
- [ ] Pressing Enter or Space on a focused card triggers `onSelect`
- [ ] Card has `aria-pressed={true}` when selected and `aria-pressed={false}` when not
- [ ] All existing acceptance criteria from `customer-card-spec.md` continue to pass (health badge, domains, responsive layout, TypeScript validity)
- [ ] Passing neither `isSelected` nor `onSelect` renders a static, non-interactive card with no regression
- [ ] `CustomerSelector` can control which card is selected by passing `isSelected` derived from its own state
- [ ] No TypeScript errors; `CustomerCardProps` interface updated and exported
