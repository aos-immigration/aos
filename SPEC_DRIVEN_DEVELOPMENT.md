# Spec-Driven Development Guide for Long-Running Agents

## Overview

This guide helps you create clear, actionable specifications that enable long-running AI agents to work autonomously on your project. Specs answer three critical questions:

1. **What it should do** (Behavior/Requirements)
2. **How it should work** (Architecture/Implementation)
3. **What it should look like** (Visual Design/UI)

---

## The Three-Layer Spec Structure

### Layer 1: What It Should Do (Behavioral Spec)

**Purpose**: Define the expected behavior and outcomes without implementation details.

**Format**: Use structured markdown with clear sections.

**Example Structure**:
```markdown
## Feature: Address History Collection

### Purpose
Collect a complete address history for the last 5 years, moving backward in time.

### User Goals
- User wants to provide their address history without confusion
- User needs to explain gaps (unemployment, travel, etc.)
- User should be able to estimate dates when exact dates are unknown

### Success Criteria
- [ ] User can add addresses starting from current address
- [ ] User can add "before that" addresses in reverse chronological order
- [ ] System accepts month/year without requiring exact day
- [ ] System prompts for gap explanations when dates don't connect
- [ ] User can review all addresses before submission

### Edge Cases
- User has lived at same address for 10+ years
- User has gaps due to travel/unemployment
- User doesn't remember exact dates
- User has multiple addresses in same month (moving mid-month)

### Data Requirements
- Address fields: street, city, state, zip, country
- Date fields: month (required), year (required), day (optional)
- Gap explanation: text field (optional but prompted if gap exists)
```

### Layer 2: How It Should Work (Technical Spec)

**Purpose**: Define the architecture, data flow, and implementation approach.

**Format**: Technical diagrams (ASCII or Mermaid) + structured documentation.

**Example Structure**:
```markdown
## Technical Spec: Address History Collection

### Data Model
```typescript
interface AddressEntry {
  id: string; // UUID
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  startMonth: string; // "01"-"12"
  startYear: string; // "2020"
  startDay?: string; // "15" (optional)
  endMonth?: string; // null if current address
  endYear?: string;
  endDay?: string;
  gapExplanation?: string; // Required if gap detected
}
```

### State Management
- Use React state with localStorage persistence
- Auto-save on every field change
- Load from localStorage on component mount

### Flow Logic
1. Start with current address (end date = null)
2. User clicks "Add Previous Address"
3. System calculates expected start date (previous address end date)
4. If user enters start date that creates gap, prompt for explanation
5. Validate: start date must be before end date
6. Validate: no overlapping addresses

### API Integration
- Save to Convex: `mutations.saveAddress(address: AddressEntry)`
- Load from Convex: `queries.getAddresses(userId: string)`
- Local-first: save to localStorage immediately, sync to Convex in background
```

### Layer 3: What It Should Look Like (Visual Spec)

**Purpose**: Define the visual appearance and user interface.

**Format**: Screenshots + reference apps + design system tokens + component descriptions.

**Example Structure**:
```markdown
## Visual Spec: Address History Collection

### Reference Applications
- **Primary Reference**: [USCIS Form I-485 Part 1](screenshots/i485-part1.png)
  - Note: Use similar field layout but with better UX (step-by-step vs. long form)
  
- **Secondary Reference**: [TurboTax Address History](screenshots/turbotax-address.png)
  - Note: Use their "Before that..." pattern for adding previous addresses

### Design System
- **Component Library**: shadcn/ui (already in project)
- **Color Scheme**: Use existing theme (light/dark mode support)
- **Typography**: System fonts (Inter or system default)
- **Spacing**: 16px base unit (1rem)

### Layout Structure
```
┌─────────────────────────────────────┐
│  Step 2 of 5: Address History      │
├─────────────────────────────────────┤
│                                     │
│  Current Address                    │
│  ┌───────────────────────────────┐ │
│  │ Street Address                 │ │
│  │ [___________________________]  │ │
│  │                                │ │
│  │ City        State    ZIP       │ │
│  │ [____]      [____]   [_____]   │ │
│  │                                │ │
│  │ Start Date: [Month] [Year]     │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ + Add Previous Address ]         │
│                                     │
│  Previous Addresses (2)             │
│  ┌───────────────────────────────┐ │
│  │ 123 Main St, NYC, NY 10001    │ │
│  │ Jan 2020 - Dec 2022           │ │
│  │ [Edit] [Remove]               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ ← Back ]  [ Continue → ]        │
└─────────────────────────────────────┘
```

### Component Specifications

#### Address Card Component
- **Visual**: Card with subtle border, rounded corners (8px)
- **Layout**: Grid layout for address fields
- **Actions**: Edit/Remove buttons in top-right corner
- **States**: 
  - Default: White background, gray border
  - Hover: Slight shadow, border color darkens
  - Editing: Blue border, expanded form

#### "Add Previous Address" Button
- **Style**: Outlined button (secondary variant)
- **Icon**: Plus icon on left
- **Position**: Below current address card
- **Behavior**: Opens inline form or modal (agent's choice based on screen size)

### Responsive Behavior
- **Desktop (>768px)**: Side-by-side fields (City, State, ZIP in one row)
- **Mobile (<768px)**: Stacked fields, full width
- **Tablet**: Hybrid approach

### Accessibility
- All inputs must have labels
- Form validation errors must be announced to screen readers
- Keyboard navigation: Tab through fields, Enter to submit
- Focus states: Clear blue outline (2px)
```

---

## Solutions for "What It Should Look Like"

### Strategy 1: Reference Screenshots (Your Current Approach)

**Best For**: When you have existing apps that do something similar

**How to Use**:
1. Take screenshots of similar features in other apps
2. Store them in `specs/screenshots/`
3. Reference them in your visual spec
4. Add annotations: "Use this layout but change X to Y"

**Example**:
```markdown
### Reference Screenshots
- `specs/screenshots/turbotax-address-flow.png` - Use this step-by-step pattern
- `specs/screenshots/uscis-form-layout.png` - Use this field grouping
- `specs/screenshots/stripe-billing-form.png` - Use this validation error style
```

### Strategy 2: Design System First

**Best For**: When you want consistency across features

**Approach**:
1. Define your design tokens once (colors, spacing, typography)
2. Reference existing components from your UI library
3. Let agents compose existing components rather than creating new ones

**Example**:
```markdown
### Design System Reference
- **Components**: Use shadcn/ui components (already installed)
  - `Button` - For all actions
  - `Input` - For text fields
  - `Select` - For dropdowns
  - `Card` - For grouping related fields
  - `Dialog` - For modals/overlays

- **Layout Patterns**: 
  - Use `StepShell` component for multi-step flows
  - Use `DashboardLayout` for main app pages
  - Use existing `Breadcrumbs` for navigation
```

### Strategy 3: "Good Enough" + Iterate

**Best For**: When you trust the agent's judgment and want to move fast

**Approach**:
1. Define the functional requirements clearly
2. Give the agent design principles (e.g., "clean, professional, accessible")
3. Let the agent propose a design
4. Iterate based on visual feedback

**Example**:
```markdown
### Design Principles
- **Style**: Clean, professional, government-form aesthetic
- **Accessibility**: WCAG AA compliant (contrast ratios, keyboard nav)
- **Responsive**: Mobile-first, works on all screen sizes
- **Consistency**: Match existing app patterns (see `IntakeFlow.tsx`)

### Agent Instructions
Design a layout that makes sense for this use case. Use existing components
from the design system. Prioritize clarity and ease of use over visual flair.
We'll iterate based on user feedback.
```

### Strategy 4: Component Composition Spec

**Best For**: When you know what components exist but not how to arrange them

**Approach**:
1. List available components
2. Define the data flow
3. Let the agent figure out the layout

**Example**:
```markdown
### Available Components
- `StepShell` - Wraps multi-step forms
- `Input` - Text input fields
- `Select` - Dropdown selects
- `Button` - Action buttons
- `Card` - Container for related fields
- `Dialog` - Modal overlays

### Component Composition
```
<StepShell>
  <Card>
    <Input label="Street Address" />
    <Input label="City" />
    <Select label="State" options={states} />
    <Input label="ZIP Code" />
  </Card>
  <Button>Add Previous Address</Button>
  <AddressList addresses={addresses} />
  <Button>Continue</Button>
</StepShell>
```

Agent: Arrange these components in a logical, user-friendly layout.
```

---

## Creating Your First Spec

### Step 1: Start with Behavior (What)

Ask yourself:
- What problem does this solve?
- What should the user be able to do?
- What are the success criteria?
- What edge cases exist?

Write this in plain language first, then structure it.

### Step 2: Define the Technical Approach (How)

Ask yourself:
- What data do I need to store?
- How should the data flow?
- What APIs/components exist?
- What are the technical constraints?

Reference existing code patterns in your project.

### Step 3: Define Visual Requirements (Looks)

Choose one approach:
- **Option A**: Reference screenshots + design system
- **Option B**: Design principles + agent judgment
- **Option C**: Component composition + layout hints

You don't need to be a Figma expert—you just need to give enough guidance.

---

## Spec Template

Create a file: `specs/[feature-name].md`

```markdown
# Feature: [Feature Name]

## 1. What It Should Do

### Purpose
[Why does this feature exist? What problem does it solve?]

### User Goals
- [Goal 1]
- [Goal 2]

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Edge Cases
- [Edge case 1]
- [Edge case 2]

## 2. How It Should Work

### Data Model
```typescript
// Define your data structures
```

### State Management
[How is state managed? React state? Convex? LocalStorage?]

### Flow Logic
1. [Step 1]
2. [Step 2]
3. [Step 3]

### API Integration
[What APIs are used? What mutations/queries?]

## 3. What It Should Look Like

### Reference Applications
- [App Name]: [screenshot path] - [What to use from it]

### Design System
- **Components**: [List available components]
- **Colors**: [Reference theme]
- **Spacing**: [Base unit]

### Layout Structure
```
[ASCII or text description of layout]
```

### Component Specifications
[Details about specific components]

### Responsive Behavior
[How it should work on different screen sizes]

### Accessibility
[Accessibility requirements]
```

---

## Multi-Agent Workflow

### Agent Roles

1. **Spec Reader Agent**: Reads specs, breaks down into tasks
2. **Implementation Agent**: Writes code based on spec
3. **Review Agent**: Checks implementation against spec
4. **Visual Agent**: Handles UI/styling based on visual spec

### Workflow

```
┌─────────────┐
│   Spec      │ (You write this)
│   Document  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Spec Reader │ (Agent reads, creates task list)
│   Agent     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Implementation│ (Agent implements based on spec)
│   Agent     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Review Agent│ (Agent checks: does code match spec?)
└──────┬──────┘
       │
       ▼
   [Iterate]
```

### Spec Updates as Feedback Loop

When you update a spec:
1. Agent detects spec change (git diff or file watcher)
2. Agent re-reads spec
3. Agent identifies what changed
4. Agent updates implementation to match new spec
5. Agent tests against updated success criteria

---

## Tips for Your AOS Project

### 1. Leverage Existing Patterns

You already have:
- `IntakeFlow.tsx` - Reference for multi-step form patterns
- `StepShell.tsx` - Reusable step wrapper
- `agent.md` - Product guidance (expand this into full specs)

### 2. Use Form-Filling as Reference

The USCIS forms themselves are specs! Reference them:
- I-130 form = spec for what data to collect
- Your implementation = how to collect it (better UX)

### 3. Create Specs for Each Major Feature

Suggested specs:
- `specs/address-history.md`
- `specs/employment-history.md`
- `specs/biographic-info.md`
- `specs/pdf-filling.md`
- `specs/review-submission.md`

### 4. Visual Specs Can Be Simple

For forms, you can say:
- "Use the same layout as `IntakeFlow.tsx` but for addresses"
- "Match the field grouping from the I-130 form"
- "Use shadcn/ui components with our existing theme"

---

## Example: Complete Spec

See `specs/example-address-history.md` for a full example.

---

## Next Steps

1. **Pick one feature** to spec out (start small)
2. **Use the template** above
3. **Start with "What"** - define behavior clearly
4. **Add "How"** - reference your existing code patterns
5. **Add "Looks"** - use reference screenshots or design principles
6. **Test with an agent** - see if it can implement from your spec
7. **Iterate** - refine the spec based on what the agent produces

Remember: A good spec doesn't need to be perfect. It needs to be clear enough that an agent can make reasonable decisions and ask clarifying questions when needed.
