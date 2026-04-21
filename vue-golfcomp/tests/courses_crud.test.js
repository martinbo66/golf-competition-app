/**
 * Tests for courses store CRUD actions and the allCoursesCache fallback branch.
 * Basic getters and fetchCourses (round-based) are covered in courses.test.js.
 */
jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        roundsUrl: jest.fn(() => '/competitions/c1/rounds'),
        coursesUrl: jest.fn(id => id ? `/courses/${id}` : '/courses')
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCoursesStore } from '@/stores/courses';

const makeCourse = (overrides = {}) => ({
    id: 'course-1',
    name: 'Parkland',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides
});

describe('Courses Store - CRUD actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.get.mockReset();
        ApiService.post.mockReset();
        ApiService.put.mockReset();
        ApiService.delete.mockReset();
    });

    describe('fetchAllCourses', () => {
        test('fetches and stores all courses in cache', async () => {
            const store = useCoursesStore();
            ApiService.get.mockResolvedValue([makeCourse(), makeCourse({ id: 'course-2', name: 'Heathland' })]);

            await store.fetchAllCourses();

            expect(ApiService.get).toHaveBeenCalledWith('/courses');
            expect(store.allCoursesCache).toHaveLength(2);
        });

        test('handles null response', async () => {
            const store = useCoursesStore();
            ApiService.get.mockResolvedValue(null);

            await store.fetchAllCourses();

            expect(store.allCoursesCache).toHaveLength(0);
        });

        test('availableCourses returns cache sorted alphabetically', async () => {
            const store = useCoursesStore();
            ApiService.get.mockResolvedValue([
                makeCourse({ id: 'c1', name: 'Moorland' }),
                makeCourse({ id: 'c2', name: 'Heathland' }),
                makeCourse({ id: 'c3', name: 'Parkland' })
            ]);

            await store.fetchAllCourses();

            const sorted = store.availableCourses;
            expect(sorted[0].name).toBe('Heathland');
            expect(sorted[1].name).toBe('Moorland');
            expect(sorted[2].name).toBe('Parkland');
        });
    });

    describe('createCourse', () => {
        test('POSTs and adds course to cache', async () => {
            const store = useCoursesStore();
            const created = makeCourse({ id: 'new-course', name: 'New Links' });
            ApiService.post.mockResolvedValue(created);

            const result = await store.createCourse({ name: 'New Links' });

            expect(ApiService.post).toHaveBeenCalledWith('/courses', { name: 'New Links' });
            expect(store.allCoursesCache).toHaveLength(1);
            expect(result.id).toBe('new-course');
        });
    });

    describe('updateCourse', () => {
        test('PUTs and updates course in cache', async () => {
            const store = useCoursesStore();
            store.allCoursesCache = [makeCourse({ id: 'c1', name: 'Old Name' })];
            const updated = makeCourse({ id: 'c1', name: 'New Name' });
            ApiService.put.mockResolvedValue(updated);

            const result = await store.updateCourse({ id: 'c1', updates: { name: 'New Name' } });

            expect(ApiService.put).toHaveBeenCalledWith('/courses/c1', { name: 'New Name' });
            expect(store.allCoursesCache[0].name).toBe('New Name');
            expect(result.name).toBe('New Name');
        });

        test('does not crash when course not in cache', async () => {
            const store = useCoursesStore();
            store.allCoursesCache = [];
            ApiService.put.mockResolvedValue(makeCourse({ id: 'c1' }));

            await store.updateCourse({ id: 'c1', updates: { name: 'X' } });

            // No crash, cache still empty (course wasn't in it)
            expect(store.allCoursesCache).toHaveLength(0);
        });
    });

    describe('deleteCourse', () => {
        test('DELETEs and removes course from cache', async () => {
            const store = useCoursesStore();
            store.allCoursesCache = [makeCourse({ id: 'c1' }), makeCourse({ id: 'c2', name: 'Heathland' })];
            ApiService.delete.mockResolvedValue(undefined);

            await store.deleteCourse('c1');

            expect(ApiService.delete).toHaveBeenCalledWith('/courses/c1');
            expect(store.allCoursesCache).toHaveLength(1);
            expect(store.allCoursesCache[0].id).toBe('c2');
        });

        test('throws user-friendly error on 409 conflict', async () => {
            const store = useCoursesStore();
            const err = new Error('Conflict');
            err.status = 409;
            ApiService.delete.mockRejectedValue(err);

            await expect(store.deleteCourse('c1')).rejects.toThrow(
                'This course is used by one or more rounds and cannot be deleted.'
            );
        });

        test('re-throws non-409 errors unchanged', async () => {
            const store = useCoursesStore();
            ApiService.delete.mockRejectedValue(new Error('Server error'));

            await expect(store.deleteCourse('c1')).rejects.toThrow('Server error');
        });
    });

    describe('clearForCompetition', () => {
        test('resets courses to fallbacks and clears rounds and loaded flag', async () => {
            const store = useCoursesStore();
            // Simulate a loaded state
            store.loaded = true;
            store.rounds = [{ id: 'r1' }];
            store.courses = [{ id: 'custom', name: 'Custom', order: 1, roundId: 'r1' }];

            store.clearForCompetition();

            expect(store.courses).toHaveLength(4);
            expect(store.courses[0].name).toBe('Parkland');
            expect(store.courses.every(c => c.roundId === null)).toBe(true);
            expect(store.rounds).toHaveLength(0);
            expect(store.loaded).toBe(false);
        });
    });

    describe('fetchCourses - allCoursesCache fallback', () => {
        test('uses allCoursesCache when API returns no rounds and cache is populated', async () => {
            const store = useCoursesStore();
            store.allCoursesCache = [
                { id: 'ac1', name: 'Heathland' },
                { id: 'ac2', name: 'Moorland' }
            ];
            ApiService.get.mockResolvedValue([]);

            await store.fetchCourses();

            expect(store.courses).toHaveLength(2);
            expect(store.courses[0].roundId).toBeNull();
            expect(store.courses[0].name).toBe('Heathland');
        });

        test('falls back to hardcoded courses when API returns no rounds and cache is empty', async () => {
            const store = useCoursesStore();
            store.allCoursesCache = [];
            ApiService.get.mockResolvedValue([]);

            await store.fetchCourses();

            expect(store.courses).toHaveLength(4);
            expect(store.courses[0].name).toBe('Parkland');
        });
    });
});
