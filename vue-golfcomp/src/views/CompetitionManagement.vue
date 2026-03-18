<template>
  <div class="competition-management">
    <h1>Competition Management</h1>
    <CompetitionList />
    <RoundList />
  </div>
</template>

<script setup>
import CompetitionList from '@/components/admin/CompetitionList.vue';
import RoundList from '@/components/admin/RoundList.vue';
</script>

<style scoped>
.competition-management {
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

body.dark-mode .competition-management {
  background-color: var(--background-color, #2c3e50);
}

body.dark-mode h1 {
  color: var(--text-color, #ecf0f1);
}
</style>
