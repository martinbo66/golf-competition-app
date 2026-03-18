<template>
  <div class="course-scorecard card">
    <div class="card-header">
      <h3>Course Scorecard: {{ courseData.name }}</h3>
    </div>
    <div class="card-body">
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
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCoursesStore } from '@/stores/courses';

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
});

const coursesStore = useCoursesStore();

const courseData = computed(() => {
  return coursesStore.courseById(props.courseId) || { name: 'Unknown Course' };
});

const scorecardImagePath = computed(() => {
  if (!courseData.value.name) return null;
  const imageName = courseData.value.name.toLowerCase().replaceAll(/\s+/g, '-') + '-scorecard.png';
  try {
    return require(`@/assets/${imageName}`);
  } catch (error) {
    console.warn(`Scorecard image not found for course: ${courseData.value.name}`);
    return null;
  }
});

const handleImageError = () => {
  console.warn(`Failed to load scorecard image for course: ${courseData.value.name}`);
};
</script>

<style scoped>
.course-scorecard {
  margin-bottom: 20px;
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
  background-color: var(--background-color);
  border: 2px dashed var(--border-color);
  border-radius: 4px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>
