<template>
  <div class="score-entry card">
    <div class="card-header">
      <h3>Score Entry: {{ courseData.name }}</h3>
    </div>
    <div class="card-body">
      <div v-if="!players.length" class="empty-state">
        <p>No players available. Add players in the Player Management section first.</p>
      </div>
      
      <div v-else>
        <div class="score-filters">
          <div class="form-group">
            <label for="filterTeam">Filter by Team</label>
            <select id="filterTeam" v-model="filterTeam" class="form-control">
              <option value="">All Teams</option>
              <option value="unassigned">Unassigned</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="filterScored">Filter by Status</label>
            <select id="filterScored" v-model="filterScored" class="form-control">
              <option value="all">All Players</option>
              <option value="scored">Scored</option>
              <option value="unscored">Unscored</option>
            </select>
          </div>
        </div>
        
        <div class="score-table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Talent</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in filteredPlayers" :key="player.id">
                <td>{{ player.name }}</td>
                <td>{{ player.teamName || 'Unassigned' }}</td>
                <td>
                  <span :class="'talent-badge talent-' + player.talentRating.toLowerCase()">
                    {{ player.talentRating }}
                  </span>
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model="scores[player.id]" 
                    class="form-control score-input"
                    :class="{ 'is-invalid': scoreErrors[player.id] }"
                    min="18"
                    max="150"
                    @change="validateScore(player.id)"
                  >
                  <div v-if="scoreErrors[player.id]" class="invalid-feedback">
                    {{ scoreErrors[player.id] }}
                  </div>
                </td>
                <td>
                  <button 
                    class="btn btn-sm" 
                    @click="saveScore(player.id)"
                    :disabled="!isScoreValid(player.id) || isSaving[player.id]"
                  >
                    <span v-if="isSaving[player.id]">Saving...</span>
                    <span v-else>Save</span>
                  </button>
                  <button 
                    v-if="hasScore(player.id)"
                    class="btn btn-sm btn-danger" 
                    @click="clearScore(player.id)"
                  >
                    Clear
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="score-summary">
          <div class="summary-item">
            <div class="summary-label">Players Scored</div>
            <div class="summary-value">{{ scoredCount }} / {{ filteredPlayers.length }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Score</div>
            <div class="summary-value">{{ averageScore }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Best Score</div>
            <div class="summary-value">{{ bestScore }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Worst Score</div>
            <div class="summary-value">{{ worstScore }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { validateScore } from '@/utils';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';

export default {
  name: 'ScoreEntry',
  props: {
    courseId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      scores: {},
      scoreErrors: {},
      isSaving: {},
      filterTeam: '',
      filterScored: 'all'
    };
  },
  computed: {
    ...mapGetters('teams', ['allTeams', 'teamById']),
    ...mapGetters('players', ['allPlayers']),
    ...mapGetters('courses', ['courseById']),
    ...mapGetters('scores', ['scoreByPlayerAndCourse']),
    
    courseData() {
      return this.courseById(this.courseId) || { name: 'Unknown Course' };
    },
    
    teams() {
      return this.allTeams;
    },
    
    players() {
      return this.allPlayers.map(player => ({
        ...player,
        teamName: player.teamId ? this.teamById(player.teamId).name : null,
        score: this.getPlayerScore(player.id)
      }));
    },
    
    filteredPlayers() {
      let result = [...this.players];
      
      // Apply team filter
      if (this.filterTeam) {
        if (this.filterTeam === 'unassigned') {
          result = result.filter(player => !player.teamId);
        } else {
          result = result.filter(player => player.teamId === this.filterTeam);
        }
      }
      
      // Apply scored filter
      if (this.filterScored === 'scored') {
        result = result.filter(player => this.hasScore(player.id));
      } else if (this.filterScored === 'unscored') {
        result = result.filter(player => !this.hasScore(player.id));
      }
      
      // Sort by team, then by name
      result.sort((a, b) => {
        if (a.teamName === b.teamName) {
          return a.name.localeCompare(b.name);
        }
        if (!a.teamName) return 1;
        if (!b.teamName) return -1;
        return a.teamName.localeCompare(b.teamName);
      });
      
      return result;
    },
    
    scoredCount() {
      return this.filteredPlayers.filter(player => this.hasScore(player.id)).length;
    },
    
    averageScore() {
      const scoredPlayers = this.filteredPlayers.filter(player => this.hasScore(player.id));
      if (scoredPlayers.length === 0) return 'N/A';
      
      const sum = scoredPlayers.reduce((total, player) => {
        return total + this.getPlayerScore(player.id);
      }, 0);
      
      return (sum / scoredPlayers.length).toFixed(1);
    },
    
    bestScore() {
      const scoredPlayers = this.filteredPlayers.filter(player => this.hasScore(player.id));
      if (scoredPlayers.length === 0) return 'N/A';
      
      const scores = scoredPlayers.map(player => this.getPlayerScore(player.id));
      return Math.min(...scores);
    },
    
    worstScore() {
      const scoredPlayers = this.filteredPlayers.filter(player => this.hasScore(player.id));
      if (scoredPlayers.length === 0) return 'N/A';
      
      const scores = scoredPlayers.map(player => this.getPlayerScore(player.id));
      return Math.max(...scores);
    }
  },
  created() {
    this.loadScores();
  },
  methods: {
    loadScores() {
      this.players.forEach(player => {
        const score = this.scoreByPlayerAndCourse(player.id, this.courseId);
        if (score) {
          this.$set(this.scores, player.id, score.value);
        } else {
          this.$set(this.scores, player.id, '');
        }
        this.$set(this.scoreErrors, player.id, null);
        this.$set(this.isSaving, player.id, false);
      });
    },
    
    getPlayerScore(playerId) {
      const score = this.scoreByPlayerAndCourse(playerId, this.courseId);
      return score ? score.value : null;
    },
    
    hasScore(playerId) {
      return this.getPlayerScore(playerId) !== null;
    },
    
    validateScore(playerId) {
      const scoreValue = this.scores[playerId];
      
      if (scoreValue === '') {
        this.$set(this.scoreErrors, playerId, null);
        return true;
      }
      
      const validation = validateScore(scoreValue);
      
      if (!validation.isValid) {
        this.$set(this.scoreErrors, playerId, validation.error);
        return false;
      }
      
      this.$set(this.scoreErrors, playerId, null);
      return true;
    },
    
    isScoreValid(playerId) {
      return this.scores[playerId] !== '' && !this.scoreErrors[playerId];
    },
    
    async saveScore(playerId) {
      if (!this.isScoreValid(playerId)) return;
      
      this.$set(this.isSaving, playerId, true);
      
      try {
        await DataService.updateScore(playerId, this.courseId, this.scores[playerId]);
        NotificationService.success('Score saved successfully');
      } catch (error) {
        NotificationService.error(`Error saving score: ${error.message}`);
      } finally {
        this.$set(this.isSaving, playerId, false);
      }
    },
    
    async clearScore(playerId) {
      const player = this.players.find(p => p.id === playerId);
      if (!player) return;
      
      if (!confirm(`Are you sure you want to clear the score for ${player.name}?`)) {
        return;
      }
      
      this.$set(this.isSaving, playerId, true);
      
      try {
        // Delete the score by setting it to null
        const score = this.scoreByPlayerAndCourse(playerId, this.courseId);
        if (score) {
          await DataService.deleteScore(score.id);
        }
        
        // Clear the input
        this.$set(this.scores, playerId, '');
        this.$set(this.scoreErrors, playerId, null);
        
        NotificationService.success('Score cleared successfully');
      } catch (error) {
        NotificationService.error(`Error clearing score: ${error.message}`);
      } finally {
        this.$set(this.isSaving, playerId, false);
      }
    }
  }
};
</script>

<style scoped>
.score-entry {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.score-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.score-filters .form-group {
  flex: 1;
  max-width: 300px;
}

.score-table-container {
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.score-input {
  width: 80px;
  text-align: center;
}

.talent-badge {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.talent-a {
  background-color: #28a745;
}

.talent-b {
  background-color: #17a2b8;
}

.talent-c {
  background-color: #ffc107;
  color: #212529;
}

.talent-d {
  background-color: #dc3545;
}

.score-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
}

.summary-item {
  flex: 1;
  min-width: 150px;
  text-align: center;
}

.summary-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 500;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .score-filters {
    flex-direction: column;
  }
  
  .score-filters .form-group {
    max-width: none;
  }
  
  .score-summary {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

