jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        teamsUrl: jest.fn((id) => id ? `/competitions/c1/teams/${id}` : '/competitions/c1/teams')
    }
}));

const mockFetchPlayers = jest.fn().mockResolvedValue(undefined);
jest.mock('@/stores/players', () => ({
    usePlayersStore: () => ({
        fetchPlayers: mockFetchPlayers
    })
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useTeamsStore } from '../src/stores/teams';

describe('Teams Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.get.mockReset();
        ApiService.post.mockReset();
        ApiService.put.mockReset();
        ApiService.delete.mockReset();
        mockFetchPlayers.mockClear();
    });

    test('fetchTeams populates store from API response', async () => {
        const store = useTeamsStore();
        const apiTeams = [
            { id: 't1', name: 'Team Alpha', logoUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
        ];
        ApiService.get.mockResolvedValue(apiTeams);

        await store.fetchTeams();

        expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/teams');
        expect(store.teams).toHaveLength(1);
        expect(store.teams[0]).toMatchObject({ id: 't1', name: 'Team Alpha' });
    });

    test('addTeam calls API and adds returned team to state', async () => {
        const store = useTeamsStore();
        const created = { id: 't-new', name: 'New Team', logoUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
        ApiService.post.mockResolvedValue(created);

        const id = await store.addTeam({ name: 'New Team' });

        expect(ApiService.post).toHaveBeenCalledWith('/competitions/c1/teams', { name: 'New Team', logoUrl: null });
        expect(id).toBe('t-new');
        expect(store.teams).toHaveLength(1);
        expect(store.teams[0].name).toBe('New Team');
    });

    test('deleteTeam calls API, removes from state, and re-fetches players', async () => {
        const store = useTeamsStore();
        store.teams = [{ id: 't1', name: 'T1', logoUrl: null, createdAt: '', updatedAt: '' }];
        ApiService.delete.mockResolvedValue(undefined);

        await store.deleteTeam('t1');

        expect(ApiService.delete).toHaveBeenCalledWith('/competitions/c1/teams/t1');
        expect(store.teams).toHaveLength(0);
        expect(mockFetchPlayers).toHaveBeenCalled();
    });

    test('deleteAllTeams calls delete and re-fetches players', async () => {
        const store = useTeamsStore();
        store.teams = [{ id: 't1', name: 'T1', logoUrl: null, createdAt: '', updatedAt: '' }];
        ApiService.delete.mockResolvedValue(undefined);

        await store.deleteAllTeams();

        expect(ApiService.delete).toHaveBeenCalledWith('/competitions/c1/teams');
        expect(store.teams).toHaveLength(0);
        expect(mockFetchPlayers).toHaveBeenCalled();
    });

    test('generateTeams calls generate endpoint and re-fetches both stores', async () => {
        const store = useTeamsStore();
        ApiService.post.mockResolvedValue(undefined);
        ApiService.get.mockResolvedValue([
            { id: 't1', name: 'Team 1', logoUrl: null, createdAt: '', updatedAt: '' },
            { id: 't2', name: 'Team 2', logoUrl: null, createdAt: '', updatedAt: '' }
        ]);

        const ids = await store.generateTeams(2);

        expect(ApiService.post).toHaveBeenCalledWith('/competitions/c1/teams/generate', { numberOfTeams: 2 });
        expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/teams');
        expect(mockFetchPlayers).toHaveBeenCalled();
        expect(ids).toHaveLength(2);
    });

    test('updateTeam calls API and updates state', async () => {
        const store = useTeamsStore();
        store.teams = [{ id: 't1', name: 'Old', logoUrl: null, createdAt: '', updatedAt: '' }];
        const updated = { id: 't1', name: 'New Name', logoUrl: 'data:image/x', createdAt: '', updatedAt: '' };
        ApiService.put.mockResolvedValue(updated);

        await store.updateTeam({ id: 't1', updates: { name: 'New Name', logoUrl: 'data:image/x' } });

        expect(store.teams[0].name).toBe('New Name');
        expect(store.teams[0].logoUrl).toBe('data:image/x');
    });

    test('uploadTeamLogo updates team via PUT', async () => {
        const store = useTeamsStore();
        store.teams = [{ id: 't1', name: 'T1', logoUrl: null, createdAt: '', updatedAt: '' }];
        ApiService.put.mockResolvedValue({ id: 't1', name: 'T1', logoUrl: 'data:base64', createdAt: '', updatedAt: '' });

        await store.uploadTeamLogo({ teamId: 't1', logoUrl: 'data:base64' });

        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/teams/t1', { name: 'T1', logoUrl: 'data:base64' });
    });

    test('updateTeam preserves logoUrl from updates when server response omits it', async () => {
        const store = useTeamsStore();
        store.teams = [{ id: 't1', name: 'T1', logoUrl: null, createdAt: '', updatedAt: '' }];
        // Server returns null logoUrl (stripped in serialization)
        ApiService.put.mockResolvedValue({ id: 't1', name: 'T1', logoUrl: null, createdAt: '', updatedAt: '' });

        await store.updateTeam({ id: 't1', updates: { logoUrl: 'data:image/png;base64,abc' } });

        expect(store.teams[0].logoUrl).toBe('data:image/png;base64,abc');
    });

    test('updateTeam pushes to state when team not found after update', async () => {
        const store = useTeamsStore();
        store.teams = [];
        ApiService.put.mockResolvedValue({ id: 't-new', name: 'New', logoUrl: null, createdAt: '', updatedAt: '' });

        await store.updateTeam({ id: 't-new', updates: { name: 'New' } });

        expect(store.teams).toHaveLength(1);
        expect(store.teams[0].id).toBe('t-new');
    });
});
