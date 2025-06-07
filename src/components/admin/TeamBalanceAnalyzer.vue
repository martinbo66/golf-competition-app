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
        
        <div class="talent-distribution-chart">
          <h4>Talent Distribution by Team</h4>
          <div class="chart-container">
            <div class="chart-labels">
              <div v-for="team in teamMetrics" :key="team.teamId" class="chart-label">
                {{ team.teamName }}
              </div>
            </div>
            <div class="chart-content">
              <div v-for="rating in ['A', 'B', 'C', 'D']" :key="rating" class="chart-row">
                <div class="rating-label" :class="'talent-' + rating.toLowerCase()">{{ rating }}</div>
                <div class="rating-bars">
                  <div v-for="team in teamMetrics" :key="team.teamId" class="rating-bar-container">
                    <div 
                      class="rating-bar" 
                      :class="'talent-' + rating.toLowerCase()"
                      :style="{ height: (team.talentCounts[rating] * 20) + 'px' }"
                    >
                      <span v-if="team.talentCounts[rating] > 0">{{ team.talentCounts[rating] }}</span>
                    </div>
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
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.balance-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.balance-metric {
  flex: 1;
  text-align: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 0 10px;
}

.balance-metric:first-child {
  margin-left: 0;
}

.balance-metric:last-child {
  margin-right: 0;
}

.metric-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 10px;
}

.balance-indicator {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 500;
  color: white;
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

.team-comparison h4, .talent-distribution-chart h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 500;
}

.avg-talent-bar {
  position: relative;
  height: 20px;
  background-color: #e9ecef;
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

.talent-distribution-chart {
  margin-top: 30px;
}

.chart-container {
  display: flex;
  flex-direction: column;
}

.chart-labels {
  display: flex;
  margin-left: 50px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-weight: 500;
  padding-bottom: 10px;
}

.chart-content {
  display: flex;
  flex-direction: column;
}

.chart-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.rating-label {
  width: 50px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  border-radius: 4px;
}

.rating-bars {
  display: flex;
  flex: 1;
  height: 100px;
}

.rating-bar-container {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 5px;
}

.rating-bar {
  width: 30px;
  min-height: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
  transition: height 0.3s ease;
}
</style>

