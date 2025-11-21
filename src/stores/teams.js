import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { usePlayersStore } from './players';

export const useTeamsStore = defineStore('teams', {
    state: () => ({
        teams: []
    }),

    getters: {
        allTeams: (state) => state.teams,
        teamById: (state) => (id) => state.teams.find(team => team.id === id),
        teamCount: (state) => state.teams.length,
        teamByName: (state) => (name) => state.teams.find(team => team.name.toLowerCase() === name.toLowerCase())
    },

    actions: {
        addTeam(team) {
            const newTeam = {
                id: uuidv4(),
                name: team.name,
                logoUrl: team.logoUrl || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.teams.push(newTeam);
            return Promise.resolve(newTeam.id);
        },

        updateTeam({ id, updates }) {
            const index = this.teams.findIndex(team => team.id === id);
            if (index !== -1) {
                const team = this.teams[index];
                this.teams[index] = {
                    ...team,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        deleteTeam(id) {
            // Unassign all players from this team first
            const playersStore = usePlayersStore();
            const teamPlayers = playersStore.playersByTeam(id);

            teamPlayers.forEach(player => {
                playersStore.assignPlayerToTeam({ playerId: player.id, teamId: null });
            });

            this.teams = this.teams.filter(team => team.id !== id);
        },

        deleteAllTeams() {
            // Unassign all players from teams first
            const playersStore = usePlayersStore();
            playersStore.unassignAllPlayers();

            // Then delete all teams
            this.teams = [];
        },

        async generateTeams(numberOfTeams) {
            // Delete existing teams
            this.deleteAllTeams();

            // Create new teams
            const teamIds = [];
            for (let i = 0; i < numberOfTeams; i++) {
                const teamName = `Team ${i + 1}`;
                const teamId = await this.addTeam({ name: teamName });
                teamIds.push(teamId);
            }

            // Implement team formation algorithm
            this.assignPlayersToTeams({ teamIds });

            return teamIds;
        },

        assignPlayersToTeams({ teamIds }) {
            const playersStore = usePlayersStore();
            const players = playersStore.allPlayers;

            if (teamIds.length === 0 || players.length === 0) {
                return;
            }

            // Calculate talent points for sorting
            const talentPoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };

            // Sort players by talent rating (highest to lowest)
            const sortedPlayers = [...players].sort((a, b) => {
                return talentPoints[b.talentRating] - talentPoints[a.talentRating];
            });

            // Use a simple round-robin assignment to ensure balanced teams
            sortedPlayers.forEach((player, index) => {
                const teamIndex = index % teamIds.length;
                playersStore.assignPlayerToTeam({
                    playerId: player.id,
                    teamId: teamIds[teamIndex]
                });
            });
        },

        uploadTeamLogo({ teamId, logoUrl }) {
            this.updateTeam({
                id: teamId,
                updates: {
                    logoUrl,
                    updatedAt: new Date().toISOString()
                }
            });
        }
    }
});
