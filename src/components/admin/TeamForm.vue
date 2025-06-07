<template>
  <form @submit.prevent="submitForm" class="team-form">
    <div class="form-group">
      <label for="name">Team Name</label>
      <input 
        type="text" 
        id="name" 
        v-model="form.name" 
        class="form-control" 
        :class="{ 'is-invalid': errors.name }"
        required
      >
      <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
    </div>
    
    <div class="form-group">
      <label for="logoUrl">Team Logo URL (Optional)</label>
      <input 
        type="text" 
        id="logoUrl" 
        v-model="form.logoUrl" 
        class="form-control"
        :class="{ 'is-invalid': errors.logoUrl }"
        placeholder="https://example.com/logo.png"
      >
      <div v-if="errors.logoUrl" class="invalid-feedback">{{ errors.logoUrl }}</div>
      <small class="form-text text-muted">
        Enter a URL to an image for the team logo. Leave blank for no logo.
      </small>
    </div>
    
    <div class="logo-preview" v-if="form.logoUrl">
      <h4>Logo Preview</h4>
      <div class="logo-image">
        <img :src="form.logoUrl" alt="Team logo preview" @error="handleLogoError">
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
      <button type="submit" class="btn">{{ team ? 'Update' : 'Add' }} Team</button>
    </div>
  </form>
</template>

<script>
export default {
  name: 'TeamForm',
  props: {
    team: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: {
        name: '',
        logoUrl: ''
      },
      errors: {}
    };
  },
  created() {
    this.initForm();
  },
  methods: {
    initForm() {
      if (this.team) {
        // Edit mode - populate form with team data
        this.form = {
          id: this.team.id,
          name: this.team.name,
          logoUrl: this.team.logoUrl || ''
        };
      } else {
        // Add mode - reset form
        this.form = {
          name: '',
          logoUrl: ''
        };
      }
      this.errors = {};
    },
    validateForm() {
      const errors = {};
      
      if (!this.form.name || this.form.name.trim() === '') {
        errors.name = 'Team name is required';
      }
      
      if (this.form.logoUrl && !this.isValidUrl(this.form.logoUrl)) {
        errors.logoUrl = 'Please enter a valid URL';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    },
    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },
    handleLogoError() {
      this.errors.logoUrl = 'Unable to load image from URL';
    },
    submitForm() {
      // Validate form
      const validation = this.validateForm();
      
      if (!validation.isValid) {
        this.errors = validation.errors;
        return;
      }
      
      // Clear errors
      this.errors = {};
      
      // Emit save event with form data
      this.$emit('save', { ...this.form });
    },
    cancel() {
      this.$emit('cancel');
    }
  },
  watch: {
    team() {
      this.initForm();
    }
  }
};
</script>

<style scoped>
.team-form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  margin-left: 10px;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #dc3545;
}

.logo-preview {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.logo-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 500;
}

.logo-image {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.logo-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
  color: #6c757d;
}
</style>

