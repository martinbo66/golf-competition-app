<template>
  <div class="round-payouts card">
    <div class="card-header">
      <h3>Payouts</h3>
      <div class="round-total">
        Round total: <strong>${{ roundTotal.toFixed(2) }}</strong>
      </div>
    </div>
    <div class="card-body">

      <!-- Team winner payout section -->
      <section class="payout-section">
        <div class="section-header">
          <h4>Team winner</h4>
          <span class="hint">Paid to each player on the winning team for this round.</span>
        </div>

        <div v-if="teamWinPayouts.length === 0" class="team-win-entry">
          <div class="leading-team" v-if="leadingTeam">
            Leading team:
            <strong>{{ leadingTeam.name }}</strong>
            <span class="muted"> (total {{ leadingTeam.totalScore }})</span>
          </div>
          <div class="team-win-form">
            <label for="twTeam">Winning team</label>
            <select id="twTeam" v-model="teamWinForm.teamId" class="form-control">
              <option value="">Select team</option>
              <option v-for="team in teamsWithScores" :key="team.id" :value="team.id">
                {{ team.name }} — {{ team.totalScore }}
              </option>
            </select>

            <label for="twAmount">Team amount ($)</label>
            <input
              id="twAmount"
              type="number"
              v-model.number="teamWinForm.teamAmount"
              class="form-control amount-input"
              min="0"
              step="0.01"
              placeholder="e.g. 80"
            >

            <button
              class="btn btn-primary"
              :disabled="!canRecordTeamWin || isSavingTeamWin"
              @click="recordTeamWin"
            >
              <span v-if="isSavingTeamWin">Saving…</span>
              <span v-else>Record team win</span>
            </button>
          </div>
          <div v-if="teamWinForm.teamId && splitPreview" class="muted split-preview">
            Splits to {{ splitPreview.count }} player(s) at ~${{ splitPreview.perPlayer }} each.
          </div>
        </div>

        <table v-else class="table payout-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th class="col-amount">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in teamWinPayouts" :key="p.id">
              <td>{{ p.playerName }}</td>
              <td>{{ p.teamName || '—' }}</td>
              <td class="col-amount">${{ p.amount.toFixed(2) }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="removePayout(p.id)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Greenies section -->
      <section class="payout-section">
        <div class="section-header">
          <h4>Greenies</h4>
          <span class="hint">One payout per closest-to-pin on a par 3.</span>
        </div>

        <table v-if="greenies.length > 0" class="table payout-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Note</th>
              <th class="col-amount">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in greenies" :key="p.id">
              <td>{{ p.playerName }}</td>
              <td>{{ p.note || '—' }}</td>
              <td class="col-amount">${{ p.amount.toFixed(2) }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="removePayout(p.id)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">No greenies recorded yet.</p>

        <div class="greenie-form">
          <select v-model="greenieForm.playerId" class="form-control">
            <option value="">Select player</option>
            <option v-for="player in sortedPlayers" :key="player.id" :value="player.id">
              {{ player.name }}<span v-if="player.teamName"> — {{ player.teamName }}</span>
            </option>
          </select>
          <input
            type="text"
            v-model="greenieForm.note"
            class="form-control note-input"
            maxlength="200"
            placeholder="Hole / description (optional)"
          >
          <input
            type="number"
            v-model.number="greenieForm.amount"
            class="form-control amount-input"
            min="0"
            step="0.01"
            placeholder="Amount"
          >
          <button
            class="btn btn-primary"
            :disabled="!canAddGreenie || isSavingGreenie"
            @click="addGreenie"
          >
            <span v-if="isSavingGreenie">Saving…</span>
            <span v-else>Add greenie</span>
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePayoutsStore } from '@/stores/payouts';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';
import NotificationService from '@/services/NotificationService';
import { getUserFriendlyErrorMessage } from '@/utils';

const props = defineProps({
  roundId: { type: String, required: true }
});

const payoutsStore = usePayoutsStore();
const playersStore = usePlayersStore();
const teamsStore = useTeamsStore();
const scoresStore = useScoresStore();

const teamWinForm = ref({ teamId: '', teamAmount: null });
const greenieForm = ref({ playerId: '', amount: null, note: '' });
const isSavingTeamWin = ref(false);
const isSavingGreenie = ref(false);

const roundPayouts = computed(() => payoutsStore.payoutsByRound(props.roundId));
const teamWinPayouts = computed(() => roundPayouts.value.filter(p => p.type === 'TEAM_WIN'));
const greenies = computed(() => roundPayouts.value.filter(p => p.type === 'GREENIE'));
const roundTotal = computed(() => payoutsStore.roundTotal(props.roundId));

const teamsWithScores = computed(() => {
  const scoresByTeam = scoresStore.courseScoresByTeam(props.roundId) || [];
  return scoresByTeam
    .map(ts => ({ id: ts.teamId, name: ts.teamName, totalScore: ts.teamTotal }))
    .sort((a, b) => b.totalScore - a.totalScore);
});

const leadingTeam = computed(() => teamsWithScores.value[0] || null);

const selectedTeamPlayerCount = computed(() => {
  if (!teamWinForm.value.teamId) return 0;
  return playersStore.playersByTeam(teamWinForm.value.teamId).length;
});

const splitPreview = computed(() => {
  const count = selectedTeamPlayerCount.value;
  const amt = Number.parseFloat(teamWinForm.value.teamAmount);
  if (!count || !amt || amt <= 0) return null;
  return { count, perPlayer: (amt / count).toFixed(2) };
});

const canRecordTeamWin = computed(() =>
  !!teamWinForm.value.teamId &&
  Number.parseFloat(teamWinForm.value.teamAmount) > 0 &&
  selectedTeamPlayerCount.value > 0
);

const sortedPlayers = computed(() => {
  return [...playersStore.allPlayers].map(p => ({
    id: p.id,
    name: p.name,
    teamName: p.teamId ? (teamsStore.teamById(p.teamId)?.name || null) : null
  })).sort((a, b) => a.name.localeCompare(b.name));
});

const canAddGreenie = computed(() =>
  !!greenieForm.value.playerId &&
  Number.parseFloat(greenieForm.value.amount) > 0
);

const recordTeamWin = async () => {
  if (!canRecordTeamWin.value) return;
  isSavingTeamWin.value = true;
  try {
    await payoutsStore.recordTeamWin({
      roundId: props.roundId,
      teamId: teamWinForm.value.teamId,
      teamAmount: teamWinForm.value.teamAmount
    });
    teamWinForm.value = { teamId: '', teamAmount: null };
    NotificationService.success('Team win payout recorded');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  } finally {
    isSavingTeamWin.value = false;
  }
};

const addGreenie = async () => {
  if (!canAddGreenie.value) return;
  isSavingGreenie.value = true;
  try {
    await payoutsStore.createPayout({
      roundId: props.roundId,
      playerId: greenieForm.value.playerId,
      type: 'GREENIE',
      amount: greenieForm.value.amount,
      note: greenieForm.value.note
    });
    greenieForm.value = { playerId: '', amount: null, note: '' };
    NotificationService.success('Greenie recorded');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  } finally {
    isSavingGreenie.value = false;
  }
};

const removePayout = async (id) => {
  if (!confirm('Remove this payout?')) return;
  try {
    await payoutsStore.deletePayout(id);
    NotificationService.success('Payout removed');
  } catch (err) {
    NotificationService.error(getUserFriendlyErrorMessage(err));
  }
};
</script>

<style scoped>
.round-payouts {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--primary-color, #007bff);
}

.round-total {
  font-size: 0.95rem;
  color: var(--text-muted, #6c757d);
}

.round-total strong {
  color: var(--text-color, #1a202c);
}

.payout-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #e9ecef);
}

.payout-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted, #6c757d);
}

.leading-team {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.muted {
  color: var(--text-muted, #6c757d);
  font-size: 0.9rem;
}

.team-win-form,
.greenie-form {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.team-win-form label {
  font-size: 0.85rem;
  color: var(--text-muted, #6c757d);
  margin-right: -4px;
}

.greenie-form select,
.team-win-form select {
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

.split-preview {
  margin-top: 6px;
}

.payout-table {
  width: 100%;
  margin-top: 8px;
}

.payout-table .col-amount {
  text-align: right;
  width: 120px;
}

@media (max-width: 640px) {
  .team-win-form,
  .greenie-form {
    flex-direction: column;
    align-items: stretch;
  }

  .amount-input,
  .note-input {
    width: 100%;
  }
}
</style>
