# CLAUDE.md - Golf Competition App

> **Version:** 2.0.0 | **Last Updated:** 2026-01-10
> **Purpose:** Essential guide for AI assistants working on this codebase

---

## Project Overview

Vue.js 2 client-side SPA for managing golf team competitions with:
- Player management (with talent ratings A/B/C/D)
- Automated team generation using snake draft algorithm
- Score tracking across 4 courses (Parkland, Heathland, Heritage Club, Moorland)
- Leaderboards (team and individual)
- localStorage persistence, import/export, light/dark themes

**Key Characteristics:**
- No backend - 100% client-side with localStorage
- Hash-based routing for static hosting
- Offline-capable after initial load

---

## Technology Stack

```json
{
  "vue": "2.6.14",          // Options API
  "vue-router": "3.5.3",    // Hash mode
  "vuex": "3.6.2",          // Namespaced modules
  "uuid": "9.0.0",
  "jest": "29.7.0",
  "@vue/test-utils": "2.4.6"
}
```

**Commands:**
```bash
npm run serve           # Dev server :8080
npm run build          # Production build
npm run lint           # ESLint check
npm run lint -- --fix  # Auto-fix
npm test               # Run tests
```

---

## Project Structure

```
src/
├── main.js                    # App entry
├── App.vue                    # Root component
├── router/index.js            # Hash mode router
├── store/
│   ├── index.js               # Root store + persistence plugin
│   └── modules/
│       ├── players.js         # Player CRUD
│       ├── teams.js           # Team CRUD + auto-generation
│       ├── scores.js          # Scoring + leaderboard logic
│       ├── courses.js         # Static course data
│       └── ui.js              # Theme, notifications, nav state
├── services/
│   ├── DataService.js         # Singleton store abstraction
│   └── NotificationService.js # Singleton toast notifications
├── utils/index.js             # Validation, formatting helpers
├── components/
│   ├── layout/                # AppHeader, AppSidebar
│   ├── shared/                # Notifications, ConfirmationDialog
│   ├── admin/                 # Player/Team CRUD components
│   └── scoring/               # ScoreEntry, Leaderboards
└── views/                     # Route-level containers
```

---

## Critical Architecture Patterns

### 1. Vuex Store (Namespaced Modules)

All modules use `namespaced: true`. Access pattern:
```javascript
// In components
computed: {
  players() {
    return this.$store.getters['players/allPlayers'];
  }
},
methods: {
  async addPlayer() {
    await this.$store.dispatch('players/addPlayer', this.formData);
  }
}
```

### 2. localStorage Persistence Plugin

**CRITICAL:** Mutations must start with module name (`players/`, `teams/`, `scores/`, `courses/`) to trigger persistence.

```javascript
// /src/store/index.js
const persistencePlugin = (store) => {
  store.subscribe((mutation) => {
    if (mutation.type.startsWith('players/') ||
        mutation.type.startsWith('teams/') ||
        mutation.type.startsWith('scores/') ||
        mutation.type.startsWith('courses/')) {
      // Auto-saves to localStorage
      localStorage.setItem('golf-competition-app', JSON.stringify(state));
    }
  });
};
```

### 3. Data Flow

```
User Action → Component → Store Action → Mutation → State Update →
Persistence Plugin → localStorage → Getter → Component Re-render
```

---

## Data Structures

### Player Object
```javascript
{
  id: 'uuid',
  name: 'John Doe',
  talentRating: 'A',        // A, B, C, or D
  entryFee: 100,
  winnings: 0,
  teamId: 'uuid' | null,    // null if unassigned
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

### Score Object
```javascript
{
  id: 'uuid',
  playerId: 'uuid',
  courseId: 'uuid',
  value: 72,               // Range: 18-150
  timestamp: 'ISO-8601'
}
```

### Course Object (Static)
```javascript
{
  id: 'parkland-1',        // Format: coursename-order
  name: 'Parkland',
  order: 1
}
```

---

## Vuex Modules Reference

### `players` Module

**Key Actions:**
- `addPlayer({ commit }, playerData)` - Creates with UUID
- `updatePlayer({ commit }, player)` - Updates existing
- `deletePlayer({ commit }, playerId)` - Removes player
- `assignPlayerToTeam({ commit }, { playerId, teamId })`
- `unassignPlayerFromTeam({ commit }, playerId)`
- `unassignAllPlayers({ commit })`

**Key Getters:**
- `allPlayers(state)` - All players array
- `playerById: (state) => (id)`
- `playersByTeam: (state) => (teamId)`
- `unassignedPlayers(state)` - Players with teamId === null
- `playersByTalent: (state) => (rating)` - Filter by A/B/C/D

### `teams` Module

**Key Actions:**
- `addTeam({ commit }, teamData)`
- `updateTeam({ commit }, team)`
- `deleteTeam({ commit, dispatch }, teamId)` - Also unassigns players
- `deleteAllTeams({ commit, dispatch })`
- `generateTeams({ commit, dispatch }, numberOfTeams)` - **Snake draft algorithm**
- `uploadTeamLogo({ commit }, { teamId, logoFile })` - Converts to data URL

**Snake Draft Algorithm:**
1. Sort players by talent rating (A → B → C → D)
2. Distribute round-robin with alternating direction:
   - Round 1: Team1, Team2, Team3, Team4
   - Round 2: Team4, Team3, Team2, Team1 (reverse)
   - Round 3: Team1, Team2, Team3, Team4
   - etc.

**Key Getters:**
- `allTeams(state)`
- `teamById: (state) => (id)`
- `teamWithPlayers: (state, getters, rootState, rootGetters) => (teamId)` - Team + players array

### `scores` Module

**Key Actions:**
- `updateScore({ commit }, { playerId, courseId, value })` - Creates or updates
- `deleteScore({ commit }, scoreId)`
- `deleteScoresByPlayer({ commit }, playerId)`
- `deleteAllScores({ commit })`

**Key Getters:**
- `scoreByPlayerAndCourse: (state) => (playerId, courseId)`
- `playerTotalScore: (state, getters) => (playerId)` - Sum all courses
- `teamTotalScore: (state, getters, rootState, rootGetters) => (teamId)` - Sum all team members
- `playerLeaderboard(state, getters, rootState, rootGetters)` - Computed rankings
- `teamLeaderboard(state, getters, rootState, rootGetters)` - Team rankings
- `courseScoresByTeam: (state, getters, rootState, rootGetters) => (courseId)` - Scorecard view

**Score Validation:** 18-150 range (validated in `/src/utils/index.js`)

### `courses` Module

**State (Static - Read-only):**
```javascript
courses: [
  { id: 'parkland-1', name: 'Parkland', order: 1 },
  { id: 'heathland-2', name: 'Heathland', order: 2 },
  { id: 'heritage-3', name: 'Heritage Club', order: 3 },
  { id: 'moorland-4', name: 'Moorland', order: 4 }
]
```

**Getters:** `allCourses`, `courseById`, `courseByName`, `courseCount`

### `ui` Module

**State:**
```javascript
{
  activeSection: 'administration',     // administration | scoring | leaderboards
  activeSidebarItem: 'players',
  isLoading: false,
  notifications: []                    // { id, type, message, timeout }
}
```

**Notification Types:** `success` (3s), `error` (5s), `warning` (4s), `info` (3s)

---

## Coding Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Vue Components | PascalCase | `PlayerList.vue` |
| JS Files | camelCase | `dataService.js` |
| CSS Classes | kebab-case | `.card-header` |
| Vuex Actions | camelCase | `addPlayer` |
| Vuex Mutations | SCREAMING_SNAKE | `ADD_PLAYER` |
| Constants | SCREAMING_SNAKE | `MAX_SCORE` |

### Vue Component Order

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
2. **Check Vuex module** - Understand state structure
3. **Look for existing patterns** - Don't duplicate functionality
4. **Test persistence** - Ensure localStorage still works

### Critical Rules

**Vuex Mutations:**
- ✅ DO: Direct state mutations only
- ❌ DON'T: Mutate parameters or call other functions
- ❌ DON'T: Generate UUIDs in mutations (do it in actions)

```javascript
// CORRECT
mutations: {
  ADD_PLAYER(state, player) {
    state.players.push(player);
  }
}

// WRONG - uuid() should be in action
mutations: {
  ADD_PLAYER(state, playerData) {
    state.players.push({ ...playerData, id: uuid() });
  }
}
```

**Reactive Data:**
- ✅ DO: Use `computed` for store data
- ❌ DON'T: Assign store data in `data()`

```javascript
// CORRECT
computed: {
  players() {
    return this.$store.getters['players/allPlayers'];
  }
}

// WRONG - not reactive
data() {
  return {
    players: this.$store.state.players.players
  };
}
```

**Persistence:**
- Mutation names MUST start with module prefix: `players/`, `teams/`, `scores/`, `courses/`
- Test that changes persist after page reload
- Debug: Check localStorage in browser DevTools

### Testing Checklist

Before finalizing changes:
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Feature works in browser
- [ ] Data persists after page reload
- [ ] Related features still work
- [ ] Dark mode still works

### Common Pitfalls

1. **Component not re-rendering?** → Use `computed` not `data()`
2. **State not persisting?** → Check mutation name starts with module prefix
3. **Router not working?** → Use `<router-link>` not `<a>`
4. **Theme broken?** → Check CSS variables for both `:root` and `.dark-mode`

---

## Quick Reference

### File Shortcuts

| Component | Path |
|-----------|------|
| Players Store | `/src/store/modules/players.js` |
| Teams Store | `/src/store/modules/teams.js` |
| Scores Store | `/src/store/modules/scores.js` |
| Player CRUD | `/src/components/admin/PlayerList.vue` |
| Team CRUD | `/src/components/admin/TeamList.vue` |
| Score Entry | `/src/components/scoring/ScoreEntry.vue` |
| Utilities | `/src/utils/index.js` |
| Styles | `/src/assets/styles.css` |

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

### localStorage Debug

```javascript
// Browser console
localStorage.removeItem('golf-competition-app');  // Clear
console.log(JSON.parse(localStorage.getItem('golf-competition-app')));  // Inspect
localStorage.clear();  // Reset all
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

1. **Always use namespaced Vuex modules** - `this.$store.getters['module/getter']`
2. **Mutations must start with module name** - or they won't persist to localStorage
3. **Use computed for reactive store data** - never assign in `data()`
4. **Score range is 18-150** - validated in utils
5. **Courses are static/read-only** - no mutations
6. **Team generation uses snake draft** - see `teams.js:72-93`
7. **Test persistence after changes** - reload page and check data

**When in doubt:** Look at existing similar code in the codebase.

---

**Version:** 2.0.0 | **Maintained By:** AI Assistant (Claude)
