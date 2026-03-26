<template>
  <form @submit.prevent="submitForm" class="organization-form">
    <div class="form-group">
      <label for="org-name">Organization Name <span class="required">*</span></label>
      <input
        ref="nameInput"
        type="text"
        id="org-name"
        v-model="form.name"
        class="form-control"
        :class="{ 'is-invalid': errors.name }"
        placeholder="e.g. My Golf Club"
        maxlength="100"
        required
        @input="onNameInput"
      >
      <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
    </div>

    <div class="form-group">
      <label for="org-slug">URL Slug <span class="required">*</span></label>
      <input
        type="text"
        id="org-slug"
        v-model="form.slug"
        class="form-control"
        :class="{ 'is-invalid': errors.slug }"
        placeholder="e.g. my-golf-club"
        maxlength="100"
        @input="onSlugInput"
      >
      <div class="form-help">Lowercase letters, numbers, and hyphens only</div>
      <div v-if="errors.slug" class="invalid-feedback">{{ errors.slug }}</div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary">
        {{ organization ? 'Save Changes' : 'Create Organization' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  organization: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

const nameInput = ref(null);
const slugManuallyEdited = ref(false);

const form = ref({
  name: '',
  slug: ''
});

const errors = ref({});

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function onNameInput() {
  if (!slugManuallyEdited.value) {
    form.value.slug = generateSlug(form.value.name);
  }
}

function onSlugInput() {
  slugManuallyEdited.value = true;
}

function initForm() {
  if (props.organization) {
    form.value = {
      name: props.organization.name || '',
      slug: props.organization.slug || ''
    };
    slugManuallyEdited.value = true;
  } else {
    form.value = { name: '', slug: '' };
    slugManuallyEdited.value = false;
  }
  errors.value = {};
}

function validateForm() {
  const errs = {};

  if (!form.value.name || !form.value.name.trim()) {
    errs.name = 'Organization name is required';
  }

  if (!form.value.slug || !form.value.slug.trim()) {
    errs.slug = 'Slug is required';
  } else if (!/^[a-z0-9-]+$/.test(form.value.slug)) {
    errs.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
  }

  return { isValid: Object.keys(errs).length === 0, errors: errs };
}

function submitForm() {
  const { isValid, errors: errs } = validateForm();
  if (!isValid) {
    errors.value = errs;
    return;
  }
  errors.value = {};
  emit('submit', {
    name: form.value.name.trim(),
    slug: form.value.slug.trim()
  });
}

watch(() => props.organization, () => {
  initForm();
});

onMounted(() => {
  initForm();
  if (nameInput.value) {
    nameInput.value.focus();
  }
});
</script>

<style scoped>
.organization-form {
  width: 100%;
}

.required {
  color: var(--danger-color);
}

.form-help {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.invalid-feedback {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: var(--danger-color);
}
</style>
