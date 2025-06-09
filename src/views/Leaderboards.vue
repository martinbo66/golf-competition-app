<template>
  <div class="leaderboards">
    <h1>Leaderboards</h1>
    
    <div class="leaderboards-grid">
      <div class="main-column">
        <team-leaderboard></team-leaderboard>
        <player-leaderboard></player-leaderboard>
      </div>
      
      <div class="side-column">
        <div class="card">
          <div class="card-header">
            <h3>Competition Summary</h3>
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
                <div class="stat-label">Courses</div>
                <div class="stat-value">{{ courses.length }}</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-label">Total Scores</div>
                <div class="stat-value">{{ scores.length }}</div>
              </div>
            </div>
            
            <div class="financial-summary">
              <h4>Financial Summary</h4>
              <div class="financial-stats">
                <div class="financial-item">
                  <div class="financial-label">Total Entry Fees</div>
                  <div class="financial-value">{{ formatCurrency(totalEntryFees) }}</div>
                </div>
                
                <div class="financial-item">
                  <div class="financial-label">Total Winnings</div>
                  <div class="financial-value">{{ formatCurrency(totalWinnings) }}</div>
                </div>
                
                <div class="financial-item">
                  <div class="financial-label">Balance</div>
                  <div class="financial-value" :class="{ 'positive': balance >= 0, 'negative': balance < 0 }">
                    {{ formatCurrency(balance) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatCurrency } from '@/utils';
import TeamLeaderboard from '@/components/scoring/TeamLeaderboard.vue';
import PlayerLeaderboard from '@/components/scoring/PlayerLeaderboard.vue';

export default {
  name: 'Leaderboards',
  components: {
    TeamLeaderboard,
    PlayerLeaderboard
  },
  computed: {
    ...mapGetters('teams', ['allTeams']),
    ...mapGetters('players', ['allPlayers', 'totalEntryFees', 'totalWinnings']),
    ...mapGetters('courses', ['allCourses']),
    ...mapGetters('scores', ['allScores']),
    
    teams() {
      return this.allTeams;
    },
    
    players() {
      return this.allPlayers;
    },
    
    courses() {
      return this.allCourses;
    },
    
    scores() {
      return this.allScores;
    },
    
    balance() {
      return this.totalEntryFees - this.totalWinnings;
    }
  },
  methods: {
    formatCurrency
  }
};
</script>

<style scoped>
.leaderboards {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
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
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.financial-summary {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
}

.financial-summary h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #2c3e50;
}

.financial-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.financial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.financial-item:last-child {
  border-bottom: none;
  padding-top: 15px;
  margin-top: 5px;
  border-top: 1px solid #dee2e6;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .stat-item {
    background-color: #2d3748;
    border: 1px solid #4a5568;
  }

  .stat-label {
    color: #a0aec0;
  }

  .stat-value {
    color: #f7fafc;
  }

  .financial-summary {
    background-color: #2d3748;
    border: 1px solid #4a5568;
  }

  .financial-summary h4 {
    color: #f7fafc;
  }

  .financial-item {
    border-bottom: 1px solid #4a5568;
  }

  .financial-item:last-child {
    border-top: 1px solid #4a5568;
  }

  .financial-label {
    color: #f7fafc;
  }

  .financial-value {
    color: #f7fafc;
  }
}

.financial-label {
  font-weight: 500;
}

.financial-value {
  font-weight: 500;
}

.financial-value.positive {
  color: #28a745;
}

.financial-value.negative {
  color: #dc3545;
}

@media (max-width: 992px) {
  .leaderboards-grid {
    grid-template-columns: 1fr;
  }
}
</style>

