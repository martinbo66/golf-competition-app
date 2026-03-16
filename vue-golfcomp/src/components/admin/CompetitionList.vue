<template>
  <div class="competition-list">
    <div class="card">
      <div class="card-header">
        <h2>Competitions</h2>
        <div class="card-actions">
          <button class="btn btn-primary" @click="openCreateForm">+ New Competition</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="competitions.length === 0" class="empty-state">
          <p>No competitions found. Click "New Competition" to create one.</p>
        </div>

        <div v-else class="competitions-grid">
          <div
            v-for="comp in competitions"
            :key="comp.id"
            class="comp-card"
            :class="{ 'comp-card--active': isActive(comp) }"
          >
            <div class="comp-card__header">
              <h3 class="comp-card__name">{{ comp.name }}</h3>
              <div class="comp-card__badges">
                <span v-if="isActive(comp)" class="badge badge--active">ACTIVE</span>
                <span v-else-if="comp.startDate || comp.endDate" :class="['badge', statusBadgeClass(comp)]">
                  {{ statusLabel(comp) }}
                </span>
              </div>
            </div>

            <div class="comp-card__details">
              <p v-if="comp.startDate || comp.endDate" class="comp-card__dates">
                <i class="fas fa-calendar"></i>
                {{ formatDateRange(comp.startDate, comp.endDate) }}
              </p>
              <p v-if="comp.location" class="comp-card__location">
                <i class="fas fa-map-marker-alt"></i>
                {{ comp.location }}
              </p>
            </div>

            <div class="comp-card__actions">
              <button
                v-if="!isActive(comp)"
                class="btn btn-primary"
                @click="confirmSwitch(comp)"
                title="Set as active competition"
              >
                Set Active
              </button>
              <button
                class="icon-btn"
                @click="editComp(comp)"
                title="Edit competition"
              >
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button
                class="icon-btn icon-btn-danger"
                :disabled="isActive(comp)"
                :title="isActive(comp) ? 'Cannot delete active competition' : 'Delete competition'"
                @click="confirmDelete(comp)"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <confirmation-dialog
      :show="showDeleteConfirmation"
      title="Delete Competition"
      :message="`Are you sure you want to delete '${compToDelete && compToDelete.name}'? This cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :confirm-loading="isDeleting"
      loading-text="Deleting..."
      @confirm="handleDelete"
      @cancel="cancelDelete"
    />

    <!-- Switch Competition Confirmation -->
    <confirmation-dialog
      :show="showSwitchConfirmation"
      title="Switch Competition?"
      :message="switchDialogMessage"
      confirm-text="Switch Competition"
      cancel-text="Cancel"
      type="primary"
      :confirm-loading="isSwitching"
      loading-text="Loading..."
      @confirm="handleSwitch"
      @cancel="cancelSwitch"
    />

    <!-- Create / Edit Modal -->
    <div v-if="showForm" class="modal" @click.self="closeForm">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingComp ? 'Edit Competition' : 'New Competition' }}</h3>
          <button class="close-btn" @click="closeForm">&times;</button>
        </div>
        <div class="modal-body">
          <CompetitionForm
            :competition="editingComp"
            :loading="saving"
            @save="handleSave"
            @cancel="closeForm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCompetitionsStore } from '@/stores/competitions';
import CompetitionForm from './CompetitionForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';
import NotificationService from '@/services/NotificationService';

export default {
  name: 'CompetitionList',

  components: { CompetitionForm, ConfirmationDialog },

  data() {
    return {
      showForm: false,
      editingComp: null,
      saving: false,
      showDeleteConfirmation: false,
      compToDelete: null,
      isDeleting: false,
      showSwitchConfirmation: false,
      compToSwitch: null,
      isSwitching: false
    };
  },

  computed: {
    competitions() {
      return useCompetitionsStore().allCompetitions;
    },
    activeCompetition() {
      return useCompetitionsStore().activeCompetition;
    },
    switchDialogMessage() {
      if (!this.compToSwitch) return '';
      return `Switch to "${this.compToSwitch.name}"? All data will reload for this competition.`;
    }
  },

  methods: {
    isActive(comp) {
      return this.activeCompetition?.id === comp.id;
    },

    statusLabel(comp) {
      const today = new Date().toISOString().split('T')[0];
      if (comp.endDate && comp.endDate < today) return 'Past';
      if (comp.startDate && comp.startDate > today) return 'Upcoming';
      return 'Active';
    },

    statusBadgeClass(comp) {
      switch (this.statusLabel(comp)) {
        case 'Upcoming': return 'badge--upcoming';
        case 'Past': return 'badge--past';
        default: return 'badge--current';
      }
    },

    formatDateRange(start, end) {
      const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
      const s = fmt(start);
      const e = fmt(end);
      if (s && e) return `${s} – ${e}`;
      if (s) return `From ${s}`;
      if (e) return `Until ${e}`;
      return '';
    },

    openCreateForm() {
      this.editingComp = null;
      this.showForm = true;
    },

    editComp(comp) {
      this.editingComp = comp;
      this.showForm = true;
    },

    closeForm() {
      this.showForm = false;
      this.editingComp = null;
    },

    confirmDelete(comp) {
      this.compToDelete = comp;
      this.showDeleteConfirmation = true;
    },

    cancelDelete() {
      this.showDeleteConfirmation = false;
      this.compToDelete = null;
    },

    confirmSwitch(comp) {
      this.compToSwitch = comp;
      this.showSwitchConfirmation = true;
    },

    cancelSwitch() {
      this.showSwitchConfirmation = false;
      this.compToSwitch = null;
    },

    async handleSwitch() {
      this.isSwitching = true;
      try {
        await useCompetitionsStore().setActiveCompetition(this.compToSwitch);
        NotificationService.success(`Active competition set to ${this.compToSwitch.name}`);
        this.showSwitchConfirmation = false;
        this.compToSwitch = null;
      } catch (err) {
        NotificationService.error(err.message || 'Failed to switch competition');
      } finally {
        this.isSwitching = false;
      }
    },

    async handleDelete() {
      this.isDeleting = true;
      try {
        await useCompetitionsStore().deleteCompetition(this.compToDelete.id);
        NotificationService.success('Competition deleted');
        this.showDeleteConfirmation = false;
        this.compToDelete = null;
      } catch (err) {
        NotificationService.error(err.message || 'Failed to delete competition');
      } finally {
        this.isDeleting = false;
      }
    },

    async handleSave(formData) {
      this.saving = true;
      try {
        const store = useCompetitionsStore();
        if (this.editingComp) {
          await store.updateCompetition({ id: this.editingComp.id, updates: formData });
          NotificationService.success('Competition updated');
        } else {
          await store.createCompetition(formData);
          NotificationService.success('Competition created');
        }
        this.closeForm();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to save competition');
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.competitions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.comp-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background-color: var(--card-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.comp-card--active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb, 52, 152, 219), 0.15);
}

.comp-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.comp-card__name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.comp-card__badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--active {
  background-color: var(--primary-color);
  color: #fff;
}

.badge--upcoming {
  background-color: #17a2b8;
  color: #fff;
}

.badge--current {
  background-color: #28a745;
  color: #fff;
}

.badge--past {
  background-color: #6c757d;
  color: #fff;
}

.comp-card__details {
  margin-bottom: 12px;
}

.comp-card__dates,
.comp-card__location {
  margin: 4px 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.comp-card__dates i,
.comp-card__location i {
  width: 14px;
  margin-right: 6px;
}

.comp-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.comp-card__actions .btn {
  font-size: 0.85rem;
  padding: 5px 12px;
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

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn:disabled:hover {
  color: var(--text-muted);
  background-color: transparent;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 4px;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .competitions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
