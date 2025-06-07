import { v4 as uuidv4 } from 'uuid';

// Teams store module
const state = {
  teams: []
};

const getters = {
  allTeams: state => state.teams,
  teamById: state => id => state.teams.find(team => team.id === id),
  teamCount: state => state.teams.length,
  teamByName: state => name => state.teams.find(team => team.name.toLowerCase() === name.toLowerCase())
};

const actions = {
  fetchTeams({ commit }) {
    // In a real app, this would be an API call
    // For now, data is loaded from localStorage in the persistence plugin
  },
  addTeam({ commit }, team) {
    const newTeam = {
      id: uuidv4(),
      name: team.name,
      logoUrl: team.logoUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    commit('ADD_TEAM', newTeam);
    return newTeam.id;
  },
  updateTeam({ commit }, { id, updates }) {
    commit('UPDATE_TEAM', { id, updates });
  },
  deleteTeam({ commit, dispatch, rootGetters }, id) {
    // Unassign all players from this team first
    const teamPlayers = rootGetters['players/playersByTeam'](id);
    teamPlayers.forEach(player => {
      dispatch('players/assignPlayerToTeam', { playerId: player.id, teamId: null }, { root: true });
    });
    
    commit('DELETE_TEAM', id);
  },
  deleteAllTeams({ commit, dispatch, state }) {
    // Unassign all players from teams first
    dispatch('players/unassignAllPlayers', null, { root: true });
    
    // Then delete all teams
    state.teams.forEach(team => {
      commit('DELETE_TEAM', team.id);
    });
  },
  generateTeams({ commit, dispatch, rootGetters }, numberOfTeams) {
    // Get all players
    const players = rootGetters['players/allPlayers'];
    
    // Delete existing teams
    dispatch('deleteAllTeams');
    
    // Create new teams
    const teamIds = [];
    for (let i = 0; i < numberOfTeams; i++) {
      const teamName = `Team ${i + 1}`;
      const teamId = dispatch('addTeam', { name: teamName });
      teamIds.push(teamId);
    }
    
    // Implement team formation algorithm
    dispatch('assignPlayersToTeams', { players, teamIds });
    
    return teamIds;
  },
  assignPlayersToTeams({ dispatch }, { players, teamIds }) {
    if (teamIds.length === 0 || players.length === 0) {
      return;
    }
    
    // Calculate talent points for sorting
    const talentPoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
    
    // Sort players by talent rating (highest to lowest)
    const sortedPlayers = [...players].sort((a, b) => {
      return talentPoints[b.talentRating] - talentPoints[a.talentRating];
    });
    
    // Assign players using snake draft pattern
    let teamIndex = 0;
    let direction = 1; // 1 for forward, -1 for backward
    
    sortedPlayers.forEach(player => {
      dispatch('players/assignPlayerToTeam', { 
        playerId: player.id, 
        teamId: teamIds[teamIndex] 
      }, { root: true });
      
      // Move to next team (snake pattern)
      teamIndex += direction;
      
      // Reverse direction if we hit the end
      if (teamIndex >= teamIds.length) {
        teamIndex = teamIds.length - 2;
        direction = -1;
      } else if (teamIndex < 0) {
        teamIndex = 1;
        direction = 1;
      }
    });
  },
  uploadTeamLogo({ commit }, { teamId, logoUrl }) {
    commit('UPDATE_TEAM', { 
      id: teamId, 
      updates: { 
        logoUrl,
        updatedAt: new Date().toISOString()
      } 
    });
  }
};

const mutations = {
  SET_TEAMS(state, teams) {
    state.teams = teams;
  },
  ADD_TEAM(state, team) {
    state.teams.push(team);
  },
  UPDATE_TEAM(state, { id, updates }) {
    const index = state.teams.findIndex(team => team.id === id);
    if (index !== -1) {
      const team = state.teams[index];
      state.teams.splice(index, 1, {
        ...team,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  },
  DELETE_TEAM(state, id) {
    state.teams = state.teams.filter(team => team.id !== id);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};

