<template>
  <div class="event-payouts">
    <div class="event-payouts__header">
      <h4>Winners</h4>
      <span class="hint">
        One payout per winning player. Paid winnings count toward the money leaderboard.
      </span>
    </div>

    <table v-if="eventPayouts.length > 0" class="table payout-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Note</th>
          <th class="col-amount">Amount</th>
          <th class="col-paid">Paid</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in eventPayouts" :key="p.id" :class="{ 'paid-row': p.paid }">
          <td>{{ p.playerName }}</td>
          <td>{{ p.note || '—' }}</td>
          <td class="col-amount">${{ p.amount.toFixed(2) }}</td>
          <td class="col-paid">
            <label class="paid-toggle">
              <input
                type="checkbox"
                :checked="p.paid"
                :disabled="togglingIds.includes(p.id)"
                @change="togglePaid(p)"
              >
              <span v-if="p.paid" class="paid-badge">Paid</span>
              <span v-else class="unpaid-badge">Unpaid</span>
            </label>
          </td>
          <td>
            <button class="btn btn-sm btn-danger" @click="removePayout(p.id)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="muted">No winners recorded yet.</p>

    <div class="winner-form">
      <select v-model="form.playerId" class="form-control">
        <option value="">Select player</option>
        <option v-for="player in sortedPlayers" :key="player.id" :value="player.id">
          {{ player.name }}<span v-if="player.teamName"> — {{ player.teamName }}</span>
        </option>
      </select>
      <input
        type="text"
        v-model="form.note"
        class="form-control note-input"
        maxlength="200"
        placeholder="Place / description (optional)"
      >
      <input
        type="number"
        v-model.number="form.amount"
        class="form-control amount-input"
        min="0"
        step="0.01"
        placeholder="Amount"
      >
      <button
        class="btn btn-primary"
        :disabled="!canAdd || isSaving"
        @click="addWinner"
      >
        <span v-if="isSaving">Saving…</span>
        <span v-else>Add winner</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePayoutsStore } from '@/stores/payouts';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import NotificationService from '@/services/NotificationService';
import { getUserFriendlyErrorMessage } from '@/utils';

const props = defineProps({
  eventId: { type: String, required: true }
});

const payoutsStore = usePayoutsStore();
const playersStore = usePlayersStore();
const teamsStore = useTeamsStore();

const form = ref({ playerId: '', amount: null, note: '' });
const isSaving = ref(false);
const togglingIds = ref([]);

const eventPayouts = computed(() => payoutsStore.payoutsByEvent(props.eventId));

const sortedPlayers = computed(() => {
  return [...playersStore.allPlayers].map(p => ({
    id: p.id,
    name: p.name,
    teamName: p.teamId ? (teamsStore.teamById(p.teamId)?.name || null) : null
  })).sort((a, b) => a.name.localeCompare(b.name));
});

const canAdd = computed(() =>
  !!form.value.playerId &&
  Number.parseFloat(form.value.amount) > 0
);

const addWinner = async () => {
  if (!canAdd.value) return;
  isSaving.value = true;
  try {
    await payoutsStore.createEventPayout({
      eventId: props.eventId,
      playerId: form.value.playerId,
      amount: form.value.amount,
      note: form.value.note
    });
    form.value = { playerId: '', amount: null, note: '' };
    NotificationService.success('Winner recorded');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  } finally {
    isSaving.value = false;
  }
};

const removePayout = async (id) => {
  if (!confirm('Remove this winner?')) return;
  try {
    await payoutsStore.deletePayout(id);
    NotificationService.success('Winner removed');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  }
};

const togglePaid = async (payout) => {
  const nextPaid = !payout.paid;
  togglingIds.value = [...togglingIds.value, payout.id];
  try {
    await payoutsStore.setPayoutPaid({ id: payout.id, paid: nextPaid });
    NotificationService.success(nextPaid ? 'Marked paid' : 'Marked unpaid');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  } finally {
    togglingIds.value = togglingIds.value.filter(id => id !== payout.id);
  }
};
</script>

<style scoped>
.event-payouts {
  padding: 12px 16px;
  background-color: var(--background-color, #f8f9fa);
  border-top: 1px solid var(--border-color, #e9ecef);
}

.event-payouts__header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}

.event-payouts__header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted, #6c757d);
}

.muted {
  color: var(--text-muted, #6c757d);
  font-size: 0.9rem;
}

.winner-form {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.winner-form select {
  min-width: 180px;
  flex: 1;
}

.amount-input {
  width: 110px;
  flex: 0 0 auto;
}

.note-input {
  flex: 2;
  min-width: 160px;
}

.payout-table {
  width: 100%;
  margin-top: 8px;
}

.payout-table .col-amount {
  text-align: right;
  width: 120px;
}

.payout-table .col-paid {
  width: 110px;
  text-align: center;
}

.paid-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.paid-toggle input[type="checkbox"] {
  cursor: pointer;
}

.paid-badge,
.unpaid-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.paid-badge {
  background: var(--success-color, #28a745);
  color: #fff;
}

.unpaid-badge {
  background: transparent;
  color: var(--danger-color, #dc3545);
  border: 1px solid var(--danger-color, #dc3545);
}

.paid-row td {
  opacity: 0.65;
}

.paid-row td:has(.paid-toggle) {
  opacity: 1;
}

@media (max-width: 640px) {
  .winner-form {
    flex-direction: column;
    align-items: stretch;
  }

  .amount-input,
  .note-input {
    width: 100%;
  }
}
</style>
