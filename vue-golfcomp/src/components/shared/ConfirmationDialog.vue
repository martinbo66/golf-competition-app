<template>
  <div v-if="show" class="confirmation-dialog-overlay">
    <div class="confirmation-dialog">
      <div class="confirmation-dialog-header">
        <h3>{{ title }}</h3>
      </div>
      <div class="confirmation-dialog-body">
        <p>{{ message }}</p>
      </div>
      <div class="confirmation-dialog-footer">
        <button 
          class="btn btn-secondary" 
          @click="cancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="btn" 
          :class="confirmButtonClass" 
          @click="confirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed?'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    type: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'danger', 'warning'].includes(value)
    }
  },
  computed: {
    confirmButtonClass() {
      return {
        'btn-danger': this.type === 'danger',
        'btn-warning': this.type === 'warning'
      };
    }
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.confirmation-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirmation-dialog {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90%;
  overflow: hidden;
}

.confirmation-dialog-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.confirmation-dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.confirmation-dialog-body {
  padding: 20px;
}

.confirmation-dialog-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.confirmation-dialog-footer button {
  margin-left: 10px;
}
</style>

