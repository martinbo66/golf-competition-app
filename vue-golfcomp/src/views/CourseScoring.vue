<template>
    <div class="course-scoring">
        <div class="page-header">
            <h1>Scoring: {{ courseName }}</h1>
        </div>

        <div v-if="courseId" class="scoring-content">
            <div class="scoring-grid">
                <div class="main-column">
                    <ScoreEntry :courseId="courseId" />

                    <!-- Team Score Cards -->
                    <div v-if="courseScoresByTeam.length" class="team-scores-section">
                        <h3 class="team-scores-heading">Team Scores</h3>
                        <div class="team-score-cards">
                            <div
                                v-for="teamScore in courseScoresByTeam"
                                :key="teamScore.teamId"
                                class="team-score-card card"
                            >
                                <div class="team-score-card-header">
                                    <div class="team-identity">
                                        <div v-if="teamScore.logoUrl" class="team-logo">
                                            <img :src="teamScore.logoUrl" :alt="teamScore.teamName + ' logo'" />
                                        </div>
                                        <div v-else class="team-logo placeholder">
                                            <span>{{ teamScore.teamName.charAt(0) }}</span>
                                        </div>
                                        <span class="team-name">{{ teamScore.teamName }}</span>
                                    </div>
                                    <div class="team-total-badge">{{ teamScore.teamTotal }}</div>
                                </div>
                                <div class="team-score-card-body">
                                    <div
                                        v-for="playerScore in teamScore.playerScores"
                                        :key="playerScore.playerId"
                                        class="player-score-row"
                                    >
                                        <span class="player-name">{{ playerScore.playerName }}</span>
                                        <span :class="'talent-badge talent-' + playerScore.talentRating.toLowerCase()">
                                            {{ playerScore.talentRating }}
                                        </span>
                                        <span class="player-score">
                                            {{ playerScore.score !== null ? playerScore.score : '—' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="side-column">
                    <CourseScorecard :courseId="courseId" />
                </div>
            </div>
        </div>
        <div v-else class="loading-state">
            <p>Select a course to view scoring.</p>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';
import { useScoresStore } from '@/stores/scores';
import ScoreEntry from '@/components/scoring/ScoreEntry.vue';
import CourseScorecard from '@/components/scoring/CourseScorecard.vue';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();
const scoresStore = useScoresStore();

const courseId = computed(() => route.params.courseId);

const courseName = computed(() => {
    if (!courseId.value) return 'Unknown Course';
    const course = coursesStore.courses.find(c => c.id === courseId.value);
    return course ? course.name : 'Unknown Course';
});

const courseScoresByTeam = computed(() => {
    if (!courseId.value) return [];
    return scoresStore.courseScoresByTeam(courseId.value);
});

onMounted(() => {
    if (!courseId.value && coursesStore.courses.length > 0) {
        router.replace({ name: 'CourseScoring', params: { courseId: coursesStore.courses[0].id } });
    }
});
</script>

<style scoped>
.course-scoring {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: #1a202c;
}

body.dark-mode h1 {
  color: #e2e8f0;
}

.scoring-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
}

.main-column, .side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Team Scores Section */
.team-scores-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #1a202c);
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.8rem;
}

.team-score-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.team-score-card {
  margin-bottom: 0;
}

.team-score-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #2c3e50;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  color: #fff;
}

.team-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.team-logo {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.team-logo.placeholder {
  background-color: var(--border-color, #dee2e6);
}

.team-logo.placeholder span {
  font-size: 0.7rem;
  font-weight: bold;
  color: #2c3e50;
}

.team-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.team-total-badge {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-color, #007bff);
  flex-shrink: 0;
  margin-left: 8px;
}

.team-score-card-body {
  padding: 6px 12px 8px;
}

.player-score-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 0.82rem;
}

.player-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color, #333);
}

.player-score {
  font-weight: 600;
  min-width: 24px;
  text-align: right;
  color: var(--text-color, #333);
}

.talent-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.talent-a { background-color: #28a745; }
.talent-b { background-color: #17a2b8; }
.talent-c { background-color: #ffc107; color: #212529; }
.talent-d { background-color: #dc3545; }

@media (max-width: 992px) {
  .scoring-grid {
    grid-template-columns: 1fr;
  }

  .team-score-cards {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 480px) {
  .team-score-cards {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
