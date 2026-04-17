<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <div v-if="activeSection === 'administration'">
        <h3>Administration</h3>
        <ul>
          <li v-for="item in adminItems" :key="item.id">
            <router-link 
              :to="item.route" 
              :class="{ active: activeSidebarItem === item.id }"
              @click.native="setActiveSidebarItem(item.id)"
            >
              <i :class="item.icon"></i>
              {{ item.label }}
            </router-link>
          </li>
        </ul>
      </div>
      
      <div v-if="activeSection === 'scoring'">
        <h3>Scoring</h3>
        <p v-if="courses.length === 0" class="no-rounds-msg">No rounds scheduled. Add rounds in Competition Management.</p>
        <ul v-else>
          <li v-for="course in courses" :key="course.roundId">
            <router-link
              :to="`/scoring/${course.roundId}`"
              :class="{ active: activeSidebarItem === course.roundId }"
              @click.native="setActiveSidebarItem(course.roundId)"
            >
              <i class="fas fa-flag"></i>
              <span class="course-nav-label">
                {{ course.name }}
                <span v-if="course.playDate" class="course-nav-date">
                  {{ formatNavDate(course.playDate) }}
                </span>
              </span>
            </router-link>
          </li>
        </ul>
      </div>
      
      <div v-if="activeSection === 'leaderboards'">
        <h3>Leaderboards</h3>
        <ul>
          <li>
            <router-link 
              to="/leaderboards" 
              :class="{ active: activeSidebarItem === 'points-leaderboards' }"
              @click.native="setActiveSidebarItem('points-leaderboards')"
            >
              <i class="fas fa-trophy"></i>
              Points Leaderboards
            </router-link>
          </li>
          <li>
            <router-link 
              to="/money-leaderboards" 
              :class="{ active: activeSidebarItem === 'money-leaderboards' }"
              @click.native="setActiveSidebarItem('money-leaderboards')"
            >
              <i class="fas fa-dollar-sign"></i>
              Money Leaderboards
            </router-link>
          </li>
        </ul>
      </div>
      
      <!-- Thumbnail Image Section -->
      <div class="sidebar-thumbnail" v-if="currentThumbnailImage">
        <img :src="currentThumbnailImage" :alt="activeSection" class="thumbnail-image" />
      </div>
      
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useCoursesStore } from '@/stores/courses';
import { useOrganizationsStore } from '@/stores/organizations';

const uiStore = useUiStore();
const coursesStore = useCoursesStore();

const adminItems = [
  { id: 'organizations', label: 'Organizations', route: '/admin/organizations', icon: 'fas fa-building' },
  { id: 'competitions', label: 'Competitions', route: '/admin/competitions', icon: 'fas fa-trophy' },
  { id: 'courses', label: 'Courses', route: '/admin/courses', icon: 'fas fa-map-marker-alt' },
  { id: 'players', label: 'Players', route: '/admin/players', icon: 'fas fa-users' },
  { id: 'teams', label: 'Teams', route: '/admin/teams', icon: 'fas fa-user-friends' }
];

const activeSection = computed(() => uiStore.activeSection);
const activeSidebarItem = computed(() => uiStore.activeSidebarItem);
const courses = computed(() => coursesStore.allCourses.filter(c => c.roundId !== null));

function formatNavDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
const organizationsStore = useOrganizationsStore();

const currentThumbnailImage = computed(() => {
  const orgName = organizationsStore.activeOrganization?.name ?? '';
  if (!orgName.toLowerCase().includes('bathe')) return null;
  const imageMap = {
    'administration': require('@/assets/bathe-head-1.png'),
    'scoring': require('@/assets/bathe-head-2.png'),
    'leaderboards': require('@/assets/bathe-head-3.png')
  };
  return imageMap[activeSection.value] || null;
});

const setActiveSidebarItem = (itemId) => {
  uiStore.setActiveSidebarItem(itemId);
};

</script>

<style scoped>
.app-sidebar {
  width: 250px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-nav h3 {
  padding: 0 20px;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
}

.sidebar-nav ul {
  list-style: none;
  margin: 0 0 20px 0;
  padding: 0;
}

.sidebar-nav li {
  margin-bottom: 2px;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: var(--text-color);
  text-decoration: none;
  transition: background-color 0.3s;
}

.sidebar-nav a i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.sidebar-nav a:hover {
  background-color: var(--sidebar-hover);
}

.sidebar-nav a.active {
  background-color: var(--sidebar-active);
  color: var(--primary-color);
  font-weight: 500;
  border-left: 3px solid var(--primary-color);
}


.no-rounds-msg {
  padding: 8px 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.course-nav-label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.course-nav-date {
  font-size: 0.82rem;
  opacity: 0.7;
  font-weight: 400;
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
  
  .sidebar-nav a {
    padding: 15px 20px;
  }
  
}
</style>

