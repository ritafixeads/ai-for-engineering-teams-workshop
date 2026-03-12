# Spec: Customer Management Integration

## Feature: Customer Management Integration
Full-stack CRUD feature for adding, viewing, updating, and listing customers in the Customer Intelligence Dashboard.

### Context
- Provides the foundational data layer for the entire dashboard — all other widgets (health scores, market intelligence, alerts) depend on customer records existing in the system
- Allows CSMs and support staff to create and maintain customer profiles without direct database access
- Consists of three layers: API route handlers, a CustomerService business-logic class, and React UI components (AddCustomerForm, CustomerList)
- Target users: internal operators (CSMs, support leads) who onboard new accounts and maintain customer metadata

### Requirements

**Functional**
- `GET /api/customers` — return all customers; support optional `?search=` query param for name/company filtering
- `POST /api/customers` — create a new customer; validate required fields (name, email, company, healthScore); return the created record with a generated `id`
- `GET /api/customers/[id]` — return a single customer by ID; 404 if not found
- `PUT /api/customers/[id]` — update an existing customer's fields; 404 if not found
- On validation failure return `400` with `{ error: string }`; on internal error return `500` with sanitized message (no stack traces)
- `CustomerService` class encapsulates in-memory storage, validation, and sanitization; pure static methods for testability
- `AddCustomerForm` component with fields: name, email, company, healthScore (0–100), subscriptionTier (basic / premium / enterprise); real-time validation feedback; success and error notification states
- `CustomerList` component that fetches from `GET /api/customers`, renders each customer using the existing `CustomerCard`, and supports live search filtering

**User Interface**
- `AddCustomerForm`: white card layout consistent with dashboard widgets; labelled inputs with inline validation messages; submit button uses the existing `Button` component (variant=`primary`, loading state while submitting); success toast/banner on creation; error banner on API failure
- `CustomerList`: responsive grid matching the `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern used on the home page; search input at top; empty state message when no results; loading skeleton while fetching
- Home page (`src/app/page.tsx`) gains a "Manage Customers" entry point (button or nav link) that reveals or routes to the customer management section

**Data / Props**
- Reuses and extends the `Customer` interface from `src/data/mock-customers.ts`; `CustomerService` starts with `mockCustomers` as seed data
- `AddCustomerFormProps`: optional `onSuccess?: (customer: Customer) => void` callback
- `CustomerListProps`: optional `onSelect?: (customer: Customer) => void` to integrate with `CustomerSelector`

**Integration**
- API routes: `src/app/api/customers/route.ts` (GET list, POST create) and `src/app/api/customers/[id]/route.ts` (GET one, PUT update)
- Service: `src/lib/customerService.ts`
- Components: `src/components/AddCustomerForm.tsx`, `src/components/CustomerList.tsx`
- Home page updated to link to customer management

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **Storage:** In-memory only — no external database; `CustomerService` holds state in a module-level `Map<string, Customer>`
- **IDs:** Generate with `crypto.randomUUID()` server-side
- **Validation:** name (1–100 chars), email (RFC-5322 regex), company (1–100 chars), healthScore (integer 0–100), subscriptionTier (enum)
- **Security:** sanitize all string inputs; never expose stack traces in API responses; email validation prevents injection; no sensitive data in client-side logs
- **Accessibility:** all form inputs have associated `<label>`; error messages linked via `aria-describedby`; form submittable via keyboard
- **Performance:** customer list renders with `React.memo` on `CustomerCard`; search filtering is client-side for lists ≤500 customers

### Acceptance Criteria
- [ ] `GET /api/customers` returns the full seeded list as JSON
- [ ] `GET /api/customers?search=acme` returns only customers whose name or company contains "acme" (case-insensitive)
- [ ] `POST /api/customers` with valid body creates a customer and returns it with a generated `id` and HTTP 201
- [ ] `POST /api/customers` with missing or invalid fields returns HTTP 400 with a descriptive `error` string
- [ ] `GET /api/customers/[id]` returns the customer when found; returns 404 when ID is unknown
- [ ] `PUT /api/customers/[id]` updates the customer and returns the updated record; returns 404 for unknown ID
- [ ] `CustomerService` methods are pure/static and return the same result for the same inputs (no hidden state leakage between calls)
- [ ] `AddCustomerForm` shows inline validation errors for blank name, invalid email, out-of-range healthScore before submission
- [ ] `AddCustomerForm` shows a success notification after a customer is created; form resets to empty state
- [ ] `AddCustomerForm` shows an error banner if the API returns a non-2xx response
- [ ] `CustomerList` renders all customers using `CustomerCard`; updates when a new customer is added
- [ ] `CustomerList` search input filters results in real time without a page reload
- [ ] Home page has a visible "Manage Customers" link/button that navigates to or reveals the management section
- [ ] No stack traces or internal error details appear in API error responses
- [ ] All form inputs are keyboard-accessible and screen-reader labelled
