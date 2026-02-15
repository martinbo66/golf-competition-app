<template>
  <div class="player-stats card">
    <div class="card-header">
      <h3>Player Statistics</h3>
    </div>
    <div class="card-body">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ playerCount }}</div>
          <div class="stat-label">Total Players</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ formatCurrency(totalEntryFees) }}</div>
          <div class="stat-label">Total Entry Fees</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ formatCurrency(totalWinnings) }}</div>
          <div class="stat-label">Total Winnings</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ unassignedPlayerCount }}</div>
          <div class="stat-label">Unassigned Players</div>
        </div>
      </div>
      
      <div class="talent-distribution">
        <h4>Talent Distribution</h4>
        <div class="talent-bars">
          <div class="talent-bar-item">
            <div class="talent-label">A</div>
            <div class="talent-bar-container">
              <div 
                class="talent-bar talent-a" 
                :style="{ width: talentPercentage('A') + '%' }"
              ></div>
            </div>
            <div class="talent-count">{{ talentCounts.A }}</div>
          </div>
          
          <div class="talent-bar-item">
            <div class="talent-label">B</div>
            <div class="talent-bar-container">
              <div 
                class="talent-bar talent-b" 
                :style="{ width: talentPercentage('B') + '%' }"
              ></div>
            </div>
            <div class="talent-count">{{ talentCounts.B }}</div>
          </div>
          
          <div class="talent-bar-item">
            <div class="talent-label">C</div>
            <div class="talent-bar-container">
              <div 
                class="talent-bar talent-c" 
                :style="{ width: talentPercentage('C') + '%' }"
              ></div>
            </div>
            <div class="talent-count">{{ talentCounts.C }}</div>
          </div>
          
          <div class="talent-bar-item">
            <div class="talent-label">D</div>
            <div class="talent-bar-container">
              <div 
                class="talent-bar talent-d" 
                :style="{ width: talentPercentage('D') + '%' }"
              ></div>
            </div>
            <div class="talent-count">{{ talentCounts.D }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayersStore } from '@/stores/players';
import { formatCurrency } from '@/utils';

const playersStore = usePlayersStore();

const playerCount = computed(() => playersStore.playerCount);
const unassignedPlayerCount = computed(() => playersStore.unassignedPlayers.length);
const totalEntryFees = computed(() => playersStore.totalEntryFees);
const totalWinnings = computed(() => playersStore.totalWinnings);

const talentCounts = computed(() => ({
  A: playersStore.playersByTalentRating('A').length,
  B: playersStore.playersByTalentRating('B').length,
  C: playersStore.playersByTalentRating('C').length,
  D: playersStore.playersByTalentRating('D').length
}));

const talentPercentage = (rating) => {
  if (playerCount.value === 0) return 0;
  return (talentCounts.value[rating] / playerCount.value) * 100;
};
</script>

<style scoped>
.player-stats {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

.talent-distribution {
  margin-top: 20px;
}

.talent-distribution h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 500;
}

.talent-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.talent-bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.talent-label {
  width: 30px;
  font-weight: 500;
  text-align: center;
}

.talent-bar-container {
  flex: 1;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.talent-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.talent-a {
  background-color: #28a745;
}

.talent-b {
  background-color: #17a2b8;
}

.talent-c {
  background-color: #ffc107;
}

.talent-d {
  background-color: #dc3545;
}

.talent-count {
  width: 30px;
  text-align: center;
}
</style>

