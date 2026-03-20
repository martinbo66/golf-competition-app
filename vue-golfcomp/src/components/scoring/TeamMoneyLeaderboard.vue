<template>
  <div class="team-money-leaderboard card">
    <div class="card-header">
      <h3>Team Money Leaderboard</h3>
    </div>
    <div class="card-body">
      <div v-if="isRefreshing" class="loading-state">
        <p>Loading leaderboard...</p>
      </div>
      <div v-else-if="!teams.length" class="empty-state">
        <p>No teams available. Create teams in the Team Management section first.</p>
      </div>
      <div v-else-if="!hasAnyWinnings" class="empty-state">
        <p>No winnings recorded yet. Add winnings to players in the Player Management section.</p>
      </div>
      <div v-else>
        <table class="table">
          <thead>
            <tr>
              <th class="rank">Rank</th>
              <th>Team</th>
              <th class="entry-fees">Entry Fees</th>
              <th class="winnings">Winnings</th>
              <th class="net-winnings">Net Winnings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(team, index) in teamMoneyLeaderboard" :key="team.id" :class="{ 'highlight': index < 3 }">
              <td class="rank">{{ index + 1 }}</td>
              <td class="team-name">
                <div class="team-info">
                  <div v-if="team.logoUrl" class="team-logo">
                    <img :src="team.logoUrl" :alt="team.name + ' logo'" />
                  </div>
                  <div v-else class="team-logo placeholder">
                    <span>{{ team.name.charAt(0) }}</span>
                  </div>
                  <span>{{ team.name }}</span>
                </div>
              </td>
              <td class="entry-fees">{{ formatCurrency(team.totalEntryFees) }}</td>
              <td class="winnings">{{ formatCurrency(team.totalWinnings) }}</td>
              <td class="net-winnings" :class="{ 'positive': team.netWinnings >= 0, 'negative': team.netWinnings < 0 }">
                {{ formatCurrency(team.netWinnings) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { useScoresStore } from '@/stores/scores';
import { formatCurrency } from '@/utils';

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();
const scoresStore = useScoresStore();

const isRefreshing = ref(false);

onMounted(async () => {
  isRefreshing.value = true;
  try {
    await Promise.all([
      playersStore.fetchPlayers(),
      teamsStore.fetchTeams()
    ]);
  } finally {
    isRefreshing.value = false;
  }
});

const teams = computed(() => teamsStore.allTeams);
const totalWinnings = computed(() => playersStore.totalWinnings);
const teamMoneyLeaderboard = computed(() => scoresStore.teamMoneyLeaderboard);

const hasAnyWinnings = computed(() => {
  return totalWinnings.value > 0;
});
</script>

<style scoped>
.team-money-leaderboard {
  margin-bottom: 20px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.table {
  margin-bottom: 0;
}

.rank {
  font-weight: bold;
  text-align: center;
}

.team-name {
  min-width: 200px;
}

.team-info {
  display: flex;
  align-items: center;
}

.team-logo {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--background-color);
}

.team-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.team-logo.placeholder {
  background-color: var(--border-color);
}

.team-logo.placeholder span {
  font-weight: bold;
  color: var(--text-muted);
}

.entry-fees,
.winnings,
.net-winnings {
  text-align: right;
  font-weight: 500;
}

.net-winnings.positive {
  color: var(--success-color);
}

.net-winnings.negative {
  color: var(--danger-color);
}

.highlight {
  background-color: var(--background-color);
}

.highlight:nth-child(1) {
  background-color: rgba(255, 215, 0, 0.1); /* Gold */
}

.highlight:nth-child(2) {
  background-color: rgba(192, 192, 192, 0.1); /* Silver */
}

.highlight:nth-child(3) {
  background-color: rgba(205, 127, 50, 0.1); /* Bronze */
}

@media (max-width: 768px) {
  .table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style> 