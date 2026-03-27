jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        roundsUrl: jest.fn(() => '/competitions/comp-1/rounds')
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCoursesStore } from '../src/stores/courses';

describe('Courses Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.get.mockReset();
    });

    test('fallback courses are available before fetchCourses is called', () => {
        const store = useCoursesStore();
        expect(store.courses).toHaveLength(4);
        expect(store.courses[0]).toMatchObject({
            name: 'Parkland',
            order: 1,
            roundId: null
        });
        expect(store.loaded).toBe(false);
    });

    test('allCourses getter returns courses', () => {
        const store = useCoursesStore();
        expect(store.allCourses).toHaveLength(4);
    });

    test('courseById returns course when found', () => {
        const store = useCoursesStore();
        const id = store.courses[0].id;
        expect(store.courseById(id)).toMatchObject({ name: 'Parkland' });
    });

    test('courseByName returns course when found', () => {
        const store = useCoursesStore();
        expect(store.courseByName('Parkland')).toMatchObject({ order: 1 });
    });

    test('coursesSorted returns courses sorted by order', () => {
        const store = useCoursesStore();
        const sorted = store.coursesSorted;
        expect(sorted[0].order).toBe(1);
        expect(sorted[3].order).toBe(4);
    });

    test('roundIdByCourseId returns null when roundId not set', () => {
        const store = useCoursesStore();
        expect(store.roundIdByCourseId(store.courses[0].id)).toBeNull();
    });

    test('courseIdByRoundId returns null when no course has roundId', () => {
        const store = useCoursesStore();
        expect(store.courseIdByRoundId('some-round-id')).toBeNull();
    });

    test('fetchCourses populates courses from API round data', async () => {
        const store = useCoursesStore();
        const rounds = [
            {
                id: 'round-1',
                course: { id: 'course-1', name: 'Parkland' },
                roundNumber: 1
            },
            {
                id: 'round-2',
                course: { id: 'course-2', name: 'Heathland' },
                roundNumber: 2
            }
        ];
        ApiService.get.mockResolvedValue(rounds);

        await store.fetchCourses();

        expect(ApiService.get).toHaveBeenCalledWith('/competitions/comp-1/rounds');
        expect(store.courses).toHaveLength(2);
        expect(store.courses[0]).toEqual({
            id: 'course-1',
            name: 'Parkland',
            order: 1,
            roundId: 'round-1',
            playDate: null
        });
        expect(store.rounds).toEqual(rounds);
        expect(store.loaded).toBe(true);
    });

    test('fetchCourses keeps fallback on API failure', async () => {
        const store = useCoursesStore();
        ApiService.get.mockRejectedValue(new Error('Network error'));

        await store.fetchCourses();

        expect(store.courses).toHaveLength(4);
        expect(store.courses[0].roundId).toBeNull();
        expect(store.loaded).toBe(true);
    });

    test('roundIdByCourseId returns correct roundId after fetch', async () => {
        const store = useCoursesStore();
        ApiService.get.mockResolvedValue([
            { id: 'r1', course: { id: 'c1', name: 'P' }, roundNumber: 1 }
        ]);
        await store.fetchCourses();
        expect(store.roundIdByCourseId('c1')).toBe('r1');
    });

    test('courseIdByRoundId returns correct courseId after fetch', async () => {
        const store = useCoursesStore();
        ApiService.get.mockResolvedValue([
            { id: 'r1', course: { id: 'c1', name: 'P' }, roundNumber: 1 }
        ]);
        await store.fetchCourses();
        expect(store.courseIdByRoundId('r1')).toBe('c1');
    });
});
