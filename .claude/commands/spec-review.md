Review a spec file for completeness and quality against the project template.

**Usage:** `/spec-review <spec-file-path>`

The spec file is: $ARGUMENTS

**Steps:**

1. Read both files in parallel:
   - The spec at `$ARGUMENTS`
   - The template at `templates/spec-template.md`

2. **Section presence check** — verify all four required top-level sections exist:
   - `### Context`
   - `### Requirements`
   - `### Constraints`
   - `### Acceptance Criteria`

   Mark each ✅ if present, ❌ if missing entirely.

3. **Section completeness check** — for each present section, evaluate quality:

   **Context**
   - [ ] States the component's purpose and role in the application
   - [ ] Describes how it fits into the larger system (parent components, data flow)
   - [ ] Identifies the target users and their use case

   **Requirements**
   - [ ] Functional requirements listed (what the component must *do*)
   - [ ] UI/visual requirements described (layout, styling, colour conventions)
   - [ ] Data / props interface defined (field names, types, optional vs required)
   - [ ] Integration requirements stated (imports, exports, parent components)

   **Constraints**
   - [ ] Tech stack specified (Next.js 15, React 19, TypeScript, Tailwind CSS)
   - [ ] Exact output file path given (e.g. `src/components/Foo.tsx`)
   - [ ] TypeScript interfaces or prop shapes defined (or referenced by file)
   - [ ] At least one non-functional constraint present (accessibility, performance, or security)

   **Acceptance Criteria**
   - [ ] Written as a checkbox list (`- [ ] ...`)
   - [ ] Each criterion is concrete and testable (not vague like "works correctly")
   - [ ] Happy path covered
   - [ ] At least one edge case covered (empty data, boundary values, error state)
   - [ ] At least one integration point verified (renders in parent, imports resolve)

4. **Actionable feedback** — for every ❌ item, write a one-sentence suggestion explaining what to add and where. Format as a numbered list under a `## Suggested Fixes` heading.

5. Print a final summary:

```
Spec Review: <file path>
─────────────────────────────────────────────────
Section presence
  ✅ Context
  ✅ Requirements
  ✅ Constraints
  ❌ Acceptance Criteria   — section missing

Section completeness
  Context              3/3 ✅
  Requirements         3/4 ❌  (missing: data/props interface)
  Constraints          2/4 ❌  (missing: output file path, non-functional constraint)
  Acceptance Criteria  —/5     (section absent)

Overall score: 8/16 criteria met

## Suggested Fixes
1. Add an `### Acceptance Criteria` section with a checkbox list of at least 5 testable items.
2. Under Requirements, add a **Data / Props** sub-section defining the TypeScript prop interface.
3. Under Constraints, add the exact output file path (e.g. `src/components/ComponentName.tsx`).
4. Under Constraints, add at least one accessibility or performance requirement.
```

If all checks pass, print `Overall: PASS — spec is complete and ready for /implement`.
