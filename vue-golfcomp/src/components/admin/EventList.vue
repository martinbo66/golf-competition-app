<template>
  <div v-if="activeCompetition" class="event-list" data-testid="events-section">
    <hr class="event-list__divider" />
    <div class="event-list__section">
      <h3 class="event-list__heading">Other Events</h3>
      <p class="event-list__subtitle">
        Non-round competitions (putting, longest drive, etc.). Add winners to award money.
      </p>

      <div class="event-list__table-wrap">
        <table class="event-list__table">
          <colgroup>
            <col class="event-list__col-date" />
            <col />
            <col class="event-list__col-total" />
            <col class="event-list__col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th class="event-list__th-date">Date</th>
              <th>Event</th>
              <th class="event-list__th-total">Total</th>
              <th class="event-list__th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- eslint-disable-next-line vue/no-v-for-template-key -->
            <template v-for="event in eventsSorted" :key="event.id">
              <tr>
                <template v-if="editingEventId === event.id">
                  <td>
                    <input
                      v-model="editForm.eventDate"
                      type="date"
                      class="form-control"
                      aria-label="Edit event date"
                    />
                  </td>
                  <td>
                    <input
                      v-model="editForm.name"
                      type="text"
                      class="form-control"
                      maxlength="255"
                      aria-label="Edit event name"
                      placeholder="Event name"
                    />
                  </td>
                  <td class="event-list__td-total">
                    ${{ eventTotal(event.id).toFixed(2) }}
                  </td>
                  <td class="event-list__td-actions">
                    <button
                      type="button"
                      class="btn-icon btn-icon--primary"
                      title="Save changes"
                      :disabled="!canSave(event) || saving"
                      @click="handleSave(event)"
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
                  <td class="event-list__td-date">{{ formatDate(event.eventDate) }}</td>
                  <td>
                    {{ event.name }}
                    <span v-if="event.note" class="event-list__note">— {{ event.note }}</span>
                  </td>
                  <td class="event-list__td-total">${{ eventTotal(event.id).toFixed(2) }}</td>
                  <td class="event-list__td-actions">
                    <button
                      type="button"
                      class="btn-icon"
                      :class="{ 'btn-icon--primary': expandedEventId === event.id }"
                      title="Manage winners"
                      @click="toggleExpand(event.id)"
                    >
                      <i class="fas fa-trophy"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-icon"
                      title="Edit event"
                      @click="startEdit(event)"
                    >
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-icon btn-icon--danger"
                      title="Delete event"
                      @click="confirmDelete(event)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </template>
              </tr>
              <tr v-if="expandedEventId === event.id" class="event-list__winners-row">
                <td colspan="4">
                  <event-payouts :event-id="event.id" />
                </td>
              </tr>
            </template>
            <tr class="event-list__add-row">
              <td>
                <input
                  v-model="form.eventDate"
                  type="date"
                  class="form-control"
                  aria-label="Event date"
                  required
                />
              </td>
              <td>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  maxlength="255"
                  aria-label="Event name"
                  placeholder="e.g. Putting Competition"
                  required
                />
              </td>
              <td></td>
              <td class="event-list__td-actions">
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
      title="Delete Event"
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
import { useEventsStore } from '@/stores/events';
import { usePayoutsStore } from '@/stores/payouts';
import EventPayouts from '@/components/admin/EventPayouts.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';
import NotificationService from '@/services/NotificationService';

export default {
  name: 'EventList',

  components: { EventPayouts, ConfirmationDialog },

  data() {
    return {
      form: {
        name: '',
        eventDate: ''
      },
      adding: false,
      showDeleteConfirmation: false,
      eventToDelete: null,
      deleting: false,
      editingEventId: null,
      editForm: {
        name: '',
        eventDate: ''
      },
      saving: false,
      expandedEventId: null
    };
  },

  computed: {
    activeCompetition() {
      return useCompetitionsStore().activeCompetition;
    },
    eventsSorted() {
      const events = useEventsStore().allEvents || [];
      return [...events].sort((a, b) => {
        const da = a.eventDate ? new Date(a.eventDate) : new Date(0);
        const db = b.eventDate ? new Date(b.eventDate) : new Date(0);
        return da - db;
      });
    },
    canAdd() {
      return this.form.name.trim() && this.form.eventDate;
    },
    deleteMessage() {
      if (!this.eventToDelete) return '';
      return `Delete event "${this.eventToDelete.name}"? Its winners and payouts will be removed. This cannot be undone.`;
    }
  },

  watch: {
    activeCompetition: {
      immediate: true,
      handler(competition) {
        if (competition?.startDate && !this.form.eventDate) {
          this.form.eventDate = competition.startDate.split('T')[0];
        }
      }
    }
  },

  created() {
    if (this.activeCompetition?.startDate && !this.form.eventDate) {
      this.form.eventDate = this.activeCompetition.startDate.split('T')[0];
    }
  },

  methods: {
    eventTotal(eventId) {
      return usePayoutsStore().eventTotal(eventId);
    },

    formatDate(eventDate) {
      if (!eventDate) return '—';
      const str = typeof eventDate === 'string' ? eventDate.split('T')[0] : eventDate;
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
      this.form.name = '';
      this.form.eventDate = this.activeCompetition?.startDate?.split('T')[0] || '';
    },

    async handleAdd() {
      if (!this.canAdd || this.adding) return;
      this.adding = true;
      try {
        await useEventsStore().createEvent({
          name: this.form.name.trim(),
          eventDate: this.form.eventDate
        });
        NotificationService.success('Event added');
        this.resetForm();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to add event');
      } finally {
        this.adding = false;
      }
    },

    toggleExpand(eventId) {
      this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
    },

    startEdit(event) {
      this.editingEventId = event.id;
      this.editForm.name = event.name ?? '';
      let eventDate = '';
      if (event.eventDate) {
        eventDate = typeof event.eventDate === 'string' ? event.eventDate.split('T')[0] : event.eventDate;
      }
      this.editForm.eventDate = eventDate;
    },

    cancelEdit() {
      this.editingEventId = null;
      this.editForm.name = '';
      this.editForm.eventDate = '';
    },

    canSave(event) {
      return (
        this.editForm.name.trim() &&
        this.editForm.eventDate &&
        (this.editForm.name !== (event.name ?? '') ||
         this.editForm.eventDate !== (event.eventDate?.split('T')[0] ?? ''))
      );
    },

    async handleSave(event) {
      if (this.saving) return;
      this.saving = true;
      try {
        await useEventsStore().updateEvent({
          id: event.id,
          name: this.editForm.name.trim(),
          eventDate: this.editForm.eventDate,
          note: event.note
        });
        NotificationService.success('Event updated');
        this.cancelEdit();
      } catch (err) {
        NotificationService.error(err.message || 'Failed to update event');
      } finally {
        this.saving = false;
      }
    },

    confirmDelete(event) {
      this.eventToDelete = event;
      this.showDeleteConfirmation = true;
    },

    cancelDelete() {
      this.showDeleteConfirmation = false;
      this.eventToDelete = null;
    },

    async handleDelete() {
      if (!this.eventToDelete) return;
      this.deleting = true;
      try {
        await useEventsStore().deleteEvent(this.eventToDelete.id);
        // Refresh payouts so cascade-deleted event payouts drop out of the leaderboard.
        await usePayoutsStore().fetchPayouts();
        NotificationService.success('Event deleted');
        if (this.expandedEventId === this.eventToDelete.id) {
          this.expandedEventId = null;
        }
        this.showDeleteConfirmation = false;
        this.eventToDelete = null;
      } catch (err) {
        NotificationService.error(err.message || 'Failed to delete event');
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style scoped>
.event-list__divider {
  border: 0;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.event-list__section {
  margin-top: 8px;
}

.event-list__heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.event-list__subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 16px 0;
}

.event-list__note {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.event-list__table-wrap {
  overflow-x: auto;
}

.event-list__table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.event-list__table th,
.event-list__table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.event-list__table thead th {
  font-weight: 600;
  font-size: 0.875rem;
}

.event-list__table tbody tr:last-child td {
  border-bottom: none;
}

.event-list__th-date,
.event-list__td-date,
.event-list__th-total,
.event-list__td-total {
  white-space: nowrap;
  width: 1%;
}

.event-list__td-total {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.event-list__th-actions,
.event-list__td-actions {
  width: 1%;
  white-space: nowrap;
}

.event-list__add-row td {
  background-color: var(--background-color);
}

.event-list__winners-row td {
  padding: 0;
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
  .event-list__table-wrap {
    margin: 0 -20px;
  }

  .event-list__table th,
  .event-list__table td {
    padding: 8px;
    font-size: 0.875rem;
  }
}
</style>
