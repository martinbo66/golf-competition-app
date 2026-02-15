<template>
    <div class="course-scoring">
        <div class="page-header">
            <h1>Scoring: {{ courseName }}</h1>
        </div>

        <div v-if="courseId" class="scoring-content">
            <div class="scoring-grid">
                <div class="main-column">
                    <ScoreEntry :courseId="courseId" />
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
import ScoreEntry from '@/components/scoring/ScoreEntry.vue';
import CourseScorecard from '@/components/scoring/CourseScorecard.vue';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();

const courseId = computed(() => {
    return route.params.courseId;
});

const courseName = computed(() => {
    if (!courseId.value) return 'Unknown Course';
    const course = coursesStore.courses.find(c => c.id === courseId.value);
    return course ? course.name : 'Unknown Course';
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

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  h1 {
    color: #e2e8f0;
  }
}

/* Force dark mode styles for apps that use dark-mode class */
.dark-mode h1,
[data-theme="dark"] h1 {
  color: #e2e8f0;
}

/* Ensure light mode has high contrast when dark mode is NOT active */
/* This overrides the media query if the user manually selects light mode (assuming light mode removes the class) */
/* However, if the media query matches, we need a way to force light mode if the user wants it. */
/* If the app doesn't have a 'light-mode' class, we rely on the absence of 'dark-mode'. */
/* But CSS media queries can't be easily overridden by the *absence* of a class if they are at the root level. */
/* We should scope the media query to only apply if the 'dark-mode' class is present OR if no class is present and preference is dark. */
/* Actually, a better approach is to set the default color to dark, and only change it if .dark-mode is present. */
/* If we want to support system preference automatically, we can use the media query but ensure the manual toggle takes precedence. */

/* Let's just set the default color (Light Mode) explicitly */
h1 {
  color: #1a202c; /* Very dark gray for high contrast in light mode */
}

/* If the user has explicitly toggled dark mode, use light text */
body.dark-mode h1 {
  color: #e2e8f0;
}
</style>

