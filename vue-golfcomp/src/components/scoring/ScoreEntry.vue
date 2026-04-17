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
        
        <div class="save-all-bar">
          <button class="btn btn-primary" @click="saveAllScores"
                  :disabled="isSavingAll || validScoresCount === 0">
            <span v-if="isSavingAll">Saving...</span>
            <span v-else>Save All Scores ({{ validScoresCount }})</span>
          </button>
          <span v-if="dirtyScores.size > 0" class="unsaved-hint">
            {{ dirtyScores.size }} unsaved change(s)
          </span>
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
              <tr v-for="player in filteredPlayers" :key="player.id"
                  :class="{ 'row-dirty': dirtyScores.has(player.id) }">
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
                    min="0"
                    max="72"
                    :data-player-id="player.id"
                    @change="validateScoreInput(player.id)"
                    @input="markDirty(player.id)"
                  >
                  <div v-if="scoreErrors[player.id]" class="invalid-feedback">
                    {{ scoreErrors[player.id] }}
                  </div>
                </td>
                <td>
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
import { useScoresStore } from '@/stores/scores';
import { validateScore, getUserFriendlyErrorMessage } from '@/utils';
import NotificationService from '@/services/NotificationService';

const props = defineProps({
  roundId: {
    type: String,
    required: true
  }
});

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();
const scoresStore = useScoresStore();

const scores = ref({});
const scoreErrors = ref({});
const isSavingAll = ref(false);
const dirtyScores = ref(new Set());
const filterTeam = ref('');
const filterScored = ref('all');

const teams = computed(() => teamsStore.allTeams);

const getPlayerScore = (playerId) => {
  const score = scoresStore.scoreByPlayerAndRound(playerId, props.roundId);
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
  scores.value = {};
  scoreErrors.value = {};
  dirtyScores.value = new Set();

  if (!props.roundId) return;

  // Populate local inputs from store (API data from fetchScores)
  playersStore.allPlayers.forEach(player => {
    const score = scoresStore.scoreByPlayerAndRound(player.id, props.roundId);
    scores.value[player.id] = score ? score.value : '';
    scoreErrors.value[player.id] = null;
  });
};

onMounted(() => {
  loadScores();
});

watch(() => props.roundId, () => {
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

const markDirty = (playerId) => {
  dirtyScores.value = new Set([...dirtyScores.value, playerId]);
};

const validScoresCount = computed(() =>
  playersStore.allPlayers.filter(p =>
    scores.value[p.id] !== '' && scores.value[p.id] !== null &&
    scores.value[p.id] !== undefined && !scoreErrors.value[p.id]
  ).length
);

const saveAllScores = async () => {
  const playersToSave = playersStore.allPlayers.filter(p =>
    scores.value[p.id] !== '' && scores.value[p.id] !== null &&
    scores.value[p.id] !== undefined && !scoreErrors.value[p.id]
  );

  if (playersToSave.length === 0) return;

  isSavingAll.value = true;

  const results = await Promise.allSettled(
    playersToSave.map(player =>
      scoresStore.updateScore({ playerId: player.id, roundId: props.roundId, value: scores.value[player.id] })
    )
  );

  const succeeded = [];
  const failed = [];
  playersToSave.forEach((player, idx) => {
    if (results[idx].status === 'fulfilled') {
      succeeded.push(player);
      dirtyScores.value.delete(player.id);
    } else {
      failed.push(player);
    }
  });

  dirtyScores.value = new Set(dirtyScores.value);

  if (failed.length === 0) {
    NotificationService.success(`${succeeded.length} score(s) saved successfully`);
  } else {
    NotificationService.error(`${succeeded.length} saved, ${failed.length} failed`);
  }

  isSavingAll.value = false;
};

const clearScore = async (playerId) => {
  const player = playersStore.playerById(playerId);
  if (!player) return;

  if (!confirm(`Are you sure you want to clear the score for ${player.name}?`)) {
    return;
  }

  try {
    // Backend has no single-delete score endpoint; remove from local state only.
    // Score will reappear on next fetchScores() unless backend adds DELETE support.
    const score = scoresStore.scoreByPlayerAndRound(playerId, props.roundId);
    if (score) {
      scoresStore.deleteScore(score.id);
    }

    scores.value[playerId] = '';
    scoreErrors.value[playerId] = null;
    dirtyScores.value.delete(playerId);
    dirtyScores.value = new Set(dirtyScores.value);

    NotificationService.success('Score cleared successfully');
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
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

.save-all-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.unsaved-hint {
  font-size: 0.85rem;
  color: var(--text-muted, #6c757d);
}

.row-dirty td:first-child {
  border-left: 3px solid var(--primary-color, #3b82f6);
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
  background-color: var(--success-color);
}

.talent-b {
  background-color: var(--info-color);
}

.talent-c {
  background-color: var(--warning-color);
  color: #212529;
}

.talent-d {
  background-color: var(--danger-color);
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
  color: var(--danger-color);
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

