<template>
  <div class="organization-management">
    <h1>Organization Management</h1>
    <OrganizationList />
  </div>
</template>

<script setup>
import OrganizationList from '@/components/admin/OrganizationList.vue';
</script>

<style scoped>
.organization-management {
  padding: 20px;
  background-color: var(--background-color, #f8f9fa);
  min-height: 100vh;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--text-color, #2c3e50);
}

body.dark-mode .organization-management {
  background-color: var(--background-color, #2c3e50);
}

body.dark-mode h1 {
  color: var(--text-color, #ecf0f1);
}
</style>
