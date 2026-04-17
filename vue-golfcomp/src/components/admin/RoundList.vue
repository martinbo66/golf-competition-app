<template>
  <div v-if="activeCompetition" class="round-list">
    <hr class="round-list__divider" />
    <div class="round-list__section">
      <h2 class="round-list__heading">Rounds — {{ activeCompetition.name }}</h2>

      <div class="round-list__table-wrap">
        <table class="round-list__table">
          <colgroup>
            <col class="round-list__col-num" />
            <col class="round-list__col-date" />
            <col />
            <col class="round-list__col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th class="round-list__th-num">#</th>
              <th class="round-list__th-date">Date</th>
              <th>Course</th>
              <th class="round-list__th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(round, index) in roundsSorted" :key="round.id">
              <td>{{ index + 1 }}</td>
              <template v-if="editingRoundId === round.id">
                <td>
                  <input
                    v-model="editForm.playDate"
                    type="date"
                    class="form-control"
                    aria-label="Edit play date"
                  />
                </td>
                <td>
                  <select
                    v-model="editForm.courseId"
                    class="form-control"
                    aria-label="Edit course"
                  >
                    <option value="" disabled>Select course</option>
                    <option
                      v-for="opt in courseOptions"
                      :key="opt.id"
                      :value="opt.id"
                    >
                      {{ courseLabel(opt) }}
                    </option>
                  </select>
                </td>
                <td class="round-list__td-actions">
                  <button
                    type="button"
                    class="btn-icon btn-icon--primary"
                    title="Save changes"
                    :disabled="!canSave(round) || saving"
                    @click="handleSave(round)"
                  >
                    <i class="fas fa-check"></i>
                  </button>
                  <button
                    type="button"
                    class="btn-icon"
                    title="Cancel edit"
                    :disabled="saving"
                    @click="cancelEdit"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </td>
              </template>
              <template v-else>
                <td class="round-list__td-date">{{ formatPlayDate(round.playDate) }}</td>
                <td>{{ round.course?.name ?? '—' }}</td>
                <td class="round-list__td-actions">
                  <button
                    type="button"
                    class="btn-icon"
                    title="Edit round"
                    @click="startEdit(round)"
                  >
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    type="button"
                    class="btn-icon btn-icon--danger"
                    title="Delete round"
                    @click="confirmDelete(round)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </template>
            </tr>
            <tr class="round-list__add-row">
              <td>{{ nextRoundNumber }}</td>
              <td>
                <input
                  v-model="form.playDate"
                  type="date"
                  class="form-control"
                  aria-label="Play date"
                  required
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
                    {{ courseLabel(opt) }}
                  </option>
                </select>
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

export default {
  name: 'RoundList',

  components: { ConfirmationDialog },

  data() {
    return {
      form: {
        courseId: '',
        playDate: ''
      },
      adding: false,
      showDeleteConfirmation: false,
      roundToDelete: null,
      deleting: false,
      editingRoundId: null,
      editForm: {
        courseId: '',
        playDate: ''
      },
      saving: false
    };
  },

  computed: {
    activeCompetition() {
      return useCompetitionsStore().activeCompetition;
    },
    courseOptions() {
      return useCoursesStore().availableCourses;
    },
    roundsSorted() {
      const rounds = useCoursesStore().rounds || [];
      return [...rounds].sort((a, b) => {
        const da = a.playDate ? new Date(a.playDate) : new Date(0);
        const db = b.playDate ? new Date(b.playDate) : new Date(0);
        return da - db;
      });
    },
    nextRoundNumber() {
      const rounds = useCoursesStore().rounds || [];
      if (rounds.length === 0) return 1;
      const max = Math.max(...rounds.map(r => r.roundNumber ?? 0));
      return max + 1;
    },
    canAdd() {
      return this.form.courseId && this.form.playDate;
    },
    deleteMessage() {
      if (!this.roundToDelete) return '';
      const course = this.roundToDelete.course?.name ?? 'this round';
      return `Delete round ${this.roundToDelete.roundNumber} (${course})? This cannot be undone.`;
    }
  },

  watch: {
    activeCompetition: {
      immediate: true,
      handler(competition) {
        if (competition?.startDate && !this.form.playDate) {
          this.form.playDate = competition.startDate.split('T')[0];
        }
      }
    },
  },

  created() {
    if (this.activeCompetition?.startDate && !this.form.playDate) {
      this.form.playDate = this.activeCompetition.startDate.split('T')[0];
    }
  },

  methods: {
    courseLabel(course) {
      const parts = [];
      if (course.facility) parts.push(course.facility);
      if (course.location) parts.push(course.location);
      return parts.length ? `${course.name} — ${parts.join(', ')}` : course.name;
    },

    formatPlayDate(playDate) {
      if (!playDate) return '—';
      const str = typeof playDate === 'string' ? playDate.split('T')[0] : playDate;
      try {
        return new Date(str + 'T00:00:00').toLocaleDateString(undefined, {
          weekday: 'short',
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
      this.form.playDate = this.activeCompetition?.startDate?.split('T')[0] || '';
    },

    async handleAdd() {
      if (!this.canAdd || this.adding) return;
      this.adding = true;
      try {
        await useCompetitionsStore().createRound({
          courseId: this.form.courseId,
          playDate: this.form.playDate,
          roundNumber: this.nextRoundNumber
        });
        NotificationService.success('Round added');
        this.resetForm();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to add round');
      } finally {
        this.adding = false;
      }
    },

    startEdit(round) {
      this.editingRoundId = round.id;
      this.editForm.courseId = round.course?.id ?? '';
      let playDate = '';
      if (round.playDate) {
        playDate = typeof round.playDate === 'string' ? round.playDate.split('T')[0] : round.playDate;
      }
      this.editForm.playDate = playDate;
    },

    cancelEdit() {
      this.editingRoundId = null;
      this.editForm.courseId = '';
      this.editForm.playDate = '';
    },

    canSave(round) {
      return (
        this.editForm.courseId &&
        this.editForm.playDate &&
        (this.editForm.courseId !== (round.course?.id ?? '') ||
         this.editForm.playDate !== (round.playDate?.split('T')[0] ?? ''))
      );
    },

    async handleSave(round) {
      if (this.saving) return;
      this.saving = true;
      try {
        await useCompetitionsStore().updateRound({
          roundId: round.id,
          courseId: this.editForm.courseId,
          playDate: this.editForm.playDate
        });
        NotificationService.success('Round updated');
        this.cancelEdit();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to update round');
      } finally {
        this.saving = false;
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

.round-list__th-num,
.round-list__th-date,
.round-list__td-date {
  white-space: nowrap;
  width: 1%;
}

.round-list__th-actions,
.round-list__td-actions {
  width: 1%;
  white-space: nowrap;
}

.round-list__add-row td {
  background-color: var(--background-color);
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: var(--text-muted);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.btn-icon:hover {
  color: var(--primary-color);
  background-color: var(--border-color);
}

.btn-icon--primary {
  color: var(--primary-color);
}

.btn-icon--primary:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.btn-icon--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon--danger {
  color: var(--danger-color, #dc3545);
}

.btn-icon--danger:hover {
  background-color: rgba(220, 53, 69, 0.1);
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
