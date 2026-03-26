# PRD: Multi-Tenant (Organization) Support

> **Version:** 1.0.0 | **Created:** 2026-03-26
> **Branch:** `bo/multi-tenant`
> **Status:** Planning

---

## 1. Overview

Introduce **Organization** as a top-level tenant container in the domain model. Competitions become private to an organization, and by extension all competition-scoped data (players, teams, rounds, scores) is tenant-isolated. Course data remains global (shared across all organizations).

### Design Principles

- **Incremental delivery** — each phase is independently deployable and testable
- **Single default tenant first** — no sign-up flow; a seed organization is auto-created
- **Minimal disruption** — existing API consumers continue to work with minor URL changes
- **Forward-compatible** — the model supports future user/auth features without rework

### Domain Model (Target State)

```
Organization (tenant boundary)
  └── Competition (organization_id FK)
        ├── Team (competition_id FK)
        ├── Player (competition_id FK, team_id FK nullable)
        ├── Round (competition_id FK, course_id FK)
        └── Score (competition_id FK [denorm], round_id FK, player_id FK)

Course (global — no organization scope)
```

**Key invariant:** A competition belongs to exactly one organization. All data reachable through a competition is implicitly scoped to that organization.

---

## 2. Phased Implementation Plan

### Phase 1 — Backend: Organization Entity & Schema

Establish the Organization entity, migration, seed data, and CRUD API.

| Story | Status | Description |
|-------|--------|-------------|
| MT-001 | 🔲 To Do | **Create Organization entity** — `Organization.java` with fields: `id` (UUID), `name` (varchar 100, NOT NULL, UNIQUE), `slug` (varchar 100, NOT NULL, UNIQUE), `createdAt`, `updatedAt`. JPA entity with `@PrePersist`/`@PreUpdate` lifecycle hooks. |
| MT-002 | 🔲 To Do | **Liquibase migration: organizations table** — `009-create-organizations-table.xml`. Columns: `id` (UUID PK), `name` (varchar 100, NOT NULL, UNIQUE), `slug` (varchar 100, NOT NULL, UNIQUE), `created_at` (TIMESTAMP NOT NULL), `updated_at` (TIMESTAMP NOT NULL). |
| MT-003 | 🔲 To Do | **Seed default organization** — `010-seed-default-organization.xml`. Insert a single row: name=`"Default"`, slug=`"default"`, with a fixed UUID. Use idempotent precondition guard (same pattern as `007-seed-courses.xml`). |
| MT-004 | 🔲 To Do | **OrganizationRepository** — `JpaRepository<Organization, UUID>` with `findBySlug(String slug)` derived query method. |
| MT-005 | 🔲 To Do | **OrganizationService** — CRUD operations: `findAll()`, `findById(UUID)`, `findBySlug(String)`, `create(Organization)`, `update(UUID, Organization)`, `delete(UUID)`. Validate uniqueness of name and slug on create/update. Prevent deletion of the default organization. |
| MT-006 | 🔲 To Do | **OrganizationController** — REST endpoints at `/api/v1/organizations`. `GET /` (list all), `GET /{id}` (by ID), `POST /` (create), `PUT /{id}` (update), `DELETE /{id}` (delete). Standard DTO mapping pattern. |
| MT-007 | 🔲 To Do | **Unit tests for OrganizationService** — Test CRUD operations, uniqueness validation, and default org deletion guard. Follow existing test patterns in `src/test/java/com/golfcomp/api/`. |
| MT-008 | 🔲 To Do | **Integration tests for Organization API** — Test all REST endpoints including error cases (duplicate name, delete default org). Follow existing integration test patterns. |

| MT-008a | 🔲 To Do | **Update CLAUDE.md — Phase 1** — Add Organization entity to the Project Structure section, Data Structures section (Organization Object), Pinia Stores Reference (placeholder for future `organizations` store), ApiService section (new `/organizations` URL), and File Shortcuts table. Update the domain model description in the Overview to mention the Organization layer. |

**Acceptance criteria:** `./gradlew backendBuild` and `./gradlew backendTest` pass. Organization CRUD is functional via API. CLAUDE.md reflects Phase 1 changes.

---

### Phase 2 — Backend: Link Competitions to Organizations

Add the foreign key from Competition to Organization and migrate existing data.

| Story | Status | Description |
|-------|--------|-------------|
| MT-009 | 🔲 To Do | **Add `organization` field to Competition entity** — `@ManyToOne(LAZY)` relationship to Organization, `organization_id` column, NOT NULL. Follow the same FK pattern used by Player→Competition. |
| MT-010 | 🔲 To Do | **Liquibase migration: add organization_id to competitions** — `011-add-organization-to-competitions.xml`. Add `organization_id` column (UUID, nullable initially), populate existing rows with the default organization UUID, then add NOT NULL constraint. Add FK constraint with CASCADE delete. Add index on `organization_id`. |
| MT-011 | 🔲 To Do | **Update CompetitionRepository** — Add `findByOrganizationId(UUID)` and `findByOrganizationIdOrderByStartDateDesc(UUID)` query methods. |
| MT-012 | 🔲 To Do | **Update CompetitionService** — All list/create operations accept `organizationId`. `findAll()` → `findByOrganization(orgId)`. `create()` sets the organization reference. `findById()` verifies organization ownership (same 404 pattern as competition→player scoping). |
| MT-013 | 🔲 To Do | **Update CompetitionController** — Nest competition endpoints under organization: `/api/v1/organizations/{orgId}/competitions`. Maintain backward compatibility with a temporary redirect or dual-mount (see Migration Notes below). |
| MT-014 | 🔲 To Do | **Update downstream services** — `PlayerService`, `TeamService`, `RoundService`, `ScoreService`, `LeaderboardService` do not need changes — they already scope by `competitionId`, and the competition's `organization_id` provides the tenant boundary. Verify with tests. |
| MT-015 | 🔲 To Do | **Update unit and integration tests** — All Competition-related tests must pass with organization context. Add tests for cross-organization isolation (competition in org A is not visible from org B). |

| MT-015a | 🔲 To Do | **Update CLAUDE.md — Phase 2** — Update Competition Object data structure to include `organizationId` field. Update ApiService section with organization-scoped competition URLs. Update the "Active Competition Context" section to mention organization context. Update the "Critical Architecture Patterns" section to describe the Organization → Competition → sub-resources scoping chain. |

**Migration notes:**
- Existing competitions are assigned to the default organization during migration
- The legacy `/api/v1/competitions` endpoints should remain functional during transition, defaulting to the default organization. Remove in Phase 5.

**Acceptance criteria:** `./gradlew ci` passes. Competitions are scoped to organizations. Cross-org isolation is tested. CLAUDE.md reflects Phase 2 changes.

---

### Phase 3 — Backend: Organization-Scoped Sub-Resources

Ensure all competition sub-resource APIs work correctly through the organization path.

| Story | Status | Description |
|-------|--------|-------------|
| MT-016 | 🔲 To Do | **Nest player endpoints under organization** — `/api/v1/organizations/{orgId}/competitions/{compId}/players/...`. Controller validates that the competition belongs to the specified organization before delegating to service. |
| MT-017 | 🔲 To Do | **Nest team endpoints under organization** — Same pattern as MT-016 for teams, including `/generate` and bulk delete. |
| MT-018 | 🔲 To Do | **Nest round endpoints under organization** — Same pattern as MT-016 for rounds. |
| MT-019 | 🔲 To Do | **Nest score endpoints under organization** — Same pattern as MT-016 for scores (upsert and bulk delete). |
| MT-020 | 🔲 To Do | **Nest leaderboard endpoints under organization** — Same pattern as MT-016 for player and team leaderboards. |
| MT-021 | 🔲 To Do | **Organization ownership validation helper** — Extract a shared method (or small service) that validates `competition.organization.id == orgId`, to avoid duplicating the check in every controller. |
| MT-022 | 🔲 To Do | **Integration tests for nested resource paths** — Test all nested endpoints. Verify that accessing a competition's resources through the wrong organization returns 404. |

| MT-022a | 🔲 To Do | **Update CLAUDE.md — Phase 3** — Update all API URL patterns in the ApiService section to show the full `/organizations/{orgId}/competitions/{compId}/...` paths. Update the Controller layer documentation. |

**Acceptance criteria:** All sub-resource endpoints work under the `/organizations/{orgId}/` prefix. Cross-org access returns 404. CLAUDE.md reflects Phase 3 URL changes.

---

### Phase 4 — Frontend: Organization Context

Update the Vue frontend to work with organization-scoped APIs.

| Story | Status | Description |
|-------|--------|-------------|
| MT-023 | 🔲 To Do | **Create organizations Pinia store** — `useOrganizationsStore()` with state: `organizations[]`, `activeOrganization`. Actions: `fetchOrganizations()`, `setActiveOrganization(org)`. On app bootstrap, fetch organizations and auto-select the default org. |
| MT-024 | 🔲 To Do | **Update ApiService with organization context** — Add `organizationId` property (like the existing `competitionId`). Update all URL builder methods to include `/organizations/{orgId}` prefix when set. Maintain backward compatibility if `organizationId` is not set (falls back to legacy paths). |
| MT-025 | 🔲 To Do | **Update bootstrap.js** — On app startup, fetch organizations, set the default org as active, then proceed with existing competition loading. |
| MT-026 | 🔲 To Do | **Update competition store** — `fetchCompetitions()` should use the organization-scoped URL. `setActiveCompetition()` continues to work as before. |
| MT-027 | 🔲 To Do | **Organization selector component** — Add a simple org selector to `AppHeader.vue` (or sidebar). Initially shows only "Default" org. Changing org re-fetches competitions and clears active competition context. Hidden or disabled when only one org exists. |
| MT-028 | 🔲 To Do | **Frontend tests** — Update existing tests to work with organization context. Add tests for organization store. |

| MT-028a | 🔲 To Do | **Update CLAUDE.md — Phase 4** — Add `organizations` store to the Pinia Stores Reference section with key actions and getters. Update the "Data Flow" and "Active Competition Context" patterns to describe the Organization → Competition selection flow. Update bootstrap description. Add Organization selector component to File Shortcuts table. |

**Acceptance criteria:** `npm run lint`, `npm test`, and `npm run build` pass in `vue-golfcomp/`. App loads with default organization auto-selected. All existing functionality works. CLAUDE.md reflects Phase 4 frontend changes.

---

### Phase 5 — Backend: Organization CRUD Management & Cleanup

Full organization management and removal of legacy endpoints.

| Story | Status | Description |
|-------|--------|-------------|
| MT-029 | 🔲 To Do | **Organization admin endpoints** — Ensure create/update/delete organization works end-to-end including cascade behavior (deleting an org deletes all its competitions and transitively all sub-data). |
| MT-030 | 🔲 To Do | **Remove legacy competition endpoints** — Remove the unscoped `/api/v1/competitions` routes that were kept for backward compatibility. All competition access must go through `/api/v1/organizations/{orgId}/competitions`. |
| MT-031 | 🔲 To Do | **Frontend organization management UI** — Admin page for creating/editing/deleting organizations. Reachable from nav or settings. |
| MT-032 | 🔲 To Do | **Organization display in UI** — Show org name in header/breadcrumbs. Organization context is visible throughout the app. |
| MT-033 | 🔲 To Do | **End-to-end testing** — Full workflow: create org → create competition → add players → generate teams → enter scores → view leaderboards. Verify tenant isolation across two orgs. |
| MT-034 | 🔲 To Do | **Final CLAUDE.md review** — Comprehensive review of CLAUDE.md to ensure all sections reflect the multi-tenant architecture. Bump version number. Verify: Overview mentions Organization, all data structures are current, all store references are complete, all API URLs use org-scoped paths, File Shortcuts includes all new files, Key Takeaways updated, Common Pitfalls updated (e.g., "API calls returning 404? → Check organizationId is set"). Remove any transition/legacy endpoint references. |
| MT-035 | 🔲 To Do | **Update user-guide.md** — Update `doc/user-guide.md` to describe organization selection, how competitions are scoped to orgs, and the default organization behavior. Add screenshots/descriptions of the org selector UI. |
| MT-036 | 🔲 To Do | **Update test-plan.md** — Update `doc/test-plan.md` to include multi-tenant test scenarios: org CRUD, org isolation, cross-org access denial, default org behavior, cascade delete of org and all child data. |
| MT-037 | 🔲 To Do | **Update MEMORY.md** — Add entry to `.claude/projects/.../memory/MEMORY.md` documenting the multi-tenant architecture decision, the Organization entity, and any implementation lessons learned during the feature build. |

**Acceptance criteria:** `./gradlew ci` passes. Full org lifecycle works. Legacy endpoints removed. All documentation files updated: CLAUDE.md, user-guide.md, test-plan.md, MEMORY.md.

---

## 3. API Design

### New Endpoints

```
# Organization CRUD
GET    /api/v1/organizations                    → List all organizations
POST   /api/v1/organizations                    → Create organization
GET    /api/v1/organizations/{orgId}             → Get organization by ID
PUT    /api/v1/organizations/{orgId}             → Update organization
DELETE /api/v1/organizations/{orgId}             → Delete organization (cascades)

# Competitions scoped to organization
GET    /api/v1/organizations/{orgId}/competitions
POST   /api/v1/organizations/{orgId}/competitions
GET    /api/v1/organizations/{orgId}/competitions/{compId}
PUT    /api/v1/organizations/{orgId}/competitions/{compId}
DELETE /api/v1/organizations/{orgId}/competitions/{compId}

# Sub-resources (same shape, new prefix)
.../competitions/{compId}/players/...
.../competitions/{compId}/teams/...
.../competitions/{compId}/rounds/...
.../competitions/{compId}/rounds/{roundId}/scores
.../competitions/{compId}/leaderboards/{type}

# Courses remain global (unchanged)
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/{id}
PUT    /api/v1/courses/{id}
DELETE /api/v1/courses/{id}
```

### Organization DTO

```json
{
  "id": "uuid",
  "name": "My Golf Club",
  "slug": "my-golf-club",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

The `slug` field provides a URL-friendly identifier for future use (e.g., `app.example.com/my-golf-club/`).

---

## 4. Data Model Changes

### New Table: `organizations`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| slug | VARCHAR(100) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### Modified Table: `competitions`

| Column | Change |
|--------|--------|
| organization_id | **ADD** UUID, NOT NULL, FK → organizations(id) ON DELETE CASCADE |

### Unchanged Tables

- `courses` — remains global, no organization scope
- `teams`, `players`, `rounds`, `scores` — already scoped via `competition_id`; no schema changes needed

### Migration Strategy

1. Create `organizations` table
2. Seed default organization with fixed UUID
3. Add `organization_id` to `competitions` as nullable
4. Backfill all existing competitions with the default org UUID
5. Alter `organization_id` to NOT NULL
6. Add FK constraint and index

---

## 5. Tenant Isolation Model

```
┌─────────────────────────────────────────────────┐
│  Organization A                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Competition 1 │  │ Competition 2 │             │
│  │  Players      │  │  Players      │             │
│  │  Teams        │  │  Teams        │             │
│  │  Rounds ──────│──│── Course*     │             │
│  │  Scores       │  │  Scores       │             │
│  └──────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────┤
│  Organization B                                  │
│  ┌──────────────┐                                │
│  │ Competition 3 │  * Courses are global and     │
│  │  Players      │    shared across all orgs     │
│  │  Teams        │    via the Round join entity   │
│  │  Rounds ──────│── Course*                     │
│  │  Scores       │                                │
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘
```

**Isolation enforcement:**
- **Database level:** `competitions.organization_id` FK with CASCADE delete
- **Service level:** All competition queries filter by `organizationId`. Sub-resource services continue to filter by `competitionId` (which is already org-scoped)
- **Controller level:** Organization ownership check before delegating to service layer
- **Error handling:** Cross-org access returns 404 (not 403) — consistent with existing cross-competition isolation pattern

---

## 6. Implementation Notes for LLM Agents

### Parallelization Opportunities

- **Phase 1** stories MT-001 through MT-006 can be implemented by a single agent sequentially (entity → migration → repo → service → controller)
- **Phase 1** tests (MT-007, MT-008) can be implemented in parallel once the main code is done
- **Phase 2** and **Phase 3** are sequential (Phase 3 depends on Phase 2)
- **Phase 4** (frontend) can begin after Phase 2 is complete
- **Phase 5** depends on Phase 3 and Phase 4

### Patterns to Follow

1. **Entity pattern:** Copy `Competition.java` structure — UUID PK with `GenerationType.UUID`, `@PrePersist`/`@PreUpdate` for timestamps
2. **Repository pattern:** Extend `JpaRepository<Organization, UUID>`, Spring Data derived queries only
3. **Service pattern:** Copy `CompetitionService.java` for CRUD; copy ownership verification from `PlayerService.findById()` for org→competition scoping
4. **Controller pattern:** Copy `CompetitionController.java` structure; use `@PathVariable` for `orgId`
5. **Migration pattern:** Follow `001-create-competitions-table.xml` structure; seed data follows `007-seed-courses.xml`
6. **Test patterns:** Follow existing unit and integration test conventions in `src/test/java/com/golfcomp/api/`

### Fixed UUIDs

The default organization should use a fixed UUID for consistency across environments:
```
Default Organization: a0000000-0000-0000-0000-000000000001
```

### Backward Compatibility During Transition

During Phases 2–4, maintain dual-mount for competition endpoints:
- **New:** `/api/v1/organizations/{orgId}/competitions/...`
- **Legacy:** `/api/v1/competitions/...` (implicitly uses default org)

This allows the frontend to be updated incrementally. Legacy endpoints are removed in Phase 5 (MT-030).

---

## 7. Future Considerations (Out of Scope)

These items are **not** part of this PRD but the design accommodates them:

- **User entity & authentication** — `User` with `organization_id` FK; JWT/session auth
- **Role-based access control** — Admin, Organizer, Viewer roles per organization
- **Organization invitations** — Sign-up flow with invite codes
- **Per-organization course libraries** — Optional `organization_id` on Course (nullable = global)
- **Organization settings** — Configurable defaults (currency, timezone, scoring rules)
- **Billing/subscription** — Per-organization plan tiers

---

## 8. Story Summary

| Phase | Stories | Description |
|-------|---------|-------------|
| 1 | MT-001 – MT-008, MT-008a | Organization entity, schema, CRUD API, tests, CLAUDE.md update |
| 2 | MT-009 – MT-015, MT-015a | Link competitions to organizations, migration, CLAUDE.md update |
| 3 | MT-016 – MT-022, MT-022a | Organization-scoped sub-resource APIs, CLAUDE.md update |
| 4 | MT-023 – MT-028, MT-028a | Frontend organization context & store, CLAUDE.md update |
| 5 | MT-029 – MT-037 | Full management UI, cleanup, all documentation updates |

**Total stories:** 38
**Completed:** 0
**Remaining:** 38

### Documentation Stories Quick Reference

Each phase includes a CLAUDE.md update story to keep project documentation current as changes land:

| Story | Phase | Scope |
|-------|-------|-------|
| MT-008a | 1 | CLAUDE.md — Organization entity, data structure, file shortcuts |
| MT-015a | 2 | CLAUDE.md — Competition→Organization relationship, API URL changes |
| MT-022a | 3 | CLAUDE.md — All sub-resource URL patterns updated |
| MT-028a | 4 | CLAUDE.md — Organizations store, frontend data flow, bootstrap |
| MT-034 | 5 | CLAUDE.md — Final comprehensive review, version bump |
| MT-035 | 5 | user-guide.md — Org selection, scoping, default org |
| MT-036 | 5 | test-plan.md — Multi-tenant test scenarios |
| MT-037 | 5 | MEMORY.md — Architecture decision record |
