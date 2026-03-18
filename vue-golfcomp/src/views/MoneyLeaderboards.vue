<template>
  <div class="money-leaderboards">
    <h1>Money Leaderboards</h1>
    
    <div class="leaderboards-grid">
      <div class="main-column">
        <team-money-leaderboard></team-money-leaderboard>
        <player-money-leaderboard></player-money-leaderboard>
      </div>
      
      <div class="side-column">
        <div class="card">
          <div class="card-header">
            <h3>Financial Summary</h3>
          </div>
          <div class="card-body">
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-label">Teams</div>
                <div class="stat-value">{{ teams.length }}</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-label">Players</div>
                <div class="stat-value">{{ players.length }}</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-label">Total Entry Fees</div>
                <div class="stat-value">{{ formatCurrency(totalEntryFees) }}</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-label">Total Winnings</div>
                <div class="stat-value">{{ formatCurrency(totalWinnings) }}</div>
              </div>
            </div>
            
            <div class="financial-breakdown">
              <h4>Top Money Winners</h4>
              <div class="top-winners">
                <div v-for="(player, index) in topMoneyWinners" :key="player.id" class="winner-item">
                  <div class="winner-rank">{{ index + 1 }}</div>
                  <div class="winner-info">
                    <div class="winner-name">{{ player.name }}</div>
                    <div class="winner-amount">{{ formatCurrency(player.winnings) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="balance-summary">
              <div class="balance-item">
                <div class="balance-label">Net Balance</div>
                <div class="balance-value" :class="{ 'positive': balance >= 0, 'negative': balance < 0 }">
                  {{ formatCurrency(balance) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { useScoresStore } from '@/stores/scores';
import { formatCurrency } from '@/utils';
import TeamMoneyLeaderboard from '@/components/scoring/TeamMoneyLeaderboard.vue';
// eslint-disable-next-line no-unused-vars -- Used in template as player-money-leaderboard
import PlayerMoneyLeaderboard from '@/components/scoring/PlayerMoneyLeaderboard.vue';

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();
const scoresStore = useScoresStore();

const teams = computed(() => teamsStore.allTeams);
const players = computed(() => playersStore.allPlayers);

const totalEntryFees = computed(() => playersStore.totalEntryFees);
const totalWinnings = computed(() => playersStore.totalWinnings);
const playerMoneyLeaderboard = computed(() => scoresStore.playerMoneyLeaderboard);

const balance = computed(() => {
  return totalEntryFees.value - totalWinnings.value;
});

const topMoneyWinners = computed(() => {
  return playerMoneyLeaderboard.value
    .filter(player => player.winnings > 0)
    .slice(0, 5);
});
</script>

<style scoped>
.money-leaderboards {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--text-color);
}

.leaderboards-grid {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
}

.main-column, .side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
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

.financial-breakdown {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.financial-breakdown h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
}

.top-winners {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.winner-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.winner-item:last-child {
  border-bottom: none;
}

.winner-rank {
  width: 24px;
  height: 24px;
  background-color: var(--info-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  margin-right: 10px;
}

.winner-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.winner-name {
  font-weight: 500;
  color: var(--text-color);
}

.winner-amount {
  font-weight: 500;
  color: var(--success-color);
}

.balance-summary {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.balance-label {
  font-weight: 500;
  color: var(--text-color);
}

.balance-value {
  font-weight: 500;
  font-size: 1.1rem;
}

.balance-value.positive {
  color: var(--success-color);
}

.balance-value.negative {
  color: var(--danger-color);
}

@media (max-width: 992px) {
  .leaderboards-grid {
    grid-template-columns: 1fr;
  }
}
</style> 