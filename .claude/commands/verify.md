Verify a component against TypeScript types, mock data, and responsive design requirements.

**Usage:** `/verify <component-file-path>`

The component file is: $ARGUMENTS

**Steps:**

1. Read the component file at `$ARGUMENTS`. Identify:
   - All imported types and their source files
   - Props interface and required/optional fields
   - Tailwind classes used for layout and responsiveness
   - Any conditional rendering logic and edge case handling

2. **TypeScript check** — run the TypeScript compiler on the file and report errors:
   ```
   npx tsc --noEmit --strict
   ```
   Also use the IDE diagnostics tool (`mcp__ide__getDiagnostics`) to surface any additional type errors. List every error with file, line, and message. Mark this check ✅ if zero errors, ❌ with details if any.

3. **Mock data rendering check** — read `src/data/mock-customers.ts` and verify the component handles every customer in `mockCustomers`:
   - Required fields (`id`, `name`, `company`, `healthScore`) are present and correctly typed for all 8 entries
   - Optional fields (`domains`, `email`, `subscriptionTier`) are handled — verify the component has null/undefined guards for each optional field
   - Health score boundary values: confirm at least one customer per range (0–30, 31–70, 71–100) exists in mock data and that the component's conditional logic covers all three ranges
   - Mark ✅ if all 8 customers would render without runtime errors, ❌ with specific customers and fields that would fail

4. **Responsive design check** — inspect Tailwind classes for responsive behaviour across four breakpoints:
   - **Mobile (default / <640px):** layout classes with no prefix (e.g. `flex-col`, `w-full`)
   - **sm (640px+):** classes prefixed `sm:`
   - **md (768px+):** classes prefixed `md:`
   - **lg (1024px+):** classes prefixed `lg:` and above
   - Check that text doesn't overflow (look for `truncate`, `overflow-hidden`, or `break-words` on variable-length fields like domain names)
   - Check that the card container has a width strategy (`w-full`, `max-w-*`, or grid parent) that prevents overflow on narrow screens
   - Mark ✅ if responsive classes are present and consistent, ❌ with the specific classes or breakpoints missing

5. **Spec acceptance criteria check** — look for a matching spec file at `specs/<component-name>-spec.md` (convert the component filename to kebab-case). If found, read it and verify each `- [ ]` acceptance criterion against the component source. Mark each ✅ or ❌.

6. Print a final pass/fail summary:

```
Verification: src/components/<ComponentName>.tsx
──────────────────────────────────────────────
✅ TypeScript          No type errors
✅ Mock data           All 8 customers render cleanly
❌ Responsive design   Missing sm: width class on card container
✅ Acceptance criteria 7/8 passing
   ❌ "domain count shown when >1 domain" — count element not found

Overall: FAIL (1 issue)
```

If all checks pass, print `Overall: PASS`.
