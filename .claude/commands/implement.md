Implement a component from a specification file.

**Usage:** `/implement <spec-file-path>`

The spec file is: $ARGUMENTS

**Steps:**

1. Read the spec file at `$ARGUMENTS`. Extract:
   - Component name and description
   - All functional, UI, data/props, and integration requirements
   - Constraints (file path, TypeScript interfaces, stack)
   - Every acceptance criterion (the checkbox list)

2. Scan the codebase for context before writing any code:
   - Read any files referenced in the spec (data interfaces, existing components, API routes)
   - Check if the target file already exists — if so, read it and diff against the spec rather than overwriting blindly
   - Note existing patterns (Tailwind classes, import paths, component conventions) from nearby components

3. Implement the component at the file path specified in the spec's Constraints section (typically `src/components/<ComponentName>.tsx`). Follow all constraints exactly:
   - Use only the listed stack (Next.js 15, React 19, TypeScript, Tailwind CSS)
   - Import types from the paths named in the spec — do not redefine them locally
   - Match color codes, class names, and prop shapes exactly as specified

4. Verify the implementation against **every** acceptance criterion from the spec:
   - Go through each `- [ ]` item one by one
   - For each criterion, confirm whether the current code satisfies it (yes/no + reason)
   - List any criteria that are NOT yet met

5. If any criteria are unmet, refine the component and re-verify. Repeat until all criteria pass.

6. Print a final summary:
   - File written to: `<path>`
   - Acceptance criteria: X/X passing
   - List each criterion with ✅ or ❌
