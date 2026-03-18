import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '../src/stores/ui';

describe('UI Store', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useUiStore();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('initial state', () => {
        test('has expected defaults', () => {
            expect(store.activeSection).toBe('administration');
            expect(store.activeSidebarItem).toBe('players');
            expect(store.isLoading).toBe(false);
            expect(store.notifications).toHaveLength(0);
        });
    });

    describe('setActiveSection', () => {
        test('updates activeSection', () => {
            store.setActiveSection('scoring');
            expect(store.activeSection).toBe('scoring');
        });
    });

    describe('setActiveSidebarItem', () => {
        test('updates activeSidebarItem', () => {
            store.setActiveSidebarItem('teams');
            expect(store.activeSidebarItem).toBe('teams');
        });
    });

    describe('setLoading', () => {
        test('sets isLoading to true', () => {
            store.setLoading(true);
            expect(store.isLoading).toBe(true);
        });

        test('sets isLoading to false', () => {
            store.isLoading = true;
            store.setLoading(false);
            expect(store.isLoading).toBe(false);
        });
    });

    describe('addNotification', () => {
        test('adds a notification with an id and returns the id', () => {
            const id = store.addNotification({ type: 'success', message: 'Done', timeout: 3000 });
            expect(typeof id).toBe('number');
            expect(store.notifications).toHaveLength(1);
            expect(store.notifications[0]).toMatchObject({ type: 'success', message: 'Done' });
            expect(store.notifications[0].id).toBe(id);
        });

        test('multiple notifications accumulate', () => {
            store.addNotification({ type: 'info', message: 'A', timeout: 3000 });
            store.addNotification({ type: 'error', message: 'B', timeout: 5000 });
            expect(store.notifications).toHaveLength(2);
        });

        test('auto-removes notification after specified timeout', () => {
            store.addNotification({ type: 'success', message: 'Auto-gone', timeout: 3000 });
            expect(store.notifications).toHaveLength(1);
            jest.advanceTimersByTime(3000);
            expect(store.notifications).toHaveLength(0);
        });

        test('uses default timeout of 5000ms when not specified', () => {
            store.addNotification({ type: 'error', message: 'Default timeout' });
            jest.advanceTimersByTime(4999);
            expect(store.notifications).toHaveLength(1);
            jest.advanceTimersByTime(1);
            expect(store.notifications).toHaveLength(0);
        });

        test('each notification has its own timer', () => {
            // Advance system time between calls so Date.now() produces unique ids
            jest.setSystemTime(1000);
            store.addNotification({ type: 'success', message: 'Short', timeout: 1000 });
            jest.setSystemTime(2000);
            store.addNotification({ type: 'error',   message: 'Long',  timeout: 5000 });
            jest.advanceTimersByTime(1000);
            expect(store.notifications).toHaveLength(1);
            expect(store.notifications[0].message).toBe('Long');
        });
    });

    describe('removeNotification', () => {
        test('removes notification by id', () => {
            const id = store.addNotification({ type: 'info', message: 'Remove me', timeout: 9999 });
            store.removeNotification(id);
            expect(store.notifications).toHaveLength(0);
        });

        test('leaves other notifications intact', () => {
            jest.setSystemTime(1000);
            const id1 = store.addNotification({ type: 'info',    message: 'Keep',   timeout: 9999 });
            jest.setSystemTime(2000);
            const id2 = store.addNotification({ type: 'success', message: 'Remove', timeout: 9999 });
            store.removeNotification(id2);
            expect(store.notifications).toHaveLength(1);
            expect(store.notifications[0].id).toBe(id1);
        });

        test('does nothing for unknown id', () => {
            store.addNotification({ type: 'info', message: 'Here', timeout: 9999 });
            store.removeNotification(999999);
            expect(store.notifications).toHaveLength(1);
        });
    });
});
