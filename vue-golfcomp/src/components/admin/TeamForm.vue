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
      <label>Team Logo (Optional)</label>

      <div class="logo-tabs">
        <button type="button" :class="['logo-tab', { active: activeTab === 'preset' }]" @click="switchTab('preset')">Preset</button>
        <button type="button" :class="['logo-tab', { active: activeTab === 'upload' }]" @click="switchTab('upload')">Upload</button>
        <button type="button" :class="['logo-tab', { active: activeTab === 'url' }]" @click="switchTab('url')">URL</button>
      </div>

      <!-- Preset tab -->
      <div v-if="activeTab === 'preset'" class="logo-tab-content">
        <div class="preset-grid">
          <div
            v-for="preset in presets"
            :key="preset.id"
            :class="['preset-item', { selected: selectedPresetId === preset.id }]"
            :title="preset.label"
            @click="selectPreset(preset)"
            v-html="preset.svg"
          ></div>
        </div>
        <small class="form-text text-muted">Click an icon to use it as the team logo.</small>
      </div>

      <!-- Upload tab -->
      <div v-if="activeTab === 'upload'" class="logo-tab-content">
        <input
          type="file"
          accept="image/*"
          class="form-control"
          @change="handleFileUpload"
        >
        <small class="form-text text-muted">Image will be scaled to 60×60px.</small>
      </div>

      <!-- URL tab -->
      <div v-if="activeTab === 'url'" class="logo-tab-content">
        <input
          type="text"
          v-model="form.logoUrl"
          class="form-control"
          :class="{ 'is-invalid': errors.logoUrl }"
          placeholder="https://example.com/logo.png"
        >
        <div v-if="errors.logoUrl" class="invalid-feedback">{{ errors.logoUrl }}</div>
        <small class="form-text text-muted">Enter a URL to an image for the team logo.</small>
      </div>

      <!-- Preview -->
      <div class="logo-preview" v-if="form.logoUrl">
        <div class="logo-preview-wrap">
          <div class="logo-preview-image">
            <img :src="form.logoUrl" alt="Logo preview" @error="handleLogoError">
          </div>
          <button type="button" class="btn btn-secondary btn-sm" @click="clearLogo">Remove Logo</button>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel" :disabled="loading">Cancel</button>
      <button type="submit" class="btn" :disabled="loading">{{ team ? 'Update' : 'Add' }} Team</button>
    </div>
  </form>
</template>

<script>
import { presetLogos, svgToDataUri } from '@/assets/logos/presetLogos';

export default {
  name: 'TeamForm',
  props: {
    team: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        name: '',
        logoUrl: ''
      },
      errors: {},
      activeTab: 'preset',
      selectedPresetId: null,
      presets: presetLogos
    };
  },
  created() {
    this.initForm();
  },
  methods: {
    initForm() {
      if (this.team) {
        this.form = {
          id: this.team.id,
          name: this.team.name,
          logoUrl: this.team.logoUrl || ''
        };
      } else {
        this.form = {
          name: '',
          logoUrl: ''
        };
      }
      this.errors = {};
      this.detectAndSetTab(this.form.logoUrl);
    },
    detectAndSetTab(logoUrl) {
      if (!logoUrl) {
        this.activeTab = 'preset';
        this.selectedPresetId = null;
        return;
      }
      if (logoUrl.startsWith('data:image/svg+xml,')) {
        const match = presetLogos.find(p => svgToDataUri(p.svg) === logoUrl);
        if (match) {
          this.activeTab = 'preset';
          this.selectedPresetId = match.id;
          return;
        }
      }
      if (logoUrl.startsWith('data:')) {
        this.activeTab = 'upload';
        this.selectedPresetId = null;
        return;
      }
      this.activeTab = 'url';
      this.selectedPresetId = null;
    },
    switchTab(tab) {
      this.activeTab = tab;
      // Clear logo when switching tabs so stale values don't carry over
      if (tab === 'preset') {
        this.selectedPresetId = null;
        this.form.logoUrl = '';
      } else if (tab === 'upload') {
        this.selectedPresetId = null;
        this.form.logoUrl = '';
      } else if (tab === 'url') {
        this.selectedPresetId = null;
        this.form.logoUrl = '';
      }
      this.errors = {};
    },
    selectPreset(preset) {
      this.selectedPresetId = preset.id;
      this.form.logoUrl = svgToDataUri(preset.svg);
      this.errors = {};
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 60;
          canvas.height = 60;
          canvas.getContext('2d').drawImage(img, 0, 0, 60, 60);
          this.form.logoUrl = canvas.toDataURL('image/png');
          this.errors = {};
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    clearLogo() {
      this.form.logoUrl = '';
      this.selectedPresetId = null;
      this.errors = {};
    },
    validateForm() {
      const errors = {};

      if (!this.form.name || this.form.name.trim() === '') {
        errors.name = 'Team name is required';
      }

      if (this.activeTab === 'url' && this.form.logoUrl && !this.isValidUrl(this.form.logoUrl)) {
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
      if (this.activeTab === 'url') {
        this.errors.logoUrl = 'Unable to load image from URL';
      }
    },
    submitForm() {
      const validation = this.validateForm();
      if (!validation.isValid) {
        this.errors = validation.errors;
        return;
      }
      this.errors = {};
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
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: var(--danger-color);
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Logo tabs */
.logo-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 0;
}

.logo-tab {
  padding: 8px 18px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.logo-tab:hover {
  color: var(--text-color);
}

.logo-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 500;
}

.logo-tab-content {
  padding: 14px 0 8px;
}

/* Preset grid */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.preset-item {
  width: 60px;
  height: 60px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.1s;
  overflow: hidden;
  background-color: var(--card-bg);
}

.preset-item:hover {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.preset-item.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

/* Prevent SVG from intercepting clicks */
.preset-item :deep(svg) {
  pointer-events: none;
  display: block;
}

/* Logo preview */
.logo-preview {
  margin-top: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  background-color: var(--background-color);
}

.logo-preview-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-preview-image {
  width: 60px;
  height: 60px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--card-bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-preview-image img {
  width: 60px;
  height: 60px;
  object-fit: cover;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.85rem;
}
</style>
