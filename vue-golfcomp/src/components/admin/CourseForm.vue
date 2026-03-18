<template>
  <form @submit.prevent="submitForm" class="course-form">
    <div class="form-group">
      <label for="name" class="form-label">Name <span class="required">*</span></label>
      <input
        type="text"
        id="name"
        v-model="form.name"
        class="form-control"
        :class="{ 'is-invalid': errors.name }"
        maxlength="100"
        placeholder="e.g. Parkland"
        required
      >
      <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
    </div>

    <div class="form-group">
      <label for="facility" class="form-label">Facility</label>
      <input
        type="text"
        id="facility"
        v-model="form.facility"
        class="form-control"
        maxlength="255"
        placeholder="Club or venue name"
      >
    </div>

    <div class="form-group">
      <label for="location" class="form-label">Location</label>
      <input
        type="text"
        id="location"
        v-model="form.location"
        class="form-control"
        maxlength="255"
        placeholder="City, region, or address"
      >
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="loading">Cancel</button>
      <button type="submit" class="btn" :disabled="loading">{{ course ? 'Update' : 'Add' }} Course</button>
    </div>
  </form>
</template>

<script>
export default {
  name: 'CourseForm',
  props: {
    course: {
      type: Object,
      default: null
    },
    existingNames: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'cancel'],
  data() {
    return {
      form: { name: '', facility: '', location: '' },
      errors: {}
    };
  },
  created() {
    this.initForm();
  },
  watch: {
    course() {
      this.initForm();
    }
  },
  methods: {
    initForm() {
      if (this.course) {
        this.form = {
          name: this.course.name || '',
          facility: this.course.facility || '',
          location: this.course.location || ''
        };
      } else {
        this.form = { name: '', facility: '', location: '' };
      }
      this.errors = {};
    },
    submitForm() {
      this.errors = {};
      const name = this.form.name.trim();

      if (!name) {
        this.errors.name = 'Course name is required.';
        return;
      }
      if (name.length > 100) {
        this.errors.name = 'Course name must be 100 characters or fewer.';
        return;
      }

      const duplicate = this.existingNames.find(
        n => n.toLowerCase() === name.toLowerCase() && n !== this.course?.name
      );
      if (duplicate) {
        this.errors.name = 'A course with this name already exists.';
        return;
      }

      this.$emit('save', {
        name,
        facility: this.form.facility.trim() || null,
        location: this.form.location.trim() || null
      });
    }
  }
};
</script>

<style scoped>
.course-form {
  width: 100%;
}

.required {
  color: var(--danger-color, #dc3545);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.invalid-feedback {
  color: var(--danger-color, #dc3545);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: var(--danger-color, #dc3545);
}
</style>
