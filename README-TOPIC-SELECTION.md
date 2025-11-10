# Topic Selection Research and Plan

## Overview

This is a proposal for implementing a topic selection functionality for students to choose particular topics in math out of a comprehensive list. According to these choices, the software will produce math problems related to those themes.

## Current State

Currently, it is only algebra problems that are generated. The system does not allow students to particularize issues such as linear equations, quadratic equations, systems of equations, word problems, and so on.

## Goal

Allow students to choose one or more topics out of a predetermined list and then create mathematical problems that pertain exclusively to those topics. Giving students control over their practice allows them to focus on areas in which they need improvement.

## Research Questions

### What topics should be included?

Need to research what topics are typically covered in Algebra 1 and what would be most useful for students:

- Linear equations (slope-intercept, standard form, point-slope)
- Systems of linear equations
- Quadratic equations
- Word problems (distance, rate, time)
- Area and perimeter problems
- Percentage problems
- Ratio and proportion problems
- Inequalities
- Polynomial operations

### How should topics be organized?

Should topics be:
- Flat list (all topics at same level)
- Categorized (e.g., "Equations", "Word Problems", "Graphing")
- Hierarchical (main topics with subtopics)

### How many topics can a student select?

- Single selection only
- Multiple selections allowed
- All topics option for mixed practice

### How does topic selection affect problem generation?

The AI prompt needs to be modified to:
- Accept selected topics as input
- Generate problems specifically related to those topics
- Ensure variety when multiple topics are selected
- Handle edge cases (no topics selected, all topics selected)

## Implementation Plan

### Step 1: Define Topic Master List

Create a data structure that holds all available topics. This could be:
- A TypeScript enum or constant array
- A JSON file
- A database table (if we want to make it dynamic later)

Each topic should have:
- Unique identifier
- Display name
- Description (optional, for tooltips)
- Category/group (optional)

### Step 2: Create Topic Selection UI Component

Build a UI component that displays the master list of topics. Options include:
- Checkboxes for multiple selection
- Radio buttons for single selection
- Multi-select dropdown
- Tag-based selection (chips/badges)

Considerations:
- Should be accessible and easy to use
- Show selected topics clearly
- Allow deselecting topics
- Maybe include a "Select All" option

### Step 3: Store Selected Topics in State

In the equations screen component:
- Add state to track selected topics
- Initialize with default selection (maybe all topics or none)
- Update state when user changes selections
- Persist selection (localStorage or similar) so it remembers between sessions

### Step 4: Modify Problem Generation API

Update the backend endpoint that generates math problems:
- Accept selected topics as a parameter
- Modify the AI prompt to include topic constraints
- Ensure generated problems match selected topics
- Handle validation if no valid problems can be generated

### Step 5: Update AI Prompt

Modify the prompt in openAiUtility.tsx to:
- Include selected topics in the system message or user prompt
- Instruct AI to generate problems only from those topics
- Provide examples of problems for each topic type
- Ensure variety when multiple topics are selected

### Step 6: Add Topic Filtering to Equation Extraction

When extracting equations, verify that the extracted equation matches one of the selected topics. This might require:
- Topic validation after extraction
- Re-extraction if topic doesn't match
- Warning if equation doesn't match selected topics

### Step 7: Testing

Test various scenarios:
- Single topic selection
- Multiple topic selection
- All topics selected
- No topics selected (edge case)
- Topic switching mid-session
- Persistence of topic selection

## Technical Considerations

### Where to store the master list?

Options:
1. Hardcoded in a constants file (simple, but not flexible)
2. JSON file (easy to modify, can be loaded at runtime)
3. Database (most flexible, allows admin to modify topics)

For MVP, probably start with option 1 or 2.

### How to structure topic data?

```typescript
interface Topic {
  id: string;
  name: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

### Integration points

- equations.tsx: Add topic selection UI and state
- openAiUtility.tsx: Modify generateAlgebra1Problem to accept topics
- server/routes/api/openAi.ts: Update endpoint to accept topics parameter
- equationValidator.ts: Potentially add topic validation

## Open Questions

1. Should topic selection be per-session or global preference?
2. Do we need topic difficulty levels?
3. Should we track which topics a student has practiced?
4. Do we need analytics on topic selection patterns?
5. Should there be recommended topics based on student performance?
6. How do we handle topics that don't have enough problem variety?

## Next Steps

1. Research and finalize the master topic list
2. Design the topic selection UI component
3. Implement topic state management
4. Modify the problem generation to use topics
5. Test with various topic combinations
6. Gather user feedback and iterate

## Notes

This will provide students with more control and personalization opportunities for practice. The UI must be kept simple. They should not be burdened with too many features. Begin with a small list of topics to expand on.

