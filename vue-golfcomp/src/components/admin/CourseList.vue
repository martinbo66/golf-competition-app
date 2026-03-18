<template>
  <div class="course-list">
    <div class="card">
      <div class="card-header">
        <h2>Courses</h2>
        <div class="card-actions">
          <button class="btn" @click="showAddForm = true">Add Course</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="courses.length === 0" class="empty-state">
          <p>No courses yet. Click "Add Course" to get started.</p>
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Facility</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course.id">
              <td>{{ course.name }}</td>
              <td>{{ course.facility || '—' }}</td>
              <td>{{ course.location || '—' }}</td>
              <td class="action-cell">
                <button class="icon-btn" title="Edit course" @click="editCourse(course)">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button
                  class="icon-btn icon-btn-danger"
                  :title="isCourseInUse(course.id) ? 'Course is assigned to a round' : 'Delete course'"
                  :disabled="isCourseInUse(course.id)"
                  @click="confirmDelete(course)"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <confirmation-dialog
      :show="showDeleteConfirmation"
      title="Delete Course"
      :message="`Are you sure you want to delete '${courseToDelete ? courseToDelete.name : ''}'? This cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :confirm-loading="isDeleting"
      loading-text="Deleting..."
      @confirm="deleteCourse"
      @cancel="cancelDelete"
    ></confirmation-dialog>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingCourse" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCourse ? 'Edit Course' : 'Add Course' }}</h3>
          <button class="close-btn" @click="closeForm">&times;</button>
        </div>
        <div class="modal-body">
          <course-form
            :course="editingCourse"
            :existing-names="existingNames"
            :loading="isSubmitting"
            @save="saveCourse"
            @cancel="closeForm"
          ></course-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCoursesStore } from '@/stores/courses';
import { getUserFriendlyErrorMessage } from '@/utils';
import NotificationService from '@/services/NotificationService';
import CourseForm from './CourseForm.vue';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog.vue';

const coursesStore = useCoursesStore();

const showAddForm = ref(false);
const editingCourse = ref(null);
const isSubmitting = ref(false);
const showDeleteConfirmation = ref(false);
const courseToDelete = ref(null);
const isDeleting = ref(false);

const courses = computed(() => coursesStore.availableCourses);

const existingNames = computed(() =>
  coursesStore.allCoursesCache.map(c => c.name)
);

const isCourseInUse = (courseId) =>
  coursesStore.rounds.some(r => r.course?.id === courseId);

const confirmDelete = (course) => {
  courseToDelete.value = course;
  showDeleteConfirmation.value = true;
};

const cancelDelete = () => {
  showDeleteConfirmation.value = false;
  courseToDelete.value = null;
};

const deleteCourse = async () => {
  if (!courseToDelete.value) return;
  isDeleting.value = true;
  try {
    await coursesStore.deleteCourse(courseToDelete.value.id);
    NotificationService.success(`Course "${courseToDelete.value.name}" deleted.`);
    cancelDelete();
  } catch (error) {
    NotificationService.error(error.status === 409
      ? error.message
      : getUserFriendlyErrorMessage(error));
  } finally {
    isDeleting.value = false;
  }
};

const editCourse = (course) => {
  editingCourse.value = { ...course };
  showAddForm.value = false;
};

const closeForm = () => {
  showAddForm.value = false;
  editingCourse.value = null;
};

const saveCourse = async (data) => {
  isSubmitting.value = true;
  try {
    if (editingCourse.value) {
      await coursesStore.updateCourse({ id: editingCourse.value.id, updates: data });
      NotificationService.success(`Course "${data.name}" updated successfully.`);
    } else {
      await coursesStore.createCourse(data);
      NotificationService.success(`Course "${data.name}" added successfully.`);
    }
    closeForm();
  } catch (error) {
    NotificationService.error(getUserFriendlyErrorMessage(error));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.course-list {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
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
  color: var(--text-color);
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
}

.modal-body {
  padding: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.close-btn:hover {
  color: var(--text-color);
}

.action-cell {
  white-space: nowrap;
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
</style>
