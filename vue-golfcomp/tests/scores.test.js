import { setActivePinia, createPinia } from 'pinia';
import { useScoresStore } from '../src/stores/scores';

describe('Scores Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    test('updateScore should add a new score', () => {
        const scoresStore = useScoresStore();
        const scoreData = {
            playerId: 'player1',
            courseId: 'course1',
            value: 72
        };

        scoresStore.updateScore(scoreData);

        const score = scoresStore.scoreByPlayerAndCourse('player1', 'course1');
        expect(score).toBeDefined();
        expect(score.value).toBe(72);
        expect(scoresStore.allScores).toHaveLength(1);
    });

    test('updateScore should update an existing score', () => {
        const scoresStore = useScoresStore();
        const initialScore = {
            playerId: 'player1',
            courseId: 'course1',
            value: 72
        };

        scoresStore.updateScore(initialScore);

        const updatedScore = {
            playerId: 'player1',
            courseId: 'course1',
            value: 70
        };

        scoresStore.updateScore(updatedScore);

        const score = scoresStore.scoreByPlayerAndCourse('player1', 'course1');
        expect(score.value).toBe(70);
        expect(scoresStore.allScores).toHaveLength(1);
    });

    test('deleteScore should remove a score', () => {
        const scoresStore = useScoresStore();
        const scoreData = {
            playerId: 'player1',
            courseId: 'course1',
            value: 72
        };

        scoresStore.updateScore(scoreData);
        const score = scoresStore.scoreByPlayerAndCourse('player1', 'course1');

        scoresStore.deleteScore(score.id);

        expect(scoresStore.allScores).toHaveLength(0);
    });
});
