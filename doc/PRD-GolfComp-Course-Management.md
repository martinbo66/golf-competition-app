# PRD: Course Management — Golf Competition App

> **Version:** 1.0.0 | **Created:** 2026-03-18
> **Status:** In Progress
> **Purpose:** Implementation guide for an LLM agent adding course CRUD to the admin UI

---

## Background & Current State

Courses are global entities (not competition-scoped) stored in the `courses` table. They are referenced by rounds, which link a course to a competition and a round number.

**What exists today:**
- Backend: Full CRUD API at `GET/POST /api/v1/courses` and `GET/PUT/DELETE /api/v1/courses/{id}` (`CourseController`, `CourseService`, `CourseRepository`)
- Database: 4 seeded courses with fixed UUIDs (Parkland, Heathland, Heritage Club, Moorland)
- Frontend: Courses are **never fetched directly** — all course data arrives via the rounds endpoint (`GET /api/v1/competitions/{cid}/rounds`), where each `RoundResponse` embeds a nested `CourseResponse`
- `courses.js` Pinia store manages course state derived from rounds, with 4 hardcoded UUID fallbacks used when no rounds exist
- `RoundList.vue` hardcodes a `COURSE_OPTIONS` array with the same 4 UUIDs — a separate sync point that must be replaced

**Problems to solve:**
1. No UI to create or delete courses — only the 4 seeded ones are usable
2. Three sync points share the same 4 hardcoded UUIDs and break silently if they diverge:
   - `courses.js` → `FALLBACK_COURSES`
   - `RoundList.vue` → `COURSE_OPTIONS`
   - `007-seed-courses.xml` → seeded rows
3. Course fields `facility` and `location` exist in the schema but are unused everywhere

---

## Scope: Phase 1 (this PRD)

Manual course name entry only. API-based course search is deferred to Phase 2.

**In scope:**
- View all courses in an admin list page
- Add a course by name (with optional facility and location)
- Edit a course name/facility/location
- Delete a course (blocked if the course is referenced by any round)
- Replace hardcoded `COURSE_OPTIONS` in `RoundList.vue` with dynamic course list from store
- Replace hardcoded `FALLBACK_COURSES` in `courses.js` with a real API call on app init

**Out of scope (Phase 2):**
- Searching an external golf course API
- Uploading scorecard images
- Course reordering / display order field

---

## Course Data Model

The backend entity and API already exist — no backend changes are needed for Phase 1.

```
Course {
  id:        UUID       (generated, read-only)
  name:      string     (required, max 100 chars)
  facility:  string     (optional, max 255 chars — club/venue name)
  location:  string     (optional, max 255 chars — address or region)
  createdAt: ISO-8601
  updatedAt: ISO-8601
}
```

Backend constraint: `DELETE /api/v1/courses/{id}` will return `409 Conflict` (FK violation from rounds table) if the course is referenced by any round. The UI must handle this gracefully.

---

## User Stories

| ID | Story | Status |
|----|-------|--------|
| CRM-001 | As an admin, I can view a list of all available courses | ✅ Done |
| CRM-002 | As an admin, I can add a new course by name (facility and location optional) | ✅ Done |
| CRM-003 | As an admin, I can edit a course's name, facility, and location | ✅ Done |
| CRM-004 | As an admin, I can delete a course that is not assigned to any round | ✅ Done |
| CRM-005 | Course options in Round management load dynamically from the courses store | ✅ Done |
| CRM-006 | The app fetches courses from the backend API on init instead of using hardcoded fallbacks | ✅ Done |

---

## Implementation Plan

### Step 1 — ApiService: add `coursesUrl()` method

**File:** `vue-golfcomp/src/services/ApiService.js`

Add a URL helper for the standalone courses endpoint (not competition-scoped):

```javascript
coursesUrl(id) {
  return id ? `${this.baseUrl}/courses/${id}` : `${this.baseUrl}/courses`;
}
```

---

### Step 2 — Courses Store: add CRUD actions and init fetch

**File:** `vue-golfcomp/src/stores/courses.js`

**Changes:**
1. Add `fetchAllCourses()` action — calls `GET /api/v1/courses`, stores the result in a new `allCoursesCache` state array. This is the global pool of available courses, independent of any active competition.
2. Add `createCourse(data)` action — `POST /api/v1/courses`, pushes result to `allCoursesCache`.
3. Add `updateCourse({ id, updates })` action — `PUT /api/v1/courses/{id}`, updates the matching entry in `allCoursesCache`.
4. Add `deleteCourse(id)` action — `DELETE /api/v1/courses/{id}`, removes from `allCoursesCache`. Catches and re-throws 409 errors with a user-readable message.
5. Add getter `availableCourses` — returns `allCoursesCache` sorted by name.
6. Keep existing `fetchCourses()` (which fetches competition-scoped rounds) unchanged — it drives the score-entry flow.
7. Replace the 4-entry `FALLBACK_COURSES` constant: when `fetchCourses()` gets no rounds, fall back to `availableCourses` (the cached global list) instead of hardcoded UUIDs. Keep the hardcoded fallback only as a last resort when even the API call fails.

**New state shape additions:**
```javascript
allCoursesCache: [],   // Global course pool from /api/v1/courses
```

---

### Step 3 — Bootstrap: load courses on app init

**File:** `vue-golfcomp/src/services/bootstrap.js`

Call `coursesStore.fetchAllCourses()` during app bootstrap (alongside existing competition fetch), so the global course list is available before any competition is selected.

---

### Step 4 — RoundList.vue: replace hardcoded COURSE_OPTIONS

**File:** `vue-golfcomp/src/components/admin/RoundList.vue`

**Changes:**
1. Remove the hardcoded `COURSE_OPTIONS` constant (lines ~164–169).
2. Import and use `useCoursesStore()`.
3. Replace the `<select>` options with a `v-for` over `coursesStore.availableCourses`.
4. Display both `name` and `facility` (if present) in the option label — e.g., `"Parkland"` or `"Parkland — Royal Golf Club"`.

---

### Step 5 — CourseList.vue component

**File:** `vue-golfcomp/src/components/admin/CourseList.vue`

New component following the same pattern as `PlayerList.vue`. Responsibilities:
- Display all courses in a table: Name, Facility, Location, Actions (Edit / Delete)
- "Add Course" button opens inline form (or modal — match existing pattern)
- Delete button: disabled (with tooltip) if the course is in use by any round in the active competition; shows confirmation dialog otherwise
- On delete 409 from backend: show error notification "This course is used by one or more rounds and cannot be deleted"
- Empty state: "No courses yet. Add your first course below."

**Table columns:**
| Name | Facility | Location | Actions |
|------|----------|----------|---------|

**Delete safety check:** Before calling `deleteCourse`, check `coursesStore.rounds` to see if any round references this course ID. If yes, show an inline warning rather than hitting the backend.

---

### Step 6 — CourseForm.vue component

**File:** `vue-golfcomp/src/components/admin/CourseForm.vue`

Inline add/edit form (same UX as `PlayerForm.vue`). Fields:
- **Name** (required, max 100 chars) — text input
- **Facility** (optional, max 255 chars) — text input, placeholder "Club or venue name"
- **Location** (optional, max 255 chars) — text input, placeholder "City, region, or address"

Validation: name must be non-empty and unique among existing courses (client-side check against store).

Emits: `@saved`, `@cancel`

---

### Step 7 — Router: add Course Management route

**File:** `vue-golfcomp/src/router/index.js`

Add route:
```javascript
{
  path: '/admin/courses',
  name: 'CourseManagement',
  component: () => import('@/views/CourseManagementView.vue')
}
```

---

### Step 8 — CourseManagementView.vue

**File:** `vue-golfcomp/src/views/CourseManagementView.vue`

Thin view wrapper (matches pattern of `PlayerManagementView.vue`):
```vue
<template>
  <div class="view-container">
    <CourseList />
  </div>
</template>
```

---

### Step 9 — Navigation: add Courses link

**File:** `vue-golfcomp/src/components/layout/AppSidebar.vue` (or wherever admin nav links live)

Add a "Courses" navigation item under the Administration section, between Competitions and Players (or at the end of the admin group — match existing ordering conventions).

---

## File Change Summary

| File | Change Type |
|------|-------------|
| `vue-golfcomp/src/services/ApiService.js` | Modify — add `coursesUrl()` |
| `vue-golfcomp/src/stores/courses.js` | Modify — add CRUD actions, `allCoursesCache`, `availableCourses` getter |
| `vue-golfcomp/src/services/bootstrap.js` | Modify — call `fetchAllCourses()` on init |
| `vue-golfcomp/src/components/admin/RoundList.vue` | Modify — replace hardcoded COURSE_OPTIONS |
| `vue-golfcomp/src/components/admin/CourseList.vue` | Create |
| `vue-golfcomp/src/components/admin/CourseForm.vue` | Create |
| `vue-golfcomp/src/views/CourseManagementView.vue` | Create |
| `vue-golfcomp/src/router/index.js` | Modify — add `/admin/courses` route |
| `vue-golfcomp/src/components/layout/AppSidebar.vue` | Modify — add nav link |

**Backend: no changes required.** `CourseController`, `CourseService`, and migrations are complete.

---

## Constraints & Gotchas

1. **No competition scope for courses** — `GET /api/v1/courses` is NOT under `/competitions/{id}/`. Don't use `ApiService.competitionId` in the courses URL.
2. **Delete constraint** — The `courses` → `rounds` FK is `ON DELETE RESTRICT`. A 409/500 from the delete endpoint means the course is in use. Catch this and show a friendly message.
3. **Rounds still use `CourseResponse` embedded in `RoundResponse`** — do not change the round-fetching flow. `fetchCourses()` (competition-scoped) must continue to work as before.
4. **Seeded UUIDs** — The 4 seeded courses will remain in the database and are valid. After CRM-006 is done, the frontend fallback UUIDs in `FALLBACK_COURSES` can be removed because the real UUIDs come from the API.
5. **Dark mode** — All new components must use CSS variables (`--card-bg`, `--text-color`, etc.) — no hardcoded colors.
6. **Existing tests** — `courses.js` store changes may affect existing tests. Update tests in `vue-golfcomp/tests/` as needed.

---

## Acceptance Criteria

- [ ] Admin can navigate to Courses page via sidebar
- [ ] All existing courses are listed with name, facility, and location
- [ ] Admin can add a course with only a name; save succeeds and course appears in list
- [ ] Admin can add a course with name + facility + location
- [ ] Admin can edit any field of an existing course
- [ ] Admin can delete a course not referenced by any round
- [ ] Deleting a course in use shows a clear error message and does not remove the course
- [ ] Round creation/editing (in RoundList) shows the dynamic course list, not 4 hardcoded names
- [ ] New courses added via CourseList immediately appear as options in RoundList
- [ ] App passes `npm run lint` with no errors
- [ ] App passes `npm test` with no regressions
- [ ] Dark mode renders correctly for all new components

---

## Phase 2 (Future — Out of Scope)

| ID | Story |
|----|-------|
| CRM-101 | As an admin, I can search for courses by name via an external golf API |
| CRM-102 | Search results auto-populate facility and location fields |
| CRM-103 | Scorecard image upload and display per course |
| CRM-104 | Course display-order field for controlling sort in scorecards view |
