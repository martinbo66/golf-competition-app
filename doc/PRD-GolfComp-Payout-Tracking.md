# PRD: Payout Payment Tracking — Golf Competition App

> **Version:** 1.0.0 | **Created:** 2026-04-21
> **Status:** Complete
> **Purpose:** Add a `paid` flag to payouts so admins can track which winnings have actually been disbursed

---

## Background & Current State

Payouts are already calculated and recorded per round via `RoundPayouts.vue`:

- **TEAM_WIN** payouts — split evenly among the winning team's players
- **GREENIE** payouts — single-player closest-to-pin awards

Each `Payout` row has `competition_id`, `round_id`, `player_id`, `type`, `amount`, and `note`. A player's `winnings` column is kept in sync server-side as the aggregate of all their payouts in the competition, and drives the Money Leaderboards.

**Problem:** there's no way to track whether a player has actually been handed the cash. Admins need to know who's still owed money at any point in the competition.

---

## Scope

**In scope:**
- Add `paid` (boolean) and `paidAt` (timestamp) to each payout
- Toggle paid state from the scoring page's round payouts table
- Redefine `player.winnings` as the sum of **paid** payouts only, so money leaderboards reflect money actually received
- Introduce a derived "outstanding" value (unpaid payout sum) surfaced on the player admin page

**Out of scope:**
- Tracking *who* marked a payout paid (only *when* — `paidAt`)
- Group/bulk toggles (e.g. "mark all team-win shares paid in one click")
- Separate "payments" table or reconciliation audit log

---

## Data Model

New columns on the existing `payouts` table:

| Column    | Type      | Nullable | Default |
|-----------|-----------|----------|---------|
| `paid`    | boolean   | NO       | `false` |
| `paid_at` | timestamp | YES      | `null`  |

`paid_at` is set to `now()` when `paid` transitions `false → true`, and cleared to `null` when `true → false`.

**Semantic change:** `player.winnings` (existing column, unchanged schema) now aggregates **only paid payouts**. Historical data — where all existing rows default to `paid=false` — implies `winnings = 0` on first migration. That matches reality: nothing has been explicitly marked paid yet.

---

## API

New endpoint:

- **`PATCH /api/v1/organizations/{orgId}/competitions/{competitionId}/payouts/{payoutId}/paid`**
  - Request: `{ "paid": true | false }`
  - Response: full `PayoutResponse` (now including `paid` and `paidAt`)
  - Side effect: recalculates `player.winnings` (paid-only aggregate)

Existing endpoints are unchanged. `PayoutResponse` gains two fields:

```json
{
  "id": "...", "competitionId": "...", "roundId": "...", "playerId": "...",
  "playerName": "...", "teamId": null, "teamName": null,
  "type": "GREENIE", "amount": 25.00, "note": "Hole 5",
  "paid": false,
  "paidAt": null,
  "createdAt": "...", "updatedAt": "..."
}
```

---

## User Stories

| ID | Story | Status |
|----|-------|--------|
| PT-001 | Extend the payout data model with `paid` and `paidAt` fields (no behavior change yet) | Complete |
| PT-002 | Redefine `player.winnings` as paid-only; add endpoint + service to toggle paid state | Complete |
| PT-003 | Frontend payouts store and API client support for toggling paid + outstanding getters | Complete |
| PT-004 | Scoring page: paid/unpaid toggle on each payout row + round-level paid/outstanding totals | Complete |
| PT-005 | Player admin: "Paid" + "Outstanding" columns and an "Outstanding" stat card | Complete |

---

## Story Status Summary

| ID | Status | Prerequisites |
|----|--------|---------------|
| PT-001 | Complete | — |
| PT-002 | Complete | PT-001 |
| PT-003 | Complete | PT-002 |
| PT-004 | Complete | PT-003 |
| PT-005 | Complete | PT-003 |

---

## Story Details

### PT-001 — Extend payout schema and DTOs

| | |
|-|-|
| **Status** | Complete |

**Description:** Add `paid` (boolean, default `false`, not null) and `paid_at` (timestamp, nullable) to the `payouts` table. Surface them on the `Payout` entity and `PayoutResponse` DTO. No behavior change — all existing logic still uses amount, player.winnings semantics unchanged in this story.

**Files to Create/Modify:**
- `spring-golfcomp/src/main/resources/db/changelog/changes/016-add-paid-to-payouts.xml` (new)
- `spring-golfcomp/src/main/resources/db/changelog/db.changelog-master.xml` (include the new changeset)
- `spring-golfcomp/src/main/java/com/golfcomp/api/model/Payout.java` (new fields)
- `spring-golfcomp/src/main/java/com/golfcomp/api/dto/response/PayoutResponse.java` (new fields)

**Acceptance Criteria:**
- [x] Migration applies cleanly; existing rows set to `paid=false`, `paid_at=null`
- [x] `Payout` entity exposes `paid` and `paidAt`
- [x] `PayoutResponse` includes `paid` and `paidAt`
- [x] Existing backend tests pass

---

### PT-002 — Paid-only winnings + toggle-paid endpoint

| | |
|-|-|
| **Status** | Complete |

**Description:** Change `player.winnings` to aggregate **only paid** payouts, and add a dedicated endpoint to mark a payout paid/unpaid. Payout create / update / delete continue to recalculate winnings, but now with the paid filter. Marking a payout paid/unpaid also triggers recalculation (for the single player involved).

**Files to Create/Modify:**
- `spring-golfcomp/src/main/java/com/golfcomp/api/repository/PayoutRepository.java` — update `sumByCompetitionAndPlayer` query to filter `p.paid = true`
- `spring-golfcomp/src/main/java/com/golfcomp/api/dto/request/MarkPayoutPaidRequest.java` (new) — `@NotNull Boolean paid`
- `spring-golfcomp/src/main/java/com/golfcomp/api/service/PayoutService.java` — new `setPaid(UUID competitionId, UUID payoutId, boolean paid)`
- `spring-golfcomp/src/main/java/com/golfcomp/api/controller/OrganizationPayoutController.java` — new `PATCH /payouts/{payoutId}/paid`
- `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutServiceTest.java` — add tests for `setPaid`; adjust existing tests where needed
- `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutControllerTest.java` — add tests for the PATCH endpoint

**Acceptance Criteria:**
- [x] `setPaid(true)` sets `paid=true` and stamps `paidAt=now()`
- [x] `setPaid(false)` sets `paid=false` and clears `paidAt=null`
- [x] After `setPaid`, `player.winnings` reflects only paid payouts
- [x] After `create` / `update` / `delete`, `player.winnings` reflects only paid payouts (existing default paid=false = no bump)
- [x] PATCH endpoint returns 200 with full `PayoutResponse`
- [x] PATCH returns 404 when payout belongs to different competition
- [x] PATCH returns 400 when body `paid` is null
- [x] All existing backend tests still pass after the winnings-definition change

---

### PT-003 — Frontend store & API client

| | |
|-|-|
| **Status** | Complete |

**Description:** Map the new response fields in the payouts store, add a `setPayoutPaid` action, add getters for paid/outstanding totals, and wire the new URL helper into `ApiService`.

**Files to Create/Modify:**
- `vue-golfcomp/src/services/ApiService.js` — add `markPayoutPaidUrl(id)` and a `patch(url, data)` helper
- `vue-golfcomp/src/stores/payouts.js`:
  - extend `mapPayoutResponse` with `paid`, `paidAt`
  - new action `setPayoutPaid({ id, paid })`
  - new getters:
    - `paidTotalByPlayer(playerId)`
    - `unpaidTotalByPlayer(playerId)`
    - `roundPaidTotal(roundId)`
    - `roundUnpaidTotal(roundId)`
    - `competitionUnpaidTotal`
- `vue-golfcomp/src/stores/players.js` — add `totalOutstandingWinnings` getter (sums `unpaidTotalByPlayer` across players)
- `vue-golfcomp/tests/payouts.test.js` — update existing assertions for new "paid-only winnings" semantics; add tests for `setPayoutPaid` and getters

**Acceptance Criteria:**
- [x] `setPayoutPaid` PATCHes the expected URL and body, updates local state with the response
- [x] Getters return correct sums segmented by paid state
- [x] Existing payouts store tests updated to match paid-only semantics
- [x] `npm test -- tests/payouts.test.js` passes

---

### PT-004 — Scoring page paid toggle

| | |
|-|-|
| **Status** | Complete |

**Description:** Add a "Paid" column with a toggle on both the TEAM_WIN and GREENIE tables in `RoundPayouts.vue`. Show round-level "Paid $X · Outstanding $Y" alongside the existing round total. Dim paid rows and highlight unpaid with the danger color. Errors roll back the toggle and show an error notification.

**Files to Create/Modify:**
- `vue-golfcomp/src/components/scoring/RoundPayouts.vue` — new column, `togglePaid` handler, header totals, styling
- `vue-golfcomp/tests/RoundPayouts.test.js` — new tests for toggle, optimistic update, rollback on error

**Acceptance Criteria:**
- [x] Each payout row shows a checkbox / badge reflecting its paid state
- [x] Clicking the toggle calls `payoutsStore.setPayoutPaid` and shows a success notification
- [x] On API error the UI reverts and shows an error notification
- [x] Round total header shows paid + outstanding breakdown
- [x] Paid rows are visually de-emphasized; unpaid are highlighted
- [x] `npm test -- tests/RoundPayouts.test.js` passes

---

### PT-005 — Player admin visibility

| | |
|-|-|
| **Status** | Complete |

**Description:** Surface the new concept on the player management page. Add **Paid** (= `player.winnings`) and **Outstanding** (= unpaid aggregate) columns after the existing **Winnings** column in `PlayerList`. Rename the existing column label from "Winnings" to "Winnings (Paid)" for clarity. Add an "Outstanding Payouts" stat card on `PlayerStats`.

**Files to Create/Modify:**
- `vue-golfcomp/src/components/admin/PlayerList.vue` — Paid/Outstanding columns (sortable), footer totals
- `vue-golfcomp/src/components/admin/PlayerStats.vue` — new stat card "Outstanding Payouts"
- `vue-golfcomp/tests/players.test.js` or `players_getters.test.js` — tests for new players-store getter
- (no new RoundPayouts changes here)

**Acceptance Criteria:**
- [x] `PlayerList` shows per-player paid and outstanding amounts with a footer total
- [x] Both new columns are sortable
- [x] `PlayerStats` shows total outstanding across all players; red-tinted when > 0
- [x] `npm test` passes
- [x] `npm run lint` passes
- [x] Dark mode renders correctly

---

## File Change Summary

| File | Change Type |
|------|-------------|
| `spring-golfcomp/src/main/resources/db/changelog/changes/016-add-paid-to-payouts.xml` | Create |
| `spring-golfcomp/src/main/resources/db/changelog/db.changelog-master.xml` | Modify |
| `spring-golfcomp/src/main/java/com/golfcomp/api/model/Payout.java` | Modify |
| `spring-golfcomp/src/main/java/com/golfcomp/api/dto/response/PayoutResponse.java` | Modify |
| `spring-golfcomp/src/main/java/com/golfcomp/api/dto/request/MarkPayoutPaidRequest.java` | Create |
| `spring-golfcomp/src/main/java/com/golfcomp/api/repository/PayoutRepository.java` | Modify |
| `spring-golfcomp/src/main/java/com/golfcomp/api/service/PayoutService.java` | Modify |
| `spring-golfcomp/src/main/java/com/golfcomp/api/controller/OrganizationPayoutController.java` | Modify |
| `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutServiceTest.java` | Modify |
| `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutControllerTest.java` | Modify |
| `vue-golfcomp/src/services/ApiService.js` | Modify |
| `vue-golfcomp/src/stores/payouts.js` | Modify |
| `vue-golfcomp/src/stores/players.js` | Modify |
| `vue-golfcomp/src/components/scoring/RoundPayouts.vue` | Modify |
| `vue-golfcomp/src/components/admin/PlayerList.vue` | Modify |
| `vue-golfcomp/src/components/admin/PlayerStats.vue` | Modify |
| `vue-golfcomp/tests/payouts.test.js` | Modify |
| `vue-golfcomp/tests/RoundPayouts.test.js` | Modify |

---

## Constraints & Gotchas

1. **Semantic change to `player.winnings`** — after PT-002, `winnings` no longer equals total awarded; it equals total **paid**. Money leaderboards and any existing UI bound to `winnings` will reflect "paid" going forward. This matches the user's intent (leaderboards should show real money received).
2. **Default all existing rows to `paid=false`** — on first deploy, all historical `player.winnings` will drop to $0. This is expected; admins can then toggle paid rows as appropriate.
3. **Optimistic UI with rollback** — `RoundPayouts.vue` must revert the toggle and notify on failure so state stays consistent with the server.
4. **Dark mode** — all visual changes must use CSS variables; test both themes.
5. **No localStorage** — keep all persistence server-side (per project conventions).

---

## Progress Log

- **2026-04-21:** PT-001..PT-005 complete. Added `paid`/`paidAt` to payouts (DB, entity, DTO), redefined `player.winnings` as paid-only, added `PATCH /payouts/{id}/paid` endpoint, wired frontend store with `setPayoutPaid` action and paid/outstanding getters, added paid toggle + round totals to `RoundPayouts.vue`, and surfaced Paid/Outstanding in `PlayerList` and `PlayerStats`. Backend + frontend tests and lint all green.

---

## Files Modified

**Backend:**
- `spring-golfcomp/src/main/resources/db/changelog/changes/016-add-paid-to-payouts.xml` (new)
- `spring-golfcomp/src/main/resources/db/changelog/db.changelog-master.xml`
- `spring-golfcomp/src/main/java/com/golfcomp/api/model/Payout.java`
- `spring-golfcomp/src/main/java/com/golfcomp/api/dto/response/PayoutResponse.java`
- `spring-golfcomp/src/main/java/com/golfcomp/api/dto/request/MarkPayoutPaidRequest.java` (new)
- `spring-golfcomp/src/main/java/com/golfcomp/api/repository/PayoutRepository.java`
- `spring-golfcomp/src/main/java/com/golfcomp/api/service/PayoutService.java`
- `spring-golfcomp/src/main/java/com/golfcomp/api/controller/OrganizationPayoutController.java`
- `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutServiceTest.java`
- `spring-golfcomp/src/test/java/com/golfcomp/api/unit/PayoutControllerTest.java`
- `spring-golfcomp/src/test/java/com/golfcomp/api/model/PayoutTest.java`

**Frontend:**
- `vue-golfcomp/src/services/ApiService.js`
- `vue-golfcomp/src/stores/payouts.js`
- `vue-golfcomp/src/stores/players.js`
- `vue-golfcomp/src/components/scoring/RoundPayouts.vue`
- `vue-golfcomp/src/components/admin/PlayerList.vue`
- `vue-golfcomp/src/components/admin/PlayerStats.vue`
- `vue-golfcomp/tests/payouts.test.js`
- `vue-golfcomp/tests/RoundPayouts.test.js`
- `vue-golfcomp/tests/players_getters.test.js`
