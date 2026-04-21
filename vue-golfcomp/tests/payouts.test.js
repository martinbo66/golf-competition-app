/**
 * Payouts store tests.
 * Note: player.winnings reflects PAID payouts only (semantic change introduced
 * alongside the paid/paidAt fields). Unpaid payouts do not bump winnings.
 */
jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        payoutsUrl: jest.fn(id => id ? `/competitions/c1/payouts/${id}` : '/competitions/c1/payouts'),
        roundPayoutsUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts`),
        teamWinPayoutUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts/team-win`),
        markPayoutPaidUrl: jest.fn(id => `/competitions/c1/payouts/${id}/paid`)
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
    paid: false,
    paidAt: null,
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
        ApiService.patch.mockReset();
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

        test('maps paid and paidAt fields', async () => {
            ApiService.get.mockResolvedValue([
                makePayout({ paid: true, paidAt: '2026-06-02T12:00:00Z' }),
                makePayout({ id: 'p2', paid: false })
            ]);

            await store.fetchPayouts();

            expect(store.payouts[0].paid).toBe(true);
            expect(store.payouts[0].paidAt).toBe('2026-06-02T12:00:00Z');
            expect(store.payouts[1].paid).toBe(false);
            expect(store.payouts[1].paidAt).toBeNull();
        });

        test('handles null/missing optional fields', async () => {
            ApiService.get.mockResolvedValue([makePayout({ teamId: null, teamName: null, note: null, paid: undefined })]);

            await store.fetchPayouts();

            expect(store.payouts[0].teamId).toBeNull();
            expect(store.payouts[0].teamName).toBeNull();
            expect(store.payouts[0].note).toBe('');
            expect(store.payouts[0].paid).toBe(false);
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
                makePayout({ id: 'p1', roundId: 'r1', playerId: 'player-1', type: 'GREENIE', amount: 25, paid: true }),
                makePayout({ id: 'p2', roundId: 'r1', playerId: 'player-2', type: 'TEAM_WIN', amount: 40, paid: false }),
                makePayout({ id: 'p3', roundId: 'r2', playerId: 'player-1', type: 'GREENIE', amount: 10, paid: false })
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

        test('roundTotal sums all amounts for a round regardless of paid', () => {
            expect(store.roundTotal('r1')).toBe(65);
            expect(store.roundTotal('r2')).toBe(10);
            expect(store.roundTotal('r99')).toBe(0);
        });

        test('roundPaidTotal sums only paid payouts for a round', () => {
            expect(store.roundPaidTotal('r1')).toBe(25);
            expect(store.roundPaidTotal('r2')).toBe(0);
        });

        test('roundUnpaidTotal sums only unpaid payouts for a round', () => {
            expect(store.roundUnpaidTotal('r1')).toBe(40);
            expect(store.roundUnpaidTotal('r2')).toBe(10);
        });

        test('paidTotalByPlayer sums paid payouts for a player', () => {
            expect(store.paidTotalByPlayer('player-1')).toBe(25);
            expect(store.paidTotalByPlayer('player-2')).toBe(0);
        });

        test('unpaidTotalByPlayer sums unpaid payouts for a player', () => {
            expect(store.unpaidTotalByPlayer('player-1')).toBe(10);
            expect(store.unpaidTotalByPlayer('player-2')).toBe(40);
        });

        test('competitionUnpaidTotal sums all unpaid payouts', () => {
            expect(store.competitionUnpaidTotal).toBe(50);
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

        test('does not bump winnings when new payout is unpaid (default)', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 0 }];
            ApiService.post.mockResolvedValue(makePayout({ playerId: 'player-1', amount: 30, paid: false }));

            await store.createPayout({ roundId: 'r1', playerId: 'player-1', type: 'GREENIE', amount: 30 });

            expect(playersStore.players[0].winnings).toBe(0);
        });

        test('bumps winnings when new payout is already paid', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 0 }];
            ApiService.post.mockResolvedValue(makePayout({ playerId: 'player-1', amount: 30, paid: true }));

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

        test('does not bump winnings when team-win splits are unpaid', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [
                { id: 'p1', name: 'Alice', winnings: 0 },
                { id: 'p2', name: 'Bob', winnings: 0 }
            ];
            ApiService.post.mockResolvedValue([
                makePayout({ id: 'tw-1', playerId: 'p1', type: 'TEAM_WIN', amount: 40, paid: false }),
                makePayout({ id: 'tw-2', playerId: 'p2', type: 'TEAM_WIN', amount: 40, paid: false })
            ]);

            await store.recordTeamWin({ roundId: 'r1', teamId: 'team-1', teamAmount: 80 });

            expect(playersStore.players[0].winnings).toBe(0);
            expect(playersStore.players[1].winnings).toBe(0);
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
            // previous player had a PAID payout of $25; winnings should drop to 0 after reassignment
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: true })];
            const playersStore = usePlayersStore();
            playersStore.players = [
                { id: 'player-1', name: 'Alice', winnings: 25 },
                { id: 'player-2', name: 'Bob', winnings: 0 }
            ];
            const updated = makePayout({ id: 'payout-1', playerId: 'player-2', amount: 25, paid: true });
            ApiService.put.mockResolvedValue(updated);

            await store.updatePayout({ id: 'payout-1', updates: { playerId: 'player-2' } });

            expect(playersStore.players[0].winnings).toBe(0);
            expect(playersStore.players[1].winnings).toBe(25);
        });
    });

    // ─── setPayoutPaid ───────────────────────────────────────────────────────

    describe('setPayoutPaid', () => {
        test('PATCHes the paid URL and updates state', async () => {
            store.payouts = [makePayout({ id: 'payout-1', paid: false })];
            ApiService.patch.mockResolvedValue(makePayout({ id: 'payout-1', paid: true, paidAt: '2026-06-02T12:00:00Z' }));

            const result = await store.setPayoutPaid({ id: 'payout-1', paid: true });

            expect(ApiService.patch).toHaveBeenCalledWith(
                '/competitions/c1/payouts/payout-1/paid',
                { paid: true }
            );
            expect(store.payouts[0].paid).toBe(true);
            expect(store.payouts[0].paidAt).toBe('2026-06-02T12:00:00Z');
            expect(result.paid).toBe(true);
        });

        test('bumps player winnings when flipped to paid', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 0 }];
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: false })];
            ApiService.patch.mockResolvedValue(makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: true, paidAt: 'now' }));

            await store.setPayoutPaid({ id: 'payout-1', paid: true });

            expect(playersStore.players[0].winnings).toBe(25);
        });

        test('drops player winnings when flipped back to unpaid', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 25 }];
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: true, paidAt: 'now' })];
            ApiService.patch.mockResolvedValue(makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: false, paidAt: null }));

            await store.setPayoutPaid({ id: 'payout-1', paid: false });

            expect(playersStore.players[0].winnings).toBe(0);
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

        test('updates player winnings after delete of a PAID payout', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'player-1', name: 'Alice', winnings: 25 }];
            store.payouts = [makePayout({ id: 'payout-1', playerId: 'player-1', amount: 25, paid: true })];
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
        test('sums only paid payouts for the player across all rounds', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [{ id: 'p1', name: 'Alice', winnings: 0 }];
            store.payouts = [
                makePayout({ id: 'a', playerId: 'p1', amount: 25, paid: true }),
                makePayout({ id: 'b', playerId: 'p1', amount: 40, paid: false }),
                makePayout({ id: 'c', playerId: 'p2', amount: 100, paid: true })
            ];

            await store._refreshPlayerWinnings('p1');

            expect(playersStore.players[0].winnings).toBe(25);
        });

        test('does nothing when player not found in players store', async () => {
            const playersStore = usePlayersStore();
            playersStore.players = [];

            await expect(store._refreshPlayerWinnings('unknown')).resolves.toBeUndefined();
        });
    });
});
