import { v4 as uuidv4 } from 'uuid';

// Scores store module
const state = {
  scores: []
};

const getters = {
  allScores: state => state.scores,
  scoresByPlayer: state => playerId => state.scores.filter(score => score.playerId === playerId),
  scoresByCourse: state => courseId => state.scores.filter(score => score.courseId === courseId),
  scoreByPlayerAndCourse: state => (playerId, courseId) => {
    return state.scores.find(score => score.playerId === playerId && score.courseId === courseId);
  },
  playerTotalScore: state => playerId => {
    return state.scores
      .filter(score => score.playerId === playerId)
      .reduce((total, score) => total + score.value, 0);
  },
  teamTotalScore: (state, getters, rootState, rootGetters) => teamId => {
    const teamPlayers = rootGetters['players/playersByTeam'](teamId);
    return teamPlayers.reduce((total, player) => {
      return total + getters.playerTotalScore(player.id);
    }, 0);
  },
  playerLeaderboard: (state, getters, rootState, rootGetters) => {
    const players = rootGetters['players/allPlayers'];
    const courses = rootGetters['courses/allCourses'];
    
    return players.map(player => {
      const courseScores = {};
      courses.forEach(course => {
        const score = getters.scoreByPlayerAndCourse(player.id, course.id);
        courseScores[course.name] = score ? score.value : null;
      });
      
      return {
        id: player.id,
        name: player.name,
        talentRating: player.talentRating,
        teamId: player.teamId,
        teamName: player.teamId ? rootGetters['teams/teamById'](player.teamId).name : null,
        courseScores,
        totalScore: getters.playerTotalScore(player.id)
      };
    }).sort((a, b) => {
      // Sort by total score (highest first), then by name if scores are equal
      const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    });
  },
  teamLeaderboard: (state, getters, rootState, rootGetters) => {
    const teams = rootGetters['teams/allTeams'];
    const courses = rootGetters['courses/allCourses'];
    
    return teams.map(team => {
      const teamPlayers = rootGetters['players/playersByTeam'](team.id);
      const courseScores = {};
      
      courses.forEach(course => {
        let courseTotal = 0;
        teamPlayers.forEach(player => {
          const score = getters.scoreByPlayerAndCourse(player.id, course.id);
          if (score) {
            courseTotal += score.value;
          }
        });
        courseScores[course.name] = courseTotal;
      });
      
      return {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        playerCount: teamPlayers.length,
        courseScores,
        totalScore: getters.teamTotalScore(team.id)
      };
    }).sort((a, b) => {
      // Sort by total score (highest first), then by name if scores are equal
      const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    });
  },
  playerMoneyLeaderboard: (state, getters, rootState, rootGetters) => {
    const players = rootGetters['players/allPlayers'];
    
    return players.map(player => {
      return {
        id: player.id,
        name: player.name,
        talentRating: player.talentRating,
        teamId: player.teamId,
        teamName: player.teamId ? rootGetters['teams/teamById'](player.teamId).name : null,
        entryFee: player.entryFee || 0,
        winnings: player.winnings || 0,
        netWinnings: (player.winnings || 0) - (player.entryFee || 0)
      };
    }).sort((a, b) => {
      // Sort by winnings (highest first), then by net winnings, then by name
      const winningsDiff = (b.winnings || 0) - (a.winnings || 0);
      if (winningsDiff !== 0) return winningsDiff;
      
      const netWinningsDiff = (b.netWinnings || 0) - (a.netWinnings || 0);
      if (netWinningsDiff !== 0) return netWinningsDiff;
      
      return a.name.localeCompare(b.name);
    });
  },
  teamMoneyLeaderboard: (state, getters, rootState, rootGetters) => {
    const teams = rootGetters['teams/allTeams'];
    
    return teams.map(team => {
      const teamPlayers = rootGetters['players/playersByTeam'](team.id);
      
      const totalEntryFees = teamPlayers.reduce((total, player) => total + (player.entryFee || 0), 0);
      const totalWinnings = teamPlayers.reduce((total, player) => total + (player.winnings || 0), 0);
      const netWinnings = totalWinnings - totalEntryFees;
      
      return {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        playerCount: teamPlayers.length,
        totalEntryFees,
        totalWinnings,
        netWinnings
      };
    }).sort((a, b) => {
      // Sort by total winnings (highest first), then by net winnings, then by name
      const winningsDiff = (b.totalWinnings || 0) - (a.totalWinnings || 0);
      if (winningsDiff !== 0) return winningsDiff;
      
      const netWinningsDiff = (b.netWinnings || 0) - (a.netWinnings || 0);
      if (netWinningsDiff !== 0) return netWinningsDiff;
      
      return a.name.localeCompare(b.name);
    });
  },
  courseScoresByTeam: (state, getters, rootState, rootGetters) => courseId => {
    const teams = rootGetters['teams/allTeams'];
    
    return teams.map(team => {
      const teamPlayers = rootGetters['players/playersByTeam'](team.id);
      const playerScores = teamPlayers.map(player => {
        const score = getters.scoreByPlayerAndCourse(player.id, courseId);
        return {
          playerId: player.id,
          playerName: player.name,
          talentRating: player.talentRating,
          score: score ? score.value : null
        };
      }).sort((a, b) => a.playerName.localeCompare(b.playerName)); // Sort players alphabetically
      
      const teamTotal = playerScores.reduce((total, player) => {
        return total + (player.score || 0);
      }, 0);
      
      return {
        teamId: team.id,
        teamName: team.name,
        logoUrl: team.logoUrl,
        playerScores,
        teamTotal
      };
    });
  }
};

const actions = {
  fetchScores() {
    // In a real app, this would be an API call
    // For now, data is loaded from localStorage in the persistence plugin
  },
  updateScore({ commit, getters }, { playerId, courseId, value }) {
    // Validate score value
    const scoreValue = parseInt(value);
    if (isNaN(scoreValue)) {
      throw new Error('Score must be a valid number');
    }
    
    const existingScore = getters.scoreByPlayerAndCourse(playerId, courseId);
    
    if (existingScore) {
      commit('UPDATE_SCORE', { id: existingScore.id, value: scoreValue });
    } else {
      const newScore = {
        id: uuidv4(),
        playerId,
        courseId,
        value: scoreValue,
        timestamp: new Date().toISOString()
      };
      commit('ADD_SCORE', newScore);
    }
  },
  deleteScore({ commit }, id) {
    commit('DELETE_SCORE', id);
  },
  deletePlayerScores({ commit, getters }, playerId) {
    const playerScores = getters.scoresByPlayer(playerId);
    playerScores.forEach(score => {
      commit('DELETE_SCORE', score.id);
    });
  },
  deleteCourseScores({ commit, getters }, courseId) {
    const courseScores = getters.scoresByCourse(courseId);
    courseScores.forEach(score => {
      commit('DELETE_SCORE', score.id);
    });
  }
};

const mutations = {
  SET_SCORES(state, scores) {
    state.scores = scores;
  },
  ADD_SCORE(state, score) {
    state.scores.push(score);
  },
  UPDATE_SCORE(state, { id, value }) {
    const index = state.scores.findIndex(score => score.id === id);
    if (index !== -1) {
      state.scores[index].value = value;
      state.scores[index].timestamp = new Date().toISOString();
    }
  },
  DELETE_SCORE(state, id) {
    state.scores = state.scores.filter(score => score.id !== id);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};

