<template>
  <div class="org-selector" v-if="orgsStore.hasMultipleOrganizations">
    <label class="org-label">
      <i class="fas fa-building"></i>
    </label>
    <select
      class="org-select"
      :value="orgsStore.activeOrganizationId"
      @change="onOrgChange"
    >
      <option
        v-for="org in orgsStore.allOrganizations"
        :key="org.id"
        :value="org.id"
      >
        {{ org.name }}
      </option>
    </select>
  </div>
  <div class="org-badge" v-else-if="orgsStore.activeOrganization">
    <i class="fas fa-building"></i>
    <span>{{ orgsStore.activeOrganization.name }}</span>
  </div>
</template>

<script setup>
import { useOrganizationsStore } from '@/stores/organizations';

const orgsStore = useOrganizationsStore();

async function onOrgChange(event) {
  const selectedId = event.target.value;
  const org = orgsStore.organizations.find(o => o.id === selectedId);
  if (!org) return;

  // setActiveOrganization fetches competitions and auto-selects the best one
  await orgsStore.setActiveOrganization(org);
}
</script>

<style scoped>
.org-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.org-label {
  color: var(--header-text);
  font-size: 0.9rem;
}

.org-select {
  background-color: var(--header-active, rgba(255,255,255,0.15));
  color: var(--header-text);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
  max-width: 160px;
}

.org-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.org-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--header-text);
  font-size: 0.85rem;
  padding: 4px 8px;
  opacity: 0.8;
}
</style>
