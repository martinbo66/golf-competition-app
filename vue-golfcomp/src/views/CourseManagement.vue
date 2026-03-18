<template>
  <div class="course-management">
    <h1>Course Management</h1>
    <course-list></course-list>
  </div>
</template>

<script setup>
import CourseList from '@/components/admin/CourseList.vue';
</script>

<style scoped>
.course-management {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--text-color);
}
</style>
