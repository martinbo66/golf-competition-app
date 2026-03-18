import { setActivePinia, createPinia } from 'pinia';
import NotificationService from '../src/services/NotificationService';
import { useUiStore } from '../src/stores/ui';

describe('NotificationService', () => {
    let uiStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        uiStore = useUiStore();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('success', () => {
        test('adds a success notification', () => {
            NotificationService.success('Saved!');
            expect(uiStore.notifications).toHaveLength(1);
            expect(uiStore.notifications[0]).toMatchObject({ type: 'success', message: 'Saved!' });
        });

        test('uses default timeout of 3000ms', () => {
            NotificationService.success('Done');
            jest.advanceTimersByTime(2999);
            expect(uiStore.notifications).toHaveLength(1);
            jest.advanceTimersByTime(1);
            expect(uiStore.notifications).toHaveLength(0);
        });

        test('accepts custom timeout', () => {
            NotificationService.success('Done', 1000);
            jest.advanceTimersByTime(1000);
            expect(uiStore.notifications).toHaveLength(0);
        });

        test('returns the notification id', () => {
            const id = NotificationService.success('OK');
            expect(typeof id).toBe('number');
        });
    });

    describe('error', () => {
        test('adds an error notification', () => {
            NotificationService.error('Something failed');
            expect(uiStore.notifications[0]).toMatchObject({ type: 'error', message: 'Something failed' });
        });

        test('uses default timeout of 5000ms', () => {
            NotificationService.error('Oops');
            jest.advanceTimersByTime(4999);
            expect(uiStore.notifications).toHaveLength(1);
            jest.advanceTimersByTime(1);
            expect(uiStore.notifications).toHaveLength(0);
        });
    });

    describe('warning', () => {
        test('adds a warning notification', () => {
            NotificationService.warning('Be careful');
            expect(uiStore.notifications[0]).toMatchObject({ type: 'warning', message: 'Be careful' });
        });

        test('uses default timeout of 4000ms', () => {
            NotificationService.warning('Watch out');
            jest.advanceTimersByTime(3999);
            expect(uiStore.notifications).toHaveLength(1);
            jest.advanceTimersByTime(1);
            expect(uiStore.notifications).toHaveLength(0);
        });
    });

    describe('info', () => {
        test('adds an info notification', () => {
            NotificationService.info('FYI');
            expect(uiStore.notifications[0]).toMatchObject({ type: 'info', message: 'FYI' });
        });

        test('uses default timeout of 3000ms', () => {
            NotificationService.info('Note');
            jest.advanceTimersByTime(3000);
            expect(uiStore.notifications).toHaveLength(0);
        });
    });

    describe('remove', () => {
        test('removes a notification by id', () => {
            const id = NotificationService.success('Temporary', 99999);
            expect(uiStore.notifications).toHaveLength(1);
            NotificationService.remove(id);
            expect(uiStore.notifications).toHaveLength(0);
        });
    });
});
