<template>
  <div class="course-scoring">
    <h1>Course Scoring: {{ courseData.name }}</h1>
    
    <div class="scoring-grid">
      <div class="main-column">
        <score-entry :course-id="courseId"></score-entry>
      </div>
      
      <div class="side-column">
        <course-scorecard :course-id="courseId"></course-scorecard>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ScoreEntry from '@/components/scoring/ScoreEntry.vue';
import CourseScorecard from '@/components/scoring/CourseScorecard.vue';

export default {
  name: 'CourseScoring',
  components: {
    ScoreEntry,
    CourseScorecard
  },
  props: {
    courseName: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('courses', ['courseByName']),
    courseData() {
      return this.courseByName(this.courseName.replace('-', ' ')) || { name: this.courseName, id: null };
    },
    courseId() {
      return this.courseData.id;
    }
  }
};
</script>

<style scoped>
.course-scoring {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
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

@media (max-width: 992px) {
  .scoring-grid {
    grid-template-columns: 1fr;
  }
}
</style>

