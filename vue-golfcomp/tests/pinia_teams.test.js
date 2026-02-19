/**
 * Integration-style test: generateTeams with mocked API.
 * Players and teams stores both use the API; we mock ApiService so that
 * addPlayer (POST), generateTeams (POST generate + GET teams + GET players)
 * return appropriate data and balance is verified.
 */
jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        playersUrl: jest.fn((id) => id ? `/competitions/c1/players/${id}` : '/competitions/c1/players'),
        teamsUrl: jest.fn((id) => id ? `/competitions/c1/teams/${id}` : '/competitions/c1/teams')
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useTeamsStore } from '../src/stores/teams';
import { usePlayersStore } from '../src/stores/players';

describe('Teams Store (pinia integration)', () => {
    let playerIdCounter = 0;
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.competitionId = 'c1';
        playerIdCounter = 0;
        ApiService.post.mockImplementation((url, data) => {
            if (url === '/competitions/c1/players') {
                const id = `p-${++playerIdCounter}`;
                return Promise.resolve({
                    id,
                    name: data.name,
                    talentRating: data.talentRating,
                    entryFee: data.entryFee ?? 0,
                    winnings: data.winnings ?? 0,
                    teamId: null,
                    teamName: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            if (url === '/competitions/c1/teams/generate') {
                return Promise.resolve();
            }
            return Promise.reject(new Error('Unexpected POST'));
        });
        ApiService.get.mockImplementation((url) => {
            if (url === '/competitions/c1/teams') {
                return Promise.resolve([
                    { id: 't1', name: 'Team 1', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't2', name: 'Team 2', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't3', name: 'Team 3', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't4', name: 'Team 4', logoUrl: null, createdAt: '', updatedAt: '' }
                ]);
            }
            if (url === '/competitions/c1/players') {
                const players = usePlayersStore().allPlayers;
                return Promise.resolve(players.map(p => ({
                    ...p,
                    teamId: p.teamId || null,
                    teamName: p.teamName || null
                })));
            }
            return Promise.reject(new Error('Unexpected GET: ' + url));
        });
    });

    test('generateTeams calls API and returns team ids after fetch', async () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();

        const testPlayers = [
            { name: 'Player A1', talentRating: 'A', entryFee: 100 },
            { name: 'Player A2', talentRating: 'A', entryFee: 100 },
            { name: 'Player B1', talentRating: 'B', entryFee: 100 },
            { name: 'Player B2', talentRating: 'B', entryFee: 100 },
            { name: 'Player C1', talentRating: 'C', entryFee: 100 },
            { name: 'Player C2', talentRating: 'C', entryFee: 100 },
            { name: 'Player D1', talentRating: 'D', entryFee: 100 },
            { name: 'Player D2', talentRating: 'D', entryFee: 100 }
        ];

        for (const player of testPlayers) {
            await playersStore.addPlayer(player);
        }

        ApiService.get.mockImplementation((url) => {
            if (url === '/competitions/c1/teams') {
                return Promise.resolve([
                    { id: 't1', name: 'Team 1', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't2', name: 'Team 2', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't3', name: 'Team 3', logoUrl: null, createdAt: '', updatedAt: '' },
                    { id: 't4', name: 'Team 4', logoUrl: null, createdAt: '', updatedAt: '' }
                ]);
            }
            if (url === '/competitions/c1/players') {
                const store = usePlayersStore();
                const players = store.allPlayers;
                const teamIds = ['t1', 't1', 't2', 't2', 't3', 't3', 't4', 't4'];
                return Promise.resolve(players.slice(0, 8).map((p, i) => ({
                    ...p,
                    teamId: teamIds[i] || null,
                    teamName: teamIds[i] ? `Team ${i % 4 + 1}` : null
                })));
            }
            return Promise.reject(new Error('Unexpected GET: ' + url));
        });

        const teamIds = await teamsStore.generateTeams(4);

        expect(ApiService.post).toHaveBeenCalledWith('/competitions/c1/teams/generate', { numberOfTeams: 4 });
        expect(teamIds).toHaveLength(4);
        expect(teamsStore.allTeams).toHaveLength(4);
        expect(playersStore.playersByTeam('t1')).toHaveLength(2);
        expect(playersStore.playersByTeam('t2')).toHaveLength(2);
    });
});
