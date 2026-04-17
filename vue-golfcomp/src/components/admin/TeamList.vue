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
              <h3><button class="name-link" @click="editTeam(team)">{{ team.name }}</button></h3>
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
              <div class="team-logo">
                <div class="logo-placeholder" v-if="!team.logoUrl">
                  {{ getTeamInitials(team.name) }}
                </div>
                <img v-else :src="team.logoUrl" :alt="team.name + ' logo'" class="logo-image" @error="onLogoError($event, team)">
              </div>
              
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
            :loading="isSubmitting"
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
            <button type="button" class="btn btn-secondary" @click="showGenerateTeamsModal = false" :disabled="isGenerating">Cancel</button>
            <button type="button" class="btn" @click="generateTeams" :disabled="isGenerating">Generate Teams</button>
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
      :confirm-loading="isDeleting"
      loading-text="Deleting..."
      @confirm="deleteTeam"
      @cancel="cancelDeleteTeam"
    ></confirmation-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { getUserFriendlyErrorMessage } from '@/utils';
import NotificationService from '@/services/NotificationService';
import TeamForm from './TeamForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();

const showAddTeamForm = ref(false);
const editingTeam = ref(null);
const showDeleteConfirmation = ref(false);
const teamToDelete = ref(null);
const showGenerateTeamsModal = ref(false);
const numberOfTeams = ref(4);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const isGenerating = ref(false);

const teams = computed(() => teamsStore.allTeams);

const getTeamPlayers = (teamId) => {
  return playersStore.playersByTeam(teamId);
};

const getPlayerCountByTalent = (teamId, talentRating) => {
  return getTeamPlayers(teamId).filter(player => player.talentRating === talentRating).length;
};

const getTeamInitials = (teamName) => {
  if (!teamName) return 'TM';
  
  // Split by spaces and apostrophes, then take first letter of each word
  const words = teamName.split(/[\s']+/).filter(word => word.length > 0);
  
  if (words.length === 1) {
    // Single word: take first two letters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words: take first letter of each word (up to 3)
    return words.slice(0, 3).map(word => word.charAt(0)).join('').toUpperCase();
  }
};

const onLogoError = (event, team) => {
  // Hide the broken image and show initials instead
  event.target.style.display = 'none';
  
  // Find the team logo container and add initials fallback
  const logoContainer = event.target.parentElement;
  if (!logoContainer.querySelector('.logo-placeholder')) {
    const placeholder = document.createElement('div');
    placeholder.className = 'logo-placeholder';
    placeholder.textContent = getTeamInitials(team.name);
    logoContainer.appendChild(placeholder);
  }
};

const editTeam = (team) => {
  editingTeam.value = { ...team };
  showAddTeamForm.value = false;
};

const confirmDeleteTeam = (team) => {
  teamToDelete.value = team;
  showDeleteConfirmation.value = true;
};

const deleteTeam = async () => {
  isDeleting.value = true;
  try {
    await teamsStore.deleteTeam(teamToDelete.value.id);
    NotificationService.success(`Team ${teamToDelete.value.name} deleted successfully.`);
    cancelDeleteTeam();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isDeleting.value = false;
  }
};

const cancelDeleteTeam = () => {
  showDeleteConfirmation.value = false;
  teamToDelete.value = null;
};

const saveTeam = async (team) => {
  isSubmitting.value = true;
  try {
    if (team.id) {
      await teamsStore.updateTeam({ id: team.id, updates: team });
      NotificationService.success(`Team ${team.name} updated successfully.`);
    } else {
      await teamsStore.addTeam(team);
      NotificationService.success(`Team ${team.name} added successfully.`);
    }
    closeTeamForm();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
};

const closeTeamForm = () => {
  showAddTeamForm.value = false;
  editingTeam.value = null;
};

const generateTeams = async () => {
  if (numberOfTeams.value < 2 || numberOfTeams.value > 10) {
    NotificationService.warning('Please choose between 2 and 10 teams.');
    return;
  }
  isGenerating.value = true;
  try {
    await teamsStore.generateTeams(numberOfTeams.value);
    NotificationService.success(`${numberOfTeams.value} teams generated successfully.`);
    showGenerateTeamsModal.value = false;
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.team-list {
  --card-header-bg: rgba(0, 0, 0, 0.03);
  --hover-bg: var(--sidebar-hover);
}

.card {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.card-header {
  background-color: var(--card-header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-color);
}

.card-actions {
  display: flex;
  gap: 10px;
}

.card-body {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: var(--background-color);
  border-radius: 8px;
  border: 2px dashed var(--border-color);
  color: var(--text-muted);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.team-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
}

.team-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--card-header-bg);
  border-bottom: 1px solid var(--border-color);
}

.team-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
}

.name-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--primary-color);
  font-size: inherit;
  font-weight: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.name-link:hover {
  color: var(--primary-dark, var(--primary-color));
  text-decoration: none;
}

.team-actions {
  display: flex;
  gap: 5px;
}

.btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: var(--primary-dark);
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.btn-icon:hover {
  background-color: var(--hover-bg);
  color: var(--text-color);
}

.team-stats {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  gap: 15px;
}

.team-logo {
  flex-shrink: 0;
}

.logo-placeholder {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color, #007bff) 0%, var(--primary-dark, #0056b3) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.logo-placeholder:hover {
  transform: scale(1.05);
}

.logo-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-color);
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

.team-players {
  padding: 15px;
  flex: 1;
}

.team-players h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
}

.team-players ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.team-players li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color);
}

.team-players li:last-child {
  border-bottom: none;
}

.no-players {
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
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
  background-color: var(--card-bg);
  color: var(--text-color);
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-weight: 600;
}

.modal-body {
  padding: 20px;
  color: var(--text-color);
  background-color: var(--card-bg);
}

.modal-body p {
  color: var(--text-color);
  margin-bottom: 15px;
  line-height: 1.5;
}

.modal-body .form-group {
  margin-bottom: 20px;
}

.modal-body .form-group label {
  color: var(--text-color);
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.modal-body .form-control {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.modal-body .form-text {
  color: var(--text-muted);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: var(--text-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions .btn {
  min-width: 100px;
  font-weight: 500;
}

.form-actions .btn-secondary {
  background-color: var(--text-muted);
  color: white;
  border: 1px solid var(--text-muted);
}

.form-actions .btn-secondary:hover {
  background-color: var(--text-color);
  border-color: var(--text-color);
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid transparent;
}

.alert-warning {
  background-color: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: #856404;
}

.alert-warning strong {
  color: #856404;
}

body.dark-mode .alert-warning,
body.dark-mode .alert-warning strong {
  color: var(--warning-color);
}

</style>

