# CLAUDE.md - Golf Competition App

> **Version:** 3.0.0 | **Last Updated:** 2026-03-17
> **Purpose:** Essential guide for AI assistants working on this codebase

---

## Project Overview

Vue 3 SPA + Spring Boot REST API for managing golf team competitions with:
- Competition management (create, switch active competition)
- Player management (with talent ratings A/B/C/D, entry fees, winnings)
- Automated team generation using snake draft algorithm
- Round/score tracking mapped to 4 courses (Parkland, Heathland, Heritage Club, Moorland)
- Leaderboards: team, individual, money (winnings-based)
- Light/dark themes

**Key Characteristics:**
- Full-stack: Vue 3 frontend + Spring Boot REST backend
- Hash-based routing for static hosting compatibility
- All state is server-side; frontend fetches via REST API
- Monorepo: Vue frontend in `vue-golfcomp/`, Spring backend in `spring-golfcomp/`

---

## Technology Stack

```json
{
  "vue": "3.5.24",
  "vue-router": "4.6.3",
  "pinia": "3.0.4",
  "axios": "1.7.0",
  "jest": "29.7.0",
  "@vue/test-utils": "2.4.6"
}
```

**Commands (from repository root):**
```bash
./gradlew build                 # Build both frontend and backend
./gradlew test                  # Run all tests
./gradlew lint                  # ESLint check
./gradlew frontendDev           # Dev server :8080
./gradlew frontendInstall       # Install npm dependencies
./gradlew showTasks             # List all Gradle tasks
./run.sh                        # Quick setup: install, lint, build, serve
```

**Commands (from vue-golfcomp/):**
```bash
npm run serve                   # Dev server :8080
npm run build                   # Production build
npm run lint                    # ESLint check
npm run lint -- --fix           # Auto-fix
npm test                        # Run all tests
npm test -- tests/teams.test.js # Run specific test
npm test -- --coverage          # Run tests with coverage
npm test -- --watch             # Watch mode for tests
```

---

## Project Structure (Monorepo)

```
golf-competition-app/
├── vue-golfcomp/              # Vue 3 frontend
│   ├── src/
│   │   ├── main.js            # App entry (createApp + createPinia + router)
│   │   ├── App.vue            # Root component
│   │   ├── router/index.js    # Hash mode router (vue.config.js: port 8080)
│   │   ├── stores/            # Pinia stores (competitions, players, teams, scores, courses, ui)
│   │   ├── services/          # ApiService, DataService, NotificationService, bootstrap.js
│   │   ├── utils/             # Validation, formatting helpers
│   │   ├── assets/            # Images and global styles
│   │   ├── components/        # layout/, shared/, admin/, scoring/
│   │   └── views/             # Route-level containers
│   ├── public/                # Static assets, index.html
│   ├── tests/                 # Jest tests
│   ├── package.json
│   ├── vue.config.js          # Vue CLI config (dev server port 8080)
│   ├── jest.config.js
│   └── babel.config.js
├── spring-golfcomp/           # Spring Boot REST API backend
│   └── src/
├── data/                      # Sample data files for import (JSON)
├── doc/                       # User guide, test plan, delivery docs
├── build.gradle               # Root Gradle orchestration
├── settings.gradle
├── gradlew / gradlew.bat      # Gradle wrapper
└── run.sh                     # Quick setup script
```

---

## Critical Architecture Patterns

### 1. Pinia Stores

All stores use `defineStore` from Pinia. Access pattern in components:
```javascript
import { usePlayersStore } from '@/stores/players';

// In setup() or <script setup>
const playersStore = usePlayersStore();
const players = computed(() => playersStore.allPlayers);

// Call actions
await playersStore.addPlayer(formData);
```

**No Vuex. No `this.$store`. No namespaced getters.**

### 2. Active Competition Context

All player/team/score/round API calls are scoped to the active competition. `ApiService.competitionId` must be set before these calls work.

`useCompetitionsStore().setActiveCompetition(comp)` sets the context and re-fetches all data:
```javascript
// ApiService scopes URLs like: /api/v1/competitions/{id}/players
// This is set automatically when user selects a competition
```

### 3. Data Flow

```
User Action → Component → Pinia Store Action → ApiService (axios) → REST API →
Store state update → Computed/getter → Component re-render
```

No localStorage persistence. All data lives on the server.

### 4. Courses vs Rounds

Courses are backend entities. The `courses` store fetches rounds from the active competition and maps them to course objects. If no rounds exist, fallback courses (hardcoded IDs) are used — scores won't persist to the backend without a `roundId`.

### 5. Component Communication

- **Parent-child:** Props down, events up
- **Cross-component:** Pinia stores for shared state
- **UI state:** `ui` store for global UI state (loading, notifications)

---

## Data Structures

### Competition Object
```javascript
{
  id: 'uuid',
  name: 'Spring Tournament 2026',
  startDate: 'ISO-8601' | null,
  endDate: 'ISO-8601' | null,
  location: 'string' | null,
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601'
}
```

### Player Object
```javascript
{
  id: 'uuid',
  name: 'John Doe',
  talentRating: 'A',        // A, B, C, or D
  entryFee: 100,
  winnings: 0,
  teamId: 'uuid' | null,    // null if unassigned
  teamName: 'string' | null,
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601'
}
```

### Team Object
```javascript
{
  id: 'uuid',
  name: 'Team Alpha',
  logoUrl: 'data:image/...' | null,  // Base64 data URL
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601'
}
```

### Score Object (frontend)
```javascript
{
  id: 'uuid',
  playerId: 'uuid',
  courseId: 'uuid',
  value: 72,
  timestamp: 'ISO-8601'
}
```

### Course Object
```javascript
{
  id: 'uuid',                // UUID from backend (or hardcoded fallback)
  name: 'Parkland',
  order: 1,
  roundId: 'uuid' | null    // null = no round scheduled yet
}
```

---

## Pinia Stores Reference

### `competitions` Store (`useCompetitionsStore`)

**Key Actions:**
- `fetchCompetitions()` - Load all competitions
- `createCompetition(data)` - Create new
- `updateCompetition({ id, updates })`
- `deleteCompetition(id)`
- `setActiveCompetition(comp)` - **Sets context + re-fetches all related data**
- `createRound(data)` - Add round to active competition
- `updateRound({ roundId, courseId, playDate })`
- `deleteRound(roundId)`

**Key Getters:**
- `allCompetitions`
- `activeCompetitionId`

### `players` Store (`usePlayersStore`)

**Key Actions:**
- `fetchPlayers()` - Load players for active competition
- `addPlayer(player)`
- `updatePlayer({ id, updates })`
- `deletePlayer(id)`
- `assignPlayerToTeam({ playerId, teamId })`
- `unassignPlayerFromTeam(playerId)`
- `unassignAllPlayers()`

**Key Getters:**
- `allPlayers`, `playerById(id)`, `playersByTeam(teamId)`
- `unassignedPlayers`, `playersByTalentRating(rating)`
- `totalEntryFees`, `totalWinnings`

### `teams` Store (`useTeamsStore`)

**Key Actions:**
- `fetchTeams()`, `addTeam(data)`, `updateTeam({ id, updates })`, `deleteTeam(id)`, `deleteAllTeams()`
- `generateTeams(numberOfTeams)` - **Snake draft algorithm**
- `uploadTeamLogo({ teamId, logoFile })` - Converts to Base64 data URL

**Snake Draft Algorithm:**
1. Sort players by talent rating (A → B → C → D)
2. Distribute round-robin with alternating direction per round

**Key Getters:**
- `allTeams`, `teamById(id)`, `teamWithPlayers(teamId)`

### `scores` Store (`useScoresStore`)

**Key Actions:**
- `fetchScores()` - Fetches scores per round from courses store
- `updateScore({ playerId, courseId, value })` - Creates or updates via API
- `deleteScore(id)`, `deletePlayerScores(playerId)`, `deleteCourseScores(courseId)` — **local only** (backend DELETE not yet implemented)

**Key Getters:**
- `scoreByPlayerAndCourse(playerId, courseId)`
- `playerTotalScore(playerId)`, `teamTotalScore(teamId)`
- `playerLeaderboard`, `teamLeaderboard`
- `playerMoneyLeaderboard`, `teamMoneyLeaderboard`
- `courseScoresByTeam(courseId)`

### `courses` Store (`useCoursesStore`)

**Actions:** `fetchCourses()` — fetches rounds for active competition, maps to course objects.

**Gotcha:** Scores require `roundId`. If `course.roundId === null`, `updateScore` will throw. A round must be created first via `competitionsStore.createRound(...)`.

**Key Getters:** `allCourses`, `courseById(id)`, `courseByName(name)`, `roundIdByCourseId(courseId)`

### `ui` Store (`useUiStore`)

**State:** `isLoading`, `notifications[]`

**Notification Types:** `success` (3s), `error` (5s), `warning` (4s), `info` (3s)

---

## ApiService

All REST calls go through `src/services/ApiService.js` (axios-based singleton):

```javascript
import ApiService from '@/services/ApiService';

// URLs — all scoped to active competition except /competitions
ApiService.competitionsUrl(id?)       // /competitions or /competitions/{id}
ApiService.playersUrl(id?)            // /competitions/{cid}/players[/{id}]
ApiService.teamsUrl(id?)              // /competitions/{cid}/teams[/{id}]
ApiService.roundsUrl(id?)             // /competitions/{cid}/rounds[/{id}]
ApiService.scoresUrl(roundId)         // /competitions/{cid}/rounds/{roundId}/scores
ApiService.leaderboardsUrl(type)      // /competitions/{cid}/leaderboards/{type}

// Methods
ApiService.get(url)
ApiService.post(url, data)
ApiService.put(url, data)
ApiService.delete(url)
```

Base URL: `/api/v1` — proxied to Spring Boot in dev.

---

## Coding Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Vue Components | PascalCase | `PlayerList.vue` |
| JS Files | camelCase | `dataService.js` |
| CSS Classes | kebab-case | `.card-header` |
| Pinia Store functions | camelCase | `addPlayer` |
| Constants | SCREAMING_SNAKE | `MAX_SCORE` |

### Vue Component Order (Options API)

1. `name`
2. `components`
3. `props`
4. `data`
5. `computed`
6. `watch`
7. `methods`
8. Lifecycle hooks

### Imports

Use `@` alias for `/src`:
```javascript
import PlayerList from '@/components/admin/PlayerList.vue'
import { usePlayersStore } from '@/stores/players'
```

---

## Theming (CSS Variables)

**Light theme (default):** `:root` variables
**Dark theme:** `body.dark-mode` variables

Toggle via `AppHeader.vue` which adds/removes `dark-mode` class to `<body>`.

**Key Variables:**
```css
--primary-color, --text-color, --background-color, --card-bg,
--header-bg, --border-color, --shadow
```

**Utility Classes:**
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- Cards: `.card`, `.card-header`, `.card-body`
- Badges: `.talent-badge`, `.talent-a/b/c/d`
- Forms: `.form-control`, `.form-group`, `.form-label`

---

## AI Assistant Guidelines

### Before Making Changes

1. **Read related files first** - Understand current implementation
2. **Check the Pinia store** - Understand state and actions
3. **Check ApiService** - Understand URL patterns
4. **Look for existing patterns** - Don't duplicate functionality

### Critical Rules

**Pinia Stores:**
- ✅ DO: Mutate `this.` state directly in actions
- ✅ DO: Call `ApiService` methods in actions
- ❌ DON'T: Use Vuex patterns (`this.$store`, namespaced getters, mutations)

```javascript
// CORRECT - Pinia action
async addPlayer(player) {
  const created = await ApiService.post(ApiService.playersUrl(), player);
  this.players.push(created);
}
```

**Reactive Data:**
- ✅ DO: Use `computed(() => store.getter)` for store data in setup
- ✅ DO: Access store properties directly in templates via store ref

**Active Competition:**
- All player/team/round/score operations require `ApiService.competitionId` to be set
- This is set by `competitionsStore.setActiveCompetition(comp)`
- If you see 404s on player/team requests, check if a competition is active

### Testing Checklist

Before finalizing changes:
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Feature works in browser with backend running
- [ ] Related features still work
- [ ] Dark mode still works

### Testing Patterns

- Use the **MockStore class pattern** established in `tests/teams.test.js`
- Focus on testing Pinia stores independently
- Test team generation algorithms thoroughly (core business logic)
- Run specific tests: `npm test -- tests/teams.test.js`
- Use watch mode during development: `npm test -- --watch`

### Common Pitfalls

1. **Component not re-rendering?** → Wrap store access in `computed()`
2. **API calls returning 404?** → Check `ApiService.competitionId` is set (active competition selected)
3. **Scores not saving?** → Course needs a `roundId` — create a round first
4. **Router not working?** → Use `<router-link>` not `<a>`
5. **Theme broken?** → Check CSS variables for both `:root` and `.dark-mode`

---

## Quick Reference

### File Shortcuts

| Component | Path |
|-----------|------|
| Competitions Store | `vue-golfcomp/src/stores/competitions.js` |
| Players Store | `vue-golfcomp/src/stores/players.js` |
| Teams Store | `vue-golfcomp/src/stores/teams.js` |
| Scores Store | `vue-golfcomp/src/stores/scores.js` |
| Courses Store | `vue-golfcomp/src/stores/courses.js` |
| API Service | `vue-golfcomp/src/services/ApiService.js` |
| Competition CRUD | `vue-golfcomp/src/components/admin/CompetitionList.vue` |
| Competition Form | `vue-golfcomp/src/components/admin/CompetitionForm.vue` |
| Round Management | `vue-golfcomp/src/components/admin/RoundList.vue` |
| Player CRUD | `vue-golfcomp/src/components/admin/PlayerList.vue` |
| Player Form | `vue-golfcomp/src/components/admin/PlayerForm.vue` |
| Player Stats | `vue-golfcomp/src/components/admin/PlayerStats.vue` |
| Team CRUD | `vue-golfcomp/src/components/admin/TeamList.vue` |
| Player Assignment | `vue-golfcomp/src/components/admin/PlayerAssignment.vue` |
| Team Balance Analyzer | `vue-golfcomp/src/components/admin/TeamBalanceAnalyzer.vue` |
| Score Entry | `vue-golfcomp/src/components/scoring/ScoreEntry.vue` |
| Course Scorecard | `vue-golfcomp/src/components/scoring/CourseScorecard.vue` |
| Player Leaderboard | `vue-golfcomp/src/components/scoring/PlayerLeaderboard.vue` |
| Team Leaderboard | `vue-golfcomp/src/components/scoring/TeamLeaderboard.vue` |
| Player Money LB | `vue-golfcomp/src/components/scoring/PlayerMoneyLeaderboard.vue` |
| Team Money LB | `vue-golfcomp/src/components/scoring/TeamMoneyLeaderboard.vue` |
| Utilities | `vue-golfcomp/src/utils/index.js` |
| Global Styles | `vue-golfcomp/src/assets/styles.css` |
| Sample Data | `data/` directory (JSON files) |
| Documentation | `doc/` directory (user guide, test plan) |

### Notification Usage

```javascript
import NotificationService from '@/services/NotificationService';

NotificationService.success('Player added!');
NotificationService.error('Failed to save');
NotificationService.warning('Check your input');
NotificationService.info('FYI...');
```

### Router Navigation

```javascript
// Programmatic
this.$router.push('/admin/players');
this.$router.push({ name: 'PlayerManagement' });

// Template
<router-link to="/admin/teams">Teams</router-link>
```

---

## Git Workflow

**Commit Format:**
```
<type>: <subject>

Types: Add, Update, Fix, Refactor, Docs, Test, Style
Example: "Add player statistics dashboard"
```

**Pre-Commit:**
- Run `npm run lint -- --fix`
- Ensure `npm test` passes
- Remove console.log() statements
- Remove commented-out code

---

## Key Takeaways

1. **Vue 3 + Pinia** — not Vue 2 + Vuex. No `this.$store`, no namespaced getters.
2. **All state is server-side** — no localStorage persistence. Pinia holds in-memory cache.
3. **Active competition context** — `ApiService.competitionId` scopes all API calls. Set via `setActiveCompetition()`.
4. **Scores need rounds** — `course.roundId` must be non-null to save scores to backend.
5. **Courses are dynamic** — fetched from backend rounds, with hardcoded fallbacks.
6. **Team generation uses snake draft** — see `teams.js`
7. **Mobile-first responsive design** — components adapt to screen size
8. **Use MockStore pattern for testing** — see `tests/teams.test.js`

**When in doubt:** Look at existing similar code in the codebase.

---

**Version:** 3.0.0 | **Maintained By:** AI Assistant (Claude)
