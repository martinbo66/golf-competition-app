/**
 * Data Service for the Golf Competition App
 * 
 * This service abstracts the data storage operations, allowing for easy switching
 * between localStorage and a backend database in the future.
 */

/**
 * Data Service for the Golf Competition App
 * 
 * This service abstracts the data storage operations, allowing for easy switching
 * between localStorage and a backend database in the future.
 */

import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';
import { useCoursesStore } from '@/stores/courses';
import { exportDataToJson, parseImportedJson } from '@/utils';

class DataService {
  // Helper to get stores
  get playersStore() { return usePlayersStore(); }
  get teamsStore() { return useTeamsStore(); }
  get scoresStore() { return useScoresStore(); }
  get coursesStore() { return useCoursesStore(); }

  /**
   * Player Methods
   */

  // Get all players
  getPlayers() {
    return this.playersStore.allPlayers;
  }

  // Get a player by ID
  getPlayerById(id) {
    return this.playersStore.playerById(id);
  }

  // Get players by team ID
  getPlayersByTeam(teamId) {
    return this.playersStore.playersByTeam(teamId);
  }

  // Get unassigned players
  getUnassignedPlayers() {
    return this.playersStore.unassignedPlayers;
  }

  // Create a new player
  createPlayer(player) {
    return this.playersStore.addPlayer(player);
  }

  // Update a player
  updatePlayer(id, updates) {
    return this.playersStore.updatePlayer({ id, updates });
  }

  // Delete a player
  deletePlayer(id) {
    return this.playersStore.deletePlayer(id);
  }

  // Assign a player to a team
  assignPlayerToTeam(playerId, teamId) {
    return this.playersStore.assignPlayerToTeam({ playerId, teamId });
  }

  /**
   * Team Methods
   */

  // Get all teams
  getTeams() {
    return this.teamsStore.allTeams;
  }

  // Get a team by ID
  getTeamById(id) {
    return this.teamsStore.teamById(id);
  }

  // Create a new team
  createTeam(team) {
    return this.teamsStore.addTeam(team);
  }

  // Update a team
  updateTeam(id, updates) {
    return this.teamsStore.updateTeam({ id, updates });
  }

  // Delete a team
  deleteTeam(id) {
    return this.teamsStore.deleteTeam(id);
  }

  // Generate teams
  generateTeams(numberOfTeams) {
    return this.teamsStore.generateTeams(numberOfTeams);
  }

  // Upload a team logo
  uploadTeamLogo(teamId, logoUrl) {
    return this.teamsStore.uploadTeamLogo({ teamId, logoUrl });
  }

  /**
   * Score Methods
   */

  // Get all scores
  getScores() {
    return this.scoresStore.allScores;
  }

  // Get scores by player
  getScoresByPlayer(playerId) {
    return this.scoresStore.scoresByPlayer(playerId);
  }

  // Get scores by course
  getScoresByCourse(courseId) {
    return this.scoresStore.scoresByCourse(courseId);
  }

  // Get a score by player and course
  getScoreByPlayerAndCourse(playerId, courseId) {
    return this.scoresStore.scoreByPlayerAndCourse(playerId, courseId);
  }

  // Update a score
  updateScore(playerId, courseId, value) {
    return this.scoresStore.updateScore({ playerId, courseId, value });
  }

  // Get player total score
  getPlayerTotalScore(playerId) {
    return this.scoresStore.playerTotalScore(playerId);
  }

  // Get team total score
  getTeamTotalScore(teamId) {
    return this.scoresStore.teamTotalScore(teamId);
  }

  /**
   * Course Methods
   */

  // Get all courses
  getCourses() {
    return this.coursesStore.allCourses;
  }

  // Get a course by ID
  getCourseById(id) {
    return this.coursesStore.courseById(id);
  }

  // Get a course by name
  getCourseByName(name) {
    return this.coursesStore.courseByName(name);
  }

  /**
   * Leaderboard Methods
   */

  // Get player leaderboard
  getPlayerLeaderboard() {
    return this.scoresStore.playerLeaderboard;
  }

  // Get team leaderboard
  getTeamLeaderboard() {
    return this.scoresStore.teamLeaderboard;
  }

  // Get course scores by team
  getCourseScoresByTeam(courseId) {
    return this.scoresStore.courseScoresByTeam(courseId);
  }

  /**
   * Data Import/Export Methods
   */

  // Export data
  exportData() {
    const data = {
      players: this.playersStore.allPlayers,
      teams: this.teamsStore.allTeams,
      scores: this.scoresStore.allScores,
      courses: this.coursesStore.allCourses,
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
    // Note: In Pinia we can patch the state directly or use actions
    // Here we'll assume we can patch the state if the stores expose it, 
    // or we might need to add specific actions for bulk update if not.
    // For now, let's assume we can use $patch or specific setters if available.
    // Since we don't have explicit SET mutations in Pinia, we'll use $patch.

    if (data.players) this.playersStore.$patch({ players: data.players });
    if (data.teams) this.teamsStore.$patch({ teams: data.teams });
    if (data.scores) this.scoresStore.$patch({ scores: data.scores });

    // Only update courses if they exist and match the expected format
    if (data.courses && data.courses.length === 4) {
      this.coursesStore.$patch({ courses: data.courses });
    }

    return true;
  }
}

// Create and export a singleton instance
export default new DataService();

