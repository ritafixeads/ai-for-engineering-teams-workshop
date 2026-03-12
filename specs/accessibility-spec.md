# Spec: Accessibility

## Feature: Accessibility
WCAG 2.1 AA compliance audit and remediation across all Customer Intelligence Dashboard components.

### Context
- Ensures the dashboard is usable by people with disabilities including those who rely on screen readers, keyboard-only navigation, or high-contrast / reduced-motion preferences
- Applies as a cross-cutting quality standard to every existing and future component: `Button`, `CustomerCard`, `CustomerSelector`, `HealthScoreCalculator`, `MarketIntelligenceWidget`, and all form components
- Target users: end users with visual, motor, or cognitive disabilities; also required for enterprise procurement compliance
- This is an audit-and-remediation pass, not a new standalone component — it produces a set of targeted fixes and a reusable accessibility checklist

### Requirements

**Functional**
- All interactive elements (buttons, links, inputs, cards with `onClick`) must be operable via keyboard (Tab to focus, Enter/Space to activate)
- No keyboard trap: focus must be able to leave every interactive region; modals/drawers must trap focus internally but release it on close
- Tab order must follow the visual reading order (left-to-right, top-to-bottom)
- All form inputs must have a programmatically associated `<label>` (via `for`/`id` or `aria-labelledby`)
- Error messages must be associated with their input via `aria-describedby`
- Dynamic content updates (loading states, toast notifications, search results) must be announced via `role="status"` or `role="alert"` live regions
- All images and icon-only buttons must have descriptive `alt` text or `aria-label`
- The page must have a single `<h1>` and a logical heading hierarchy (`h2`, `h3`, …)

**User Interface**
- Focus rings: minimum 2 px solid outline with 3:1 contrast ratio against adjacent background; no `outline: none` without a custom replacement
- Color contrast: body text ≥ 4.5:1, large text (≥ 18 pt / 14 pt bold) ≥ 3:1, UI components and focus indicators ≥ 3:1 (WCAG 1.4.11)
- Color is never the sole conveyor of meaning — every health badge, sentiment badge, and alert indicator includes a text label alongside color
- Reduced-motion: wrap CSS animations (`animate-spin`, `animate-pulse`) in `@media (prefers-reduced-motion: reduce)` to disable or reduce them
- High-contrast mode: Tailwind utility classes should not override forced-color styles; avoid hardcoded border/background colors that disappear in high-contrast mode

**Data / Props**
- No new props required — fixes are applied directly to existing component markup
- Where interactive behaviour depends on `onClick`, verify `role`, `tabIndex`, `aria-label`, and keyboard handler (`onKeyDown` for Enter/Space) are all present

**Integration**
- Fixes applied in-place to: `src/components/Button.tsx`, `src/components/CustomerCard.tsx`, `src/components/HealthScoreCalculator.tsx`, `src/components/MarketIntelligenceWidget.tsx`
- Skip-to-content link added to `src/app/layout.tsx`
- `globals.css` updated with `prefers-reduced-motion` overrides

### Constraints
- **Standard:** WCAG 2.1 Level AA (success criteria 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.11, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 3.3.1, 3.3.2, 4.1.2)
- **Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS
- **No new runtime dependencies** — use native HTML semantics and ARIA attributes only
- **Testing tools:** axe-core browser extension for automated checks; manual keyboard walkthrough; screen reader spot-check (NVDA/VoiceOver)
- **Tailwind note:** use `focus-visible:ring-2 focus-visible:ring-offset-2` (not `focus:`) to avoid showing rings on mouse click

### Acceptance Criteria
- [ ] Every button, link, and interactive card is reachable via Tab and activatable via Enter or Space
- [ ] Tab order follows the visual reading order on all pages
- [ ] All form inputs in `AddCustomerForm` and `MarketIntelligenceWidget` have associated `<label>` elements
- [ ] Form validation error messages are linked to their input via `aria-describedby`
- [ ] Loading skeletons and toast notifications are announced by screen readers via live regions
- [ ] All icon-only buttons have a descriptive `aria-label`
- [ ] The page has exactly one `<h1>` and a logical heading hierarchy
- [ ] Skip-to-content link is the first focusable element on every page and moves focus to `<main>`
- [ ] All health, sentiment, and alert badges convey meaning via text label, not color alone
- [ ] Body text contrast ratio ≥ 4.5:1; large text ≥ 3:1 (verified via axe-core or WebAIM Contrast Checker)
- [ ] Focus rings are visible on all interactive elements; no `outline: none` without replacement
- [ ] `animate-spin` (loading spinners) and `animate-pulse` (skeletons) are suppressed when `prefers-reduced-motion: reduce` is set
- [ ] axe-core reports zero critical or serious violations across all pages
- [ ] No TypeScript errors introduced by the changes
