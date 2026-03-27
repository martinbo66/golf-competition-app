import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';

function mapPlayerResponse(response) {
    return {
        id: response.id,
        name: response.name,
        talentRating: response.talentRating,
        entryFee: Number.parseFloat(response.entryFee) || 0,
        winnings: Number.parseFloat(response.winnings) || 0,
        teamId: response.teamId || null,
        teamName: response.teamName || null,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

export const usePlayersStore = defineStore('players', {
    state: () => ({
        players: []
    }),

    getters: {
        allPlayers: (state) => state.players,
        playerById: (state) => (id) => state.players.find(player => player.id === id),
        playersByTeam: (state) => (teamId) => state.players.filter(player => player.teamId === teamId),
        unassignedPlayers: (state) => state.players.filter(player => !player.teamId),
        playerCount: (state) => state.players.length,
        playersByTalentRating: (state) => (rating) => state.players.filter(player => player.talentRating === rating),
        totalEntryFees: (state) => state.players.reduce((total, player) => total + (Number.parseFloat(player.entryFee) || 0), 0),
        totalWinnings: (state) => state.players.reduce((total, player) => total + (Number.parseFloat(player.winnings) || 0), 0)
    },

    actions: {
        async fetchPlayers() {
            const list = await ApiService.get(ApiService.playersUrl());
            this.players = (list || []).map(mapPlayerResponse);
        },

        async addPlayer(player) {
            const created = await ApiService.post(ApiService.playersUrl(), {
                name: player.name,
                talentRating: player.talentRating,
                entryFee: Number.parseFloat(player.entryFee) || 0,
                winnings: Number.parseFloat(player.winnings) || 0
            });
            const mapped = mapPlayerResponse(created);
            this.players.push(mapped);
            return mapped.id;
        },

        async updatePlayer({ id, updates }) {
            const updated = await ApiService.put(ApiService.playersUrl(id), {
                name: updates.name === undefined ? this.playerById(id)?.name : updates.name,
                talentRating: updates.talentRating === undefined ? this.playerById(id)?.talentRating : updates.talentRating,
                entryFee: updates.entryFee === undefined ? (this.playerById(id)?.entryFee ?? 0) : (Number.parseFloat(updates.entryFee) || 0),
                winnings: updates.winnings === undefined ? (this.playerById(id)?.winnings ?? 0) : (Number.parseFloat(updates.winnings) || 0)
            });
            const mapped = mapPlayerResponse(updated);
            const index = this.players.findIndex(p => p.id === id);
            if (index !== -1) {
                this.players[index] = mapped;
            } else {
                this.players.push(mapped);
            }
        },

        async deletePlayer(id) {
            await ApiService.delete(ApiService.playersUrl(id));
            this.players = this.players.filter(player => player.id !== id);
        },

        async assignPlayerToTeam({ playerId, teamId }) {
            const updated = await ApiService.put(ApiService.playersUrl(playerId) + '/assign', { teamId });
            const mapped = mapPlayerResponse(updated);
            const index = this.players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                this.players[index] = mapped;
            } else {
                this.players.push(mapped);
            }
        },

        async unassignPlayerFromTeam(playerId) {
            const updated = await ApiService.put(ApiService.playersUrl(playerId) + '/unassign');
            const mapped = mapPlayerResponse(updated);
            const index = this.players.findIndex(p => p.id === playerId);
            if (index === -1) {
                this.players.push(mapped);
            } else {
                this.players[index] = mapped;
            }
        },

        async unassignAllPlayers() {
            const assigned = this.players.filter(p => p.teamId);
            for (const player of assigned) {
                await this.unassignPlayerFromTeam(player.id);
            }
        },

        async copyPlayersFromCompetition(sourceCompetitionId) {
            const sourcePlayers = await ApiService.get(`/competitions/${sourceCompetitionId}/players`);
            let copied = 0;
            for (const player of (sourcePlayers || [])) {
                await this.addPlayer({
                    name: player.name,
                    talentRating: player.talentRating,
                    entryFee: 0,
                    winnings: 0
                });
                copied++;
            }
            return copied;
        }
    }
});
