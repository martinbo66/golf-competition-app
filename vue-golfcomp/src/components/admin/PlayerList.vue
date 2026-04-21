<template>
  <div class="player-list">
    <div class="card">
      <div class="card-header">

        <div class="card-actions">
          <button class="btn btn-secondary" @click="showCopyModal = true">Copy from Competition</button>
          <button class="btn" @click="showAddPlayerForm = true">Add Player</button>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="players.length === 0" class="empty-state">
          <p>No players added yet. Click "Add Player" to get started.</p>
        </div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th @click="sortBy('name')">
                Name
                <span v-if="sortKey === 'name'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th>Nickname</th>
              <th @click="sortBy('talentRating')">
                Talent Rating
                <span v-if="sortKey === 'talentRating'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('entryFee')">
                Entry Fee
                <span v-if="sortKey === 'entryFee'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('winnings')">
                Paid
                <span v-if="sortKey === 'winnings'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('outstanding')">
                Outstanding
                <span v-if="sortKey === 'outstanding'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('teamName')">
                Team
                <span v-if="sortKey === 'teamName'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in sortedPlayers" :key="player.id">
              <td><button class="name-link" @click="editPlayer(player)">{{ player.name }}</button></td>
              <td>{{ player.nickname || '' }}</td>
              <td>{{ player.talentRating }}</td>
              <td>{{ formatCurrency(player.entryFee) }}</td>
              <td>{{ formatCurrency(player.winnings) }}</td>
              <td :class="{ 'outstanding-cell': player.outstanding > 0 }">{{ formatCurrency(player.outstanding) }}</td>
              <td>{{ player.teamName || 'Unassigned' }}</td>
              <td class="action-cell">
                <button class="icon-btn" title="Edit player" @click="editPlayer(player)">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="icon-btn icon-btn-danger" title="Delete player" @click="confirmDeletePlayer(player)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td></td>
              <td></td>
              <td><strong>{{ formatCurrency(totalEntryFees) }}</strong></td>
              <td><strong>{{ formatCurrency(totalWinnings) }}</strong></td>
              <td :class="{ 'outstanding-cell': totalOutstanding > 0 }">
                <strong>{{ formatCurrency(totalOutstanding) }}</strong>
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    
    <!-- Add/Edit Player Form Modal -->
    <div v-if="showAddPlayerForm || editingPlayer" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingPlayer ? 'Edit Player' : 'Add Player' }}</h3>
          <button class="close-btn" @click="closePlayerForm">&times;</button>
        </div>
        <div class="modal-body">
          <player-form 
            :player="editingPlayer" 
            :loading="isSubmitting"
            @save="savePlayer" 
            @cancel="closePlayerForm"
          ></player-form>
        </div>
      </div>
    </div>
    
    <!-- Copy Players Modal -->
    <div v-if="showCopyModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Copy Players from Competition</h3>
          <button class="close-btn" @click="closeCopyModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="copy-description">Select a competition to copy players from. Players will be added to the current competition without replacing existing ones.</p>
          <div class="form-group">
            <label class="form-label" for="source-competition">Source Competition</label>
            <select id="source-competition" v-model="selectedSourceCompetitionId" class="form-control">
              <option value="">-- Select a competition --</option>
              <option
                v-for="comp in otherCompetitions"
                :key="comp.id"
                :value="comp.id"
              >{{ comp.name }}</option>
            </select>
            <p v-if="otherCompetitions.length === 0" class="no-competitions">No other competitions available.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCopyModal" :disabled="isCopying">Cancel</button>
          <button
            class="btn btn-primary"
            @click="copyPlayers"
            :disabled="!selectedSourceCompetitionId || isCopying"
          >{{ isCopying ? 'Copying...' : 'Copy Players' }}</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <confirmation-dialog
      :show="showDeleteConfirmation"
      title="Delete Player"
      :message="`Are you sure you want to delete ${playerToDelete ? playerToDelete.name : ''}?`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :confirm-loading="isDeleting"
      loading-text="Deleting..."
      @confirm="deletePlayer"
      @cancel="cancelDeletePlayer"
    ></confirmation-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useCompetitionsStore } from '@/stores/competitions';
import { usePayoutsStore } from '@/stores/payouts';
import { formatCurrency, getUserFriendlyErrorMessage } from '@/utils';
import NotificationService from '@/services/NotificationService';
import PlayerForm from './PlayerForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';

const playersStore = usePlayersStore();
const teamsStore = useTeamsStore();
const competitionsStore = useCompetitionsStore();
const payoutsStore = usePayoutsStore();

const showAddPlayerForm = ref(false);
const editingPlayer = ref(null);
const showDeleteConfirmation = ref(false);
const playerToDelete = ref(null);
const sortKey = ref('name');
const sortDirection = ref('asc');
const isSubmitting = ref(false);
const isDeleting = ref(false);
const showCopyModal = ref(false);
const selectedSourceCompetitionId = ref('');
const isCopying = ref(false);

const players = computed(() => {
  return playersStore.allPlayers.map(player => ({
    ...player,
    teamName: player.teamId ? teamsStore.teamById(player.teamId)?.name : null,
    outstanding: payoutsStore.unpaidTotalByPlayer(player.id)
  }));
});

const totalEntryFees = computed(() => playersStore.totalEntryFees);
const totalWinnings = computed(() => playersStore.totalWinnings);
const totalOutstanding = computed(() => playersStore.totalOutstandingWinnings);
const otherCompetitions = computed(() =>
  competitionsStore.allCompetitions.filter(c => c.id !== competitionsStore.activeCompetitionId)
);

const sortedPlayers = computed(() => {
  const playersList = [...players.value];
  
  return playersList.sort((a, b) => {
    let valueA = a[sortKey.value];
    let valueB = b[sortKey.value];
    
    // Handle null values
    if (valueA === null) valueA = '';
    if (valueB === null) valueB = '';
    
    // Compare based on type
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection.value === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else {
      return sortDirection.value === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
  });
});

const sortBy = (key) => {
  // If clicking the same column, toggle direction
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

const editPlayer = (player) => {
  editingPlayer.value = { ...player };
  showAddPlayerForm.value = false;
};

const confirmDeletePlayer = (player) => {
  playerToDelete.value = player;
  showDeleteConfirmation.value = true;
};

const deletePlayer = async () => {
  isDeleting.value = true;
  try {
    await playersStore.deletePlayer(playerToDelete.value.id);
    NotificationService.success(`Player ${playerToDelete.value.name} deleted successfully.`);
    cancelDeletePlayer();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isDeleting.value = false;
  }
};

const cancelDeletePlayer = () => {
  showDeleteConfirmation.value = false;
  playerToDelete.value = null;
};

const savePlayer = async (player) => {
  isSubmitting.value = true;
  try {
    if (player.id) {
      await playersStore.updatePlayer({ id: player.id, updates: player });
      NotificationService.success(`Player ${player.name} updated successfully.`);
    } else {
      await playersStore.addPlayer(player);
      NotificationService.success(`Player ${player.name} added successfully.`);
    }
    closePlayerForm();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
};

const closePlayerForm = () => {
  showAddPlayerForm.value = false;
  editingPlayer.value = null;
};

const closeCopyModal = () => {
  showCopyModal.value = false;
  selectedSourceCompetitionId.value = '';
};

const copyPlayers = async () => {
  if (!selectedSourceCompetitionId.value) return;
  isCopying.value = true;
  try {
    const count = await playersStore.copyPlayersFromCompetition(selectedSourceCompetitionId.value);
    NotificationService.success(`${count} player${count === 1 ? '' : 's'} copied successfully.`);
    closeCopyModal();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isCopying.value = false;
  }
};
</script>

<style scoped>
.player-list {
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

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
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
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-muted);
}

.close-btn:hover {
  color: var(--text-color);
}

.name-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--primary-color);
  font-size: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.name-link:hover {
  color: var(--primary-dark, var(--primary-color));
  text-decoration: none;
}

.action-cell {
  white-space: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
  transition: color 0.2s, background-color 0.2s;
}

.icon-btn:hover {
  color: var(--primary-color);
  background-color: var(--border-color);
}

.icon-btn-danger:hover {
  color: var(--danger-color, #dc3545);
  background-color: rgba(220, 53, 69, 0.1);
}

.sort-asc::after {
  content: " ▲";
  font-size: 0.8em;
}

.sort-desc::after {
  content: " ▼";
  font-size: 0.8em;
}

th {
  cursor: pointer;
}

th:hover {
  background-color: var(--border-color);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
}

.copy-description {
  margin-bottom: 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.no-competitions {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-style: italic;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.outstanding-cell {
  color: var(--danger-color, #dc3545);
  font-weight: 600;
}
</style>

