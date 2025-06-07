<template>
  <div class="team-leaderboard card">
    <div class="card-header">
      <h3>Team Leaderboard</h3>
    </div>
    <div class="card-body">
      <div v-if="!teams.length" class="empty-state">
        <p>No teams available. Create teams in the Team Management section first.</p>
      </div>
      
      <div v-else-if="!hasAnyScores" class="empty-state">
        <p>No scores recorded yet. Enter scores in the Course Scoring sections.</p>
      </div>
      
      <div v-else>
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th v-for="course in courses" :key="course.id">{{ course.name }}</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(team, index) in teamLeaderboard" :key="team.id" :class="{ 'highlight': index < 3 }">
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
              <td v-for="course in courses" :key="course.id" class="course-score">
                {{ team.courseScores[course.name] || '-' }}
              </td>
              <td class="total-score">{{ team.totalScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TeamLeaderboard',
  computed: {
    ...mapGetters('teams', ['allTeams']),
    ...mapGetters('courses', ['allCourses']),
    ...mapGetters('scores', ['teamLeaderboard', 'allScores']),
    
    teams() {
      return this.allTeams;
    },
    
    courses() {
      return this.allCourses;
    },
    
    hasAnyScores() {
      return this.allScores.length > 0;
    }
  }
};
</script>

<style scoped>
.team-leaderboard {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
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
  background-color: #f8f9fa;
}

.team-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.team-logo.placeholder {
  background-color: #e9ecef;
}

.team-logo.placeholder span {
  font-weight: bold;
  color: #6c757d;
}

.course-score {
  text-align: center;
}

.total-score {
  font-weight: bold;
  text-align: center;
}

.highlight {
  background-color: #f8f9fa;
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

