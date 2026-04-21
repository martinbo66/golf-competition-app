<template>
  <div v-if="section" class="section-banner" :style="{ backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url(${headerImage})` }">
    <h1 class="section-banner__title">{{ section.title }}</h1>
    <div v-if="section.subtitle" class="section-banner__subtitle">{{ section.subtitle }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';
import headerImage from '@/assets/golf-header.png';

const route = useRoute();
const coursesStore = useCoursesStore();

const TITLES = {
  '/admin/organizations': 'Organizations',
  '/admin/competitions': 'Competitions',
  '/admin/courses': 'Courses',
  '/admin/players': 'Players',
  '/admin/teams': 'Teams',
  '/leaderboards': 'Leaderboards',
  '/money-leaderboards': 'Money leaderboards',
};

const section = computed(() => {
  const p = route.path;

  if (p.startsWith('/admin')) {
    return { title: TITLES[p] ?? 'Administration', subtitle: null };
  }

  if (p.startsWith('/scoring/')) {
    const course = coursesStore.allCourses.find(c => c.roundId === route.params.roundId);
    if (!course) return { title: 'Score entry and payouts', subtitle: null };
    const parts = [course.name];
    if (course.playDate) {
      const d = new Date(course.playDate + 'T00:00:00');
      parts.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    }
    return { title: 'Score entry and payouts', subtitle: parts.join(' · ') };
  }

  if (p === '/leaderboards' || p === '/money-leaderboards') {
    return { title: TITLES[p], subtitle: null };
  }

  return null;
});
</script>

<style scoped>
.section-banner {
  height: 120px;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 30px;
  color: #fff;
  flex-shrink: 0;
}

.section-banner__title {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
}

.section-banner__subtitle {
  margin-top: 4px;
  font-size: 14px;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .section-banner {
    height: 80px;
    padding: 0 20px;
  }

  .section-banner__title {
    font-size: 22px;
  }
}
</style>
