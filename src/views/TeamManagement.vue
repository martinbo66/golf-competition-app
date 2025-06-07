<template>
  <div class="team-management">
    <h1>Team Management</h1>
    
    <div class="team-management-grid">
      <div class="main-column">
        <team-list></team-list>
      </div>
      
      <div class="side-column">
        <team-balance-analyzer></team-balance-analyzer>
        <player-assignment></player-assignment>
      </div>
    </div>
  </div>
</template>

<script>
import TeamList from '@/components/admin/TeamList.vue';
import TeamBalanceAnalyzer from '@/components/admin/TeamBalanceAnalyzer.vue';
import PlayerAssignment from '@/components/admin/PlayerAssignment.vue';

export default {
  name: 'TeamManagement',
  components: {
    TeamList,
    TeamBalanceAnalyzer,
    PlayerAssignment
  }
};
</script>

<style scoped>
.team-management {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c3e50;
}

.team-management-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.main-column, .side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 992px) {
  .team-management-grid {
    grid-template-columns: 1fr;
  }
}
</style>

