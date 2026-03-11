# Spec: Button Component

## Feature: Button

### Context
- A foundational UI primitive used throughout the Customer Intelligence Dashboard
- Provides consistent interactive affordances for actions such as saving data, triggering navigation, confirming destructive operations, and submitting forms
- Used by developers building dashboard features and by end-users interacting with the application

### Requirements
- **Functional**
  - Renders a native `<button>` element
  - Supports four visual variants: `primary`, `secondary`, `danger`, `ghost`
  - Supports three sizes: `sm`, `md` (default), `lg`
  - Supports a `loading` state that shows an animated spinner and prevents interaction
  - Supports an optional leading `icon` slot
  - Forwards all standard HTML button attributes via rest props spread

- **User Interface**
  - Variants use Tailwind CSS utility classes for color, hover, and focus styles
  - Disabled/loading state applies `opacity-50` and `cursor-not-allowed`
  - Visible focus ring (`ring-2 ring-offset-2`) for keyboard navigation
  - Loading spinner replaces the icon to keep button width stable

- **Data / Props**
  - `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'` — default `'primary'`
  - `size?: 'sm' | 'md' | 'lg'` — default `'md'`
  - `loading?: boolean` — default `false`
  - `icon?: React.ReactNode` — optional leading icon
  - `children: React.ReactNode` — button label (required)
  - `type?: 'button' | 'submit' | 'reset'` — default `'button'`
  - `className?: string` — additional CSS classes
  - All `React.ButtonHTMLAttributes<HTMLButtonElement>` props

- **Integration**
  - Default export from `src/components/Button.tsx`
  - No external dependencies beyond React and Tailwind CSS

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **File:** `src/components/Button.tsx`
- **Naming:** PascalCase component, kebab-case file
- **Accessibility:** Must use native `disabled` attribute; `aria-busy` on loading state
- **No form submission side-effects:** `type` defaults to `'button'`
- **Security:** No dynamic HTML injection; icon and children are React nodes only

### Acceptance Criteria
- [ ] Renders all four variants with correct Tailwind color classes
- [ ] Renders all three sizes with correct padding/font-size classes
- [ ] `loading=true` shows spinner, hides icon, and prevents clicks
- [ ] `disabled=true` applies opacity and cursor styles via native attribute
- [ ] Focus ring is visible when navigating by keyboard
- [ ] `icon` prop renders a leading icon when not loading
- [ ] `className` prop appends additional classes without overriding base styles
- [ ] All native button attributes (e.g. `onClick`, `form`, `aria-label`) pass through correctly
- [ ] `type` defaults to `'button'` to avoid accidental form submissions
