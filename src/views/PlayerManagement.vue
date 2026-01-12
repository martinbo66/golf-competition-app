<template>
  <div class="player-management">
    <h1>Player Management</h1>
    <player-stats></player-stats>
    <player-list></player-list>
  </div>
</template>

<script setup>
import PlayerList from '@/components/admin/PlayerList.vue';
import PlayerStats from '@/components/admin/PlayerStats.vue';
</script>

<style scoped>
.player-management {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
}
</style>

