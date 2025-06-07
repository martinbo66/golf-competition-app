import { v4 as uuidv4 } from 'uuid';

// Players store module
const state = {
  players: []
};

const getters = {
  allPlayers: state => state.players,
  playerById: state => id => state.players.find(player => player.id === id),
  playersByTeam: state => teamId => state.players.filter(player => player.teamId === teamId),
  unassignedPlayers: state => state.players.filter(player => !player.teamId),
  playerCount: state => state.players.length,
  playersByTalentRating: state => rating => state.players.filter(player => player.talentRating === rating),
  totalEntryFees: state => state.players.reduce((total, player) => total + (parseFloat(player.entryFee) || 0), 0),
  totalWinnings: state => state.players.reduce((total, player) => total + (parseFloat(player.winnings) || 0), 0)
};

const actions = {
  fetchPlayers({ commit }) {
    // In a real app, this would be an API call
    // For now, data is loaded from localStorage in the persistence plugin
  },
  addPlayer({ commit }, player) {
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
    commit('ADD_PLAYER', newPlayer);
    return newPlayer.id;
  },
  updatePlayer({ commit }, { id, updates }) {
    // Ensure numeric values are parsed
    if (updates.entryFee !== undefined) {
      updates.entryFee = parseFloat(updates.entryFee) || 0;
    }
    if (updates.winnings !== undefined) {
      updates.winnings = parseFloat(updates.winnings) || 0;
    }
    
    commit('UPDATE_PLAYER', { id, updates });
  },
  deletePlayer({ commit, dispatch }, id) {
    // Delete player's scores first
    dispatch('scores/deletePlayerScores', id, { root: true });
    
    // Then delete the player
    commit('DELETE_PLAYER', id);
  },
  assignPlayerToTeam({ commit }, { playerId, teamId }) {
    commit('ASSIGN_PLAYER_TO_TEAM', { playerId, teamId });
  },
  unassignPlayerFromTeam({ commit }, playerId) {
    commit('ASSIGN_PLAYER_TO_TEAM', { playerId, teamId: null });
  },
  unassignAllPlayers({ commit, state }) {
    state.players.forEach(player => {
      commit('ASSIGN_PLAYER_TO_TEAM', { playerId: player.id, teamId: null });
    });
  }
};

const mutations = {
  SET_PLAYERS(state, players) {
    state.players = players;
  },
  ADD_PLAYER(state, player) {
    state.players.push(player);
  },
  UPDATE_PLAYER(state, { id, updates }) {
    const index = state.players.findIndex(player => player.id === id);
    if (index !== -1) {
      const player = state.players[index];
      state.players.splice(index, 1, {
        ...player,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  },
  DELETE_PLAYER(state, id) {
    state.players = state.players.filter(player => player.id !== id);
  },
  ASSIGN_PLAYER_TO_TEAM(state, { playerId, teamId }) {
    const index = state.players.findIndex(player => player.id === playerId);
    if (index !== -1) {
      state.players[index].teamId = teamId;
      state.players[index].updatedAt = new Date().toISOString();
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};

