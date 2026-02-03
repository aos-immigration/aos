# Address History Feature

## Overview

Feature to collect complete address history for the last 5 years, moving backward in time. Required for USCIS forms (I-130, I-485) with a user-friendly, step-by-step approach.

## Specs in This Folder

- **`user-stories.md`** - User stories with acceptance criteria
- **`gherkin.feature`** - BDD test specifications (Given-When-Then)
- **`schema.md`** - Data structure definitions (TypeScript types, validation rules)
- **`tasks/`** - Task breakdown for agent delegation

## Schema Location

**Schema definitions live in TWO places**:

1. **`schema.md`** (this folder) - Reference/documentation
   - What the schema should be
   - Field descriptions
   - Validation rules
   - Examples

2. **Actual code** - Implementation
   - TypeScript types: `apps/web/src/app/lib/intakeStorage.ts`
   - Validation schemas: `apps/web/src/app/lib/addressValidation.ts` (if using Zod)
   - Database schemas: `apps/web/convex/schema.ts` (if using Convex)

**Why both?**
- `schema.md` = Spec (what it should be)
- Code = Implementation (what it actually is)
- Keep them in sync!

## Development Flow

1. **Idea** → Generate user stories
2. **User Stories** → Generate Gherkin
3. **Stories + Gherkin** → Generate schema (both `schema.md` and code)
4. **All specs** → Generate task breakdown
5. **Tasks** → Delegate to agents

## Status

- [ ] User stories defined
- [ ] Gherkin scenarios written
- [ ] Schema defined
- [ ] Tasks broken down
- [ ] Implementation in progress
