<template>
  <header class="app-header">
    <!-- Header Image and Logo Section -->
    <div class="header-main-section" v-if="currentHeaderImage">
      <div class="logo-section">
        <router-link to="/" class="logo-link">
          <img src="@/assets/logo.png" alt="Bathe Golf Competition" class="logo-img" />
        </router-link>
      </div>
      <div class="header-image-section">
        <img :src="currentHeaderImage" :alt="currentSection" class="header-image" />
      </div>
    </div>
    
    <div class="header-content">
      <div class="site-title">
        <router-link to="/">
          <h1>Bathe Golf Competition</h1>
        </router-link>
      </div>
      <nav class="top-nav">
        <ul>
          <li v-for="item in navItems" :key="item.id">
            <router-link 
              :to="item.route" 
              :class="{ active: activeSection === item.id }"
              @click.native="setActiveSection(item.id)"
            >
              <i :class="item.icon"></i>
              {{ item.label }}
            </router-link>
          </li>
        </ul>
      </nav>
      <div class="user-menu">
        <button class="btn-icon" @click="toggleTheme">
          <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
        </button>
        <button class="btn-icon" @click="showExportModal = true">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn-icon" @click="showImportModal = true">
          <i class="fas fa-upload"></i>
        </button>
      </div>
    </div>
    
    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Export Data</h3>
          <button class="close-btn" @click="showExportModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Export all competition data to a JSON file. This file can be used for backup or to transfer data to another device.</p>
          <div class="export-options">
            <button class="btn" @click="exportData">
              <i class="fas fa-download"></i> Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Import Data</h3>
          <button class="close-btn" @click="showImportModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Import competition data from a JSON file. This will replace all current data.</p>
          <div class="import-warning alert alert-warning">
            <strong>Warning:</strong> Importing data will overwrite all existing data. Make sure to export your current data first if you want to keep it.
          </div>
          <div class="import-options">
            <textarea 
              v-model="importData" 
              class="form-control" 
              placeholder="Paste JSON data here"
              rows="10"
            ></textarea>
            <div class="form-actions">
              <button class="btn" @click="importDataFromJson" :disabled="!importData">
                <i class="fas fa-upload"></i> Import Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useCoursesStore } from '@/stores/courses';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';

const uiStore = useUiStore();
const coursesStore = useCoursesStore();

const scoringRoute = computed(() => {
  const firstCourse = coursesStore.allCourses[0];
  return firstCourse ? `/scoring/${firstCourse.id}` : '/scoring';
});

const navItems = computed(() => [
  { id: 'administration', label: 'Administration', route: '/admin/players', icon: 'fas fa-users-cog' },
  { id: 'scoring', label: 'Scoring', route: scoringRoute.value, icon: 'fas fa-golf-ball' },
  { id: 'leaderboards', label: 'Leaderboards', route: '/leaderboards', icon: 'fas fa-trophy' }
]);

const showExportModal = ref(false);
const showImportModal = ref(false);
const importData = ref('');
const isDarkMode = ref(false);

const activeSection = computed(() => uiStore.activeSection);

const currentHeaderImage = computed(() => {
  const imageMap = {
    'administration': require('@/assets/parkland-header.png'),
    'scoring': require('@/assets/heathland-header.png'),
    'leaderboards': require('@/assets/moorland-header.png')
  };
  return imageMap[activeSection.value] || null;
});

const currentSection = computed(() => activeSection.value || 'administration');

const setActiveSection = (sectionId) => {
  uiStore.setActiveSection(sectionId);
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark-mode', isDarkMode.value);
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false');
  
  NotificationService.info(`${isDarkMode.value ? 'Dark' : 'Light'} mode activated`);
};

const exportData = () => {
  try {
    const data = DataService.exportData();
    
    // Create a download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golf-competition-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showExportModal.value = false;
    NotificationService.success('Data exported successfully');
  } catch (error) {
    NotificationService.error(`Error exporting data: ${error.message}`);
  }
};

const importDataFromJson = () => {
  try {
    if (!importData.value) {
      NotificationService.warning('Please paste JSON data to import');
      return;
    }
    
    DataService.importData(importData.value);
    
    importData.value = '';
    showImportModal.value = false;
    NotificationService.success('Data imported successfully');
    
    // Refresh the page to show the imported data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    NotificationService.error(`Error importing data: ${error.message}`);
  }
};

onMounted(() => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    isDarkMode.value = true;
    document.body.classList.add('dark-mode');
  }
});
</script>

<style scoped>
.app-header {
  background-color: var(--header-bg);
  color: var(--header-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-main-section {
  display: flex;
  align-items: stretch;
  height: 120px;
}

.logo-section {
  width: auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px;
}

.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--header-text);
}

.logo-img {
  height: 120px;
  width: auto;
  transition: transform 0.3s ease;
}

.logo-img:hover {
  transform: scale(1.05);
}

.header-image-section {
  flex: 1;
  height: 120px;
  overflow: hidden;
  position: relative;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.site-title {
  flex: 1;
}

.site-title a {
  text-decoration: none;
  color: var(--header-text);
}

.site-title h1 {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0;
}

.top-nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.top-nav li {
  margin: 0 5px;
}

.top-nav a {
  color: var(--header-text);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
}

.top-nav a i {
  margin-right: 8px;
}

.top-nav a:hover {
  background-color: var(--header-hover);
}

.top-nav a.active {
  background-color: var(--header-active);
  font-weight: 500;
}

.user-menu {
  display: flex;
  align-items: center;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--header-text);
  font-size: 1.1rem;
  padding: 8px;
  margin-left: 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-icon:hover {
  background-color: var(--header-hover);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
}

.modal-body {
  padding: 20px;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.close-btn:hover {
  color: var(--text-color);
}

.export-options, .import-options {
  margin-top: 20px;
}

.import-warning {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .header-main-section {
    flex-direction: column;
    height: auto;
  }
  
  .logo-section {
    width: 100%;
    height: 80px;
    padding: 15px;
    justify-content: center;
  }
  
  .logo-img {
    height: 70px;
  }
  
  .header-image-section {
    height: 80px;
  }
  
  .header-content {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
  }
  
  .site-title {
    margin-bottom: 10px;
    width: 100%;
    text-align: center;
  }
  
  .top-nav {
    order: 3;
    width: 100%;
    margin-top: 10px;
  }
  
  .top-nav ul {
    justify-content: space-around;
  }
  
  .top-nav a {
    flex-direction: column;
    font-size: 0.8rem;
    padding: 8px;
  }
  
  .top-nav a i {
    margin-right: 0;
    margin-bottom: 5px;
    font-size: 1.2rem;
  }
  
  .user-menu {
    order: 2;
  }
}
</style>

