<template>
  <div class="player-assignment card">
    <div class="card-header">
      <h3>Player Assignment</h3>
    </div>
    <div class="card-body">
      <div v-if="teams.length === 0 || players.length === 0" class="empty-state">
        <p v-if="teams.length === 0">No teams available. Create teams first to assign players.</p>
        <p v-else-if="players.length === 0">No players available. Add players first to assign them to teams.</p>
      </div>
      
      <div v-else>
        <div class="assignment-controls">
          <div class="form-group">
            <label for="filterTalent">Filter by Talent</label>
            <select id="filterTalent" v-model="filterTalent" class="form-control">
              <option value="">All Ratings</option>
              <option value="A">A (Highest)</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D (Lowest)</option>
            </select>
          </div>
          
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
            <label for="sortBy">Sort By</label>
            <select id="sortBy" v-model="sortBy" class="form-control">
              <option value="name">Name</option>
              <option value="talentRating">Talent Rating</option>
              <option value="teamName">Team</option>
            </select>
          </div>
        </div>
        
        <div class="player-list">
          <div 
            v-for="player in filteredSortedPlayers" 
            :key="player.id" 
            class="player-card"
            :class="{ 'selected': selectedPlayer === player.id }"
            @click="selectPlayer(player.id)"
          >
            <div class="player-info">
              <div class="player-name">{{ player.name }}</div>
              <div class="player-talent" :class="'talent-' + player.talentRating.toLowerCase()">
                {{ player.talentRating }}
              </div>
            </div>
            <div class="player-team">
              {{ player.teamName || 'Unassigned' }}
            </div>
          </div>
        </div>
        
        <div class="assignment-actions" v-if="selectedPlayer">
          <div class="current-selection">
            <strong>Selected:</strong> {{ getPlayerName(selectedPlayer) }}
            <span 
              :class="'talent-badge talent-' + getPlayerTalent(selectedPlayer).toLowerCase()"
            >
              {{ getPlayerTalent(selectedPlayer) }}
            </span>
          </div>
          
          <div class="team-selection">
            <label for="assignToTeam">Assign to Team:</label>
            <select id="assignToTeam" v-model="selectedTeam" class="form-control">
              <option value="">Unassigned</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="btn" @click="assignPlayer" :disabled="!canAssign || isSubmitting">
              {{ assignButtonText }}
            </button>
            <button class="btn btn-secondary" @click="cancelSelection" :disabled="isSubmitting">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { getUserFriendlyErrorMessage } from '@/utils';
import NotificationService from '@/services/NotificationService';

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();

const filterTalent = ref('');
const filterTeam = ref('');
const sortBy = ref('name');
const selectedPlayer = ref(null);
const selectedTeam = ref('');
const isSubmitting = ref(false);

const teams = computed(() => teamsStore.allTeams);

const players = computed(() => {
  return playersStore.allPlayers.map(player => ({
    ...player,
    teamName: player.teamId ? teamsStore.teamById(player.teamId)?.name : null
  }));
});

const filteredSortedPlayers = computed(() => {
  let result = [...players.value];
  
  // Apply talent filter
  if (filterTalent.value) {
    result = result.filter(player => player.talentRating === filterTalent.value);
  }
  
  // Apply team filter
  if (filterTeam.value) {
    if (filterTeam.value === 'unassigned') {
      result = result.filter(player => !player.teamId);
    } else {
      result = result.filter(player => player.teamId === filterTeam.value);
    }
  }
  
  // Apply sorting
  result.sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy.value === 'talentRating') {
      // Sort by talent rating (A > B > C > D)
      const talentOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      return talentOrder[a.talentRating] - talentOrder[b.talentRating];
    } else if (sortBy.value === 'teamName') {
      // Sort by team name, with unassigned at the end
      if (!a.teamName && !b.teamName) return 0;
      if (!a.teamName) return 1;
      if (!b.teamName) return -1;
      return a.teamName.localeCompare(b.teamName);
    }
    return 0;
  });
  
  return result;
});

const canAssign = computed(() => {
  if (!selectedPlayer.value) return false;
  
  const player = playersStore.playerById(selectedPlayer.value);
  // Can assign if team is different from current team
  return player.teamId !== selectedTeam.value;
});

const assignButtonText = computed(() => {
  if (!selectedPlayer.value) return 'Assign';
  
  const player = playersStore.playerById(selectedPlayer.value);
  if (!selectedTeam.value) {
    return 'Unassign Player';
  } else if (!player.teamId) {
    return 'Assign to Team';
  } else {
    return 'Change Team';
  }
});

const selectPlayer = (playerId) => {
  selectedPlayer.value = playerId;
  
  // Set the selected team to the player's current team
  const player = playersStore.playerById(playerId);
  selectedTeam.value = player.teamId || '';
};

const getPlayerName = (playerId) => {
  const player = playersStore.playerById(playerId);
  return player ? player.name : '';
};

const getPlayerTalent = (playerId) => {
  const player = playersStore.playerById(playerId);
  return player ? player.talentRating : '';
};

const assignPlayer = async () => {
  isSubmitting.value = true;
  try {
    const player = playersStore.playerById(selectedPlayer.value);
    const oldTeamId = player.teamId;
    const newTeamId = selectedTeam.value || null;

    await playersStore.assignPlayerToTeam({ playerId: selectedPlayer.value, teamId: newTeamId });

    if (!newTeamId) {
      NotificationService.success(`${player.name} has been unassigned.`);
    } else if (!oldTeamId) {
      const team = teamsStore.teamById(newTeamId);
      NotificationService.success(`${player.name} has been assigned to ${team.name}.`);
    } else {
      const oldTeam = teamsStore.teamById(oldTeamId);
      const newTeam = teamsStore.teamById(newTeamId);
      NotificationService.success(`${player.name} has been moved from ${oldTeam.name} to ${newTeam.name}.`);
    }

    cancelSelection();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
};

const cancelSelection = () => {
  selectedPlayer.value = null;
  selectedTeam.value = '';
};
</script>

<style scoped>
.player-assignment {
  --selected-bg: rgba(23, 162, 184, 0.1);
  --accent-color: var(--info-color);

  margin-bottom: 20px;
}

body.dark-mode .player-assignment {
  --selected-bg: rgba(52, 152, 219, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  background-color: var(--background-color);
  border-radius: 8px;
  border: 2px dashed var(--border-color);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.assignment-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.assignment-controls .form-group {
  flex: 1;
}

.assignment-controls .form-group label {
  color: var(--text-color);
  font-weight: 500;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 5px;
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--card-bg);
  color: var(--text-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.player-card:hover {
  background-color: var(--sidebar-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.player-card.selected {
  background-color: var(--selected-bg);
  border-color: var(--accent-color);
  border-width: 2px;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.2);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-weight: 500;
  color: var(--text-color);
}

.player-talent {
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

.player-team {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-style: italic;
}

.assignment-actions {
  background-color: var(--background-color);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  border: 1px solid var(--border-color);
}

.current-selection {
  flex: 1;
  min-width: 200px;
  color: var(--text-color);
}

.current-selection strong {
  color: var(--text-color);
}

.team-selection {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-selection label {
  margin-bottom: 0;
  white-space: nowrap;
  color: var(--text-color);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 10px;
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
  margin-left: 8px;
}


@media (max-width: 768px) {
  .assignment-controls {
    flex-direction: column;
  }
  
  .player-list {
    grid-template-columns: 1fr;
  }
  
  .assignment-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .team-selection {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .action-buttons {
    justify-content: stretch;
  }
  
  .action-buttons button {
    flex: 1;
  }
}
</style>

