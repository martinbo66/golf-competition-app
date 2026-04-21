<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo-link">
        <img :src="headerLogoSrc" alt="Logo" class="logo-img" />
      </router-link>
      <div class="header-identity">
        <div class="header-org-name">{{ orgName }}</div>
        <div class="header-tagline">Golf Competition Tracking</div>
      </div>
    </div>

    <div class="header-right">
      <OrganizationSelector />
      <router-link v-if="activeCompetitionName" to="/admin/competitions" class="header-competition">
        {{ activeCompetitionName }}
      </router-link>
      <button class="btn-icon btn-icon--bordered" @click="toggleTheme" :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
        <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
      </button>
      <button class="btn-icon" @click="showExportModal = true" aria-label="Export data">
        <i class="fas fa-download"></i>
      </button>
      <button class="btn-icon" @click="showImportModal = true" aria-label="Import data">
        <i class="fas fa-upload"></i>
      </button>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal" @click.self="showExportModal = false">
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
    <div v-if="showImportModal" class="modal" @click.self="closeImportModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Import Data</h3>
          <button class="close-btn" @click="closeImportModal" :disabled="isImporting">&times;</button>
        </div>
        <div class="modal-body">
          <p>Import competition data from a JSON file. This will replace all current data.</p>
          <div class="import-warning alert alert-warning">
            <strong>Warning:</strong> Importing will clear all existing players, teams, and scores, then create new data from the file. Export your current data first if you want to keep it.
          </div>
          <div v-if="importProgress" class="import-progress">
            {{ importProgress }}
          </div>
          <div class="import-options">
            <textarea
              v-model="importData"
              class="form-control"
              placeholder="Paste JSON data here"
              rows="10"
              :disabled="isImporting"
            ></textarea>
            <div class="form-actions">
              <button class="btn" @click="importDataFromJson" :disabled="!importData || isImporting">
                <i class="fas fa-upload"></i> {{ isImporting ? 'Importing…' : 'Import Data' }}
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
import { useOrganizationsStore } from '@/stores/organizations';
import { useCompetitionsStore } from '@/stores/competitions';
import DataService from '@/services/DataService';
import NotificationService from '@/services/NotificationService';
import { getUserFriendlyErrorMessage } from '@/utils';
import OrganizationSelector from '@/components/layout/OrganizationSelector.vue';

const organizationsStore = useOrganizationsStore();
const competitionsStore = useCompetitionsStore();

const orgName = computed(() => organizationsStore.activeOrganization?.name ?? 'Golf Competition');
const activeCompetitionName = computed(() => competitionsStore.activeCompetition?.name ?? null);
const headerLogoSrc = computed(() => {
  const activeOrgName = organizationsStore.activeOrganization?.name ?? '';
  const isBatheOrg = activeOrgName.trim().toLowerCase().startsWith('bathe');
  return isBatheOrg ? require('@/assets/bathe-logo.png') : require('@/assets/logo.png');
});

const showExportModal = ref(false);
const showImportModal = ref(false);
const importData = ref('');
const importProgress = ref('');
const isImporting = ref(false);
const isDarkMode = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark-mode', isDarkMode.value);
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false');
  NotificationService.info(`${isDarkMode.value ? 'Dark' : 'Light'} mode activated`);
};

const exportData = () => {
  try {
    const data = DataService.exportData();
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

const closeImportModal = () => {
  if (!isImporting.value) {
    showImportModal.value = false;
    importProgress.value = '';
  }
};

const importDataFromJson = async () => {
  if (!importData.value) {
    NotificationService.warning('Please paste JSON data to import');
    return;
  }
  const confirmed = globalThis.confirm(
    'This will delete all existing players, teams, and scores and replace them with the imported data. Continue?'
  );
  if (!confirmed) return;

  isImporting.value = true;
  importProgress.value = 'Starting…';
  try {
    await DataService.importData(importData.value, {
      onProgress: (message) => { importProgress.value = message; }
    });
    importData.value = '';
    importProgress.value = '';
    showImportModal.value = false;
    NotificationService.success('Data imported successfully');
    setTimeout(() => globalThis.location.reload(), 500);
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
    importProgress.value = '';
  } finally {
    isImporting.value = false;
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    isDarkMode.value = true;
    document.body.classList.add('dark-mode');
  }
});
</script>

<style scoped>
.app-header {
  height: 72px;
  background-color: var(--header-bg);
  color: var(--header-text);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-img {
  height: 64px;
  width: auto;
  transition: transform 0.2s;
}

.logo-img:hover {
  transform: scale(1.05);
}

.header-identity {
  min-width: 0;
}

.header-org-name {
  font-size: 22px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--header-text);
}

.header-tagline {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-competition {
  font-size: 13px;
  opacity: 0.8;
  white-space: nowrap;
  color: var(--header-text);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.header-competition:hover {
  background-color: var(--header-hover);
  opacity: 1;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--header-text);
  font-size: 14px;
  width: 34px;
  height: 34px;
  padding: 0;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.btn-icon:hover {
  background-color: var(--header-hover);
}

.btn-icon--bordered {
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-color);
}

.export-options,
.import-options {
  margin-top: 20px;
}

.import-warning {
  margin-bottom: 20px;
}

.import-progress {
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-color);
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
    gap: 12px;
  }

  .header-tagline {
    display: none;
  }

  .header-competition {
    display: none;
  }
}
</style>
