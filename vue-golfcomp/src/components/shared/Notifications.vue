<template>
  <div class="notifications-container">
    <transition-group name="notification">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <i :class="getIconClass(notification.type)"></i>
          </div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-close" @click.stop="removeNotification(notification.id)">×</div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';

const uiStore = useUiStore();

const notifications = computed(() => uiStore.notifications);

const removeNotification = (id) => {
  uiStore.removeNotification(id);
};

const getIconClass = (type) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  return icons[type] || icons.info;
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 360px;
}

.notification {
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-success {
  background-color: #dff0d8;
  color: #3c763d;
  border-left: 4px solid #3c763d;
}

.notification-error {
  background-color: #f2dede;
  color: #a94442;
  border-left: 4px solid #a94442;
}

.notification-warning {
  background-color: #fcf8e3;
  color: #8a6d3b;
  border-left: 4px solid #8a6d3b;
}

.notification-info {
  background-color: #d9edf7;
  color: #31708f;
  border-left: 4px solid #31708f;
}

/* Dark mode overrides */
body.dark-mode .notification-success {
  background-color: rgba(46, 204, 113, 0.15);
  color: var(--success-color);
  border-left-color: var(--success-color);
}

body.dark-mode .notification-error {
  background-color: rgba(231, 76, 60, 0.15);
  color: var(--danger-color);
  border-left-color: var(--danger-color);
}

body.dark-mode .notification-warning {
  background-color: rgba(241, 196, 15, 0.15);
  color: var(--warning-color);
  border-left-color: var(--warning-color);
}

body.dark-mode .notification-info {
  background-color: rgba(52, 152, 219, 0.15);
  color: var(--info-color);
  border-left-color: var(--info-color);
}

.notification-content {
  display: flex;
  align-items: center;
}

.notification-icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.notification-message {
  flex: 1;
}

.notification-close {
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0 5px;
}

.notification-close:hover {
  opacity: 0.7;
}

/* Transition animations */
.notification-enter-active, .notification-leave-active {
  transition: all 0.3s;
}

.notification-enter, .notification-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

