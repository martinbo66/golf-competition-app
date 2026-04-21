<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <div v-for="group in navGroups" :key="group.label" class="nav-group">
        <div class="nav-group-label">{{ group.label }}</div>
        <template v-if="group.items.length > 0">
          <router-link
            v-for="item in group.items"
            :key="item.id"
            :to="item.route"
            class="nav-item"
            :class="{ active: isActive(item) }"
          >
            <i :class="item.icon"></i>
            <span v-if="item.sublabel" class="nav-item-text">
              <span class="nav-item-label">{{ item.label }}</span>
              <span class="nav-item-sublabel">{{ item.sublabel }}</span>
            </span>
            <template v-else>{{ item.label }}</template>
          </router-link>
        </template>
        <p v-else-if="group.emptyMessage" class="no-rounds-msg">{{ group.emptyMessage }}</p>
      </div>

      <div class="sidebar-thumbnail" v-if="currentThumbnailImage">
        <img :src="currentThumbnailImage" alt="Organization" class="thumbnail-image" />
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';
import { useOrganizationsStore } from '@/stores/organizations';

const route = useRoute();
const coursesStore = useCoursesStore();
const organizationsStore = useOrganizationsStore();

const courses = computed(() => coursesStore.allCourses.filter(c => c.roundId !== null));

function formatNavDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const navGroups = computed(() => [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'leaderboards', icon: 'fas fa-trophy', label: 'Leaderboards', route: '/leaderboards' },
      { id: 'money-leaderboards', icon: 'fas fa-dollar-sign', label: 'Money leaderboards', route: '/money-leaderboards' },
    ]
  },
  {
    label: 'SCORING',
    emptyMessage: 'No rounds scheduled. Add rounds in Competition Management.',
    items: courses.value.map(c => ({
      id: c.roundId,
      icon: 'fas fa-flag',
      label: c.name,
      sublabel: c.playDate ? formatNavDate(c.playDate) : null,
      route: `/scoring/${c.roundId}`,
    }))
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { id: 'organizations', icon: 'fas fa-building', label: 'Organizations', route: '/admin/organizations' },
      { id: 'competitions', icon: 'fas fa-trophy', label: 'Competitions', route: '/admin/competitions' },
      { id: 'courses', icon: 'fas fa-map-marker-alt', label: 'Courses', route: '/admin/courses' },
      { id: 'players', icon: 'fas fa-users', label: 'Players', route: '/admin/players' },
      { id: 'teams', icon: 'fas fa-user-friends', label: 'Teams', route: '/admin/teams' },
    ]
  }
]);

function isActive(item) {
  return route.path === item.route;
}

const currentThumbnailImage = computed(() => {
  const orgName = organizationsStore.activeOrganization?.name ?? '';
  if (!orgName.toLowerCase().includes('bathe')) return null;
  const section = route.path.startsWith('/admin') ? 'administration'
    : route.path.startsWith('/scoring') ? 'scoring'
    : 'leaderboards';
  const imageMap = {
    administration: require('@/assets/bathe-head-1.png'),
    scoring: require('@/assets/bathe-head-2.png'),
    leaderboards: require('@/assets/bathe-head-3.png')
  };
  return imageMap[section] || null;
});
</script>

<style scoped>
.app-sidebar {
  width: 250px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 18px 0;
  height: calc(100vh - 72px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nav-group {
  margin-bottom: 18px;
}

.nav-group-label {
  padding: 6px 20px 8px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: var(--text-color);
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  border-left: 3px solid transparent;
  transition: background-color 0.15s;
}

.nav-item i {
  width: 16px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.nav-item:hover {
  background-color: var(--sidebar-hover);
}

.nav-item.active {
  background-color: rgba(76, 175, 80, 0.08);
  border-left-color: var(--primary-color);
  font-weight: 500;
  padding-left: 17px;
}

.nav-item.active i {
  color: var(--primary-color);
}

body.dark-mode .nav-item.active {
  background-color: rgba(102, 187, 106, 0.12);
}

.nav-item-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.nav-item-sublabel {
  font-size: 12px;
  opacity: 0.7;
  font-weight: 400;
  margin-top: 1px;
}

.no-rounds-msg {
  padding: 4px 20px 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.sidebar-thumbnail {
  margin: 20px 15px;
  text-align: center;
}

.thumbnail-image {
  max-width: 100%;
  height: 100px;
  width: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.thumbnail-image:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .nav-item {
    padding: 12px 20px;
  }

  .nav-item.active {
    padding-left: 17px;
  }
}
</style>
