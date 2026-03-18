# PRD: Competition Management Frontend

> **Version:** 1.0.0 | **Date:** 2026-03-13
> **Status:** Approved for Implementation

---

## Overview

### Problem

The Spring Boot backend exposes a full REST API for managing multiple competitions, rounds, teams, players, and scores — all scoped to a competition ID. The Vue frontend is hardcoded to a single competition ("Golf Competition") created silently at startup. Users have no way to:

- Create, edit, or delete competitions
- View competition details (dates, location)
- Switch between multiple competitions
- Create or manage the rounds within a competition

### Goal

Add competition and round management UI to the Administration section, surfacing the backend capabilities that already exist. The feature must be backward-compatible (existing single-competition users see no disruption).

---

## Scope

### In Scope

- Competition CRUD (create, read, update, delete)
- Active competition selection with full data reload
- Round CRUD for the active competition
- Active competition badge in the app header
- Bootstrap update to load competitions from API

### Out of Scope

- User authentication / per-user competition ownership
- Competition status workflow (draft / published / archived)
- Copying/cloning competitions or rounds
- Bulk operations

---

## User Stories

| ID | Status | Story |
|----|--------|-------|
| CM-01 | ✅ Done | As an organiser, I want to create a named competition with optional start/end dates and location, so I can track multiple events. |
| CM-02 | ✅ Done | As an organiser, I want to see all competitions listed with their status (Upcoming / Active / Past), so I know which event is current. |
| CM-03 | ✅ Done | As an organiser, I want to edit a competition's name, dates, and location, so I can correct mistakes. |
| CM-04 | ✅ Done | As an organiser, I want to delete a competition that is not the active one, so I can clean up test data. |
| CM-05 | ✅ Done | As an organiser, I want to switch the active competition (with a confirmation prompt), so I can work on a different event without accidentally losing context. |
| CM-06 | ✅ Done | As an organiser, I want to see the active competition name in the header at all times, so I always know which event I'm working on. |
| CM-07 | ✅ Done | As an organiser, I want to add rounds to the active competition by choosing a course and play date, so I can schedule the event. |
| CM-08 | ✅ Done | As an organiser, I want to delete a round from the active competition, so I can remove incorrectly scheduled rounds. |

---

## Backend API Reference

All endpoints already exist in the Spring Boot backend.

| Method | URL | Purpose |
|--------|-----|---------|
| `GET` | `/api/v1/competitions` | List all competitions |
| `POST` | `/api/v1/competitions` | Create competition |
| `PUT` | `/api/v1/competitions/{id}` | Update competition |
| `DELETE` | `/api/v1/competitions/{id}` | Delete competition |
| `GET` | `/api/v1/competitions/{id}/rounds` | List rounds for a competition |
| `POST` | `/api/v1/competitions/{id}/rounds` | Create round |
| `DELETE` | `/api/v1/competitions/{id}/rounds/{roundId}` | Delete round |

**Create Competition request body:**
```json
{
  "name": "Summer Cup",
  "startDate": "2026-06-01",
  "endDate": "2026-08-31",
  "location": "Moorland Golf Club"
}
```

**Create Round request body:**
```json
{
  "courseId": "parkland-1",
  "playDate": "2026-06-14",
  "roundNumber": 1
}
```

---

## Technical Design

### New Files

| File | Description |
|------|-------------|
| `vue-golfcomp/src/stores/competitions.js` | Pinia store for competition and round state |
| `vue-golfcomp/src/views/CompetitionManagement.vue` | Route-level view container |
| `vue-golfcomp/src/components/admin/CompetitionList.vue` | Competition card grid with CRUD actions |
| `vue-golfcomp/src/components/admin/CompetitionForm.vue` | Create/edit modal form |
| `vue-golfcomp/src/components/admin/RoundList.vue` | Round table with add/delete for active competition |
| `vue-golfcomp/src/components/layout/CompetitionBadge.vue` | Header badge showing active competition name |

### Modified Files

| File | Change |
|------|--------|
| `vue-golfcomp/src/services/ApiService.js` | Add `competitionsUrl(id?)` URL builder |
| `vue-golfcomp/src/bootstrap.js` | Fetch competitions on init; populate `competitionsStore`; auto-create default if none exist |
| `vue-golfcomp/src/router/index.js` | Add `/admin/competitions` route and nav guard mapping |
| `vue-golfcomp/src/components/layout/AppSidebar.vue` | Add "Competitions" nav item at top of Administration section |
| `vue-golfcomp/src/components/layout/AppHeader.vue` | Embed `<CompetitionBadge />` |

### Competitions Store (`stores/competitions.js`)

Follows the existing Pinia `defineStore` pattern used in `players.js`, `teams.js`, etc.

```
State:
  competitions: []          // all competitions from API
  activeCompetition: null   // currently selected competition object

Getters:
  allCompetitions           // sorted by createdAt desc
  activeCompetition
  activeCompetitionId       // convenience → ApiService.competitionId

Actions:
  fetchCompetitions()       → GET /api/v1/competitions
  createCompetition(data)   → POST /api/v1/competitions → append to state
  updateCompetition(comp)   → PUT /api/v1/competitions/{id} → update in state
  deleteCompetition(id)     → DELETE /api/v1/competitions/{id} → remove from state
  setActiveCompetition(comp)→ update state + ApiService.competitionId
                              + re-fetch players, teams, courses, scores
  fetchRounds()             → GET /api/v1/competitions/{activeId}/rounds
  createRound(data)         → POST /api/v1/competitions/{activeId}/rounds
  deleteRound(roundId)      → DELETE /api/v1/competitions/{activeId}/rounds/{roundId}
```

`setActiveCompetition` re-loads data in the same dependency order as `bootstrap.js`:
1. `coursesStore.fetchCourses()` (includes round mapping)
2. `playersStore.fetchPlayers()` + `teamsStore.fetchTeams()` in parallel
3. `scoresStore.fetchScores()` (depends on round IDs from step 1)

### Bootstrap Changes (`bootstrap.js`)

Current behaviour (auto-create "Golf Competition") is preserved as a fallback:

```javascript
// New step before existing round-setup logic:
const competitions = await ApiService.get(ApiService.competitionsUrl());
let competition;
if (competitions.length === 0) {
  // Existing logic: create default competition + 4 rounds
  competition = await ApiService.post(ApiService.competitionsUrl(), {
    name: 'Golf Competition',
    startDate: today,
    endDate: oneWeekLater,
  });
  competitionsStore.competitions = [competition];
  // ... existing round creation code ...
} else {
  competition = competitions[0]; // use most recently created
  competitionsStore.competitions = competitions;
}
competitionsStore.activeCompetition = competition;
ApiService.competitionId = competition.id;
// Remaining bootstrap unchanged
```

### Router

```javascript
{
  path: '/admin/competitions',
  name: 'CompetitionManagement',
  component: () => import('@/views/CompetitionManagement.vue'),
}
```

Nav guard (`router.beforeEach`) additions:
- Path starts with `/admin/competitions` → `activeSection: 'administration'`, `activeSidebarItem: 'competitions'`

---

## UI Specification

### Layout: Competition Management Page (`/admin/competitions`)

```
┌──────────────────────────────────────────────────────────┐
│ AppHeader                    [🏆 Summer Cup ▸]   [Dark]  │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar       │ Competition Management                    │
│               │                                          │
│ Administration│   ┌────────────────────────────────────┐ │
│  ● Competitions   │ 🏆 Summer Cup            ACTIVE    │ │
│    Players    │   │ Jun 1, 2026 – Aug 31, 2026         │ │
│    Teams      │   │ Moorland Golf Club                 │ │
│               │   │                    [✏ Edit] [🗑]  │ │
│ Scoring       │   └────────────────────────────────────┘ │
│    Parkland   │   ┌────────────────────────────────────┐ │
│    ...        │   │ Winter League                      │ │
│               │   │ Dec 1, 2026 – Feb 28, 2027         │ │
│ Leaderboards  │   │ Heritage Club                      │ │
│    Points     │   │ [Set Active]        [✏ Edit] [🗑]  │ │
│    Money      │   └────────────────────────────────────┘ │
│               │                                          │
│               │   [+ New Competition]                    │
│               │                                          │
│               │ ──────────────────────────────────────   │
│               │ Rounds — Summer Cup                      │
│               │                                          │
│               │  #   Course        Date       Actions    │
│               │  1   Parkland      Jun 14     [🗑]       │
│               │  2   Heathland     Jul 12     [🗑]       │
│               │  ┌─────────────┬─────────────┬────────┐ │
│               │  │ [Course ▼]  │ [Date     ] │ [Add]  │ │
│               │  └─────────────┴─────────────┴────────┘ │
└───────────────┴──────────────────────────────────────────┘
```

### Competition Card

Each card displays:
- Competition name (heading)
- Date range (if dates provided; omitted if null)
- Location (if provided; omitted if null)
- **Status badge:** Upcoming (start date in future) / Active (within date range) / Past (end date past) / No Dates
- **Active competition:** highlighted with `--primary-color` border; **ACTIVE** badge; no "Set Active" button
- **Non-active competition:** "Set Active" button + Edit + Delete
- Delete button disabled (greyed out) if competition is currently active

### New Competition Form (Modal)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | Yes | Non-empty |
| Start Date | date | No | — |
| End Date | date | No | ≥ Start Date if both provided |
| Location | text | No | — |

Same modal pattern and CSS as `TeamForm.vue`. Cancel/Save buttons.

### Switch Competition Dialog

Triggered when user clicks "Set Active" on a non-active competition:

```
╔══════════════════════════════════════╗
║  Switch Competition?                 ║
║                                      ║
║  Switch to "Winter League"?          ║
║  All data will reload for this       ║
║  competition.                        ║
║                                      ║
║  [Cancel]        [Switch Competition]║
╚══════════════════════════════════════╝
```

On confirm: show global loading overlay → re-fetch all stores → dismiss overlay. Same pattern as bootstrap loading.

### Round Table (inline)

- Shown only when an active competition exists
- Separated from competition list by a horizontal rule
- Section heading: `Rounds — [active competition name]`
- Column widths adjust to content; table scrolls horizontally on mobile (<768px)
- Add-round row always visible at bottom of table
- Course dropdown populated from `coursesStore.allCourses` (4 static courses)
- Round number auto-increments (max existing + 1), editable
- After add/delete: refresh `coursesStore` (it maintains `roundId` ↔ `courseId` mapping used by score entry)

### Competition Badge (Header)

- Placed in `AppHeader` right-side, before the dark-mode toggle
- Links to `/admin/competitions`
- Text: `🏆 [competition name]` truncated to 20 chars with ellipsis
- Fallback text: `No Competition` (shown only if bootstrap failed)
- Styled as a subtle pill/chip using existing header CSS variables

### Sidebar

"Competitions" added as the first item under Administration:

```
Administration
  🏆 Competitions   ← new (first)
  👤 Players
  👥 Teams
```

---

## State & Data Flow

```
bootstrap.js
  └─ fetchCompetitions() → competitionsStore.competitions
  └─ setActiveCompetition(first) → ApiService.competitionId
  └─ existing: fetchCourses / fetchPlayers / fetchTeams / fetchScores

User clicks "Set Active"
  └─ SwitchDialog confirms
  └─ competitionsStore.setActiveCompetition(comp)
       ├─ ApiService.competitionId = comp.id
       ├─ uiStore.setLoading(true)
       ├─ coursesStore.fetchCourses()
       ├─ playersStore.fetchPlayers() + teamsStore.fetchTeams()  [parallel]
       ├─ scoresStore.fetchScores()
       └─ uiStore.setLoading(false)
```

---

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC-01 | App bootstraps as before; existing "Golf Competition" is selected automatically if no other competitions exist |
| AC-02 | `/admin/competitions` route renders the Competition Management page |
| AC-03 | Sidebar shows "Competitions" as first item under Administration |
| AC-04 | Header displays active competition name; clicking navigates to `/admin/competitions` |
| AC-05 | User can create a competition with name only (dates/location optional) |
| AC-06 | User can create a competition with all fields populated |
| AC-07 | User can edit any competition's name, dates, and location |
| AC-08 | User can delete any non-active competition; active competition delete button is disabled |
| AC-09 | Clicking "Set Active" shows a confirmation dialog |
| AC-10 | Cancelling the dialog makes no changes |
| AC-11 | Confirming the dialog shows loading overlay, reloads all data, updates header badge |
| AC-12 | After switching, Players/Teams/Scoring/Leaderboard views show data for the new competition |
| AC-13 | User can add a round by selecting a course, date, and round number |
| AC-14 | User can delete a round; scoring sidebar updates accordingly |
| AC-15 | All new components support dark mode (use CSS variables) |
| AC-16 | All new components are responsive at <768px breakpoint |
| AC-17 | `npm run lint` passes |
| AC-18 | `npm test` passes (no regressions to existing tests) |
| AC-19 | `npm run build` succeeds |

---

## Files Reference

| Component | Path |
|-----------|------|
| Competitions Store | `vue-golfcomp/src/stores/competitions.js` |
| Competition Management View | `vue-golfcomp/src/views/CompetitionManagement.vue` |
| Competition List | `vue-golfcomp/src/components/admin/CompetitionList.vue` |
| Competition Form | `vue-golfcomp/src/components/admin/CompetitionForm.vue` |
| Round List | `vue-golfcomp/src/components/admin/RoundList.vue` |
| Competition Badge | `vue-golfcomp/src/components/layout/CompetitionBadge.vue` |
| API Service | `vue-golfcomp/src/services/ApiService.js` |
| Bootstrap | `vue-golfcomp/src/bootstrap.js` |
| Router | `vue-golfcomp/src/router/index.js` |
| Sidebar | `vue-golfcomp/src/components/layout/AppSidebar.vue` |
| Header | `vue-golfcomp/src/components/layout/AppHeader.vue` |
| Existing pattern reference | `vue-golfcomp/src/components/admin/TeamList.vue` |
| Global Styles | `vue-golfcomp/src/assets/styles.css` |
