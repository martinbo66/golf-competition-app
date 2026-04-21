/**
 * Payouts store tests.
 */
jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        payoutsUrl: jest.fn(id => id ? `/competitions/c1/payouts/${id}` : '/competitions/c1/payouts'),
        roundPayoutsUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts`),
        teamWinPayoutUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts/team-win`)
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { usePayoutsStore } from '@/stores/payouts';
import { usePlayersStore } from '@/stores/players';

const makePayout = (overrides = {}) => ({
    id: 'payout-1',
    competitionId: 'comp-1',
    roundId: 'round-1',
    playerId: 'player-1',
    playerName: 'Alice Smith',
    teamId: 'team-1',
    teamName: 'Team Alpha',
    type: 'GREENIE',
    amount: 25,
    note: 'Hole 5',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    ...overrides
});

describe('payouts store', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = usePayoutsStore();
        ApiService.get.mockReset();
        ApiService.post.mockReset();
        ApiService.put.mockReset();
        ApiService.delete.mockReset();
    });

    // ─── fetchPayouts ────────────────────────────────────────────────────────

    describe('fetchPayouts', () => {
        test('loads and maps payouts from API', async () => {
            ApiService.get.mockResolvedValue([makePayout(), makePayout({ id: 'payout-2', type: 'TEAM_WIN', amount: '40.00' })]);

            await store.fetchPayouts();

            expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/payouts');
            expect(store.payouts).toHaveLength(2);
            expect(store.payouts[0].type).toBe('GREENIE');
            expect(store.payouts[1].type).toBe('TEAM_WIN');
        });

        test('converts amount string to number', async () => {
            ApiService.get.mockResolvedValue([makePayout({ amount: '33.50' })]);

            await store.fetchPayouts();

            expect(store.payouts[0].amount).toBe(33.5);
        });

        test('handles null/missing optional fields', async () => {
            ApiService.get.mockResolvedValue([makePayout({ teamId: null, teamName: null, note: null })]);

            await store.fetchPayouts();

            expect(store.payouts[0].teamId).toBeNull();
            expect(store.payouts[0].teamName).toBeNull();
            expect(store.payouts[0].note).toBe('');
        });

        test('handles empty response', async () => {
            ApiService.get.mockResolvedValue([]);

            await store.fetchPayouts();

            expect(store.payouts).toHaveLength(0);
        });
    });

    // ─── getters ─────────────────────────────────────────────────────────────

    describe('getters', () => {
        beforeEach(() => {
            store.payouts = [
                makePayout({ id: 'p1', roundId: 'r1', playerId: 'player-1', type: 'GREENIE', amount: 25 }),
                makePayout({ id: 'p2', roundId: 'r1', playerId: 'player-2', type: 'TEAM_WIN', amount: 40 }),
                makePayout({ id: 'p3', roundId: 'r2', playerId: 'player-1', type: 'GREENIE', amount: 10 })
            ];
        });

        test('payoutsByRound filters by roundId', () => {
            expect(store.payoutsByRound('r1')).toHaveLength(2);
            expect(store.payoutsByRound('r2')).toHaveLength(1);
            expect(store.payoutsByRound('r99')).toHaveLength(0);
        });

        test('payoutsByPlayer filters by playerId', () => {
            expect(store.payoutsByPlayer('player-1')).toHaveLength(2);
            expect(store.payoutsByPlayer('player-2')).toHaveLength(1);
        });

        test('roundTotal sums amounts for a round', () => {
            expect(store.roundTotal('r1')).toBe(65);
            expect(store.roundTotal('r2')).toBe(10);
            expect(store.roundTotal('r99')).toBe(0);
        });

        test('roundPayoutsByType filters by round and type', () => {
            expect(store.roundPayoutsByType('r1', 'GREENIE')).toHaveLength(1);
            expect(store.roundPayoutsByType('r1', 'TEAM_WIN')).toHaveLength(1);
            expect(store.roundPayoutsByType('r2', 'TEAM_WIN')).toHaveLength(0);
        });

        test('allPayouts returns full list', () => {
            expect(store.allPayouts).toHaveLength(3);
        });
    });

    // ─── createPayout ────────────────────────────────────────────────────────

    describe('createPayout', () => {
        test('posts to round payouts URL and adds to state', async () => {
            const created = makePayout({ id: 'new-p' });
            ApiService.post.mockResolvedValue(created);

            const result = await store.createPayout({
                roundId: 'round-1',
                playerId: 'player-1',
                type: 'GREENIE',
                amount: 25,
                note: 'Hole 5'
            });

            expect(ApiService.post).toHaveBeenCalledWith(
                '/competitions/c1/rounds/round-1/payouts',
                { playerId: 'player-1', type: 'GREENIE', amount: 25, note: 'Hole 5' }
            );
            expect(store.payouts).toHaveLength(1);
            expect(result.id).toBe('new-p');
        });

        test('converts empty note to null in request', async () => {
            ApiService.post.mockResolvedValue(makePayout());

            await store.createPayout({ roundId: 'r1', playerId: 'p1', type: 'GREENIE', amount: 10, note: '' });

            expect(ApiService.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ note: null })
            );
        });

        test('updates player winnings after create', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 0 }];
            ApiService.post.mockResolvedValue(makePayout({ playerId: 'player-1', amount: 30 }));

            await store.createPayout({ roundId: 'r1', playerId: 'player-1', type: 'GREENIE', amount: 30 });

            expect(playersStore.players[0].winnings).toBe(30);
        });
    });

    // ─── recordTeamWin ───────────────────────────────────────────────────────

    describe('recordTeamWin', () => {
        test('posts to team-win URL and adds all splits to state', async () => {
            const splits = [
                makePayout({ id: 'tw-1', playerId: 'p1', type: 'TEAM_WIN', amount: 40 }),
                makePayout({ id: 'tw-2', playerId: 'p2', type: 'TEAM_WIN', amount: 40 })
            ];
            ApiService.post.mockResolvedValue(splits);

            const result = await store.recordTeamWin({
                roundId: 'round-1',
                teamId: 'team-1',
                teamAmount: 80
            });

            expect(ApiService.post).toHaveBeenCalledWith(
                '/competitions/c1/rounds/round-1/payouts/team-win',
                { teamId: 'team-1', teamAmount: 80 }
            );
            expect(store.payouts).toHaveLength(2);
            expect(result).toHaveLength(2);
        });

        test('updates winnings for each unique player', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [
                { id: 'p1', name: 'Alice', winnings: 0 },
                { id: 'p2', name: 'Bob', winnings: 0 }
            ];
            ApiService.post.mockResolvedValue([
                makePayout({ id: 'tw-1', playerId: 'p1', type: 'TEAM_WIN', amount: 40 }),
                makePayout({ id: 'tw-2', playerId: 'p2', type: 'TEAM_WIN', amount: 40 })
            ]);

            await store.recordTeamWin({ roundId: 'r1', teamId: 'team-1', teamAmount: 80 });

            expect(playersStore.players[0].winnings).toBe(40);
            expect(playersStore.players[1].winnings).toBe(40);
        });

        test('handles null response gracefully', async () => {
            ApiService.post.mockResolvedValue(null);

            const result = await store.recordTeamWin({ roundId: 'r1', teamId: 't1', teamAmount: 80 });

            expect(result).toHaveLength(0);
            expect(store.payouts).toHaveLength(0);
        });
    });

    // ─── updatePayout ────────────────────────────────────────────────────────

    describe('updatePayout', () => {
        beforeEach(() => {
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25 })];
        });

        test('puts to payouts URL and updates state', async () => {
            const updated = makePayout({ id: 'payout-1', amount: 50, note: 'Updated' });
            ApiService.put.mockResolvedValue(updated);

            const result = await store.updatePayout({ id: 'payout-1', updates: { amount: 50, note: 'Updated' } });

            expect(ApiService.put).toHaveBeenCalledWith(
                '/competitions/c1/payouts/payout-1',
                expect.objectContaining({ amount: 50, note: 'Updated' })
            );
            expect(store.payouts[0].amount).toBe(50);
            expect(result.amount).toBe(50);
        });

        test('uses existing payout fields for omitted updates', async () => {
            const updated = makePayout({ id: 'payout-1', amount: 25, type: 'TEAM_WIN' });
            ApiService.put.mockResolvedValue(updated);

            await store.updatePayout({ id: 'payout-1', updates: { type: 'TEAM_WIN' } });

            expect(ApiService.put).toHaveBeenCalledWith(
                '/competitions/c1/payouts/payout-1',
                expect.objectContaining({ playerId: 'player-1', amount: 25 })
            );
        });

        test('appends to state when payout not found in list', async () => {
            const updated = makePayout({ id: 'brand-new', playerId: 'player-1', amount: 20 });
            ApiService.put.mockResolvedValue(updated);

            await store.updatePayout({ id: 'brand-new', updates: { amount: 20 } });

            expect(store.payouts).toHaveLength(2);
        });

        test('recalculates winnings for previous player when player changes', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [
                { id: 'player-1', name: 'Alice', winnings: 25 },
                { id: 'player-2', name: 'Bob', winnings: 0 }
            ];
            const updated = makePayout({ id: 'payout-1', playerId: 'player-2', amount: 25 });
            ApiService.put.mockResolvedValue(updated);

            await store.updatePayout({ id: 'payout-1', updates: { playerId: 'player-2' } });

            // player-1 had the payout removed, player-2 gained it
            expect(playersStore.players[0].winnings).toBe(0);
            expect(playersStore.players[1].winnings).toBe(25);
        });
    });

    // ─── deletePayout ────────────────────────────────────────────────────────

    describe('deletePayout', () => {
        test('calls DELETE and removes payout from state', async () => {
            store.payouts = [makePayout({ id: 'payout-1' })];
            ApiService.delete.mockResolvedValue(undefined);

            await store.deletePayout('payout-1');

            expect(ApiService.delete).toHaveBeenCalledWith('/competitions/c1/payouts/payout-1');
            expect(store.payouts).toHaveLength(0);
        });

        test('updates player winnings after delete', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 25 }];
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25 })];
            ApiService.delete.mockResolvedValue(undefined);

            await store.deletePayout('payout-1');

            expect(playersStore.players[0].winnings).toBe(0);
        });

        test('does not crash when deleting unknown id', async () => {
            store.payouts = [];
            ApiService.delete.mockResolvedValue(undefined);

            await store.deletePayout('ghost-id');

            expect(store.payouts).toHaveLength(0);
        });
    });

    // ─── _refreshPlayerWinnings ──────────────────────────────────────────────

    describe('_refreshPlayerWinnings', () => {
        test('sums all payouts for the player across all rounds', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'p1', name: 'Alice', winnings: 0 }];
            store.payouts = [
                makePayout({ id: 'a', playerId: 'p1', amount: 25 }),
                makePayout({ id: 'b', playerId: 'p1', amount: 40 }),
                makePayout({ id: 'c', playerId: 'p2', amount: 100 })
            ];

            await store._refreshPlayerWinnings('p1');

            expect(playersStore.players[0].winnings).toBe(65);
        });

        test('does nothing when player not found in players store', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [];

            await expect(store._refreshPlayerWinnings('unknown')).resolves.toBeUndefined();
        });
    });
});
