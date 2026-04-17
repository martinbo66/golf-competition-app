/**
 * Tests for scores store getters — leaderboards, money, courseScoresByTeam,
 * and the local-only delete actions.
 */

jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
        scoresUrl: jest.fn((roundId) => `/competitions/c1/rounds/${roundId}/scores`)
    }
}));

jest.mock('@/stores/courses', () => ({
    useCoursesStore: () => ({
        allCourses: [
            { id: 'course1', name: 'Parkland', roundId: 'round1' },
            { id: 'course2', name: 'Heathland', roundId: 'round2' }
        ],
        roundIdByCourseId: jest.fn()
    })
}));

import { setActivePinia, createPinia } from 'pinia';
import { useScoresStore } from '../src/stores/scores';
import { usePlayersStore } from '../src/stores/players';
import { useTeamsStore } from '../src/stores/teams';

const TEAMS = [
    { id: 't1', name: 'Eagles', logoUrl: null, createdAt: '', updatedAt: '' },
    { id: 't2', name: 'Tigers', logoUrl: null, createdAt: '', updatedAt: '' }
];

const PLAYERS = [
    { id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 200, teamId: 't1', teamName: 'Eagles', createdAt: '', updatedAt: '' },
    { id: 'p2', name: 'Bob',   talentRating: 'B', entryFee: 50,  winnings: 0,   teamId: 't1', teamName: 'Eagles', createdAt: '', updatedAt: '' },
    { id: 'p3', name: 'Carol', talentRating: 'C', entryFee: 75,  winnings: 150, teamId: 't2', teamName: 'Tigers', createdAt: '', updatedAt: '' }
];

// p1: Parkland=70, Heathland=72  (total 142)
// p2: Parkland=68                (total 68)
// p3: Parkland=75                (total 75)
const SCORES = [
    { id: 's1', playerId: 'p1', courseId: 'course1', roundId: 'round1', value: 70, timestamp: '' },
    { id: 's2', playerId: 'p1', courseId: 'course2', roundId: 'round2', value: 72, timestamp: '' },
    { id: 's3', playerId: 'p2', courseId: 'course1', roundId: 'round1', value: 68, timestamp: '' },
    { id: 's4', playerId: 'p3', courseId: 'course1', roundId: 'round1', value: 75, timestamp: '' }
];

describe('Scores Store - Getters', () => {
    let scoresStore, playersStore, teamsStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        scoresStore = useScoresStore();
        playersStore = usePlayersStore();
        teamsStore = useTeamsStore();

        scoresStore.scores = [...SCORES];
        playersStore.players = [...PLAYERS];
        teamsStore.teams = [...TEAMS];
    });

    describe('basic getters', () => {
        test('allScores returns all scores', () => {
            expect(scoresStore.allScores).toHaveLength(4);
        });

        test('scoresByPlayer filters by playerId', () => {
            const p1Scores = scoresStore.scoresByPlayer('p1');
            expect(p1Scores).toHaveLength(2);
            expect(p1Scores.every(s => s.playerId === 'p1')).toBe(true);
        });

        test('scoresByPlayer returns empty array for unknown player', () => {
            expect(scoresStore.scoresByPlayer('nobody')).toHaveLength(0);
        });

        test('scoresByCourse filters by courseId', () => {
            expect(scoresStore.scoresByCourse('course1')).toHaveLength(3);
            expect(scoresStore.scoresByCourse('course2')).toHaveLength(1);
        });

        test('scoreByPlayerAndCourse finds exact match', () => {
            const score = scoresStore.scoreByPlayerAndCourse('p1', 'course1');
            expect(score).toBeDefined();
            expect(score.value).toBe(70);
        });

        test('scoreByPlayerAndCourse returns undefined when not found', () => {
            expect(scoresStore.scoreByPlayerAndCourse('p1', 'unknown')).toBeUndefined();
        });

        test('playerTotalScore sums all scores for a player', () => {
            expect(scoresStore.playerTotalScore('p1')).toBe(142);
            expect(scoresStore.playerTotalScore('p2')).toBe(68);
            expect(scoresStore.playerTotalScore('p3')).toBe(75);
        });

        test('playerTotalScore returns 0 for player with no scores', () => {
            expect(scoresStore.playerTotalScore('nobody')).toBe(0);
        });
    });

    describe('teamTotalScore', () => {
        test('sums scores for all players in a team', () => {
            // Eagles: Alice (70+72) + Bob (68) = 210
            expect(scoresStore.teamTotalScore('t1')).toBe(210);
            // Tigers: Carol (75) = 75
            expect(scoresStore.teamTotalScore('t2')).toBe(75);
        });

        test('returns 0 for unknown team', () => {
            expect(scoresStore.teamTotalScore('nobody')).toBe(0);
        });
    });

    describe('playerLeaderboard', () => {
        test('returns one entry per player with course scores and total', () => {
            const lb = scoresStore.playerLeaderboard;
            expect(lb).toHaveLength(3);

            const alice = lb.find(e => e.id === 'p1');
            expect(alice.totalScore).toBe(142);
            expect(alice.courseScores['round1']).toBe(70);
            expect(alice.courseScores['round2']).toBe(72);
            expect(alice.teamName).toBe('Eagles');
            expect(alice.talentRating).toBe('A');
        });

        test('uses null for missing course scores', () => {
            const lb = scoresStore.playerLeaderboard;
            const carol = lb.find(e => e.id === 'p3');
            expect(carol.courseScores['round2']).toBeNull();
        });

        test('is sorted by total score descending', () => {
            const lb = scoresStore.playerLeaderboard;
            expect(lb[0].id).toBe('p1'); // 142
            expect(lb[1].id).toBe('p3'); // 75
            expect(lb[2].id).toBe('p2'); // 68
        });

        test('uses null teamName when player has no team', () => {
            playersStore.players = playersStore.players.map(p =>
                p.id === 'p1' ? { ...p, teamId: null } : p
            );
            const lb = scoresStore.playerLeaderboard;
            const alice = lb.find(e => e.id === 'p1');
            expect(alice.teamName).toBeNull();
        });

        test('returns empty array when no players', () => {
            playersStore.players = [];
            expect(scoresStore.playerLeaderboard).toHaveLength(0);
        });
    });

    describe('teamLeaderboard', () => {
        test('returns one entry per team with course totals', () => {
            const lb = scoresStore.teamLeaderboard;
            expect(lb).toHaveLength(2);

            const eagles = lb.find(e => e.id === 't1');
            expect(eagles.totalScore).toBe(210);
            expect(eagles.courseScores['round1']).toBe(138); // 70 + 68
            expect(eagles.courseScores['round2']).toBe(72);
            expect(eagles.playerCount).toBe(2);
        });

        test('is sorted by total score descending', () => {
            const lb = scoresStore.teamLeaderboard;
            expect(lb[0].id).toBe('t1'); // 210
            expect(lb[1].id).toBe('t2'); // 75
        });

        test('returns empty array when no teams', () => {
            teamsStore.teams = [];
            expect(scoresStore.teamLeaderboard).toHaveLength(0);
        });
    });

    describe('playerMoneyLeaderboard', () => {
        test('includes entry fees, winnings, and net winnings', () => {
            const lb = scoresStore.playerMoneyLeaderboard;
            const alice = lb.find(e => e.id === 'p1');
            expect(alice.entryFee).toBe(100);
            expect(alice.winnings).toBe(200);
            expect(alice.netWinnings).toBe(100); // 200 - 100
        });

        test('is sorted by winnings descending', () => {
            const lb = scoresStore.playerMoneyLeaderboard;
            expect(lb[0].id).toBe('p1'); // 200 winnings
            expect(lb[1].id).toBe('p3'); // 150 winnings
            expect(lb[2].id).toBe('p2'); // 0 winnings
        });

        test('defaults to 0 for undefined entryFee/winnings', () => {
            playersStore.players = [
                { id: 'px', name: 'X', talentRating: 'D', teamId: null, teamName: null, createdAt: '', updatedAt: '' }
            ];
            const lb = scoresStore.playerMoneyLeaderboard;
            expect(lb[0].entryFee).toBe(0);
            expect(lb[0].winnings).toBe(0);
            expect(lb[0].netWinnings).toBe(0);
        });

        test('uses null teamName when player has no team', () => {
            playersStore.players = playersStore.players.map(p =>
                p.id === 'p3' ? { ...p, teamId: null } : p
            );
            const lb = scoresStore.playerMoneyLeaderboard;
            const carol = lb.find(e => e.id === 'p3');
            expect(carol.teamName).toBeNull();
        });
    });

    describe('teamMoneyLeaderboard', () => {
        test('aggregates entry fees and winnings across team players', () => {
            const lb = scoresStore.teamMoneyLeaderboard;
            const eagles = lb.find(e => e.id === 't1');
            expect(eagles.totalEntryFees).toBe(150);  // 100 + 50
            expect(eagles.totalWinnings).toBe(200);   // 200 + 0
            expect(eagles.netWinnings).toBe(50);
            expect(eagles.playerCount).toBe(2);
        });

        test('is sorted by total winnings descending', () => {
            const lb = scoresStore.teamMoneyLeaderboard;
            expect(lb[0].id).toBe('t1'); // 200 winnings
            expect(lb[1].id).toBe('t2'); // 150 winnings
        });

        test('returns empty array when no teams', () => {
            teamsStore.teams = [];
            expect(scoresStore.teamMoneyLeaderboard).toHaveLength(0);
        });
    });

    describe('courseScoresByTeam', () => {
        test('returns scores per team for a given course', () => {
            const result = scoresStore.courseScoresByTeam('round1');
            expect(result).toHaveLength(2);

            const eagles = result.find(r => r.teamId === 't1');
            expect(eagles.teamTotal).toBe(138); // 70 + 68
            expect(eagles.playerScores).toHaveLength(2);

            const aliceScore = eagles.playerScores.find(ps => ps.playerId === 'p1');
            expect(aliceScore.score).toBe(70);
            expect(aliceScore.talentRating).toBe('A');
        });

        test('returns null score for players with no score on that course', () => {
            const result = scoresStore.courseScoresByTeam('round2');
            const eagles = result.find(r => r.teamId === 't1');
            const bobScore = eagles.playerScores.find(ps => ps.playerId === 'p2');
            expect(bobScore.score).toBeNull();
        });

        test('player scores within team are sorted alphabetically by name', () => {
            const result = scoresStore.courseScoresByTeam('round1');
            const eagles = result.find(r => r.teamId === 't1');
            expect(eagles.playerScores[0].playerName).toBe('Alice');
            expect(eagles.playerScores[1].playerName).toBe('Bob');
        });

        test('includes logoUrl on team entry', () => {
            teamsStore.teams[0].logoUrl = 'data:image/png;base64,abc';
            const result = scoresStore.courseScoresByTeam('round1');
            const eagles = result.find(r => r.teamId === 't1');
            expect(eagles.logoUrl).toBe('data:image/png;base64,abc');
        });
    });

    describe('deletePlayerScores action', () => {
        test('removes all scores for a specific player', () => {
            scoresStore.deletePlayerScores('p1');
            expect(scoresStore.allScores.filter(s => s.playerId === 'p1')).toHaveLength(0);
            expect(scoresStore.allScores).toHaveLength(2);
        });

        test('leaves other players scores intact', () => {
            scoresStore.deletePlayerScores('p1');
            expect(scoresStore.scoresByPlayer('p2')).toHaveLength(1);
            expect(scoresStore.scoresByPlayer('p3')).toHaveLength(1);
        });
    });

    describe('deleteCourseScores action', () => {
        test('removes all scores for a specific course', () => {
            scoresStore.deleteCourseScores('course1');
            expect(scoresStore.allScores.filter(s => s.courseId === 'course1')).toHaveLength(0);
            expect(scoresStore.allScores).toHaveLength(1); // only p1/course2 remains
        });
    });
});
