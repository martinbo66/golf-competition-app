<template>
  <div v-if="section" class="section-banner" :style="{ backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url(${section.image})` }">
    <h1 class="section-banner__title">{{ section.title }}</h1>
    <div v-if="section.subtitle" class="section-banner__subtitle">{{ section.subtitle }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';

const route = useRoute();
const coursesStore = useCoursesStore();

const SECTIONS = {
  administration: {
    image: require('@/assets/parkland-header.png'),
    titles: {
      '/admin/organizations': 'Organizations',
      '/admin/competitions': 'Competitions',
      '/admin/courses': 'Courses',
      '/admin/players': 'Players',
      '/admin/teams': 'Teams',
    }
  },
  scoring: {
    image: require('@/assets/heathland-header.png'),
  },
  leaderboards: {
    image: require('@/assets/moorland-header.png'),
    titles: {
      '/leaderboards': 'Leaderboards',
      '/money-leaderboards': 'Money leaderboards',
    }
  }
};

const section = computed(() => {
  const p = route.path;

  if (p.startsWith('/admin')) {
    const s = SECTIONS.administration;
    return { image: s.image, title: s.titles[p] ?? 'Administration', subtitle: null };
  }

  if (p.startsWith('/scoring/')) {
    const roundId = route.params.roundId;
    const course = coursesStore.allCourses.find(c => c.roundId === roundId);
    return {
      image: SECTIONS.scoring.image,
      title: 'Score entry',
      subtitle: course ? course.name : null,
    };
  }

  if (p === '/leaderboards' || p === '/money-leaderboards') {
    const s = SECTIONS.leaderboards;
    return { image: s.image, title: s.titles[p], subtitle: null };
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
