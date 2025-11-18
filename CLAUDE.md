# CLAUDE.md - AI Assistant Guide for Golf Competition App

> **Last Updated:** 2025-11-18
> **Version:** 1.1.0
> **Purpose:** Comprehensive guide for AI assistants working on this codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Key Architectural Patterns](#key-architectural-patterns)
5. [Development Workflow](#development-workflow)
6. [Coding Conventions](#coding-conventions)
7. [State Management (Vuex)](#state-management-vuex)
8. [Component Architecture](#component-architecture)
9. [Styling Guidelines](#styling-guidelines)
10. [Testing Strategy](#testing-strategy)
11. [Git Workflow](#git-workflow)
12. [Common Development Tasks](#common-development-tasks)
13. [Troubleshooting](#troubleshooting)
14. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### What This Application Does

The **Golf Team Competition App** is a client-side Vue.js 2 application for managing golf team competitions. It provides complete functionality for:

- **Player Management**: Add, edit, delete players with talent ratings (A, B, C, D) and financial tracking
- **Team Formation**: Manual team creation or automatic balanced team generation using snake draft algorithm
- **Scoring System**: Score entry and tracking across 4 predefined courses (Parkland, Heathland, Heritage Club, Moorland)
- **Leaderboards**: Real-time team and individual rankings with per-course breakdowns
- **Data Management**: Import/export functionality with localStorage persistence
- **Theming**: Light/dark mode with CSS variable-based theming

### Key Characteristics

- **Client-Side Only**: No backend required - all data stored in localStorage
- **Static Hosting Compatible**: Uses hash-based routing for deployment flexibility
- **Single Page Application**: Vue Router handles all navigation
- **Offline Capable**: Works entirely offline after initial load
- **Responsive Design**: Mobile-first approach with tablet and desktop support

---

## Technology Stack

### Core Framework
```json
{
  "vue": "2.6.14",           // UI framework (Options API)
  "vue-router": "3.5.3",     // Client-side routing (hash mode)
  "vuex": "3.6.2",           // State management (modular pattern)
  "uuid": "9.0.0"            // Unique ID generation
}
```

### Build & Development Tools
```json
{
  "@vue/cli-service": "5.0.8",    // Build tool
  "webpack": "5.76.0",             // Module bundler
  "@babel/preset-env": "7.27.2",  // ES2020+ transpilation
  "eslint": "8.57.1"               // Code linting
}
```

### Testing
```json
{
  "jest": "29.7.0",                // Test framework
  "@vue/test-utils": "2.4.6",      // Vue component testing
  "@vue/vue2-jest": "29.2.6",      // Vue 2 Jest transformer
  "babel-jest": "30.0.0-beta.3"    // Babel/Jest integration
}
```

### Styling
- **CSS Variables** for theming
- **Font Awesome** (CDN) for icons
- **Roboto Font** (Google Fonts)
- **Custom CSS** in `/src/assets/styles.css`

---

## Project Structure

```
golf-competition-app/
├── public/
│   └── index.html                  # Entry point, font imports
│
├── src/
│   ├── main.js                     # Vue app initialization
│   ├── App.vue                     # Root component with layout
│   │
│   ├── assets/
│   │   ├── styles.css              # Global CSS variables & theming (315 lines)
│   │   ├── logo.png                # Bathe Golf Competition logo
│   │   └── [course]-*.png          # Course images (scorecard, header, thumbnails)
│   │
│   ├── router/
│   │   └── index.js                # Vue Router config (hash mode, guards)
│   │
│   ├── store/
│   │   ├── index.js                # Vuex store with persistence plugin
│   │   └── modules/
│   │       ├── players.js          # Player CRUD operations
│   │       ├── teams.js            # Team CRUD, auto-generation algorithm
│   │       ├── scores.js           # Scoring logic, leaderboard calculations
│   │       ├── courses.js          # 4 predefined courses (static)
│   │       └── ui.js               # UI state (theme, notifications, navigation)
│   │
│   ├── services/
│   │   ├── DataService.js          # Singleton, abstracts store operations
│   │   └── NotificationService.js  # Singleton, toast notifications
│   │
│   ├── utils/
│   │   └── index.js                # Helpers (validation, formatting, calculations)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue       # Header with nav, theme toggle, import/export
│   │   │   └── AppSidebar.vue      # Context-aware sidebar navigation
│   │   │
│   │   ├── shared/
│   │   │   ├── Notifications.vue   # Toast notification display
│   │   │   └── ConfirmationDialog.vue
│   │   │
│   │   ├── admin/
│   │   │   ├── PlayerList.vue      # Player CRUD interface
│   │   │   ├── PlayerForm.vue      # Player creation/editing
│   │   │   ├── PlayerStats.vue     # Player statistics dashboard
│   │   │   ├── TeamList.vue        # Team management (752 lines)
│   │   │   ├── TeamForm.vue        # Team creation/editing
│   │   │   ├── PlayerAssignment.vue  # Drag-drop player assignment
│   │   │   └── TeamBalanceAnalyzer.vue  # Team balance metrics
│   │   │
│   │   └── scoring/
│   │       ├── ScoreEntry.vue      # Score input with validation
│   │       ├── CourseScorecard.vue # Team scorecard display
│   │       ├── TeamLeaderboard.vue # Team rankings
│   │       └── PlayerLeaderboard.vue  # Player rankings
│   │
│   └── views/
│       ├── PlayerManagement.vue    # Player admin page
│       ├── TeamManagement.vue      # Team admin page
│       ├── CourseScoring.vue       # Course-specific scoring page
│       └── Leaderboards.vue        # Main leaderboards page
│
├── tests/
│   └── teams.test.js               # Jest tests for team generation (11,155 lines)
│
├── doc/
│   ├── README.md                   # Project overview
│   ├── user-guide.md               # User documentation
│   ├── test-plan.md                # Test plan
│   └── final-delivery.md           # Delivery documentation
│
├── data/
│   └── golf-competition-export-2025-06-08.json  # Sample data
│
├── Configuration Files
│   ├── package.json                # Dependencies, scripts, ESLint config
│   ├── vue.config.js               # Vue CLI configuration
│   ├── babel.config.js             # Babel transpilation config
│   ├── jest.config.js              # Jest testing config
│   └── .gitignore                  # Git ignore patterns
│
└── run.sh                          # Setup & serve script
```

---

## Key Architectural Patterns

### 1. Modular Vuex Store

The application uses a **namespaced modular Vuex store** pattern:

```javascript
store/
├── index.js              // Root store with persistence plugin
└── modules/
    ├── players.js        // namespaced: true
    ├── teams.js          // namespaced: true
    ├── scores.js         // namespaced: true
    ├── courses.js        // namespaced: true
    └── ui.js             // namespaced: true
```

**Key Features:**
- Each module manages its own domain
- Persistence plugin auto-saves to localStorage on mutations
- Services abstract store access for components

### 2. Singleton Services

**DataService** and **NotificationService** are implemented as **singletons**:

```javascript
// services/DataService.js
class DataService {
  constructor(store) {
    this.store = store;
  }
  // Methods that wrap store operations
}

export default new DataService(store);  // Singleton export
```

**Benefits:**
- Clean abstraction over Vuex
- Components don't need direct store access
- Easy to test and mock

### 3. Component Hierarchy

```
App.vue (Root)
├── AppHeader (Layout)
├── AppSidebar (Layout)
├── Notifications (Shared)
└── <router-view>
    ├── PlayerManagement (View)
    │   ├── PlayerList (Feature)
    │   ├── PlayerForm (Feature)
    │   └── PlayerStats (Feature)
    ├── TeamManagement (View)
    │   ├── TeamList (Feature)
    │   ├── TeamForm (Feature)
    │   ├── PlayerAssignment (Feature)
    │   └── TeamBalanceAnalyzer (Feature)
    ├── CourseScoring (View)
    │   ├── ScoreEntry (Feature)
    │   └── CourseScorecard (Feature)
    └── Leaderboards (View)
        ├── TeamLeaderboard (Feature)
        └── PlayerLeaderboard (Feature)
```

**Pattern:**
- **Views** (in `/src/views/`) are route-level containers
- **Feature components** (in `/src/components/`) are reusable, specialized
- **Layout components** are persistent across routes
- **Shared components** are generic utilities

### 4. Data Flow

**Unidirectional data flow:**

```
User Action
  ↓
Component Method
  ↓
Service Call / Store Dispatch
  ↓
Vuex Action
  ↓
Vuex Mutation
  ↓
State Update
  ↓
Persistence Plugin (localStorage)
  ↓
Getter Computation
  ↓
Component Re-render
```

### 5. Persistence Strategy

**Custom Vuex Plugin** (`/src/store/index.js:14-54`):

```javascript
const persistencePlugin = (store) => {
  store.subscribe((mutation) => {
    if (mutation.type.startsWith('players/') ||
        mutation.type.startsWith('teams/') ||
        mutation.type.startsWith('scores/') ||
        mutation.type.startsWith('courses/')) {
      // Save to localStorage
      const state = {
        players: store.state.players.players,
        teams: store.state.teams.teams,
        scores: store.state.scores.scores,
        courses: store.state.courses.courses,
        version: '1.1.0',
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('golf-competition-app', JSON.stringify(state));
    }
  });
};
```

**On app load**, state is hydrated from localStorage in `/src/store/index.js`.

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd golf-competition-app

# Install dependencies
npm install

# Start development server (opens http://localhost:8080)
npm run serve
```

### Development Commands

```bash
# Start dev server with hot reload
npm run serve

# Build for production (outputs to /dist)
npm run build

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run full test script (install, lint, build, serve)
./run.sh
```

### Project Scripts Explained

**`package.json` scripts:**

```json
{
  "serve": "vue-cli-service serve",     // Dev server on :8080
  "build": "vue-cli-service build",     // Production build to /dist
  "lint": "vue-cli-service lint",       // ESLint check
  "test": "jest"                        // Run Jest tests
}
```

### Vue CLI Configuration

**`vue.config.js`:**

```javascript
module.exports = {
  publicPath: './',              // Relative paths for static hosting
  outputDir: 'dist',             // Build output directory
  devServer: {
    port: 8080,
    open: true,                  // Auto-open browser
    historyApiFallback: true     // SPA routing support
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')  // '@' = '/src'
      }
    }
  }
};
```

**Import alias usage:**

```javascript
// Instead of: import MyComponent from '../../components/MyComponent.vue'
import MyComponent from '@/components/MyComponent.vue'
```

---

## Coding Conventions

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| **Vue Components** | PascalCase | `PlayerList.vue`, `AppHeader.vue` |
| **JavaScript Files** | camelCase | `dataService.js`, `index.js` |
| **Store Modules** | camelCase | `players.js`, `teams.js` |
| **CSS Classes** | kebab-case | `.card-header`, `.talent-badge` |
| **Constants** | SCREAMING_SNAKE_CASE | `TALENT_RATINGS`, `MAX_SCORE` |
| **Functions** | camelCase | `calculateTotal()`, `formatDate()` |
| **Vuex Actions** | camelCase | `addPlayer`, `updateTeam` |
| **Vuex Mutations** | SCREAMING_SNAKE_CASE | `SET_PLAYERS`, `ADD_PLAYER` |

### File Organization

**Component file structure:**

```vue
<template>
  <!-- HTML template -->
</template>

<script>
export default {
  name: 'ComponentName',
  components: { /* ... */ },
  props: { /* ... */ },
  data() { /* ... */ },
  computed: { /* ... */ },
  methods: { /* ... */ },
  created() { /* ... */ },
  mounted() { /* ... */ }
}
</script>

<style scoped>
/* Component-specific styles */
</style>
```

**Order of Vue component options:**

1. `name`
2. `components`
3. `props`
4. `data`
5. `computed`
6. `watch`
7. `methods`
8. Lifecycle hooks (`created`, `mounted`, etc.)

### Code Style

**ESLint configuration** (`package.json:34-60`):

```json
{
  "extends": [
    "plugin:vue/essential",
    "eslint:recommended"
  ],
  "parserOptions": {
    "parser": "@babel/eslint-parser",
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "vue/multi-word-component-names": "off"
  }
}
```

**Key style guidelines:**

- **Indentation**: 2 spaces (enforced by ESLint)
- **Quotes**: Single quotes for JS, double quotes for HTML
- **Semicolons**: Required
- **Trailing commas**: Optional (prefer consistent usage)
- **Component names**: Multi-word preferred (but rule disabled for flexibility)

### Vue Options API Patterns

**Data definition:**

```javascript
data() {
  return {
    localState: '',
    isLoading: false
  };
}
```

**Computed properties:**

```javascript
computed: {
  // Getters from Vuex
  players() {
    return this.$store.getters['players/allPlayers'];
  },
  // Derived values
  totalPlayers() {
    return this.players.length;
  }
}
```

**Methods:**

```javascript
methods: {
  async handleSubmit() {
    try {
      await this.$store.dispatch('players/addPlayer', this.formData);
      this.$router.push('/admin/players');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  }
}
```

---

## State Management (Vuex)

### Store Structure

**`/src/store/index.js`:**

```javascript
import Vue from 'vue';
import Vuex from 'vuex';
import players from './modules/players';
import teams from './modules/teams';
import scores from './modules/scores';
import courses from './modules/courses';
import ui from './modules/ui';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    players,
    teams,
    scores,
    courses,
    ui
  },
  plugins: [persistencePlugin]
});
```

### Module: `players`

**File:** `/src/store/modules/players.js`

**State:**

```javascript
state: {
  players: []
}
```

**Player Object Structure:**

```javascript
{
  id: 'uuid-string',
  name: 'John Doe',
  talentRating: 'A',        // A, B, C, D
  entryFee: 100,            // Number
  winnings: 0,              // Number
  teamId: 'uuid-string' | null,
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601'
}
```

**Key Actions:**

```javascript
addPlayer({ commit }, playerData)       // Creates player with UUID
updatePlayer({ commit }, player)        // Updates existing player
deletePlayer({ commit }, playerId)      // Removes player
assignPlayerToTeam({ commit }, { playerId, teamId })
unassignPlayerFromTeam({ commit }, playerId)
unassignAllPlayers({ commit })          // Removes all team assignments
```

**Key Getters:**

```javascript
allPlayers(state)                       // All players
playerById: (state) => (id)             // Single player
playersByTeam: (state) => (teamId)      // Players on a team
unassignedPlayers(state)                // Players without teams
playerCount(state)                      // Total count
playersByTalent: (state) => (rating)    // Players by talent (A/B/C/D)
```

### Module: `teams`

**File:** `/src/store/modules/teams.js`

**State:**

```javascript
state: {
  teams: []
}
```

**Team Object Structure:**

```javascript
{
  id: 'uuid-string',
  name: 'Team Alpha',
  logoUrl: 'https://...' | null,
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601'
}
```

**Key Actions:**

```javascript
addTeam({ commit }, teamData)                    // Creates team
updateTeam({ commit }, team)                     // Updates team
deleteTeam({ commit, dispatch }, teamId)         // Deletes team, unassigns players
deleteAllTeams({ commit, dispatch })             // Clears all teams
generateTeams({ commit, dispatch }, numberOfTeams)  // Auto-generates balanced teams
assignPlayersToTeams({ commit, rootGetters })    // Snake draft assignment
uploadTeamLogo({ commit }, { teamId, logoFile }) // Stores logo as data URL
```

**Team Generation Algorithm:**

**Location:** `/src/store/modules/teams.js:72-93`

```javascript
// Snake draft algorithm
1. Sort players by talent rating (A → B → C → D)
2. Distribute in round-robin:
   - Round 1: Team1, Team2, Team3, Team4
   - Round 2: Team4, Team3, Team2, Team1 (reverse)
   - Round 3: Team1, Team2, Team3, Team4
   - etc.
3. Result: Balanced talent distribution
```

**Key Getters:**

```javascript
allTeams(state)
teamById: (state) => (id)
teamCount(state)
teamWithPlayers: (state, getters, rootState, rootGetters) => (teamId)
  // Returns team object with populated players array
```

### Module: `scores`

**File:** `/src/store/modules/scores.js`

**State:**

```javascript
state: {
  scores: []
}
```

**Score Object Structure:**

```javascript
{
  id: 'uuid-string',
  playerId: 'uuid-string',
  courseId: 'uuid-string',
  value: 72,                // Score (18-150)
  timestamp: 'ISO-8601'
}
```

**Key Actions:**

```javascript
updateScore({ commit }, { playerId, courseId, value })
  // Creates or updates score for player/course combination
deleteScore({ commit }, scoreId)
deleteScoresByPlayer({ commit }, playerId)
deleteAllScores({ commit })
```

**Key Getters:**

```javascript
allScores(state)
scoreByPlayerAndCourse: (state) => (playerId, courseId)
scoresByPlayer: (state) => (playerId)
scoresByCourse: (state) => (courseId)
playerTotalScore: (state, getters) => (playerId)
  // Sum of all scores for a player
teamTotalScore: (state, getters, rootState, rootGetters) => (teamId)
  // Sum of all team members' scores
playerLeaderboard(state, getters, rootState, rootGetters)
  // Computed rankings: [{ player, totalScore, courseScores: {...} }]
teamLeaderboard(state, getters, rootState, rootGetters)
  // Team rankings: [{ team, totalScore, players: [...] }]
courseScoresByTeam: (state, getters, rootState, rootGetters) => (courseId)
  // Team scorecard view for a course
```

**Score Validation:**

Validated via `/src/utils/index.js:validateScore()`:

```javascript
function validateScore(score) {
  if (score < 18 || score > 150) {
    return { isValid: false, error: 'Score must be between 18 and 150' };
  }
  return { isValid: true };
}
```

### Module: `courses`

**File:** `/src/store/modules/courses.js`

**State (Static):**

```javascript
state: {
  courses: [
    { id: 'parkland-1', name: 'Parkland', order: 1 },
    { id: 'heathland-2', name: 'Heathland', order: 2 },
    { id: 'heritage-3', name: 'Heritage Club', order: 3 },
    { id: 'moorland-4', name: 'Moorland', order: 4 }
  ]
}
```

**Key Getters:**

```javascript
allCourses(state)
courseById: (state) => (id)
courseByName: (state) => (name)
courseCount(state)
```

**Note:** Courses are **read-only** - no mutations or actions for modification.

### Module: `ui`

**File:** `/src/store/modules/ui.js`

**State:**

```javascript
state: {
  activeSection: 'administration',
  activeSidebarItem: 'players',
  isLoading: false,
  notifications: []
}
```

**Key Actions:**

```javascript
setActiveSection({ commit }, section)
setActiveSidebarItem({ commit }, item)
setLoading({ commit }, isLoading)
addNotification({ commit }, notification)
  // notification: { id, type, message, timeout }
removeNotification({ commit }, notificationId)
```

**Notification Types:**

- `'success'` (green, 3s timeout)
- `'error'` (red, 5s timeout)
- `'warning'` (orange, 4s timeout)
- `'info'` (blue, 3s timeout)

---

## Component Architecture

### Layout Components

#### AppHeader.vue

**Location:** `/src/components/layout/AppHeader.vue` (457 lines)

**Responsibilities:**

- Navigation menu (Administration, Scoring, Leaderboards)
- Theme toggle (light/dark)
- Data import/export modals
- Dynamic header images per section
- Logo display

**Key Features:**

```javascript
methods: {
  toggleTheme() {
    // Toggles body.dark-mode class
    // Persists to localStorage
  },
  exportData() {
    // Calls DataService.exportData()
    // Downloads JSON file
  },
  importData(jsonString) {
    // Validates and imports data
    // Replaces all state
  }
}
```

**Usage:**

```vue
<!-- In App.vue -->
<app-header />
```

#### AppSidebar.vue

**Location:** `/src/components/layout/AppSidebar.vue` (235 lines)

**Responsibilities:**

- Context-aware navigation (changes based on active section)
- Course links in scoring section
- Thumbnail images for visual appeal
- Footer with version info

**Dynamic Content:**

```javascript
computed: {
  sidebarContent() {
    switch (this.activeSection) {
      case 'administration':
        return [/* Player Management, Team Management links */];
      case 'scoring':
        return [/* Course links */];
      case 'leaderboards':
        return [/* Leaderboard links */];
    }
  }
}
```

### Shared Components

#### Notifications.vue

**Location:** `/src/components/shared/Notifications.vue` (122 lines)

**Features:**

- Auto-dismiss with configurable timeout
- Smooth transitions (`<transition-group>`)
- Close button for manual dismiss
- Color-coded by type

**Usage:**

```javascript
// In any component
NotificationService.success('Player added successfully!');
NotificationService.error('Failed to save team');
```

### Feature Components

#### PlayerList.vue

**Location:** `/src/components/admin/PlayerList.vue` (311 lines)

**Features:**

- Display all players in a table
- Edit/delete actions
- Filter by assignment status
- Search functionality
- Talent rating badges

**Key Methods:**

```javascript
methods: {
  async deletePlayer(playerId) {
    if (confirm('Are you sure?')) {
      await this.$store.dispatch('players/deletePlayer', playerId);
      NotificationService.success('Player deleted');
    }
  }
}
```

#### TeamList.vue

**Location:** `/src/components/admin/TeamList.vue` (752 lines)

**Features:**

- Display teams as cards
- Show players on each team
- Auto-generate teams button
- Drag-drop player assignment (via PlayerAssignment component)
- Team balance analysis (via TeamBalanceAnalyzer component)
- Upload team logos

**Auto-Generation Flow:**

```javascript
methods: {
  async generateTeams() {
    const numberOfTeams = this.numberOfTeamsToGenerate;
    await this.$store.dispatch('teams/generateTeams', numberOfTeams);
    NotificationService.success(`${numberOfTeams} teams created!`);
  }
}
```

#### ScoreEntry.vue

**Location:** `/src/components/scoring/ScoreEntry.vue` (449 lines)

**Features:**

- Score input for each player
- Filters (by team, by score status)
- Score validation (18-150 range)
- Visual indicators (scored/unscored)
- Real-time updates

**Score Update Flow:**

```javascript
methods: {
  async updateScore(playerId, courseId, value) {
    const validation = validateScore(value);
    if (!validation.isValid) {
      NotificationService.error(validation.error);
      return;
    }
    await this.$store.dispatch('scores/updateScore', {
      playerId,
      courseId,
      value
    });
  }
}
```

### View Components

#### PlayerManagement.vue

**Location:** `/src/views/PlayerManagement.vue`

**Structure:**

```vue
<template>
  <div>
    <player-stats />
    <player-form @submit="handleAddPlayer" />
    <player-list />
  </div>
</template>
```

#### TeamManagement.vue

**Location:** `/src/views/TeamManagement.vue`

**Structure:**

```vue
<template>
  <div>
    <team-form />
    <team-balance-analyzer />
    <team-list />
  </div>
</template>
```

#### CourseScoring.vue

**Location:** `/src/views/CourseScoring.vue`

**Dynamic Route:**

```javascript
// Route: /scoring/:courseName
props: ['courseName']

computed: {
  course() {
    return this.$store.getters['courses/courseByName'](this.courseName);
  }
}
```

**Structure:**

```vue
<template>
  <div>
    <course-scorecard :course="course" />
    <score-entry :course="course" />
  </div>
</template>
```

#### Leaderboards.vue

**Location:** `/src/views/Leaderboards.vue`

**Structure:**

```vue
<template>
  <div>
    <team-leaderboard />
    <player-leaderboard />
    <competition-summary />
  </div>
</template>
```

---

## Styling Guidelines

### CSS Variables (Theming)

**File:** `/src/assets/styles.css`

**Light Theme (Default):**

```css
:root {
  --primary-color: #4CAF50;
  --primary-hover: #45a049;
  --text-color: #2c3e50;
  --background-color: #f8f9fa;
  --card-bg: #ffffff;
  --header-bg: #2c3e50;
  --header-text: #ffffff;
  --border-color: #ddd;
  --shadow: rgba(0, 0, 0, 0.1);
}
```

**Dark Theme:**

```css
body.dark-mode {
  --background-color: #2c3e50;
  --card-bg: #34495e;
  --header-bg: #1e272e;
  --text-color: #ecf0f1;
  --border-color: #555;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

**Usage in Components:**

```css
.card {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
```

### Utility Classes

**Buttons:**

```css
.btn                 /* Base button */
.btn-primary         /* Green primary button */
.btn-secondary       /* Gray secondary button */
.btn-danger          /* Red danger button */
```

**Cards:**

```css
.card                /* Base card with shadow */
.card-header         /* Card header section */
.card-body           /* Card body section */
```

**Badges:**

```css
.talent-badge        /* Base badge */
.talent-a            /* A rating (blue) */
.talent-b            /* B rating (green) */
.talent-c            /* C rating (orange) */
.talent-d            /* D rating (red) */
```

**Forms:**

```css
.form-control        /* Input/select styling */
.form-group          /* Form field wrapper */
.form-label          /* Label styling */
```

### Responsive Design

**Mobile-First Approach:**

```css
/* Mobile (default) */
.container {
  padding: 10px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 40px;
  }
}
```

**Layout:**

- **Flexbox** for header/sidebar
- **CSS Grid** for card layouts
- **Relative units** (rem, em, %) for scalability

### Component-Scoped Styles

**Always use `<style scoped>` in components:**

```vue
<style scoped>
/* These styles only apply to this component */
.header {
  background: var(--header-bg);
}
</style>
```

**Exception:** Global styles in `/src/assets/styles.css`

---

## Testing Strategy

### Test Setup

**Configuration:** `/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main.js'
  ]
};
```

### Current Test Coverage

**File:** `/tests/teams.test.js` (11,155 lines)

**Coverage:**

- Team generation algorithm
- Player assignment logic
- Balance calculations
- Edge cases (no players, uneven distribution, etc.)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Writing New Tests

**Pattern:**

```javascript
import { createStore } from 'vuex';
import teamsModule from '@/store/modules/teams';
import playersModule from '@/store/modules/players';

describe('Feature Name', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        teams: teamsModule,
        players: playersModule
      }
    });
  });

  it('should do something', async () => {
    await store.dispatch('teams/addTeam', { name: 'Test Team' });
    const teams = store.getters['teams/allTeams'];
    expect(teams).toHaveLength(1);
  });
});
```

### Component Testing (Future)

**Recommended approach:**

```javascript
import { mount } from '@vue/test-utils';
import PlayerList from '@/components/admin/PlayerList.vue';
import { createStore } from 'vuex';

describe('PlayerList.vue', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: { /* ... */ }
    });
  });

  it('renders players', () => {
    const wrapper = mount(PlayerList, {
      global: {
        plugins: [store]
      }
    });
    expect(wrapper.find('.player-list').exists()).toBe(true);
  });
});
```

---

## Git Workflow

### Branching Strategy

**Main Branches:**

- `main` / `master`: Production-ready code
- `develop`: Integration branch (if used)
- `claude/*`: AI-generated feature branches

**Feature Branches:**

- Naming: `feature/descriptive-name`
- Example: `feature/add-team-logos`

### Commit Message Conventions

**Based on recent commits:**

```
<type>: <subject>

Examples:
- "Add thumbnail images for sidebar sections"
- "Fix dark mode styling"
- "Update score validation range"
- "Consolidate version info"
```

**Types:**

- `Add`: New feature
- `Update`: Enhancement to existing feature
- `Fix`: Bug fix
- `Refactor`: Code restructuring
- `Docs`: Documentation changes
- `Test`: Test additions/changes
- `Style`: Formatting changes

**Guidelines:**

- Use imperative mood ("Add feature" not "Added feature")
- First line ≤ 72 characters
- Capitalize first word
- No period at end of subject line
- Body (if needed) explains "why" not "what"

### Commit Best Practices

**DO:**

```bash
git add src/components/NewFeature.vue
git commit -m "Add new feature component with validation"
```

**DON'T:**

```bash
git commit -m "stuff"
git commit -m "wip"
git commit -m "asdf"
```

### Pull Request Guidelines

**Title Format:**

```
<Type>: <Brief description>

Example: "Add player statistics dashboard"
```

**Description Template:**

```markdown
## Summary
- Brief description of changes
- Why this change is needed

## Changes Made
- File 1: Description
- File 2: Description

## Testing
- [ ] Tested locally
- [ ] No ESLint errors
- [ ] Build succeeds

## Screenshots (if applicable)
[Add screenshots]
```

### Pre-Commit Checklist

Before committing, ensure:

- [ ] Code passes ESLint (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] No console.log() statements (unless intentional)
- [ ] No commented-out code blocks
- [ ] Build succeeds (`npm run build`)

---

## Common Development Tasks

### Adding a New Player Field

**1. Update Player Data Structure**

`/src/store/modules/players.js`:

```javascript
// In addPlayer action
const player = {
  id: uuid(),
  name: playerData.name,
  talentRating: playerData.talentRating,
  newField: playerData.newField,  // Add here
  // ...
};
```

**2. Update Player Form**

`/src/components/admin/PlayerForm.vue`:

```vue
<template>
  <div class="form-group">
    <label>New Field</label>
    <input v-model="form.newField" type="text" class="form-control" />
  </div>
</template>

<script>
data() {
  return {
    form: {
      name: '',
      talentRating: 'A',
      newField: ''  // Add here
    }
  };
}
</script>
```

**3. Update Player List Display**

`/src/components/admin/PlayerList.vue`:

```vue
<template>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>New Field</th>  <!-- Add column -->
      </tr>
    </thead>
    <tbody>
      <tr v-for="player in players" :key="player.id">
        <td>{{ player.name }}</td>
        <td>{{ player.newField }}</td>  <!-- Display value -->
      </tr>
    </tbody>
  </table>
</template>
```

### Adding a New Course

**1. Update Courses Module**

`/src/store/modules/courses.js`:

```javascript
state: {
  courses: [
    { id: 'parkland-1', name: 'Parkland', order: 1 },
    { id: 'heathland-2', name: 'Heathland', order: 2 },
    { id: 'heritage-3', name: 'Heritage Club', order: 3 },
    { id: 'moorland-4', name: 'Moorland', order: 4 },
    { id: 'newcourse-5', name: 'New Course', order: 5 }  // Add here
  ]
}
```

**2. Add Course Images**

Add to `/src/assets/`:

- `newcourse-scorecard.png` (scorecard image)
- `newcourse-header.png` (header image)
- `newcourse-thumbnail.png` (sidebar thumbnail)

**3. Update Sidebar**

`/src/components/layout/AppSidebar.vue`:

```javascript
computed: {
  courses() {
    return this.$store.getters['courses/allCourses'];
  }
}
```

**4. Add Route (if needed)**

`/src/router/index.js`:

```javascript
{
  path: '/scoring/newcourse',
  name: 'NewCourseScoring',
  component: CourseScoring,
  props: { courseName: 'New Course' }
}
```

### Adding a New Vuex Module

**1. Create Module File**

`/src/store/modules/newmodule.js`:

```javascript
const state = {
  items: []
};

const getters = {
  allItems: (state) => state.items
};

const actions = {
  addItem({ commit }, item) {
    commit('ADD_ITEM', item);
  }
};

const mutations = {
  ADD_ITEM(state, item) {
    state.items.push(item);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
```

**2. Register Module**

`/src/store/index.js`:

```javascript
import newmodule from './modules/newmodule';

export default new Vuex.Store({
  modules: {
    players,
    teams,
    scores,
    courses,
    ui,
    newmodule  // Add here
  }
});
```

**3. Update Persistence Plugin (if needed)**

`/src/store/index.js`:

```javascript
const persistencePlugin = (store) => {
  store.subscribe((mutation) => {
    if (mutation.type.startsWith('newmodule/')) {  // Add condition
      // Save to localStorage
    }
  });
};
```

### Creating a New View

**1. Create View Component**

`/src/views/NewView.vue`:

```vue
<template>
  <div class="new-view">
    <h1>New View</h1>
    <!-- Content -->
  </div>
</template>

<script>
export default {
  name: 'NewView',
  components: { /* ... */ },
  data() {
    return { /* ... */ };
  }
};
</script>

<style scoped>
/* Styles */
</style>
```

**2. Add Route**

`/src/router/index.js`:

```javascript
import NewView from '@/views/NewView.vue';

const routes = [
  // ...existing routes
  {
    path: '/new-view',
    name: 'NewView',
    component: NewView
  }
];
```

**3. Add Navigation Link**

`/src/components/layout/AppHeader.vue` or `AppSidebar.vue`:

```vue
<router-link to="/new-view">New View</router-link>
```

### Debugging localStorage Issues

**Clear localStorage:**

```javascript
// In browser console
localStorage.removeItem('golf-competition-app');
location.reload();
```

**Inspect stored data:**

```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('golf-competition-app')));
```

**Reset to clean state:**

```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## Troubleshooting

### Common Issues

#### Build Fails with ESLint Errors

**Problem:** `npm run build` fails with linting errors

**Solution:**

```bash
# Auto-fix linting issues
npm run lint -- --fix

# If unfixable, manually address errors in listed files
```

#### Vuex State Not Persisting

**Problem:** Changes don't persist after page reload

**Checklist:**

1. Ensure mutation type starts with module name (e.g., `players/ADD_PLAYER`)
2. Check persistence plugin is subscribing to mutation
3. Verify localStorage quota isn't exceeded
4. Check browser console for errors

**Debug:**

```javascript
// Add to store/index.js persistence plugin
console.log('Saving mutation:', mutation.type);
console.log('State:', JSON.stringify(state));
```

#### Router Navigation Not Working

**Problem:** Clicking links doesn't change route

**Solutions:**

- Ensure using `<router-link>` not `<a>`
- Check route is defined in `/src/router/index.js`
- Verify component import path is correct
- Check browser console for errors

#### Component Not Re-rendering

**Problem:** Data changes but UI doesn't update

**Solutions:**

1. Ensure using computed properties for reactive data
2. Check `this.$forceUpdate()` as last resort
3. Verify mutation is actually modifying state
4. Check Vue DevTools for state changes

**Example:**

```javascript
// BAD - Not reactive
data() {
  return {
    players: this.$store.state.players.players
  };
}

// GOOD - Reactive
computed: {
  players() {
    return this.$store.getters['players/allPlayers'];
  }
}
```

#### Theme Toggle Not Working

**Problem:** Dark mode doesn't activate

**Solutions:**

1. Check `body.dark-mode` class is added
2. Verify CSS variables are defined for dark mode
3. Clear localStorage theme preference if corrupted
4. Check browser console for errors

**Debug:**

```javascript
// In browser console
document.body.classList.toggle('dark-mode');
```

### Development Server Issues

#### Port 8080 Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::8080`

**Solution:**

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port
npm run serve -- --port 8081
```

#### Hot Reload Not Working

**Problem:** Changes don't reflect without manual refresh

**Solutions:**

1. Restart dev server
2. Check file is saved
3. Clear browser cache
4. Check webpack dev server logs for errors

### Testing Issues

#### Tests Failing After Store Changes

**Problem:** Tests fail after modifying Vuex modules

**Solution:**

1. Update test mocks to match new state structure
2. Ensure test is using correct module namespace
3. Check mutation/action names match

#### Jest Transform Errors

**Problem:** `SyntaxError: Unexpected token` in Vue files

**Solution:**

Ensure `jest.config.js` has correct transformers:

```javascript
transform: {
  '^.+\\.js$': 'babel-jest',
  '^.+\\.vue$': '@vue/vue2-jest'
}
```

---

## AI Assistant Guidelines

### General Principles

When working on this codebase as an AI assistant:

1. **Understand the full context** - Review related files before making changes
2. **Follow existing patterns** - Match the established code style and architecture
3. **Test your changes** - Run linter and tests before committing
4. **Document significant changes** - Update this CLAUDE.md if architecture changes
5. **Be cautious with store changes** - State management changes affect entire app
6. **Preserve data integrity** - Don't break localStorage persistence

### Before Making Changes

**Always:**

1. Read the relevant view/component to understand current implementation
2. Check the Vuex module to understand state structure
3. Review related components to ensure consistency
4. Check if similar functionality exists elsewhere (don't duplicate)

### Code Modification Guidelines

#### When Adding Features

1. **Check existing patterns first:**
   - Similar features in other components
   - Store module structure
   - Service layer abstractions

2. **Follow the data flow:**
   ```
   User Input → Component Method → Service/Action → Mutation → State → Getter → Component Re-render
   ```

3. **Update all layers:**
   - Store (if data changes)
   - Service (if new operations)
   - Component (UI changes)
   - Validation (if new data)

4. **Test integration:**
   - Ensure persistence works
   - Check related components still work
   - Verify leaderboards update correctly

#### When Fixing Bugs

1. **Reproduce the issue:**
   - Understand the exact scenario
   - Check browser console for errors
   - Review relevant code paths

2. **Identify root cause:**
   - Is it a state issue?
   - Component lifecycle problem?
   - Data validation issue?
   - UI rendering bug?

3. **Fix minimally:**
   - Don't refactor while fixing bugs
   - Make smallest change that fixes issue
   - Add comments explaining fix if non-obvious

4. **Verify fix:**
   - Test the specific scenario
   - Check related functionality
   - Ensure no new issues introduced

#### When Refactoring

1. **Have a clear goal:**
   - Performance improvement
   - Code organization
   - Reducing duplication
   - Improving maintainability

2. **Make incremental changes:**
   - Don't refactor multiple areas at once
   - Commit frequently
   - Test after each change

3. **Preserve functionality:**
   - Ensure all features still work
   - Check localStorage persistence
   - Verify all routes work

### Specific Areas to Be Careful With

#### Vuex Store Mutations

**DO:**

```javascript
mutations: {
  ADD_PLAYER(state, player) {
    state.players.push(player);  // Direct mutation
  }
}
```

**DON'T:**

```javascript
mutations: {
  ADD_PLAYER(state, player) {
    // Don't mutate parameters
    player.id = uuid();
    state.players.push(player);
  }
}
```

**Reason:** Parameters should be mutated in actions, not mutations.

#### localStorage Persistence

**Key Points:**

- Persistence plugin watches specific mutation types
- Must start with module name: `players/`, `teams/`, etc.
- Changes outside mutations won't persist
- Test localStorage after store changes

#### Component Lifecycle

**Common Pitfall:**

```javascript
// BAD - Accessing store before it's ready
data() {
  return {
    players: this.$store.getters['players/allPlayers']
  };
}

// GOOD - Use computed for reactive access
computed: {
  players() {
    return this.$store.getters['players/allPlayers'];
  }
}
```

### Testing Requirements

Before considering work complete:

1. **Run linter:**
   ```bash
   npm run lint
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Build succeeds:**
   ```bash
   npm run build
   ```

4. **Manual testing:**
   - Test feature in browser
   - Check persistence (reload page)
   - Test edge cases
   - Verify related features work

### Communication Guidelines

When working with users:

1. **Explain changes clearly:**
   - What files were modified
   - Why changes were made
   - What to test

2. **Highlight potential issues:**
   - Breaking changes
   - Data migration needs
   - Browser cache clearing

3. **Provide testing instructions:**
   - Specific scenarios to test
   - Expected behavior
   - How to verify fix

4. **Document complex changes:**
   - Update this CLAUDE.md if architecture changes
   - Add code comments for non-obvious logic
   - Update user documentation if UI changes

### Code Review Checklist

Before finalizing changes, review:

- [ ] Follows existing naming conventions
- [ ] Uses correct component hierarchy
- [ ] Properly uses Vuex (no direct state mutation in components)
- [ ] Includes error handling
- [ ] Updates persistence if needed
- [ ] Responsive design maintained
- [ ] Dark mode works correctly
- [ ] No console.log() left in code
- [ ] No unused imports
- [ ] Comments added for complex logic
- [ ] ESLint passes
- [ ] Tests pass
- [ ] Build succeeds

### When in Doubt

**Ask yourself:**

1. Does this follow existing patterns in the codebase?
2. Will this work with the persistence system?
3. Have I tested all affected areas?
4. Is this the minimal change needed?
5. Would another developer understand this change?

**If unsure:**

- Look for similar implementations in the codebase
- Check Vue.js 2 documentation
- Review Vuex documentation
- Ask the user for clarification

---

## Quick Reference

### File Shortcuts

| Component | File Path |
|-----------|-----------|
| Player CRUD | `/src/components/admin/PlayerList.vue` |
| Team CRUD | `/src/components/admin/TeamList.vue` |
| Score Entry | `/src/components/scoring/ScoreEntry.vue` |
| Leaderboards | `/src/views/Leaderboards.vue` |
| Players Store | `/src/store/modules/players.js` |
| Teams Store | `/src/store/modules/teams.js` |
| Scores Store | `/src/store/modules/scores.js` |
| Data Service | `/src/services/DataService.js` |
| Utilities | `/src/utils/index.js` |
| Styles | `/src/assets/styles.css` |

### Command Shortcuts

```bash
# Development
npm run serve                  # Start dev server
npm run build                  # Production build
npm run lint                   # Check linting
npm run lint -- --fix          # Auto-fix linting
npm test                       # Run tests

# Quick setup
npm install && npm run serve

# Full test
./run.sh

# Git
git status
git add .
git commit -m "Add: feature description"
git push
```

### Store Access Patterns

```javascript
// In components

// Get data (computed)
computed: {
  players() {
    return this.$store.getters['players/allPlayers'];
  }
}

// Dispatch action (method)
methods: {
  async addPlayer() {
    await this.$store.dispatch('players/addPlayer', this.formData);
  }
}

// Direct state access (avoid if possible)
this.$store.state.players.players
```

### Router Navigation

```javascript
// Programmatic navigation
this.$router.push('/admin/players');
this.$router.push({ name: 'PlayerManagement' });
this.$router.push({ path: '/scoring/parkland' });

// In template
<router-link to="/admin/teams">Teams</router-link>
<router-link :to="{ name: 'Leaderboards' }">Leaderboards</router-link>
```

### Notification Usage

```javascript
import NotificationService from '@/services/NotificationService';

NotificationService.success('Operation successful!');
NotificationService.error('Something went wrong');
NotificationService.warning('Please check your input');
NotificationService.info('Here is some information');
```

---

## Conclusion

This document provides comprehensive guidance for AI assistants working on the Golf Competition App. Always prioritize:

1. **Consistency** with existing patterns
2. **Testing** before finalizing changes
3. **Documentation** of significant changes
4. **User experience** in all modifications

For questions or clarifications, refer to the existing codebase as the source of truth. When in doubt, follow the patterns established in similar components or features.

**Last Updated:** 2025-11-18
**Maintained By:** AI Assistant (Claude)
**Version:** 1.1.0
