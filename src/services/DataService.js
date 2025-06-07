/**
 * Data Service for the Golf Competition App
 * 
 * This service abstracts the data storage operations, allowing for easy switching
 * between localStorage and a backend database in the future.
 */

import store from '@/store';
import { exportDataToJson, parseImportedJson } from '@/utils';

class DataService {
  /**
   * Player Methods
   */
  
  // Get all players
  getPlayers() {
    return store.getters['players/allPlayers'];
  }
  
  // Get a player by ID
  getPlayerById(id) {
    return store.getters['players/playerById'](id);
  }
  
  // Get players by team ID
  getPlayersByTeam(teamId) {
    return store.getters['players/playersByTeam'](teamId);
  }
  
  // Get unassigned players
  getUnassignedPlayers() {
    return store.getters['players/unassignedPlayers'];
  }
  
  // Create a new player
  createPlayer(player) {
    return store.dispatch('players/addPlayer', player);
  }
  
  // Update a player
  updatePlayer(id, updates) {
    return store.dispatch('players/updatePlayer', { id, updates });
  }
  
  // Delete a player
  deletePlayer(id) {
    return store.dispatch('players/deletePlayer', id);
  }
  
  // Assign a player to a team
  assignPlayerToTeam(playerId, teamId) {
    return store.dispatch('players/assignPlayerToTeam', { playerId, teamId });
  }
  
  /**
   * Team Methods
   */
  
  // Get all teams
  getTeams() {
    return store.getters['teams/allTeams'];
  }
  
  // Get a team by ID
  getTeamById(id) {
    return store.getters['teams/teamById'](id);
  }
  
  // Create a new team
  createTeam(team) {
    return store.dispatch('teams/addTeam', team);
  }
  
  // Update a team
  updateTeam(id, updates) {
    return store.dispatch('teams/updateTeam', { id, updates });
  }
  
  // Delete a team
  deleteTeam(id) {
    return store.dispatch('teams/deleteTeam', id);
  }
  
  // Generate teams
  generateTeams(numberOfTeams) {
    return store.dispatch('teams/generateTeams', numberOfTeams);
  }
  
  // Upload a team logo
  uploadTeamLogo(teamId, logoUrl) {
    return store.dispatch('teams/uploadTeamLogo', { teamId, logoUrl });
  }
  
  /**
   * Score Methods
   */
  
  // Get all scores
  getScores() {
    return store.getters['scores/allScores'];
  }
  
  // Get scores by player
  getScoresByPlayer(playerId) {
    return store.getters['scores/scoresByPlayer'](playerId);
  }
  
  // Get scores by course
  getScoresByCourse(courseId) {
    return store.getters['scores/scoresByCourse'](courseId);
  }
  
  // Get a score by player and course
  getScoreByPlayerAndCourse(playerId, courseId) {
    return store.getters['scores/scoreByPlayerAndCourse'](playerId, courseId);
  }
  
  // Update a score
  updateScore(playerId, courseId, value) {
    return store.dispatch('scores/updateScore', { playerId, courseId, value });
  }
  
  // Get player total score
  getPlayerTotalScore(playerId) {
    return store.getters['scores/playerTotalScore'](playerId);
  }
  
  // Get team total score
  getTeamTotalScore(teamId) {
    return store.getters['scores/teamTotalScore'](teamId);
  }
  
  /**
   * Course Methods
   */
  
  // Get all courses
  getCourses() {
    return store.getters['courses/allCourses'];
  }
  
  // Get a course by ID
  getCourseById(id) {
    return store.getters['courses/courseById'](id);
  }
  
  // Get a course by name
  getCourseByName(name) {
    return store.getters['courses/courseByName'](name);
  }
  
  /**
   * Leaderboard Methods
   */
  
  // Get player leaderboard
  getPlayerLeaderboard() {
    return store.getters['scores/playerLeaderboard'];
  }
  
  // Get team leaderboard
  getTeamLeaderboard() {
    return store.getters['scores/teamLeaderboard'];
  }
  
  // Get course scores by team
  getCourseScoresByTeam(courseId) {
    return store.getters['scores/courseScoresByTeam'](courseId);
  }
  
  /**
   * Data Import/Export Methods
   */
  
  // Export data
  exportData() {
    const data = {
      players: store.getters['players/allPlayers'],
      teams: store.getters['teams/allTeams'],
      scores: store.getters['scores/allScores'],
      courses: store.getters['courses/allCourses'],
      appMetadata: {
        version: '1.0.0',
        exportDate: new Date().toISOString()
      }
    };
    
    return exportDataToJson(data);
  }
  
  // Import data
  importData(jsonData) {
    const data = parseImportedJson(jsonData);
    
    if (!data) {
      throw new Error('Invalid data format');
    }
    
    // Update store with imported data
    store.commit('players/SET_PLAYERS', data.players);
    store.commit('teams/SET_TEAMS', data.teams);
    store.commit('scores/SET_SCORES', data.scores);
    
    // Only update courses if they exist and match the expected format
    if (data.courses && data.courses.length === 4) {
      store.commit('courses/SET_COURSES', data.courses);
    }
    
    return true;
  }
}

// Create and export a singleton instance
export default new DataService();

