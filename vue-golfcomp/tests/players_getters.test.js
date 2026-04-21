/**
 * Tests for players store getters and unassignAllPlayers action.
 * Core CRUD actions are covered in players.test.js.
 */

jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
        playersUrl: jest.fn((id) => id ? `/competitions/c1/players/${id}` : '/competitions/c1/players')
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { usePlayersStore } from '../src/stores/players';

const makePlayer = (overrides = {}) => ({
    id: 'p1',
    name: 'Alice',
    talentRating: 'A',
    entryFee: 100,
    winnings: 50,
    teamId: null,
    teamName: null,
    createdAt: '',
    updatedAt: '',
    ...overrides
});

describe('Players Store - Getters', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = usePlayersStore();
    });

    describe('playerById', () => {
        test('returns player with matching id', () => {
            store.players = [makePlayer(), makePlayer({ id: 'p2', name: 'Bob' })];
            expect(store.playerById('p2').name).toBe('Bob');
        });

        test('returns undefined for unknown id', () => {
            store.players = [makePlayer()];
            expect(store.playerById('nobody')).toBeUndefined();
        });
    });

    describe('playersByTeam', () => {
        test('returns players assigned to the given team', () => {
            store.players = [
                makePlayer({ id: 'p1', teamId: 't1' }),
                makePlayer({ id: 'p2', teamId: 't2' }),
                makePlayer({ id: 'p3', teamId: 't1' })
            ];
            const team1Players = store.playersByTeam('t1');
            expect(team1Players).toHaveLength(2);
            expect(team1Players.map(p => p.id)).toEqual(['p1', 'p3']);
        });

        test('returns empty array when no players on team', () => {
            store.players = [makePlayer({ teamId: 't1' })];
            expect(store.playersByTeam('t2')).toHaveLength(0);
        });
    });

    describe('unassignedPlayers', () => {
        test('returns players with no team', () => {
            store.players = [
                makePlayer({ id: 'p1', teamId: null }),
                makePlayer({ id: 'p2', teamId: 't1' }),
                makePlayer({ id: 'p3', teamId: null })
            ];
            const unassigned = store.unassignedPlayers;
            expect(unassigned).toHaveLength(2);
            expect(unassigned.map(p => p.id)).toEqual(['p1', 'p3']);
        });

        test('returns empty array when all players are assigned', () => {
            store.players = [makePlayer({ teamId: 't1' })];
            expect(store.unassignedPlayers).toHaveLength(0);
        });
    });

    describe('playerCount', () => {
        test('returns number of players', () => {
            store.players = [makePlayer(), makePlayer({ id: 'p2' })];
            expect(store.playerCount).toBe(2);
        });

        test('returns 0 when empty', () => {
            expect(store.playerCount).toBe(0);
        });
    });

    describe('playersByTalentRating', () => {
        test('returns players matching the rating', () => {
            store.players = [
                makePlayer({ id: 'p1', talentRating: 'A' }),
                makePlayer({ id: 'p2', talentRating: 'B' }),
                makePlayer({ id: 'p3', talentRating: 'A' })
            ];
            expect(store.playersByTalentRating('A')).toHaveLength(2);
            expect(store.playersByTalentRating('B')).toHaveLength(1);
            expect(store.playersByTalentRating('C')).toHaveLength(0);
        });
    });

    describe('totalEntryFees', () => {
        test('sums entry fees across all players', () => {
            store.players = [
                makePlayer({ entryFee: 100 }),
                makePlayer({ id: 'p2', entryFee: 50 }),
                makePlayer({ id: 'p3', entryFee: 75 })
            ];
            expect(store.totalEntryFees).toBe(225);
        });

        test('handles string values from API', () => {
            store.players = [makePlayer({ entryFee: '100.50' }), makePlayer({ id: 'p2', entryFee: '25.25' })];
            expect(store.totalEntryFees).toBeCloseTo(125.75);
        });

        test('returns 0 when no players', () => {
            expect(store.totalEntryFees).toBe(0);
        });
    });

    describe('totalWinnings', () => {
        test('sums winnings across all players', () => {
            store.players = [
                makePlayer({ winnings: 200 }),
                makePlayer({ id: 'p2', winnings: 150 })
            ];
            expect(store.totalWinnings).toBe(350);
        });

        test('returns 0 when no players', () => {
            expect(store.totalWinnings).toBe(0);
        });
    });

    describe('outstanding getters', () => {
        // eslint-disable-next-line global-require
        const { usePayoutsStore } = require('../src/stores/payouts');

        test('outstandingByPlayer returns unpaid total for a player', () => {
            const payoutsStore = usePayoutsStore();
            payoutsStore.payouts = [
                { id: 'x1', playerId: 'p1', amount: 30, paid: false },
                { id: 'x2', playerId: 'p1', amount: 20, paid: true },
                { id: 'x3', playerId: 'p2', amount: 10, paid: false }
            ];

            expect(store.outstandingByPlayer('p1')).toBe(30);
            expect(store.outstandingByPlayer('p2')).toBe(10);
            expect(store.outstandingByPlayer('ghost')).toBe(0);
        });

        test('totalOutstandingWinnings sums all unpaid payouts', () => {
            const payoutsStore = usePayoutsStore();
            payoutsStore.payouts = [
                { id: 'x1', playerId: 'p1', amount: 30, paid: false },
                { id: 'x2', playerId: 'p1', amount: 20, paid: true },
                { id: 'x3', playerId: 'p2', amount: 10, paid: false }
            ];

            expect(store.totalOutstandingWinnings).toBe(40);
        });

        test('totalOutstandingWinnings is 0 when all paid', () => {
            const payoutsStore = usePayoutsStore();
            payoutsStore.payouts = [
                { id: 'x1', playerId: 'p1', amount: 30, paid: true }
            ];

            expect(store.totalOutstandingWinnings).toBe(0);
        });
    });
});

describe('Players Store - unassignAllPlayers', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.put.mockReset();
    });

    test('calls unassign for each assigned player', async () => {
        const store = usePlayersStore();
        store.players = [
            makePlayer({ id: 'p1', teamId: 't1' }),
            makePlayer({ id: 'p2', teamId: null }),
            makePlayer({ id: 'p3', teamId: 't2' })
        ];

        const unassignedP1 = makePlayer({ id: 'p1', teamId: null });
        const unassignedP3 = makePlayer({ id: 'p3', teamId: null });
        ApiService.put
            .mockResolvedValueOnce(unassignedP1)
            .mockResolvedValueOnce(unassignedP3);

        await store.unassignAllPlayers();

        expect(ApiService.put).toHaveBeenCalledTimes(2);
        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/players/p1/unassign');
        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/players/p3/unassign');
    });

    test('does nothing when no players are assigned', async () => {
        const store = usePlayersStore();
        store.players = [makePlayer({ teamId: null })];

        await store.unassignAllPlayers();

        expect(ApiService.put).not.toHaveBeenCalled();
    });
});

describe('Players Store - updatePlayer edge cases', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.put.mockReset();
    });

    test('pushes player to state when id not found', async () => {
        const store = usePlayersStore();
        store.players = [];
        const updated = makePlayer({ id: 'p-new', name: 'New Player' });
        ApiService.put.mockResolvedValue(updated);

        await store.updatePlayer({ id: 'p-new', updates: { name: 'New Player' } });

        expect(store.players).toHaveLength(1);
        expect(store.players[0].id).toBe('p-new');
    });
});

describe('Players Store - assign/unassign edge cases', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.put.mockReset();
    });

    test('assignPlayerToTeam pushes player when not in state', async () => {
        const store = usePlayersStore();
        store.players = [];
        ApiService.put.mockResolvedValue(makePlayer({ id: 'p1', teamId: 't1' }));

        await store.assignPlayerToTeam({ playerId: 'p1', teamId: 't1' });

        expect(store.players).toHaveLength(1);
        expect(store.players[0].teamId).toBe('t1');
    });

    test('unassignPlayerFromTeam pushes player when not in state', async () => {
        const store = usePlayersStore();
        store.players = [];
        ApiService.put.mockResolvedValue(makePlayer({ id: 'p1', teamId: null }));

        await store.unassignPlayerFromTeam('p1');

        expect(store.players).toHaveLength(1);
        expect(store.players[0].teamId).toBeNull();
    });
});
