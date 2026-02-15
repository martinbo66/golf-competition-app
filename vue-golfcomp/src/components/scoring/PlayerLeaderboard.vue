<template>
  <div class="player-leaderboard card">
    <div class="card-header">
      <h3>Player Leaderboard</h3>
    </div>
    <div class="card-body">
      <div v-if="!players.length" class="empty-state">
        <p>No players available. Add players in the Player Management section first.</p>
      </div>
      
      <div v-else-if="!hasAnyScores" class="empty-state">
        <p>No scores recorded yet. Enter scores in the Course Scoring sections.</p>
      </div>
      
      <div v-else>
        <div class="leaderboard-filters">
          <div class="form-group">
            <label for="filterTeam">Filter by Team</label>
            <select id="filterTeam" v-model="filterTeam" class="form-control">
              <option value="">All Teams</option>
              <option value="unassigned">Unassigned</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="filterTalent">Filter by Talent</label>
            <select id="filterTalent" v-model="filterTalent" class="form-control">
              <option value="">All Ratings</option>
              <option value="A">A (Highest)</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D (Lowest)</option>
            </select>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Team</th>
              <th>Talent</th>
              <th v-for="course in courses" :key="course.id">{{ course.name }}</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in filteredLeaderboard" :key="player.id" :class="{ 'highlight': index < 3 }">
              <td class="rank">{{ index + 1 }}</td>
              <td class="player-name">{{ player.name }}</td>
              <td class="team-name">{{ player.teamName || 'Unassigned' }}</td>
              <td class="talent-rating">
                <span :class="'talent-badge talent-' + player.talentRating.toLowerCase()">
                  {{ player.talentRating }}
                </span>
              </td>
              <td v-for="course in courses" :key="course.id" class="course-score">
                {{ player.courseScores[course.name] || '-' }}
              </td>
              <td class="total-score">{{ player.totalScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { useCoursesStore } from '@/stores/courses';
import { useScoresStore } from '@/stores/scores';

const teamsStore = useTeamsStore();
const playersStore = usePlayersStore();
const coursesStore = useCoursesStore();
const scoresStore = useScoresStore();

const filterTeam = ref('');
const filterTalent = ref('');

const teams = computed(() => teamsStore.allTeams);
const players = computed(() => playersStore.allPlayers);
const courses = computed(() => coursesStore.allCourses);
const allScores = computed(() => scoresStore.allScores);
const playerLeaderboard = computed(() => scoresStore.playerLeaderboard);

const hasAnyScores = computed(() => {
  return allScores.value.length > 0;
});

const filteredLeaderboard = computed(() => {
  let result = [...playerLeaderboard.value];
  
  // Apply team filter
  if (filterTeam.value) {
    if (filterTeam.value === 'unassigned') {
      result = result.filter(player => !player.teamId);
    } else {
      result = result.filter(player => player.teamId === filterTeam.value);
    }
  }
  
  // Apply talent filter
  if (filterTalent.value) {
    result = result.filter(player => player.talentRating === filterTalent.value);
  }
  
  return result;
});
</script>

<style scoped>
.player-leaderboard {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.leaderboard-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.leaderboard-filters .form-group {
  flex: 1;
  max-width: 300px;
}

.table {
  margin-bottom: 0;
}

.rank {
  font-weight: bold;
  text-align: center;
}

.player-name {
  min-width: 150px;
}

.team-name {
  min-width: 150px;
}

.talent-rating {
  text-align: center;
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
  .leaderboard-filters {
    flex-direction: column;
  }
  
  .leaderboard-filters .form-group {
    max-width: none;
  }
  
  .table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>

