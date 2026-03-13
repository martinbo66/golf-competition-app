<template>
  <form @submit.prevent="submitForm" class="competition-form">
    <div class="form-group">
      <label for="comp-name">Competition Name <span class="required">*</span></label>
      <input
        type="text"
        id="comp-name"
        v-model="form.name"
        class="form-control"
        :class="{ 'is-invalid': errors.name }"
        placeholder="e.g. Summer Cup 2026"
        required
      >
      <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="comp-start">Start Date</label>
        <input
          type="date"
          id="comp-start"
          v-model="form.startDate"
          class="form-control"
          :class="{ 'is-invalid': errors.startDate }"
        >
        <div v-if="errors.startDate" class="invalid-feedback">{{ errors.startDate }}</div>
      </div>

      <div class="form-group">
        <label for="comp-end">End Date</label>
        <input
          type="date"
          id="comp-end"
          v-model="form.endDate"
          class="form-control"
          :class="{ 'is-invalid': errors.endDate }"
        >
        <div v-if="errors.endDate" class="invalid-feedback">{{ errors.endDate }}</div>
      </div>
    </div>

    <div class="form-group">
      <label for="comp-location">Location</label>
      <input
        type="text"
        id="comp-location"
        v-model="form.location"
        class="form-control"
        placeholder="e.g. Moorland Golf Club"
      >
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="loading">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ competition ? 'Save Changes' : 'Create Competition' }}
      </button>
    </div>
  </form>
</template>

<script>
export default {
  name: 'CompetitionForm',

  props: {
    competition: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['save', 'cancel'],

  data() {
    return {
      form: {
        name: '',
        startDate: '',
        endDate: '',
        location: ''
      },
      errors: {}
    };
  },

  created() {
    this.initForm();
  },

  watch: {
    competition() {
      this.initForm();
    },
    'form.startDate'(newVal) {
      if (newVal && !this.form.endDate) {
        this.form.endDate = newVal;
      }
    }
  },

  methods: {
    initForm() {
      if (this.competition) {
        this.form = {
          name: this.competition.name,
          startDate: this.competition.startDate || '',
          endDate: this.competition.endDate || '',
          location: this.competition.location || ''
        };
      } else {
        this.form = { name: '', startDate: '', endDate: '', location: '' };
      }
      this.errors = {};
    },

    validateForm() {
      const errors = {};

      if (!this.form.name || !this.form.name.trim()) {
        errors.name = 'Competition name is required';
      }

      if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
        errors.endDate = 'End date must be on or after start date';
      }

      return { isValid: Object.keys(errors).length === 0, errors };
    },

    submitForm() {
      const { isValid, errors } = this.validateForm();
      if (!isValid) {
        this.errors = errors;
        return;
      }
      this.errors = {};
      this.$emit('save', {
        name: this.form.name.trim(),
        startDate: this.form.startDate || null,
        endDate: this.form.endDate || null,
        location: this.form.location.trim() || null
      });
    }
  }
};
</script>

<style scoped>
.competition-form {
  width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.required {
  color: #dc3545;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #dc3545;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
