<template>
  <div v-if="activeCompetition" class="round-list">
    <hr class="round-list__divider" />
    <div class="round-list__section">
      <h2 class="round-list__heading">Rounds — {{ activeCompetition.name }}</h2>

      <div class="round-list__table-wrap">
        <table class="round-list__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Course</th>
              <th>Date</th>
              <th class="round-list__th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="round in roundsSorted" :key="round.id">
              <td>{{ round.roundNumber }}</td>
              <td>{{ round.course?.name ?? '—' }}</td>
              <td>{{ formatPlayDate(round.playDate) }}</td>
              <td class="round-list__td-actions">
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  title="Delete round"
                  @click="confirmDelete(round)"
                >
                  <i class="fas fa-trash"></i> Delete
                </button>
              </td>
            </tr>
            <tr class="round-list__add-row">
              <td>
                <input
                  v-model.number="form.roundNumber"
                  type="number"
                  min="1"
                  class="form-control form-control--inline"
                  placeholder="#"
                  aria-label="Round number"
                />
              </td>
              <td>
                <select
                  v-model="form.courseId"
                  class="form-control"
                  aria-label="Course"
                  required
                >
                  <option value="" disabled>Select course</option>
                  <option
                    v-for="opt in courseOptions"
                    :key="opt.id"
                    :value="opt.id"
                  >
                    {{ opt.name }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  v-model="form.playDate"
                  type="date"
                  class="form-control"
                  aria-label="Play date"
                  required
                />
              </td>
              <td class="round-list__td-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="!canAdd || adding"
                  @click="handleAdd"
                >
                  {{ adding ? 'Adding...' : 'Add' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <confirmation-dialog
      :show="showDeleteConfirmation"
      title="Delete Round"
      :message="deleteMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :confirm-loading="deleting"
      loading-text="Deleting..."
      @confirm="handleDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script>
import { useCompetitionsStore } from '@/stores/competitions';
import { useCoursesStore } from '@/stores/courses';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';
import NotificationService from '@/services/NotificationService';

// Course options for add-round dropdown (must match backend course IDs)
const COURSE_OPTIONS = [
  { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland' },
  { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland' },
  { id: '38a5c806-7f44-4ebb-9472-6ec79431c5ff', name: 'Heritage Club' },
  { id: 'd3d8aa11-5320-477b-9602-6501dd63b186', name: 'Moorland' }
];

export default {
  name: 'RoundList',

  components: { ConfirmationDialog },

  data() {
    return {
      form: {
        courseId: '',
        playDate: '',
        roundNumber: 1
      },
      adding: false,
      showDeleteConfirmation: false,
      roundToDelete: null,
      deleting: false,
      courseOptions: COURSE_OPTIONS
    };
  },

  computed: {
    activeCompetition() {
      return useCompetitionsStore().activeCompetition;
    },
    roundsSorted() {
      const rounds = useCoursesStore().rounds || [];
      return [...rounds].sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
    },
    nextRoundNumber() {
      const rounds = useCoursesStore().rounds || [];
      if (rounds.length === 0) return 1;
      const max = Math.max(...rounds.map(r => r.roundNumber ?? 0));
      return max + 1;
    },
    canAdd() {
      return this.form.courseId && this.form.playDate && this.form.roundNumber >= 1;
    },
    deleteMessage() {
      if (!this.roundToDelete) return '';
      const course = this.roundToDelete.course?.name ?? 'this round';
      return `Delete round ${this.roundToDelete.roundNumber} (${course})? This cannot be undone.`;
    }
  },

  created() {
    this.form.roundNumber = this.nextRoundNumber;
  },

  methods: {
    formatPlayDate(playDate) {
      if (!playDate) return '—';
      const str = typeof playDate === 'string' ? playDate.split('T')[0] : playDate;
      try {
        return new Date(str + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return str;
      }
    },

    resetForm() {
      this.form.courseId = '';
      this.form.playDate = '';
      this.form.roundNumber = this.nextRoundNumber;
    },

    async handleAdd() {
      if (!this.canAdd || this.adding) return;
      this.adding = true;
      try {
        await useCompetitionsStore().createRound({
          courseId: this.form.courseId,
          playDate: this.form.playDate,
          roundNumber: this.form.roundNumber
        });
        NotificationService.success('Round added');
        this.resetForm();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to add round');
      } finally {
        this.adding = false;
      }
    },

    confirmDelete(round) {
      this.roundToDelete = round;
      this.showDeleteConfirmation = true;
    },

    cancelDelete() {
      this.showDeleteConfirmation = false;
      this.roundToDelete = null;
    },

    async handleDelete() {
      if (!this.roundToDelete) return;
      this.deleting = true;
      try {
        await useCompetitionsStore().deleteRound(this.roundToDelete.id);
        NotificationService.success('Round deleted');
        this.showDeleteConfirmation = false;
        this.roundToDelete = null;
      } catch (err) {
        NotificationService.error(err.message || 'Failed to delete round');
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style scoped>
.round-list__divider {
  border: 0;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.round-list__section {
  margin-top: 8px;
}

.round-list__heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

.round-list__table-wrap {
  overflow-x: auto;
}

.round-list__table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.round-list__table th,
.round-list__table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.round-list__table thead th {
  font-weight: 600;
  font-size: 0.875rem;
}

.round-list__table tbody tr:last-child td {
  border-bottom: none;
}

.round-list__th-actions,
.round-list__td-actions {
  width: 1%;
  white-space: nowrap;
}

.round-list__add-row td {
  background-color: var(--background-color);
}

.form-control--inline {
  width: 4em;
  display: inline-block;
}

.btn-sm {
  font-size: 0.85rem;
  padding: 4px 10px;
}

@media (max-width: 768px) {
  .round-list__table-wrap {
    margin: 0 -20px;
  }

  .round-list__table th,
  .round-list__table td {
    padding: 8px;
    font-size: 0.875rem;
  }
}
</style>
