---
name: implement-golfcomp-prd-story
description: Implements a user story from any PRD file in the doc/ folder (PRD-*.md), updates PRD status for session tracking, adds tests for new functionality, and ensures tests and linting pass. Use when implementing user stories for the golf competition app or when the user asks to implement a PRD story.
---

# Implement Golf Competition PRD User Story

## Overview

Implements a single user story from any PRD file in the `doc/` folder (files starting with `PRD-`), updating the PRD for cross-session tracking and ensuring all acceptance criteria, tests, and linting pass.

## Workflow

### 0. Select PRD File

1. List all PRD files in `doc/` folder: `doc/PRD-*.md`
2. If user specified a PRD file or story ID, use that PRD
3. If multiple PRDs exist and user didn't specify:
   - Show available PRD files
   - Ask user which PRD to work with
4. Common PRD files:
   - `doc/PRD-GolfComp-Backend.md` - Backend API stories
   - `doc/PRD-GolfComp-Frontend-Integration.md` - Frontend integration stories

### 1. Select Story

1. Read the selected PRD file's Implementation Tracking section
2. Use **Next Up** or **Story Status Summary** to pick the next story
3. Verify prerequisites: all prerequisite stories must be **Complete**
4. If user specified a story (e.g., US-002, FI-001), use that one

### 2. Update PRD: Mark In Progress

Before implementing, update the PRD:

- **Story Status Summary table:** Change the story's Status from `Not Started` to `In Progress`
- **Story section:** Update the story's `| **Status** |` attribute to `In Progress`
- **Acceptance Criteria:** Leave checkboxes as `[ ]` until done

### 3. Implement

1. Read the full story section (Description, Prerequisites, Acceptance Criteria, Agent Instructions)
2. Follow **Files to Create/Modify** exactly
3. Follow **Constraints** and **Hints** in the story
4. Reference relevant sections in the PRD:
   - **Backend PRD:** Data Model (Section 6), API Contracts (Section 7)
   - **Frontend PRD:** Component specifications, integration requirements
5. Note the base path for files (varies by PRD):
   - Backend stories: Files relative to `spring-golfcomp/`
   - Frontend stories: Files relative to `vue-golfcomp/`

### 4. Add Tests

- **Every story** requires tests for new functionality
- Use story's **Testing Requirements** section for location
- **Backend tests:**
  - Default: `spring-golfcomp/src/test/java/com/golfcomp/api/` — use `unit/` or `integration/` subpackages
  - Test types:
    - **Entities:** Repository tests or entity validation tests
    - **Repositories:** Integration tests with `@DataJpaTest`
    - **Services:** Unit tests with Mockito
    - **Controllers:** `@WebMvcTest` or integration tests
- **Frontend tests:**
  - Default: `vue-golfcomp/tests/`
  - Test types:
    - **Components:** Vue Test Utils with Jest
    - **Stores:** Vuex/Pinia store unit tests
    - **Services:** Service layer unit tests
    - **Integration:** End-to-end component tests
- Ensure new code paths are covered

### 5. Verify

Run from repository root (`golf-competition-app/`):

**For Backend stories:**
```bash
./gradlew backendBuild   # Compiles backend
./gradlew backendTest    # Backend tests
./gradlew lint           # Frontend ESLint (must pass)
```

**For Frontend stories:**
```bash
./gradlew frontendBuild  # Compiles frontend
./gradlew test           # All tests (frontend + backend)
./gradlew lint           # Frontend ESLint (must pass)
```

**Full CI (all stories):**
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
- [ ] Build passes (`./gradlew backendBuild` or `./gradlew frontendBuild`)
- [ ] Tests pass (`./gradlew backendTest` or `./gradlew test`)
- [ ] `./gradlew lint` passes
- [ ] PRD Implementation Tracking updated
- [ ] Ready for human code review

## PRD Section Reference

Common sections across all PRD files:

| Section | Purpose |
|---------|---------|
| Story Status Summary | Table of story IDs (US-XXX, FI-XXX, etc.) with Status column |
| Next Up | Recommended next story with dependency check |
| Progress Log | Date-stamped completion entries |
| Files Modified | Cumulative list of changed files |
| Story Dependency Graph | Prerequisite order |
| Appendix A | Status workflow: Not Started → In Progress → Complete |

PRD-specific sections:

**Backend PRD (`PRD-GolfComp-Backend.md`):**
- Section 6: Data Model - Entity definitions, constraints
- Section 7: API Contracts - Endpoints, request/response formats

**Frontend Integration PRD (`PRD-GolfComp-Frontend-Integration.md`):**
- Component specifications
- Integration requirements
- API client patterns

## Status Values

Use exactly: `Not Started`, `In Progress`, `Complete`

## Path Conventions

- **PRD files:** `doc/PRD-*.md` (from repo root)
  - Backend: `doc/PRD-GolfComp-Backend.md`
  - Frontend: `doc/PRD-GolfComp-Frontend-Integration.md`
- **Backend root:** `spring-golfcomp/`
  - Java package: `com.golfcomp.api`
- **Frontend root:** `vue-golfcomp/`
  - Source: `vue-golfcomp/src/`
  - Tests: `vue-golfcomp/tests/`
- **Commands:** Run from `golf-competition-app/` (repository root)
