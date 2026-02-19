jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
        scoresUrl: jest.fn((roundId) => `/competitions/c1/rounds/${roundId}/scores`)
    }
}));

const mockRoundIdByCourseId = jest.fn();
jest.mock('@/stores/courses', () => ({
    useCoursesStore: () => ({
        allCourses: [
            { id: 'course1', name: 'Parkland', roundId: 'round1' },
            { id: 'course2', name: 'Heathland', roundId: 'round2' }
        ],
        roundIdByCourseId: mockRoundIdByCourseId
    })
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useScoresStore } from '../src/stores/scores';

describe('Scores Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.get.mockReset();
        ApiService.put.mockReset();
        mockRoundIdByCourseId.mockImplementation((courseId) => (courseId === 'course1' ? 'round1' : courseId === 'course2' ? 'round2' : null));
    });

    test('updateScore maps courseId to roundId and updates local state', async () => {
        const scoresStore = useScoresStore();
        const apiScore = {
            id: 'score-1',
            playerId: 'player1',
            value: 72,
            updatedAt: '2026-01-01T12:00:00Z',
            createdAt: '2026-01-01T12:00:00Z'
        };
        ApiService.put.mockResolvedValue(apiScore);

        await scoresStore.updateScore({ playerId: 'player1', courseId: 'course1', value: 72 });

        expect(mockRoundIdByCourseId).toHaveBeenCalledWith('course1');
        expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1/rounds/round1/scores', { playerId: 'player1', value: 72 });
        const score = scoresStore.scoreByPlayerAndCourse('player1', 'course1');
        expect(score).toBeDefined();
        expect(score.value).toBe(72);
        expect(scoresStore.allScores).toHaveLength(1);
    });

    test('updateScore updates existing score in state after API success', async () => {
        const scoresStore = useScoresStore();
        scoresStore.scores = [
            { id: 'old', playerId: 'player1', courseId: 'course1', value: 70, timestamp: '' }
        ];
        ApiService.put.mockResolvedValue({
            id: 'old',
            playerId: 'player1',
            value: 75,
            updatedAt: '2026-01-01',
            createdAt: '2026-01-01'
        });

        await scoresStore.updateScore({ playerId: 'player1', courseId: 'course1', value: 75 });

        expect(scoresStore.allScores).toHaveLength(1);
        expect(scoresStore.scoreByPlayerAndCourse('player1', 'course1').value).toBe(75);
    });

    test('updateScore throws when no round for course', async () => {
        const scoresStore = useScoresStore();
        mockRoundIdByCourseId.mockReturnValue(null);

        await expect(
            scoresStore.updateScore({ playerId: 'p1', courseId: 'unknown-course', value: 72 })
        ).rejects.toThrow('No round found for course');
    });

    test('deleteScore removes from local state only', () => {
        const scoresStore = useScoresStore();
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', courseId: 'course1', value: 72, timestamp: '' }
        ];

        scoresStore.deleteScore('s1');

        expect(scoresStore.allScores).toHaveLength(0);
    });

    test('fetchScores fetches from all rounds and maps to courseId', async () => {
        const scoresStore = useScoresStore();
        ApiService.get
            .mockResolvedValueOnce([{ id: 's1', playerId: 'p1', value: 72, updatedAt: '', createdAt: '' }])
            .mockResolvedValueOnce([{ id: 's2', playerId: 'p1', value: 74, updatedAt: '', createdAt: '' }]);

        await scoresStore.fetchScores();

        expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/rounds/round1/scores');
        expect(ApiService.get).toHaveBeenCalledWith('/competitions/c1/rounds/round2/scores');
        expect(scoresStore.scores).toHaveLength(2);
        expect(scoresStore.scores[0]).toMatchObject({ playerId: 'p1', courseId: 'course1', value: 72 });
        expect(scoresStore.scores[1]).toMatchObject({ playerId: 'p1', courseId: 'course2', value: 74 });
    });
});
