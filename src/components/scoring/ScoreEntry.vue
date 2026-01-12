<template>
  <div class="score-entry card">
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
                    :data-player-id="player.id"
                    @change="validateScoreInput(player.id)"
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

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { useCoursesStore } from '@/stores/courses';
import { useScoresStore } from '@/stores/scores';
import { validateScore } from '@/utils';
import NotificationService from '@/services/NotificationService';

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
});

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();
const coursesStore = useCoursesStore();
const scoresStore = useScoresStore();

const scores = ref({});
const scoreErrors = ref({});
const isSaving = ref({});
const filterTeam = ref('');
const filterScored = ref('all');

const courseData = computed(() => {
  return coursesStore.courseById(props.courseId) || { name: 'Unknown Course' };
});

const teams = computed(() => teamsStore.allTeams);

const getPlayerScore = (playerId) => {
  const score = scoresStore.scoreByPlayerAndCourse({ playerId, courseId: props.courseId });
  return score ? score.value : null;
};

const hasScore = (playerId) => {
  return getPlayerScore(playerId) !== null;
};

const players = computed(() => {
  return playersStore.allPlayers.map(player => ({
    ...player,
    teamName: player.teamId ? teamsStore.teamById(player.teamId)?.name : null,
    score: getPlayerScore(player.id)
  }));
});

const filteredPlayers = computed(() => {
  let result = [...players.value];
  
  // Apply team filter
  if (filterTeam.value) {
    if (filterTeam.value === 'unassigned') {
      result = result.filter(player => !player.teamId);
    } else {
      result = result.filter(player => player.teamId === filterTeam.value);
    }
  }
  
  // Apply scored filter
  if (filterScored.value === 'scored') {
    result = result.filter(player => hasScore(player.id));
  } else if (filterScored.value === 'unscored') {
    result = result.filter(player => !hasScore(player.id));
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
});

const scoredCount = computed(() => {
  return filteredPlayers.value.filter(player => hasScore(player.id)).length;
});

const averageScore = computed(() => {
  const scoredPlayers = filteredPlayers.value.filter(player => hasScore(player.id));
  if (scoredPlayers.length === 0) return 'N/A';
  
  const sum = scoredPlayers.reduce((total, player) => {
    return total + getPlayerScore(player.id);
  }, 0);
  
  return (sum / scoredPlayers.length).toFixed(1);
});

const bestScore = computed(() => {
  const scoredPlayers = filteredPlayers.value.filter(player => hasScore(player.id));
  if (scoredPlayers.length === 0) return 'N/A';
  
  const scoresList = scoredPlayers.map(player => getPlayerScore(player.id));
  return Math.max(...scoresList);
});

const worstScore = computed(() => {
  const scoredPlayers = filteredPlayers.value.filter(player => hasScore(player.id));
  if (scoredPlayers.length === 0) return 'N/A';
  
  const scoresList = scoredPlayers.map(player => getPlayerScore(player.id));
  return Math.min(...scoresList);
});

const loadScores = () => {
  // Reset local state
  scores.value = {};
  scoreErrors.value = {};
  isSaving.value = {};

  players.value.forEach(player => {
    if (typeof player.id === 'object') {
        console.error('ScoreEntry: Player ID is an object!', player);
    }

    if (!props.courseId) {
        console.warn('ScoreEntry: No courseId provided to loadScores');
        // Decide how to handle this case, maybe skip loading for this player or set a default
        scoreErrors.value[player.id] = 'No course ID provided.';
        return;
    }

    const score = scoresStore.scoreByPlayerAndCourse({ playerId: player.id, courseId: props.courseId });

    if (score) {
      scores.value[player.id] = score.value;
    } else {
      scores.value[player.id] = '';
    }
    scoreErrors.value[player.id] = null;
    isSaving.value[player.id] = false;
  });
};

onMounted(() => {
  loadScores();
});

watch(() => props.courseId, () => {
  loadScores();
});

const validateScoreInput = (playerId) => {
  const scoreValue = scores.value[playerId];
  
  if (scoreValue === '' || scoreValue === null || scoreValue === undefined) {
    scoreErrors.value[playerId] = null;
    return true;
  }
  
  const validation = validateScore(scoreValue);
  
  if (!validation.isValid) {
    scoreErrors.value[playerId] = validation.error;
    return false;
  }
  
  scoreErrors.value[playerId] = null;
  return true;
};

const isScoreValid = (playerId) => {
  return scores.value[playerId] !== '' && scores.value[playerId] !== null && !scoreErrors.value[playerId];
};

const saveScore = async (playerId) => {
  if (!isScoreValid(playerId)) return;
  
  isSaving.value[playerId] = true;
  
  try {
    await scoresStore.updateScore({ playerId, courseId: props.courseId, value: scores.value[playerId] });
    NotificationService.success('Score saved successfully');
  } catch (error) {
    NotificationService.error(`Error saving score: ${error.message}`);
  } finally {
    isSaving.value[playerId] = false;
  }
};

const clearScore = async (playerId) => {
  const player = players.value.find(p => p.id === playerId);
  if (!player) return;
  
  if (!confirm(`Are you sure you want to clear the score for ${player.name}?`)) {
    return;
  }
  
  isSaving.value[playerId] = true;
  
  try {
    // Delete the score by setting it to null
    const score = scoresStore.scoreByPlayerAndCourse({ playerId, courseId: props.courseId });
    if (score) {
      await scoresStore.deleteScore(score.id);
    }
    
    // Clear the input
    scores.value[playerId] = '';
    scoreErrors.value[playerId] = null;
    
    NotificationService.success('Score cleared successfully');
  } catch (error) {
    NotificationService.error(`Error clearing score: ${error.message}`);
  } finally {
    isSaving.value[playerId] = false;
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
  color: var(--text-muted, #666);
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
  background-color: var(--card-header-bg, #f8f9fa);
  color: var(--card-text, #333);
  border-radius: 4px;
  padding: 15px;
  border: 1px solid var(--card-border, #e9ecef);
}

.summary-item {
  flex: 1;
  min-width: 150px;
  text-align: center;
}

.summary-label {
  font-size: 0.9rem;
  color: var(--text-muted, #6c757d);
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

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .score-entry {
    --card-text: #e2e8f0;
    --card-header-bg: #1a202c;
    --card-border: #4a5568;
    --text-muted: #a0aec0;
  }
}

/* Force dark mode styles for apps that use dark class */
.dark .score-entry,
[data-theme="dark"] .score-entry {
  --card-text: #e2e8f0;
  --card-header-bg: #1a202c;
  --card-border: #4a5568;
  --text-muted: #a0aec0;
}
</style>

