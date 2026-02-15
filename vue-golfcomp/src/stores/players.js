import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useScoresStore } from './scores';

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
        addPlayer(player) {
            const newPlayer = {
                id: uuidv4(),
                name: player.name,
                talentRating: player.talentRating,
                entryFee: parseFloat(player.entryFee) || 0,
                winnings: parseFloat(player.winnings) || 0,
                teamId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.players.push(newPlayer);
            return newPlayer.id;
        },

        updatePlayer({ id, updates }) {
            const index = this.players.findIndex(player => player.id === id);
            if (index !== -1) {
                // Ensure numeric values are parsed
                if (updates.entryFee !== undefined) {
                    updates.entryFee = parseFloat(updates.entryFee) || 0;
                }
                if (updates.winnings !== undefined) {
                    updates.winnings = parseFloat(updates.winnings) || 0;
                }

                const player = this.players[index];
                this.players[index] = {
                    ...player,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        deletePlayer(id) {
            // Delete player's scores first
            const scoresStore = useScoresStore();
            scoresStore.deletePlayerScores(id);

            // Then delete the player
            this.players = this.players.filter(player => player.id !== id);
        },

        assignPlayerToTeam({ playerId, teamId }) {
            const index = this.players.findIndex(player => player.id === playerId);
            if (index !== -1) {
                this.players[index].teamId = teamId;
                this.players[index].updatedAt = new Date().toISOString();
            }
        },

        unassignPlayerFromTeam(playerId) {
            this.assignPlayerToTeam({ playerId, teamId: null });
        },

        unassignAllPlayers() {
            this.players.forEach(player => {
                player.teamId = null;
                player.updatedAt = new Date().toISOString();
            });
        }
    }
});
