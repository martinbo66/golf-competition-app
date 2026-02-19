import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';

function mapPlayerResponse(response) {
    return {
        id: response.id,
        name: response.name,
        talentRating: response.talentRating,
        entryFee: parseFloat(response.entryFee) || 0,
        winnings: parseFloat(response.winnings) || 0,
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
        totalEntryFees: (state) => state.players.reduce((total, player) => total + (parseFloat(player.entryFee) || 0), 0),
        totalWinnings: (state) => state.players.reduce((total, player) => total + (parseFloat(player.winnings) || 0), 0)
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
                entryFee: parseFloat(player.entryFee) || 0,
                winnings: parseFloat(player.winnings) || 0
            });
            const mapped = mapPlayerResponse(created);
            this.players.push(mapped);
            return mapped.id;
        },

        async updatePlayer({ id, updates }) {
            const updated = await ApiService.put(ApiService.playersUrl(id), {
                name: updates.name !== undefined ? updates.name : this.playerById(id)?.name,
                talentRating: updates.talentRating !== undefined ? updates.talentRating : this.playerById(id)?.talentRating,
                entryFee: updates.entryFee !== undefined ? parseFloat(updates.entryFee) || 0 : (this.playerById(id)?.entryFee ?? 0),
                winnings: updates.winnings !== undefined ? parseFloat(updates.winnings) || 0 : (this.playerById(id)?.winnings ?? 0)
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
            if (index !== -1) {
                this.players[index] = mapped;
            } else {
                this.players.push(mapped);
            }
        },

        async unassignAllPlayers() {
            const assigned = this.players.filter(p => p.teamId);
            for (const player of assigned) {
                await this.unassignPlayerFromTeam(player.id);
            }
        }
    }
});
