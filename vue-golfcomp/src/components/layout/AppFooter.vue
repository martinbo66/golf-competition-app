<template>
  <footer class="app-footer">
    <div class="app-info">
      <span class="app-name">Golf Competition App</span>
      <span class="separator">·</span>
      <span class="version">Version 1.1.0</span>
      <span class="separator">·</span>
      <span class="updated-date">Updated: {{ buildDate }}</span>
    </div>
  </footer>
</template>

<script setup>
/* global __BUILD_DATE__ */
const buildDate = __BUILD_DATE__;
</script>

<style scoped>
.app-footer {
  text-align: center;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--background-color);
}

.app-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.app-name {
  font-weight: 500;
  color: var(--primary-color);
}

.separator {
  opacity: 0.5;
}

.updated-date {
  font-style: italic;
  opacity: 0.8;
}
</style>
