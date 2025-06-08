<template>
  <div class="team-list">
    <div class="card">
      <div class="card-header">
        <h2>Teams</h2>
        <div class="card-actions">
          <button class="btn" @click="showAddTeamForm = true">Add Team</button>
          <button class="btn" @click="showGenerateTeamsModal = true">Generate Teams</button>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="teams.length === 0" class="empty-state">
          <p>No teams created yet. Click "Add Team" to create a team manually or "Generate Teams" to automatically create balanced teams.</p>
        </div>
        
        <div v-else class="teams-grid">
          <div v-for="team in teams" :key="team.id" class="team-card">
            <div class="team-header">
              <h3>{{ team.name }}</h3>
              <div class="team-actions">
                <button class="btn-icon" @click="editTeam(team)" title="Edit Team">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" @click="confirmDeleteTeam(team)" title="Delete Team">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="team-stats">
              <div class="stat-item">
                <div class="stat-label">Players</div>
                <div class="stat-value">{{ getTeamPlayers(team.id).length }}</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-label">Talent</div>
                <div class="stat-value talent-distribution">
                  <span v-for="rating in ['A', 'B', 'C', 'D']" :key="rating" 
                    :class="'talent-badge talent-' + rating.toLowerCase()"
                    :title="rating + ' players: ' + getPlayerCountByTalent(team.id, rating)"
                  >
                    {{ getPlayerCountByTalent(team.id, rating) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="team-players">
              <h4>Players</h4>
              <ul v-if="getTeamPlayers(team.id).length > 0">
                <li v-for="player in getTeamPlayers(team.id)" :key="player.id">
                  {{ player.name }} 
                  <span :class="'talent-badge talent-' + player.talentRating.toLowerCase()">
                    {{ player.talentRating }}
                  </span>
                </li>
              </ul>
              <p v-else class="no-players">No players assigned to this team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Team Modal -->
    <div v-if="showAddTeamForm || editingTeam" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingTeam ? 'Edit Team' : 'Add Team' }}</h3>
          <button class="close-btn" @click="closeTeamForm">&times;</button>
        </div>
        <div class="modal-body">
          <team-form 
            :team="editingTeam" 
            @save="saveTeam" 
            @cancel="closeTeamForm"
          ></team-form>
        </div>
      </div>
    </div>
    
    <!-- Generate Teams Modal -->
    <div v-if="showGenerateTeamsModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Generate Teams</h3>
          <button class="close-btn" @click="showGenerateTeamsModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="numberOfTeams">Number of Teams</label>
            <input 
              type="number" 
              id="numberOfTeams" 
              v-model="numberOfTeams" 
              class="form-control"
              min="2"
              max="10"
            >
            <small class="form-text text-muted">
              Choose between 2 and 10 teams. Players will be distributed evenly based on talent ratings.
            </small>
          </div>
          
          <div class="alert alert-warning" v-if="teams.length > 0">
            <strong>Warning:</strong> Generating new teams will delete all existing teams and reassign all players.
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showGenerateTeamsModal = false">Cancel</button>
            <button type="button" class="btn" @click="generateTeams">Generate Teams</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Dialog -->
    <confirmation-dialog
      :show="showDeleteConfirmation"
      title="Delete Team"
      :message="`Are you sure you want to delete ${teamToDelete ? teamToDelete.name : ''}? All players will be unassigned.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      @confirm="deleteTeam"
      @cancel="cancelDeleteTeam"
    ></confirmation-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';
import TeamForm from './TeamForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';

export default {
  name: 'TeamList',
  components: {
    TeamForm,
    ConfirmationDialog
  },
  data() {
    return {
      showAddTeamForm: false,
      editingTeam: null,
      showDeleteConfirmation: false,
      teamToDelete: null,
      showGenerateTeamsModal: false,
      numberOfTeams: 4
    };
  },
  computed: {
    ...mapGetters('teams', ['allTeams']),
    ...mapGetters('players', ['playersByTeam']),
    teams() {
      return this.allTeams;
    }
  },
  methods: {
    getTeamPlayers(teamId) {
      return this.playersByTeam(teamId);
    },
    getPlayerCountByTalent(teamId, talentRating) {
      return this.getTeamPlayers(teamId).filter(player => player.talentRating === talentRating).length;
    },
    editTeam(team) {
      this.editingTeam = { ...team };
      this.showAddTeamForm = false;
    },
    confirmDeleteTeam(team) {
      this.teamToDelete = team;
      this.showDeleteConfirmation = true;
    },
    deleteTeam() {
      try {
        DataService.deleteTeam(this.teamToDelete.id);
        NotificationService.success(`Team ${this.teamToDelete.name} deleted successfully.`);
      } catch (error) {
        NotificationService.error(`Error deleting team: ${error.message}`);
      } finally {
        this.cancelDeleteTeam();
      }
    },
    cancelDeleteTeam() {
      this.showDeleteConfirmation = false;
      this.teamToDelete = null;
    },
    saveTeam(team) {
      try {
        if (team.id) {
          // Update existing team
          DataService.updateTeam(team.id, team);
          NotificationService.success(`Team ${team.name} updated successfully.`);
        } else {
          // Add new team
          DataService.createTeam(team);
          NotificationService.success(`Team ${team.name} added successfully.`);
        }
        this.closeTeamForm();
      } catch (error) {
        NotificationService.error(`Error saving team: ${error.message}`);
      }
    },
    closeTeamForm() {
      this.showAddTeamForm = false;
      this.editingTeam = null;
    },
    generateTeams() {
      try {
        if (this.numberOfTeams < 2 || this.numberOfTeams > 10) {
          NotificationService.warning('Please choose between 2 and 10 teams.');
          return;
        }
        
        DataService.generateTeams(this.numberOfTeams);
        NotificationService.success(`${this.numberOfTeams} teams generated successfully.`);
        this.showGenerateTeamsModal = false;
      } catch (error) {
        NotificationService.error(`Error generating teams: ${error.message}`);
      }
    }
  }
};
</script>

<style scoped>
.team-list {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.team-card {
  background-color: var(--card-bg, #fff);
  color: var(--card-text, #333);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--card-border, #e9ecef);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: var(--card-header-bg, #f8f9fa);
  border-bottom: 1px solid var(--card-border, #e9ecef);
}

.team-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.team-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--text-muted, #6c757d);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: var(--hover-bg, #e9ecef);
  color: var(--text-primary, #495057);
}

.team-stats {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid var(--card-border, #e9ecef);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted, #6c757d);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 500;
}

.talent-distribution {
  display: flex;
  justify-content: center;
  gap: 5px;
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

.team-players {
  padding: 15px;
  flex: 1;
}

.team-players h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 500;
}

.team-players ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.team-players li {
  padding: 8px 0;
  border-bottom: 1px solid var(--card-border, #e9ecef);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-players li:last-child {
  border-bottom: none;
}

.no-players {
  color: var(--text-muted, #6c757d);
  font-style: italic;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.modal-body {
  padding: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  margin-left: 10px;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
  color: #6c757d;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .team-list {
    --card-bg: #2d3748;
    --card-text: #e2e8f0;
    --card-header-bg: #1a202c;
    --card-border: #4a5568;
    --text-muted: #a0aec0;
    --text-primary: #e2e8f0;
    --hover-bg: #4a5568;
  }
}

/* Force dark mode styles for apps that use dark class */
.dark .team-list,
[data-theme="dark"] .team-list {
  --card-bg: #2d3748;
  --card-text: #e2e8f0;
  --card-header-bg: #1a202c;
  --card-border: #4a5568;
  --text-muted: #a0aec0;
  --text-primary: #e2e8f0;
  --hover-bg: #4a5568;
}
</style>

