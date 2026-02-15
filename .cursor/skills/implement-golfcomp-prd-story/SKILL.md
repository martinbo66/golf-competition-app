---
name: implement-golfcomp-prd-story
description: Implements a user story from doc/PRD-GolfComp-Backend.md, updates PRD status for session tracking, adds tests for new functionality, and ensures tests and linting pass. Use when implementing backend user stories for the golf competition app or when the user asks to implement a PRD story.
---

# Implement Golf Competition PRD User Story

## Overview

Implements a single user story from `doc/PRD-GolfComp-Backend.md`, updating the PRD for cross-session tracking and ensuring all acceptance criteria, tests, and linting pass.

## Workflow

### 1. Select Story

1. Read `doc/PRD-GolfComp-Backend.md` Implementation Tracking section
2. Use **Next Up** or **Story Status Summary** to pick the next story
3. Verify prerequisites: all prerequisite stories must be **Complete**
4. If user specified a story (e.g., US-002), use that one

### 2. Update PRD: Mark In Progress

Before implementing, update the PRD:

- **Story Status Summary table:** Change the story's Status from `Not Started` to `In Progress`
- **Story section:** Update the story's `| **Status** |` attribute to `In Progress`
- **Acceptance Criteria:** Leave checkboxes as `[ ]` until done

### 3. Implement

1. Read the full story section (Description, Prerequisites, Acceptance Criteria, Agent Instructions)
2. Follow **Files to Create/Modify** exactly
3. Follow **Constraints** and **Hints** in the story
4. Reference **Data Model** (Section 6) and **API Contracts** (Section 7) for schema and endpoints
5. All file paths are relative to `spring-golfcomp/` unless noted

### 4. Add Tests

- **Every story** requires tests for new functionality
- Use story's **Testing Requirements** section for location
- Default: `src/test/java/com/golfcomp/api/` — use `unit/` or `integration/` subpackages
- Test types:
  - **Entities:** Repository tests or entity validation tests
  - **Repositories:** Integration tests with `@DataJpaTest`
  - **Services:** Unit tests with Mockito
  - **Controllers:** `@WebMvcTest` or integration tests
- Ensure new code paths are covered

### 5. Verify

Run from repository root (`golf-competition-app/`):

```bash
./gradlew backendBuild   # Compiles
./gradlew backendTest    # Backend tests
./gradlew lint           # Frontend ESLint (must pass)
```

Or full CI:

```bash
./gradlew ci
```

If any step fails, fix before updating PRD status.

### 6. Update PRD: Mark Complete

After all verification passes:

1. **Story Status Summary table:** Change Status to `Complete`
2. **Story section:** Update `| **Status** |` to `Complete`
3. **Acceptance Criteria:** Change all `[ ]` to `[x]` for criteria met
4. **Next Up:** Update to recommend the next story (check dependency graph)
5. **Progress Log:** Add entry:
   ```
   - **YYYY-MM-DD:** US-XXX complete. [Brief summary of what was implemented].
   ```
6. **Files Modified:** Append new/modified files to the cumulative list

### 7. Definition of Done Checklist

Before considering the story complete:

- [ ] All acceptance criteria met (checkboxes `[x]`)
- [ ] Tests written for new functionality
- [ ] `./gradlew backendBuild` passes
- [ ] `./gradlew backendTest` passes
- [ ] `./gradlew lint` passes
- [ ] PRD Implementation Tracking updated
- [ ] Ready for human code review

## PRD Section Reference

| Section | Purpose |
|---------|---------|
| Story Status Summary | Table of US-001..US-032 with Status column |
| Next Up | Recommended next story with dependency check |
| Progress Log | Date-stamped completion entries |
| Files Modified | Cumulative list of changed files |
| Section 6: Data Model | Entity definitions, constraints |
| Section 7: API Contracts | Endpoints, request/response formats |
| Section 9: Story Dependency Graph | Prerequisite order |
| Appendix A | Status workflow: Not Started → In Progress → Complete |

## Status Values

Use exactly: `Not Started`, `In Progress`, `Complete`

## Path Conventions

- **PRD path:** `doc/PRD-GolfComp-Backend.md` (from repo root)
- **Backend root:** `spring-golfcomp/`
- **Java package:** `com.golfcomp.api`
- **Commands:** Run from `golf-competition-app/` (repository root)
