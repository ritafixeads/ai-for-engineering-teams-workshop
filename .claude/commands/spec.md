Generate a spec file for a component or feature.

**Usage:** `/spec <ComponentName>`

**Steps:**

1. The component name is: $ARGUMENTS

2. Check if `requirements/$ARGUMENTS.md` exists (try both PascalCase and kebab-case variants, e.g. `CustomerCard` → `customer-card`). Read it if found — use it as the primary source of truth for business context, functional requirements, and data requirements.

3. Read `templates/spec-template.md` to confirm the required structure.

4. Scan the codebase for any existing related files (components, data interfaces, API routes) that inform constraints — e.g. `src/components/$ARGUMENTS.tsx`, `src/data/mock-*.ts`, `src/app/api/`.

5. Generate a complete spec following the template structure:
   - **# Spec: $ARGUMENTS**
   - **Feature:** name and one-line description
   - **Context:** purpose, role in the system, target users
   - **Requirements:** functional, UI, data/props, integration
   - **Constraints:** stack (Next.js 15, React 19, TypeScript, Tailwind CSS), file paths, TypeScript interfaces, accessibility, performance
   - **Acceptance Criteria:** checkbox list of concrete, testable criteria covering happy paths, edge cases, and integration points

6. Save the output to `specs/$ARGUMENTS-spec.md` (convert PascalCase to kebab-case for the filename, e.g. `CustomerCard` → `specs/customer-card-spec.md`).

7. Confirm the file was written and print the path.
