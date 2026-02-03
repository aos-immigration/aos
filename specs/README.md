# Specs Directory

This directory contains feature specifications organized by feature.

## Structure

Each feature has its own folder with:

```
specs/
  feature-name/
    README.md          # Feature overview
    user-stories.md    # User stories
    gherkin.feature    # BDD test specifications
    schema.md          # Data structure definitions (reference)
    tasks/             # Task breakdown for agent delegation
      tasks.md         # Detailed task breakdown
      board.md         # Quick task board
      tasks.json       # Machine-readable task list
```

## Current Features

- **address-history/** - Address history collection feature

## Creating a New Feature

1. Create feature folder: `specs/my-feature/`
2. Copy template: `cp TEMPLATE.md specs/my-feature/README.md`
3. Generate specs using prompts in `../prompts/`:
   - `01-user-stories.md` → `user-stories.md`
   - `02-gherkin.md` → `gherkin.feature`
   - `03-schema.md` → `schema.md`
4. Create task breakdown: `specs/my-feature/tasks/`

## Schema Location

**Important**: Schemas exist in TWO places:

1. **`schema.md`** (in feature folder) - Reference/documentation
   - What the schema should be
   - Field descriptions
   - Validation rules

2. **Actual code** - Implementation
   - TypeScript types: `apps/web/src/app/lib/`
   - Validation schemas: `apps/web/src/app/lib/`
   - Database schemas: `apps/web/convex/schema.ts`

Keep both in sync!

## Development Flow

1. **Idea** → Generate user stories
2. **User Stories** → Generate Gherkin
3. **Stories + Gherkin** → Generate schema (both `schema.md` and code)
4. **All specs** → Generate task breakdown
5. **Tasks** → Delegate to agents

See `../prompts/` for pipeline prompts.
