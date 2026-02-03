# Complete Development Guide

**One guide to rule them all** - Everything you need for spec-driven development with agents.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [The Pipeline](#the-pipeline)
3. [Core Concepts](#core-concepts)
4. [Pragmatic Approach](#pragmatic-approach)
5. [Decision Making](#decision-making)
6. [Agent Delegation](#agent-delegation)
7. [Prompts](#prompts)

---

## Quick Start

### For a New Feature

1. **Create feature folder**: `specs/my-feature/`
2. **Generate specs** (30-60 min total):
   - User stories → `specs/my-feature/user-stories.md`
   - Gherkin → `specs/my-feature/gherkin.feature`
   - Schema → `specs/my-feature/schema.md` (reference) + code (implementation)
3. **Create tasks**: `specs/my-feature/tasks/`
4. **Delegate to agents**: Use task breakdown
5. **Code it**: Implement based on specs

**Time**: ~2-3 hours for specs + task breakdown, then agents code in parallel

---

## The Pipeline

### The Flow

```
Idea
  ↓
[Prompt 1] User Stories (30 min)
  ↓
[Prompt 2] Gherkin (30 min) - Use existing Gherkin as pattern if exists
  ↓
[Prompt 3] Schema (30 min) - Extend existing schema
  ↓
[Optional] Tests (skip for exploration/prototyping)
  ↓
[Optional] Code Generation (or write manually)
  ↓
Working Feature
```

### Step 1: Idea → User Stories

**Prompt**: Use the template below with your feature idea

**Input**:
- Feature idea
- Existing user stories (for consistency)
- Product principles (from `agent.md`)

**Output**: `specs/my-feature/user-stories.md`

**Format**:
```markdown
## Story 1: [Title]
As a [user type], I want [goal] so that [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
```

**Time**: 30 minutes (don't perfect it, just enough to start)

---

### Step 2: User Stories → Gherkin

**Prompt**: Use the template below with user stories

**Input**:
- User stories (from Step 1)
- Existing Gherkin files (for patterns)

**Output**: `specs/my-feature/gherkin.feature`

**Format**:
```gherkin
Feature: [Feature Name]
  As a [user]
  I want [goal]
  So that [benefit]

  Scenario: [Scenario name]
    Given [context]
    When [action]
    Then [outcome]
```

**Time**: 30 minutes (happy path + key edge cases, not everything)

**Note**: Gherkin is a spec/documentation. You can skip generating tests from it - write tests after code instead.

---

### Step 3: Stories + Gherkin → Schema

**Prompt**: Use the template below

**Input**:
- User stories
- Gherkin scenarios
- Existing schemas (TypeScript types, Convex schemas)

**Output**: 
- `specs/my-feature/schema.md` (reference)
- Actual code: `apps/web/src/app/lib/` (implementation)

**Schema = All Data Structures**:
- TypeScript types (frontend)
- Validation schemas (Zod/Yup)
- Database schemas (Convex)
- API types (request/response)

**Time**: 30 minutes

**Important**: Schema lives in TWO places:
1. `schema.md` = Reference/documentation
2. Code = Actual implementation
Keep them in sync!

---

## Core Concepts

### What are User Stories?

**Format**: "As a [user], I want [goal] so that [benefit]"

**Example**:
```
As a user filling out immigration forms,
I want to add my current address first,
So that I can start with what I know best.
```

**Purpose**: Define what users need, not how to build it.

---

### What is Gherkin?

**Gherkin** = Plain-text format for writing specifications in natural language.

**Example**:
```gherkin
Feature: Add Current Address
  Scenario: Add address
    Given I see the form
    When I enter address details
    Then it should save
```

**Purpose**: 
- Guide your thinking (what to build)
- Document behavior
- Can become tests (optional)

**Key Insight**: You can use Gherkin as **spec only** (not generate tests). Write tests after code instead - they're more accurate.

---

### What is a Schema?

**Schema** = Data structure definition (not just database schemas!)

**Types of Schemas**:
1. **TypeScript types**: `export type AddressEntry = { ... }`
2. **Validation schemas**: `z.object({ ... })` (Zod)
3. **Database schemas**: `defineTable({ ... })` (Convex)
4. **API types**: Request/response types

**Location**:
- **Reference**: `specs/my-feature/schema.md` (what it should be)
- **Implementation**: Code files (what it actually is)

**Keep both in sync!**

---

## Pragmatic Approach

### The Scrappy Path (Recommended)

**Don't perfect specs upfront. Iterate:**

```
Quick Spec (30 min)
    ↓
Code (1 hour) → Discover issues
    ↓
Update Spec (10 min) → Document what you learned
    ↓
Fix Code (30 min)
    ↓
Repeat until done
```

**Total**: ~2 hours vs. 8 hours for "perfect spec first"

### When to Use Quick vs. Detailed Specs

**Quick Specs (30 min)** when:
- Prototyping/exploring
- Simple features
- Solo development
- Constraints unknown

**Detailed Specs (2-4 hours)** when:
- Multiple developers
- Complex business logic
- Long-term maintenance
- High risk features

### The Iterative Cycle

1. **Quick spec** - Just enough to start
2. **Code it** - Discover reality
3. **Update spec** - Document what you learned
4. **Fix code** - Adjust to reality
5. **Repeat** - Refine as you go

**Key**: Specs get better as you learn, not worse.

---

## Decision Making

### When Tests Fail or Code Doesn't Work

**Decision Tree**:

```
Test Fails / Code Wrong
    ↓
Is the test correct?
    ├─→ YES → Fix Code
    └─→ NO → Was spec wrong?
              ├─→ YES → Update Spec
              └─→ NO → Fix Test
```

### Golden Rules

1. **Spec wrong?** → Update spec → Regenerate
2. **Code wrong?** → Fix code → Re-test
3. **Test wrong?** → Fix test → Re-test
4. **Unclear?** → Update spec (safer)

### When to Update Specs

**Update specs when REQUIREMENT is wrong:**
- User needs something different
- Edge case discovered
- Business logic incorrect
- API doesn't work as expected

**Example**: 
- Spec says "Use API X"
- API X requires OAuth (not documented)
- **Action**: Update spec → "Use API X with OAuth" or "Use API Y instead"

### When to Update Code

**Fix code when IMPLEMENTATION is wrong:**
- Tests are correct but code doesn't match
- Code has bugs
- Code doesn't follow patterns

**Example**:
- Test expects "Jan 2020 - Present"
- Code shows "2020-01 - Current"
- **Action**: Fix code (don't change test)

### Agent Decision-Making

**Agents can**:
- Analyze failures
- Compare code to spec
- Suggest fixes
- Ask clarifying questions

**You should**:
- Make final decisions (you understand business context)
- Review agent suggestions
- Approve or adjust changes

---

## Agent Delegation

### The Hierarchy

```
Planner Agent
  (Reads specs, creates tasks, coordinates)
    ↓
  Delegates to:
    ├─→ Backend Agent (data, validation, utilities)
    ├─→ Frontend Agent (components, UI, forms)
    └─→ Full-Stack Agent (integration, orchestration)
```

### Workflow

1. **Planner Agent** reads:
   - User stories
   - Gherkin scenarios
   - Schema definitions
   - Task breakdown template

2. **Planner Agent** creates assignments:
   - Backend Agent: TASK-01 to TASK-06
   - Frontend Agent: TASK-07 to TASK-12
   - Full-Stack Agent: TASK-13 to TASK-18

3. **Subagents** work in parallel (respecting dependencies)

4. **Coordination** through planner agent

### Task Breakdown Structure

Each feature has: `specs/my-feature/tasks/`
- `tasks.md` - Detailed breakdown with dependencies
- `board.md` - Quick reference for agents
- `tasks.json` - Machine-readable format

**See**: `specs/address-history/tasks/` for example

---

## Prompts

### Prompt 1: Generate User Stories

```
You are a product manager creating user stories.

FEATURE IDEA:
{feature_idea}

EXISTING USER STORIES (for reference):
{existing_user_stories}

PRODUCT PRINCIPLES:
{product_principles}

TASK:
Create user stories following this format:

As a [type of user], I want [some goal] so that [some reason/benefit]

Acceptance Criteria:
- [ ] Criterion 1 (testable and specific)
- [ ] Criterion 2

REQUIREMENTS:
1. Each story should be independent and testable
2. Acceptance criteria should be specific and measurable
3. Consider edge cases
4. Align with product principles

OUTPUT:
Create user-stories.md with feature overview and 3-8 stories.
```

---

### Prompt 2: Generate Gherkin

```
You are a QA engineer creating BDD test specifications.

USER STORIES:
{user_stories}

EXISTING GHERKIN FILES (for reference/patterns):
{existing_gherkin_files}

TASK:
Create Gherkin feature files covering all user stories.

GHERKIN FORMAT:
```gherkin
Feature: [Feature Name]
  As a [user type]
  I want [goal]
  So that [benefit]

  Scenario: [Scenario name]
    Given [initial context]
    When [action]
    Then [expected outcome]
```

REQUIREMENTS:
1. One feature file per major user story
2. Each acceptance criterion should have at least one scenario
3. Include happy path, edge cases, and errors
4. Use clear, domain language
5. Follow existing Gherkin patterns if provided

OUTPUT:
Create gherkin.feature file.
```

---

### Prompt 3: Generate Schema

```
You are a software architect creating data schemas.

FEATURE IDEA:
{feature_idea}

USER STORIES:
{user_stories}

GHERKIN SCENARIOS:
{gherkin_scenarios}

EXISTING SCHEMAS:
{existing_schemas}

TASK:
Create or update schemas that support the feature.

SCHEMA REQUIREMENTS:
1. Define all data structures needed
2. Integrate with existing schemas (extend, not duplicate)
3. Include validation rules
4. Support all Gherkin scenarios
5. Include TypeScript types
6. Include validation schemas (Zod/Yup if used)
7. Update Convex schema if needed

SCHEMA TYPES TO CREATE:
- TypeScript interfaces/types
- Validation schemas (Zod/Yup)
- Convex schema updates (if applicable)
- API request/response types (if applicable)

OUTPUT:
Create schema.md (reference) and update actual code files.
```

---

## Complete Example: Address History

### Step 1: User Stories

**File**: `specs/address-history/user-stories.md`

```markdown
## Story 1: Add Current Address
As a user, I want to add my current address first so that I can start with what I know best.

Acceptance Criteria:
- [ ] User can enter street, city, state, zip, country
- [ ] User can enter start date (month/year, day optional)
- [ ] System marks this as "current address"
- [ ] Data saves automatically
```

### Step 2: Gherkin

**File**: `specs/address-history/gherkin.feature`

```gherkin
Feature: Add Current Address
  Scenario: Add address with all fields
    Given I see the "Current Address" form
    When I enter address details
    Then my address should be saved
```

### Step 3: Schema

**File**: `specs/address-history/schema.md` (reference)

**Code**: `apps/web/src/app/lib/intakeStorage.ts` (implementation)

```typescript
export type AddressEntry = {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  startMonth: MonthValue;
  startYear: string;
  startDay?: string;
  isCurrent: boolean;
  gapExplanation?: string;
};
```

### Step 4: Tasks

**File**: `specs/address-history/tasks/tasks.md`

18 tasks broken down with dependencies, ready for agent delegation.

---

## Key Principles

1. **Start small** - Quick specs (30 min), not perfect specs (4 hours)
2. **Iterate** - Update specs as you learn
3. **Code first, tests after** - Tests written before code are often wrong
4. **Keep specs in sync** - Update `schema.md` when code changes
5. **Use existing patterns** - Reference existing Gherkin, schemas, code
6. **Delegate intelligently** - Break into tasks, assign to agents, coordinate

---

## File Structure

```
specs/
  my-feature/
    README.md          # Feature overview
    user-stories.md    # User stories
    gherkin.feature    # BDD scenarios
    schema.md          # Schema reference
    tasks/             # Task breakdown
      tasks.md         # Detailed tasks
      board.md         # Quick board
      tasks.json       # Machine-readable
```

**Actual code** lives in:
- `apps/web/src/app/lib/` - Types, utilities
- `apps/web/src/app/components/` - Components
- `apps/web/convex/` - Database schemas

---

## Summary

**The Pipeline**:
1. Idea → User Stories (30 min)
2. Stories → Gherkin (30 min, use existing as pattern)
3. Stories + Gherkin → Schema (30 min, extend existing)
4. All specs → Task breakdown
5. Tasks → Delegate to agents

**The Approach**:
- Quick specs, iterate, learn as you go
- Write tests after code (more accurate)
- Update specs as you discover reality
- Keep specs and code in sync

**Agent Coordination**:
- Planner Agent breaks down into tasks
- Subagents work in parallel
- Coordinate through planner
- Respect dependencies

**Total Time**: ~2-3 hours for specs + tasks, then agents code in parallel (~9 hours vs. 18 hours sequential)

---

**This is everything you need. One guide, complete reference.**
