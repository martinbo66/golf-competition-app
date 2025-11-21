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
        <ul>
          <li v-for="course in courses" :key="course.id">
            <router-link 
              :to="`/scoring/${course.id}`" 
              :class="{ active: activeSidebarItem === course.id }"
              @click.native="setActiveSidebarItem(course.id)"
            >
              <i class="fas fa-flag"></i>
              {{ course.name }}
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
      
      <div class="sidebar-footer">
        <div class="app-info">
          <p class="app-name">Golf Competition App</p>
          <p class="version">Version 1.1.0</p>
          <p class="updated-date">Updated: June 8, 2025</p>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppSidebar',
  data() {
    return {
      adminItems: [
        { id: 'players', label: 'Players', route: '/admin/players', icon: 'fas fa-users' },
        { id: 'teams', label: 'Teams', route: '/admin/teams', icon: 'fas fa-user-friends' }
      ]
    };
  },
  computed: {
    ...mapGetters('ui', ['activeSection', 'activeSidebarItem']),
    ...mapGetters('courses', ['allCourses']),
    courses() {
      return this.allCourses;
    },
    
    currentThumbnailImage() {
      const imageMap = {
        'administration': require('@/assets/bathe-head-1.png'),
        'scoring': require('@/assets/bathe-head-2.png'),
        'leaderboards': require('@/assets/bathe-head-3.png')
      };
      return imageMap[this.activeSection] || null;
    }
  },
  methods: {
    ...mapActions('ui', ['setActiveSidebarItem'])
  }
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

.sidebar-footer {
  margin-top: auto;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
}

.app-info {
  text-align: center;
}

.app-info p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.app-name {
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: 4px !important;
}

.version {
  font-size: 0.8rem;
  margin-bottom: 2px !important;
}

.updated-date {
  font-size: 0.75rem;
  font-style: italic;
  opacity: 0.8;
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
  
  .sidebar-footer {
    display: none;
  }
}
</style>

