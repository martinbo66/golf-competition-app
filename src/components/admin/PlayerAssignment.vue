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
            <label>Assign to Team:</label>
            <select v-model="selectedTeam" class="form-control">
              <option value="">Unassigned</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="btn" @click="assignPlayer" :disabled="!canAssign">
              {{ assignButtonText }}
            </button>
            <button class="btn btn-secondary" @click="cancelSelection">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';

export default {
  name: 'PlayerAssignment',
  data() {
    return {
      filterTalent: '',
      filterTeam: '',
      sortBy: 'name',
      selectedPlayer: null,
      selectedTeam: ''
    };
  },
  computed: {
    ...mapGetters('teams', ['allTeams', 'teamById']),
    ...mapGetters('players', ['allPlayers', 'playerById']),
    teams() {
      return this.allTeams;
    },
    players() {
      return this.allPlayers.map(player => ({
        ...player,
        teamName: player.teamId ? this.teamById(player.teamId).name : null
      }));
    },
    filteredSortedPlayers() {
      let result = [...this.players];
      
      // Apply talent filter
      if (this.filterTalent) {
        result = result.filter(player => player.talentRating === this.filterTalent);
      }
      
      // Apply team filter
      if (this.filterTeam) {
        if (this.filterTeam === 'unassigned') {
          result = result.filter(player => !player.teamId);
        } else {
          result = result.filter(player => player.teamId === this.filterTeam);
        }
      }
      
      // Apply sorting
      result.sort((a, b) => {
        if (this.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (this.sortBy === 'talentRating') {
          // Sort by talent rating (A > B > C > D)
          const talentOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          return talentOrder[a.talentRating] - talentOrder[b.talentRating];
        } else if (this.sortBy === 'teamName') {
          // Sort by team name, with unassigned at the end
          if (!a.teamName && !b.teamName) return 0;
          if (!a.teamName) return 1;
          if (!b.teamName) return -1;
          return a.teamName.localeCompare(b.teamName);
        }
        return 0;
      });
      
      return result;
    },
    canAssign() {
      if (!this.selectedPlayer) return false;
      
      const player = this.playerById(this.selectedPlayer);
      // Can assign if team is different from current team
      return player.teamId !== this.selectedTeam;
    },
    assignButtonText() {
      if (!this.selectedPlayer) return 'Assign';
      
      const player = this.playerById(this.selectedPlayer);
      if (!this.selectedTeam) {
        return 'Unassign Player';
      } else if (!player.teamId) {
        return 'Assign to Team';
      } else {
        return 'Change Team';
      }
    }
  },
  methods: {
    selectPlayer(playerId) {
      this.selectedPlayer = playerId;
      
      // Set the selected team to the player's current team
      const player = this.playerById(playerId);
      this.selectedTeam = player.teamId || '';
    },
    getPlayerName(playerId) {
      const player = this.playerById(playerId);
      return player ? player.name : '';
    },
    getPlayerTalent(playerId) {
      const player = this.playerById(playerId);
      return player ? player.talentRating : '';
    },
    assignPlayer() {
      try {
        const player = this.playerById(this.selectedPlayer);
        const oldTeamId = player.teamId;
        const newTeamId = this.selectedTeam || null;
        
        // Assign player to team
        DataService.assignPlayerToTeam(this.selectedPlayer, newTeamId);
        
        // Show success notification
        if (!newTeamId) {
          NotificationService.success(`${player.name} has been unassigned.`);
        } else if (!oldTeamId) {
          const team = this.teamById(newTeamId);
          NotificationService.success(`${player.name} has been assigned to ${team.name}.`);
        } else {
          const oldTeam = this.teamById(oldTeamId);
          const newTeam = this.teamById(newTeamId);
          NotificationService.success(`${player.name} has been moved from ${oldTeam.name} to ${newTeam.name}.`);
        }
        
        // Reset selection
        this.cancelSelection();
      } catch (error) {
        NotificationService.error(`Error assigning player: ${error.message}`);
      }
    },
    cancelSelection() {
      this.selectedPlayer = null;
      this.selectedTeam = '';
    }
  }
};
</script>

<style scoped>
.player-assignment {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted, #666);
}

.assignment-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.assignment-controls .form-group {
  flex: 1;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: var(--card-bg, #f8f9fa);
  color: var(--card-text, #333);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--card-border, #e9ecef);
}

.player-card:hover {
  background-color: var(--hover-bg, #e9ecef);
}

.player-card.selected {
  background-color: var(--selected-bg, #d1ecf1);
  border-left: 3px solid var(--accent-color, #17a2b8);
}

.player-info {
  display: flex;
  align-items: center;
}

.player-name {
  margin-right: 10px;
  font-weight: 500;
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
  color: var(--text-muted, #6c757d);
}

.assignment-actions {
  background-color: var(--card-header-bg, #f8f9fa);
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  border: 1px solid var(--card-border, #e9ecef);
}

.current-selection {
  flex: 1;
  min-width: 200px;
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
}

.action-buttons {
  display: flex;
  gap: 10px;
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
  margin-left: 5px;
}

@media (max-width: 768px) {
  .assignment-controls {
    flex-direction: column;
  }
  
  .assignment-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .team-selection {
    flex-direction: column;
    align-items: stretch;
  }
  
  .team-selection label {
    margin-bottom: 5px;
  }
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .player-assignment {
    --card-bg: #2d3748;
    --card-text: #e2e8f0;
    --card-header-bg: #1a202c;
    --card-border: #4a5568;
    --text-muted: #a0aec0;
    --hover-bg: #4a5568;
    --selected-bg: #2b6cb0;
    --accent-color: #4299e1;
  }
}

/* Force dark mode styles for apps that use dark class */
.dark .player-assignment,
[data-theme="dark"] .player-assignment {
  --card-bg: #2d3748;
  --card-text: #e2e8f0;
  --card-header-bg: #1a202c;
  --card-border: #4a5568;
  --text-muted: #a0aec0;
  --hover-bg: #4a5568;
  --selected-bg: #2b6cb0;
  --accent-color: #4299e1;
}
</style>

