import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
    state: () => ({
        activeSection: 'administration',
        activeSidebarItem: 'players',
        isLoading: false,
        notifications: []
    }),

    getters: {
        // In Pinia, we can access state directly, so these getters are redundant but kept for compatibility if needed
        // or we can just use state properties directly in components
    },

    actions: {
        setActiveSection(section) {
            this.activeSection = section;
        },

        setActiveSidebarItem(item) {
            this.activeSidebarItem = item;
        },

        setLoading(isLoading) {
            this.isLoading = isLoading;
        },

        addNotification(notification) {
            const id = Date.now();
            this.notifications.push({ ...notification, id });

            // Auto-remove notifications after a delay
            setTimeout(() => {
                this.removeNotification(id);
            }, notification.timeout || 5000);

            return id;
        },

        removeNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }
});
