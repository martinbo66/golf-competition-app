/**
 * Data Service for the Golf Competition App
 *
 * Abstracts data storage operations. Export reads from store state (API-backed).
 * Import creates entities via API with ID remapping; clears existing data first.
 */

import ApiService from '@/services/ApiService';
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
   * Data Import/Export Methods (API-based)
   */

  /**
   * Export current competition data to JSON (from store state, already from API).
   * @returns {string} JSON string with players, teams, scores, courses, metadata
   */
  exportData() {
    return exportDataToJson({
      players: this.playersStore.allPlayers,
      teams: this.teamsStore.allTeams,
      scores: this.scoresStore.allScores,
      courses: this.coursesStore.allCourses,
      appMetadata: {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        source: 'api'
      }
    });
  }

  /**
   * Import data from JSON: clears existing data via API, then creates players,
   * teams, and scores via API. Maps old IDs to new (server-generated) IDs.
   * Scores in file use courseId; import maps to roundId for API.
   * @param {string} jsonData - JSON string from export
   * @param {Object} [options] - Optional { onProgress: (message: string) => void }
   * @returns {Promise<void>}
   * @throws {Error} Invalid data format, or list of failed items after partial import
   */
  async importData(jsonData, options = {}) {
    const { onProgress = () => {} } = options;
    const data = parseImportedJson(jsonData);
    if (!data) throw new Error('Invalid data format');

    const failures = [];

    // 1. Clear existing data via API
    onProgress('Clearing existing data…');
    try {
      await ApiService.delete(ApiService.compUrl + '/scores');
      this.scoresStore.$patch({ scores: [] });
    } catch (err) {
      failures.push({ type: 'clear', message: err.message || String(err) });
    }
    await this.teamsStore.deleteAllTeams();
    const players = [...this.playersStore.allPlayers];
    for (const player of players) {
      try {
        await this.playersStore.deletePlayer(player.id);
      } catch (err) {
        failures.push({ type: 'player', id: player.id, message: err.message || String(err) });
      }
    }

    // 2. Create teams (new IDs from server)
    const teamIdMap = {};
    const teams = data.teams || [];
    onProgress(`Importing teams (0/${teams.length})…`);
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      try {
        const newId = await this.teamsStore.addTeam({
          name: team.name,
          logoUrl: team.logoUrl || null
        });
        teamIdMap[team.id] = newId;
      } catch (err) {
        failures.push({ type: 'team', name: team.name, message: err.message || String(err) });
      }
      onProgress(`Importing teams (${i + 1}/${teams.length})…`);
    }

    // 3. Create players and assign to teams
    const playerIdMap = {};
    const playersToImport = data.players || [];
    onProgress(`Importing players (0/${playersToImport.length})…`);
    for (let i = 0; i < playersToImport.length; i++) {
      const player = playersToImport[i];
      try {
        const newId = await this.playersStore.addPlayer({
          name: player.name,
          talentRating: player.talentRating,
          entryFee: player.entryFee != null ? Number(player.entryFee) : 0,
          winnings: player.winnings != null ? Number(player.winnings) : 0
        });
        playerIdMap[player.id] = newId;
        if (player.teamId && teamIdMap[player.teamId]) {
          await this.playersStore.assignPlayerToTeam({
            playerId: newId,
            teamId: teamIdMap[player.teamId]
          });
        }
      } catch (err) {
        failures.push({ type: 'player', name: player.name, message: err.message || String(err) });
      }
      onProgress(`Importing players (${i + 1}/${playersToImport.length})…`);
    }

    // 4. Create scores (courseId from file → roundId for API via store)
    const scores = data.scores || [];
    onProgress(`Importing scores (0/${scores.length})…`);
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      const newPlayerId = playerIdMap[score.playerId];
      if (!newPlayerId) continue;
      try {
        await this.scoresStore.updateScore({
          playerId: newPlayerId,
          courseId: score.courseId,
          value: score.value
        });
      } catch (err) {
        failures.push({
          type: 'score',
          playerId: score.playerId,
          courseId: score.courseId,
          message: err.message || String(err)
        });
      }
      onProgress(`Importing scores (${i + 1}/${scores.length})…`);
    }

    if (failures.length > 0) {
      const details = failures.map(f => `${f.type}: ${f.name || f.id || ''} - ${f.message}`).join('; ');
      throw new Error(`Import completed with errors: ${details}`);
    }
  }
}

// Create and export a singleton instance
export default new DataService();

