jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        playersUrl: jest.fn((id) => id ? `/competitions/c1/players/${id}` : '/competitions/c1/players')
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { usePlayersStore } from '../src/stores/players';

describe('Players Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.competitionId = 'c1';
        ApiService.get.mockReset();
        ApiService.post.mockReset();
        ApiService.put.mockReset();
        ApiService.delete.mockReset();
    });

    test('fetchPlayers populates store from API response', async () => {
        const store = usePlayersStore();
        const apiPlayers = [
            { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 0, teamId: null, teamName: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
        ];
        ApiService.get.mockResolvedValue(apiPlayers);

        await store.fetchPlayers();

        expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/players');
        expect(store.players).toHaveLength(1);
        expect(store.players[0]).toMatchObject({
            id: 'p1',
            name: 'Alice',
            talentRating: 'A',
            entryFee: 100,
            winnings: 0,
            teamId: null
        });
    });

    test('addPlayer calls API and adds returned player to state', async () => {
        const store = usePlayersStore();
        const created = {
            id: 'p-new',
            name: 'Bob',
            talentRating: 'B',
            entryFee: 50,
            winnings: 0,
            teamId: null,
            teamName: null,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01'
        };
        ApiService.post.mockResolvedValue(created);

        const id = await store.addPlayer({ name: 'Bob', talentRating: 'B', entryFee: 50, winnings: 0 });

        expect(ApiService.post).toHaveBeenCalledWith('/competitions/c1/players', {
            name: 'Bob',
            nickname: null,
            talentRating: 'B',
            entryFee: 50
        });
        expect(id).toBe('p-new');
        expect(store.players).toHaveLength(1);
        expect(store.players[0].name).toBe('Bob');
    });

    test('updatePlayer calls API and updates state', async () => {
        const store = usePlayersStore();
        store.players = [
            { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 0, teamId: null, teamName: null, createdAt: '', updatedAt: '' }
        ];
        const updated = { id: 'p1', name: 'Alice X', talentRating: 'A', entryFee: 100, winnings: 10, teamId: null, teamName: null, createdAt: '', updatedAt: '' };
        ApiService.put.mockResolvedValue(updated);

        await store.updatePlayer({ id: 'p1', updates: { name: 'Alice X', winnings: 10 } });

        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/players/p1', expect.any(Object));
        expect(store.players[0].name).toBe('Alice X');
        expect(store.players[0].winnings).toBe(10);
    });

    test('deletePlayer calls API and removes from state', async () => {
        const store = usePlayersStore();
        store.players = [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: null, teamName: null, createdAt: '', updatedAt: '' }];
        ApiService.delete.mockResolvedValue(undefined);

        await store.deletePlayer('p1');

        expect(ApiService.delete).toHaveBeenCalledWith('/competitions/c1/players/p1');
        expect(store.players).toHaveLength(0);
    });

    test('assignPlayerToTeam calls assign endpoint', async () => {
        const store = usePlayersStore();
        store.players = [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: null, teamName: null, createdAt: '', updatedAt: '' }];
        const assigned = { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: 't1', teamName: 'Team 1', createdAt: '', updatedAt: '' };
        ApiService.put.mockResolvedValue(assigned);

        await store.assignPlayerToTeam({ playerId: 'p1', teamId: 't1' });

        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/players/p1/assign', { teamId: 't1' });
        expect(store.players[0].teamId).toBe('t1');
    });

    test('unassignPlayerFromTeam calls unassign endpoint', async () => {
        const store = usePlayersStore();
        store.players = [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: 't1', teamName: 'T1', createdAt: '', updatedAt: '' }];
        const unassigned = { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: null, teamName: null, createdAt: '', updatedAt: '' };
        ApiService.put.mockResolvedValue(unassigned);

        await store.unassignPlayerFromTeam('p1');

        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/players/p1/unassign');
        expect(store.players[0].teamId).toBeNull();
    });

    test('API failure does not corrupt state', async () => {
        const store = usePlayersStore();
        store.players = [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 0, winnings: 0, teamId: null, teamName: null, createdAt: '', updatedAt: '' }];
        ApiService.put.mockRejectedValue(new Error('Network error'));

        await expect(store.updatePlayer({ id: 'p1', updates: { name: 'X' } })).rejects.toThrow('Network error');
        expect(store.players).toHaveLength(1);
        expect(store.players[0].name).toBe('Alice');
    });

    test('mapPlayerResponse converts BigDecimal to number', async () => {
        const store = usePlayersStore();
        ApiService.get.mockResolvedValue([
            { id: 'p1', name: 'A', talentRating: 'A', entryFee: '100.50', winnings: '25.25', teamId: null, teamName: null, createdAt: '', updatedAt: '' }
        ]);
        await store.fetchPlayers();
        expect(store.players[0].entryFee).toBe(100.5);
        expect(store.players[0].winnings).toBe(25.25);
    });

    describe('copyPlayersFromCompetition', () => {
        const makeCreated = (id, name, rating) => ({
            id, name, talentRating: rating, entryFee: 0, winnings: 0,
            teamId: null, teamName: null, createdAt: '', updatedAt: ''
        });

        test('fetches from source competition URL and adds each player', async () => {
            const store = usePlayersStore();
            const sourcePlayers = [
                { id: 'src-p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 50, teamId: 't1' },
                { id: 'src-p2', name: 'Bob',   talentRating: 'B', entryFee: 200, winnings: 0,  teamId: null }
            ];
            ApiService.get.mockResolvedValue(sourcePlayers);
            ApiService.post
                .mockResolvedValueOnce(makeCreated('new-p1', 'Alice', 'A'))
                .mockResolvedValueOnce(makeCreated('new-p2', 'Bob', 'B'));

            const count = await store.copyPlayersFromCompetition('src-comp-id');

            expect(ApiService.get).toHaveBeenCalledWith('/competitions/src-comp-id/players');
            expect(ApiService.post).toHaveBeenCalledTimes(2);
            expect(count).toBe(2);
            expect(store.players).toHaveLength(2);
        });

        test('resets entryFee to 0 regardless of source values', async () => {
            const store = usePlayersStore();
            ApiService.get.mockResolvedValue([
                { id: 'src-p1', name: 'Alice', talentRating: 'A', entryFee: 999, winnings: 500, teamId: null }
            ]);
            ApiService.post.mockResolvedValue(makeCreated('new-p1', 'Alice', 'A'));

            await store.copyPlayersFromCompetition('src-comp-id');

            expect(ApiService.post).toHaveBeenCalledWith(
                '/competitions/c1/players',
                expect.objectContaining({ entryFee: 0 })
            );
        });

        test('copies name and talentRating from source player', async () => {
            const store = usePlayersStore();
            ApiService.get.mockResolvedValue([
                { id: 'src-p1', name: 'Carol', talentRating: 'C', entryFee: 0, winnings: 0, teamId: null }
            ]);
            ApiService.post.mockResolvedValue(makeCreated('new-p1', 'Carol', 'C'));

            await store.copyPlayersFromCompetition('src-comp-id');

            expect(ApiService.post).toHaveBeenCalledWith(
                '/competitions/c1/players',
                expect.objectContaining({ name: 'Carol', talentRating: 'C' })
            );
        });

        test('returns 0 and makes no API calls when source has no players', async () => {
            const store = usePlayersStore();
            ApiService.get.mockResolvedValue([]);

            const count = await store.copyPlayersFromCompetition('empty-comp');

            expect(count).toBe(0);
            expect(ApiService.post).not.toHaveBeenCalled();
            expect(store.players).toHaveLength(0);
        });

        test('handles null API response without throwing', async () => {
            const store = usePlayersStore();
            ApiService.get.mockResolvedValue(null);

            const count = await store.copyPlayersFromCompetition('src-comp-id');

            expect(count).toBe(0);
            expect(ApiService.post).not.toHaveBeenCalled();
        });

        test('does not copy teamId — new players start unassigned', async () => {
            const store = usePlayersStore();
            ApiService.get.mockResolvedValue([
                { id: 'src-p1', name: 'Dave', talentRating: 'D', entryFee: 0, winnings: 0, teamId: 't99' }
            ]);
            ApiService.post.mockResolvedValue(makeCreated('new-p1', 'Dave', 'D'));

            await store.copyPlayersFromCompetition('src-comp-id');

            const postPayload = ApiService.post.mock.calls[0][1];
            expect(postPayload).not.toHaveProperty('teamId');
        });

        test('appends copied players without replacing existing ones', async () => {
            const store = usePlayersStore();
            store.players = [makeCreated('existing-p1', 'Existing', 'A')];
            ApiService.get.mockResolvedValue([
                { id: 'src-p1', name: 'New Player', talentRating: 'B', entryFee: 0, winnings: 0, teamId: null }
            ]);
            ApiService.post.mockResolvedValue(makeCreated('new-p1', 'New Player', 'B'));

            await store.copyPlayersFromCompetition('src-comp-id');

            expect(store.players).toHaveLength(2);
            expect(store.players.map(p => p.name)).toEqual(['Existing', 'New Player']);
        });
    });
});
