<template>
  <router-link to="/admin/competitions" class="competition-badge" :title="fullName">
    <span class="competition-badge__icon">🏆</span>
    <span class="competition-badge__name">{{ displayName }}</span>
  </router-link>
</template>

<script>
import { computed } from 'vue';
import { useCompetitionsStore } from '@/stores/competitions';

const MAX_NAME_LENGTH = 20;

export default {
  name: 'CompetitionBadge',

  setup() {
    const competitionsStore = useCompetitionsStore();

    const fullName = computed(() => {
      const comp = competitionsStore.activeCompetition;
      return comp ? comp.name : 'No Competition';
    });

    const displayName = computed(() => {
      const name = fullName.value;
      if (name.length <= MAX_NAME_LENGTH) return name;
      return name.slice(0, MAX_NAME_LENGTH - 3) + '...';
    });

    return { displayName, fullName };
  }
};
</script>

<style scoped>
.competition-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-right: 8px;
  background-color: var(--header-hover, rgba(255, 255, 255, 0.1));
  color: var(--header-text);
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
  max-width: 200px;
}

.competition-badge:hover {
  background-color: var(--header-active, rgba(255, 255, 255, 0.2));
}

.competition-badge__icon {
  flex-shrink: 0;
}

.competition-badge__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
