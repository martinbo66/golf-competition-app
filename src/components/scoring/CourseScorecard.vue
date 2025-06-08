<template>
  <div class="course-scorecard card">
    <div class="card-header">
      <h3>Course Scorecard: {{ courseData.name }}</h3>
    </div>
    <div class="card-body">
      <!-- Scorecard Image Section -->
      <div class="scorecard-image-section">
        <div class="scorecard-image">
          <img 
            :src="scorecardImagePath" 
            :alt="courseData.name + ' Scorecard'"
            @error="handleImageError"
            v-if="scorecardImagePath"
          />
          <div v-else class="scorecard-placeholder">
            <p>Scorecard not available</p>
          </div>
        </div>
      </div>
      
      <div v-if="!teams.length" class="empty-state">
        <p>No teams available. Create teams in the Team Management section first.</p>
      </div>
      
      <div v-else-if="!hasAnyScores" class="empty-state">
        <p>No scores recorded yet. Enter scores in the Score Entry section.</p>
      </div>
      
      <div v-else>
        <div class="scorecard-container">
          <div v-for="teamScore in courseScoresByTeam" :key="teamScore.teamId" class="team-scorecard">
            <div class="team-header">
              <div class="team-info">
                <div v-if="teamScore.logoUrl" class="team-logo">
                  <img :src="teamScore.logoUrl" :alt="teamScore.teamName + ' logo'" />
                </div>
                <div v-else class="team-logo placeholder">
                  <span>{{ teamScore.teamName.charAt(0) }}</span>
                </div>
                <h4>{{ teamScore.teamName }}</h4>
              </div>
              <div class="team-total">
                Total: <span>{{ teamScore.teamTotal }}</span>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Talent</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="playerScore in teamScore.playerScores" :key="playerScore.playerId">
                  <td>{{ playerScore.playerName }}</td>
                  <td class="talent-cell">
                    <span :class="'talent-badge talent-' + playerScore.talentRating.toLowerCase()">
                      {{ playerScore.talentRating }}
                    </span>
                  </td>
                  <td class="score-cell">
                    {{ playerScore.score !== null ? playerScore.score : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'CourseScorecard',
  props: {
    courseId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('teams', ['allTeams']),
    ...mapGetters('courses', ['courseById']),
    ...mapGetters('scores', ['courseScoresByTeam', 'scoresByCourse']),
    
    courseData() {
      return this.courseById(this.courseId) || { name: 'Unknown Course' };
    },
    
    teams() {
      return this.allTeams;
    },
    
    hasAnyScores() {
      return this.scoresByCourse(this.courseId).length > 0;
    },
    
    scorecardImagePath() {
      if (!this.courseData.name) return null;
      
      // Convert course name to the image filename format
      const imageName = this.courseData.name.toLowerCase().replace(/\s+/g, '-') + '-scorecard.png';
      
      try {
        return require(`@/assets/${imageName}`);
      } catch (error) {
        console.warn(`Scorecard image not found for course: ${this.courseData.name}`);
        return null;
      }
    }
  },
  
  methods: {
    handleImageError() {
      console.warn(`Failed to load scorecard image for course: ${this.courseData.name}`);
    }
  }
};
</script>

<style scoped>
.course-scorecard {
  margin-bottom: 20px;
}

.scorecard-image-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.scorecard-image {
  text-align: center;
}

.scorecard-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scorecard-placeholder {
  background-color: #f8f9fa;
  border: 2px dashed #e9ecef;
  border-radius: 4px;
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.scorecard-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.team-scorecard {
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #e9ecef;
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
  background-color: white;
}

.team-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.team-logo.placeholder {
  background-color: #dee2e6;
}

.team-logo.placeholder span {
  font-weight: bold;
  color: #6c757d;
}

.team-info h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.team-total {
  font-weight: 500;
}

.team-total span {
  font-size: 1.2rem;
  font-weight: bold;
}

.table {
  margin-bottom: 0;
}

.talent-cell {
  text-align: center;
}

.score-cell {
  text-align: center;
  font-weight: 500;
}

.talent-badge {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.talent-a {
  background-color: #28a745;
}

.talent-b {
  background-color: #17a2b8;
}

.talent-c {
  background-color: #ffc107;
  color: #212529;
}

.talent-d {
  background-color: #dc3545;
}

@media (max-width: 768px) {
  .scorecard-container {
    grid-template-columns: 1fr;
  }
}
</style>

