import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';
import { usePlayersStore } from './players';

function mapTeamResponse(response) {
    return {
        id: response.id,
        name: response.name,
        logoUrl: response.logoUrl || null,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

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
        async fetchTeams() {
            const list = await ApiService.get(ApiService.teamsUrl());
            this.teams = (list || []).map(mapTeamResponse);
        },

        async addTeam(team) {
            const created = await ApiService.post(ApiService.teamsUrl(), {
                name: team.name,
                logoUrl: team.logoUrl || null
            });
            const mapped = mapTeamResponse(created);
            this.teams.push(mapped);
            return Promise.resolve(mapped.id);
        },

        async updateTeam({ id, updates }) {
            const existing = this.teamById(id);
            const updated = await ApiService.put(ApiService.teamsUrl(id), {
                name: updates.name !== undefined ? updates.name : (existing?.name ?? ''),
                logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : (existing?.logoUrl ?? null)
            });
            const mapped = mapTeamResponse(updated);
            const index = this.teams.findIndex(t => t.id === id);
            if (index !== -1) {
                this.teams[index] = mapped;
            } else {
                this.teams.push(mapped);
            }
        },

        async deleteTeam(id) {
            await ApiService.delete(ApiService.teamsUrl(id));
            this.teams = this.teams.filter(team => team.id !== id);
            const playersStore = usePlayersStore();
            await playersStore.fetchPlayers();
        },

        async deleteAllTeams() {
            await ApiService.delete(ApiService.teamsUrl());
            this.teams = [];
            const playersStore = usePlayersStore();
            await playersStore.fetchPlayers();
        },

        async generateTeams(numberOfTeams) {
            // Depends on backend US-029 (Snake Draft). Endpoint may 404 until implemented.
            await ApiService.post(ApiService.teamsUrl() + '/generate', { numberOfTeams });
            await this.fetchTeams();
            const playersStore = usePlayersStore();
            await playersStore.fetchPlayers();
            return this.teams.map(t => t.id);
        },

        async uploadTeamLogo({ teamId, logoUrl }) {
            const team = this.teamById(teamId);
            if (!team) return;
            await this.updateTeam({
                id: teamId,
                updates: { name: team.name, logoUrl }
            });
        }
    }
});
