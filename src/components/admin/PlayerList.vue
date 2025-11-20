<template>
  <div class="player-list">
    <div class="card">
      <div class="card-header">
        <h2>Players</h2>
        <div class="card-actions">
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
              <th @click="sortBy('talentRating')">
                Talent Rating
                <span v-if="sortKey === 'talentRating'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('entryFee')">
                Entry Fee
                <span v-if="sortKey === 'entryFee'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
              </th>
              <th @click="sortBy('winnings')">
                Winnings
                <span v-if="sortKey === 'winnings'" :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'"></span>
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
              <td>{{ player.name }}</td>
              <td>{{ player.talentRating }}</td>
              <td>{{ formatCurrency(player.entryFee) }}</td>
              <td>{{ formatCurrency(player.winnings) }}</td>
              <td>{{ player.teamName || 'Unassigned' }}</td>
              <td>
                <button class="btn btn-sm" @click="editPlayer(player)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="confirmDeletePlayer(player)">Delete</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td></td>
              <td><strong>{{ formatCurrency(totalEntryFees) }}</strong></td>
              <td><strong>{{ formatCurrency(totalWinnings) }}</strong></td>
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
            @save="savePlayer" 
            @cancel="closePlayerForm"
          ></player-form>
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
      @confirm="deletePlayer"
      @cancel="cancelDeletePlayer"
    ></confirmation-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatCurrency } from '@/utils';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';
import PlayerForm from './PlayerForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';

export default {
  name: 'PlayerList',
  components: {
    PlayerForm,
    ConfirmationDialog
  },
  data() {
    return {
      showAddPlayerForm: false,
      editingPlayer: null,
      showDeleteConfirmation: false,
      playerToDelete: null,
      sortKey: 'name',
      sortDirection: 'asc'
    };
  },
  computed: {
    ...mapGetters('players', ['allPlayers', 'totalEntryFees', 'totalWinnings']),
    ...mapGetters('teams', ['teamById']),
    players() {
      return this.allPlayers.map(player => ({
        ...player,
        teamName: player.teamId ? this.teamById(player.teamId).name : null
      }));
    },
    sortedPlayers() {
      const players = [...this.players];
      
      return players.sort((a, b) => {
        let valueA = a[this.sortKey];
        let valueB = b[this.sortKey];
        
        // Handle null values
        if (valueA === null) valueA = '';
        if (valueB === null) valueB = '';
        
        // Compare based on type
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        } else {
          return this.sortDirection === 'asc' 
            ? valueA - valueB 
            : valueB - valueA;
        }
      });
    }
  },
  methods: {
    formatCurrency,
    sortBy(key) {
      // If clicking the same column, toggle direction
      if (this.sortKey === key) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortDirection = 'asc';
      }
    },
    editPlayer(player) {
      this.editingPlayer = { ...player };
      this.showAddPlayerForm = false;
    },
    confirmDeletePlayer(player) {
      this.playerToDelete = player;
      this.showDeleteConfirmation = true;
    },
    deletePlayer() {
      try {
        DataService.deletePlayer(this.playerToDelete.id);
        NotificationService.success(`Player ${this.playerToDelete.name} deleted successfully.`);
      } catch (error) {
        NotificationService.error(`Error deleting player: ${error.message}`);
      } finally {
        this.cancelDeletePlayer();
      }
    },
    cancelDeletePlayer() {
      this.showDeleteConfirmation = false;
      this.playerToDelete = null;
    },
    savePlayer(player) {
      try {
        if (player.id) {
          // Update existing player
          DataService.updatePlayer(player.id, player);
          NotificationService.success(`Player ${player.name} updated successfully.`);
        } else {
          // Add new player
          DataService.createPlayer(player);
          NotificationService.success(`Player ${player.name} added successfully.`);
        }
        this.closePlayerForm();
      } catch (error) {
        NotificationService.error(`Error saving player: ${error.message}`);
      }
    },
    closePlayerForm() {
      this.showAddPlayerForm = false;
      this.editingPlayer = null;
    }
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
  color: #666;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  margin-right: 5px;
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
</style>

