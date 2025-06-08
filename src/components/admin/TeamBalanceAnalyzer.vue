<template>
  <div class="team-balance-analyzer card">
    <div class="card-header">
      <h3>Team Balance Analysis</h3>
    </div>
    <div class="card-body">
      <div v-if="teams.length === 0" class="empty-state">
        <p>No teams available for analysis. Create teams to see balance metrics.</p>
      </div>
      
      <div v-else>
        <div class="balance-summary">
          <div class="balance-metric">
            <div class="metric-label">Overall Balance</div>
            <div class="metric-value">
              <div class="balance-indicator" :class="overallBalanceClass">
                {{ overallBalanceText }}
              </div>
            </div>
          </div>
          
          <div class="balance-metric">
            <div class="metric-label">Player Distribution</div>
            <div class="metric-value">
              <div class="balance-indicator" :class="playerDistributionClass">
                {{ playerDistributionText }}
              </div>
            </div>
          </div>
          
          <div class="balance-metric">
            <div class="metric-label">Talent Distribution</div>
            <div class="metric-value">
              <div class="balance-indicator" :class="talentDistributionClass">
                {{ talentDistributionText }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="team-comparison">
          <h4>Team Comparison</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Players</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                <th>Avg. Talent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in teamMetrics" :key="team.teamId">
                <td>{{ team.teamName }}</td>
                <td>{{ team.playerCount }}</td>
                <td>{{ team.talentCounts.A }}</td>
                <td>{{ team.talentCounts.B }}</td>
                <td>{{ team.talentCounts.C }}</td>
                <td>{{ team.talentCounts.D }}</td>
                <td>
                  <div class="avg-talent-bar">
                    <div 
                      class="avg-talent-value" 
                      :style="{ width: (team.avgTalentRating / 4 * 100) + '%' }"
                      :class="getAvgTalentClass(team.avgTalentRating)"
                    ></div>
                    <span class="avg-talent-text">{{ team.avgTalentRating.toFixed(2) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { calculateTeamBalanceMetrics } from '@/utils';

export default {
  name: 'TeamBalanceAnalyzer',
  computed: {
    ...mapGetters('teams', ['allTeams']),
    ...mapGetters('players', ['allPlayers']),
    teams() {
      return this.allTeams;
    },
    players() {
      return this.allPlayers;
    },
    teamMetrics() {
      return calculateTeamBalanceMetrics(this.teams, this.players);
    },
    // Calculate overall balance metrics
    playerCountVariance() {
      if (this.teamMetrics.length <= 1) return 0;
      
      const counts = this.teamMetrics.map(team => team.playerCount);
      const avg = counts.reduce((sum, count) => sum + count, 0) / counts.length;
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
      return variance;
    },
    talentVariance() {
      if (this.teamMetrics.length <= 1) return 0;
      
      const avgTalents = this.teamMetrics.map(team => team.avgTalentRating);
      const avg = avgTalents.reduce((sum, val) => sum + val, 0) / avgTalents.length;
      const variance = avgTalents.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / avgTalents.length;
      return variance;
    },
    // Balance indicators
    overallBalanceClass() {
      const combinedVariance = this.playerCountVariance + this.talentVariance * 2;
      if (combinedVariance < 0.1) return 'excellent';
      if (combinedVariance < 0.3) return 'good';
      if (combinedVariance < 0.6) return 'fair';
      return 'poor';
    },
    overallBalanceText() {
      const classes = {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      };
      return classes[this.overallBalanceClass];
    },
    playerDistributionClass() {
      if (this.playerCountVariance < 0.1) return 'excellent';
      if (this.playerCountVariance < 0.5) return 'good';
      if (this.playerCountVariance < 1) return 'fair';
      return 'poor';
    },
    playerDistributionText() {
      const classes = {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      };
      return classes[this.playerDistributionClass];
    },
    talentDistributionClass() {
      if (this.talentVariance < 0.05) return 'excellent';
      if (this.talentVariance < 0.15) return 'good';
      if (this.talentVariance < 0.3) return 'fair';
      return 'poor';
    },
    talentDistributionText() {
      const classes = {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      };
      return classes[this.talentDistributionClass];
    }
  },
  methods: {
    getAvgTalentClass(avgTalent) {
      if (avgTalent >= 3.5) return 'talent-a';
      if (avgTalent >= 2.5) return 'talent-b';
      if (avgTalent >= 1.5) return 'talent-c';
      return 'talent-d';
    }
  }
};
</script>

<style scoped>
.team-balance-analyzer {
  /* Define CSS variables for proper light/dark mode support */
  --card-bg: var(--card-bg, #ffffff);
  --card-text: var(--text-color, #2c3e50);
  --card-header-bg: rgba(0, 0, 0, 0.03);
  --card-border: var(--border-color, #e9ecef);
  --text-muted: var(--text-muted, #6c757d);
  --text-primary: var(--text-color, #2c3e50);
  --metric-bg: var(--background-color, #f8f9fa);
  --empty-state-color: var(--text-muted, #6c757d);
  --table-stripe: rgba(0, 0, 0, 0.05);
  
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--empty-state-color);
  background-color: var(--metric-bg);
  border-radius: 8px;
  border: 2px dashed var(--card-border);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.balance-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  gap: 15px;
}

.balance-metric {
  flex: 1;
  text-align: center;
  padding: 15px;
  background-color: var(--metric-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
}

.balance-metric:first-child {
  margin-left: 0;
}

.balance-metric:last-child {
  margin-right: 0;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 10px;
  font-weight: 500;
}

.balance-indicator {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 500;
  color: white;
  font-size: 0.9rem;
}

.balance-indicator.excellent {
  background-color: #28a745;
}

.balance-indicator.good {
  background-color: #17a2b8;
}

.balance-indicator.fair {
  background-color: #ffc107;
  color: #212529;
}

.balance-indicator.poor {
  background-color: #dc3545;
}

.team-comparison {
  margin-bottom: 30px;
}

.team-comparison h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  overflow: hidden;
}

.table th {
  background-color: var(--card-header-bg);
  color: var(--text-primary);
  font-weight: 500;
  text-align: left;
  padding: 12px 15px;
  border-bottom: 1px solid var(--card-border);
  font-size: 0.9rem;
}

.table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.table tbody tr:nth-child(even) {
  background-color: var(--table-stripe);
}

.table tbody tr:hover {
  background-color: var(--card-border);
}

.avg-talent-bar {
  position: relative;
  height: 20px;
  background-color: var(--card-border);
  border-radius: 4px;
  overflow: hidden;
  width: 100px;
}

.avg-talent-value {
  height: 100%;
  transition: width 0.3s ease;
}

.avg-talent-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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

/* Dark mode overrides */
body.dark-mode .team-balance-analyzer,
[data-theme="dark"] .team-balance-analyzer {
  --card-bg: #34495e;
  --card-text: #ecf0f1;
  --card-header-bg: rgba(255, 255, 255, 0.05);
  --card-border: #4b6584;
  --text-muted: #b2bec3;
  --text-primary: #ecf0f1;
  --metric-bg: #2c3e50;
  --empty-state-color: #b2bec3;
  --table-stripe: rgba(255, 255, 255, 0.05);
}

/* Responsive design */
@media (max-width: 768px) {
  .balance-summary {
    flex-direction: column;
    gap: 10px;
  }
  
  .balance-metric {
    margin: 0;
  }
  
  .table {
    font-size: 0.8rem;
  }
  
  .table th,
  .table td {
    padding: 8px 10px;
  }
  
  .avg-talent-bar {
    width: 80px;
  }
}
</style>

