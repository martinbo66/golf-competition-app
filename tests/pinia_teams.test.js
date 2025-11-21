import { setActivePinia, createPinia } from 'pinia';
import { useTeamsStore } from '../src/stores/teams';
import { usePlayersStore } from '../src/stores/players';

describe('Teams Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    test('generateTeams should create balanced teams', async () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();

        // Add test players
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
            playersStore.addPlayer(player);
        }

        // Generate 4 teams
        const teamIds = await teamsStore.generateTeams(4);

        expect(teamIds).toHaveLength(4);
        expect(teamsStore.allTeams).toHaveLength(4);

        // Check balance
        const teamPlayerCounts = teamIds.map(teamId => {
            return playersStore.playersByTeam(teamId).length;
        });

        expect(teamPlayerCounts).toEqual([2, 2, 2, 2]);
    });
});
