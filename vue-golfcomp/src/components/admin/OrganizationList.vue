<template>
  <div class="organization-list">
    <div class="card">
      <div class="card-header">
        <h2>Organizations</h2>
        <div class="card-actions">
          <button class="btn btn-primary" @click="openCreateForm">+ New Organization</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="organizations.length === 0" class="empty-state">
          <p>No organizations found. Click "New Organization" to create one.</p>
        </div>

        <div v-else class="orgs-grid">
          <div
            v-for="org in organizations"
            :key="org.id"
            class="org-card"
            :class="{ 'org-card--active': isActive(org) }"
          >
            <div class="org-card__header">
              <h3 class="org-card__name">{{ org.name }}</h3>
              <div class="org-card__badges">
                <span v-if="isActive(org)" class="badge badge--active">ACTIVE</span>
              </div>
            </div>

            <div class="org-card__details">
              <p class="org-card__slug">
                <i class="fas fa-link"></i>
                {{ org.slug }}
              </p>
            </div>

            <div class="org-card__actions">
              <button
                v-if="!isActive(org)"
                class="btn btn-secondary"
                @click="handleSetActive(org)"
                title="Set as active organization"
              >
                Set Active
              </button>
              <button
                class="icon-btn"
                @click="editOrg(org)"
                title="Edit organization"
              >
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button
                v-if="org.id !== DEFAULT_ORG_ID"
                class="icon-btn icon-btn-danger"
                :title="'Delete organization'"
                @click="confirmDelete(org)"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showForm" class="modal" @click.self="closeForm">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingOrg ? 'Edit Organization' : 'New Organization' }}</h3>
          <button class="close-btn" @click="closeForm">&times;</button>
        </div>
        <div class="modal-body">
          <OrganizationForm
            :organization="editingOrg"
            @submit="handleSave"
            @cancel="closeForm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrganizationsStore, DEFAULT_ORG_ID } from '@/stores/organizations';
import { useUiStore } from '@/stores/ui';
import NotificationService from '@/services/NotificationService';
import OrganizationForm from './OrganizationForm.vue';

const orgsStore = useOrganizationsStore();
const uiStore = useUiStore();

const showForm = ref(false);
const editingOrg = ref(null);

const organizations = computed(() => orgsStore.allOrganizations);

function isActive(org) {
  return orgsStore.activeOrganizationId === org.id;
}

function openCreateForm() {
  editingOrg.value = null;
  showForm.value = true;
}

function editOrg(org) {
  editingOrg.value = org;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingOrg.value = null;
}

async function handleSetActive(org) {
  uiStore.setLoading(true);
  try {
    await orgsStore.setActiveOrganization(org);
    NotificationService.success(`Active organization set to ${org.name}`);
  } catch (err) {
    NotificationService.error(err.message || 'Failed to set active organization');
  } finally {
    uiStore.setLoading(false);
  }
}

async function confirmDelete(org) {
  const confirmed = window.confirm(
    `Delete organization "${org.name}"? This will permanently delete all its competitions and data.`
  );
  if (!confirmed) return;

  uiStore.setLoading(true);
  try {
    await orgsStore.deleteOrganization(org.id);
    NotificationService.success('Organization deleted');
  } catch (err) {
    NotificationService.error(err.message || 'Failed to delete organization');
  } finally {
    uiStore.setLoading(false);
  }
}

async function handleSave(formData) {
  uiStore.setLoading(true);
  try {
    if (editingOrg.value) {
      await orgsStore.updateOrganization({ id: editingOrg.value.id, updates: formData });
      NotificationService.success('Organization updated');
    } else {
      await orgsStore.createOrganization(formData);
      NotificationService.success('Organization created');
    }
    closeForm();
  } catch (err) {
    NotificationService.error(err.message || 'Failed to save organization');
  } finally {
    uiStore.setLoading(false);
  }
}
</script>

<style scoped>
.orgs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.org-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background-color: var(--card-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.org-card--active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb, 52, 152, 219), 0.15);
}

.org-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.org-card__name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.org-card__badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--active {
  background-color: var(--primary-color);
  color: #fff;
}

.org-card__details {
  margin-bottom: 12px;
}

.org-card__slug {
  margin: 4px 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.org-card__slug i {
  width: 14px;
  margin-right: 6px;
}

.org-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.org-card__actions .btn {
  font-size: 0.85rem;
  padding: 5px 12px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
  transition: color 0.2s, background-color 0.2s;
}

.icon-btn:hover {
  color: var(--primary-color);
  background-color: var(--border-color);
}

.icon-btn-danger:hover {
  color: var(--danger-color, #dc3545);
  background-color: rgba(220, 53, 69, 0.1);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn:disabled:hover {
  color: var(--text-muted);
  background-color: transparent;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 4px;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .orgs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
