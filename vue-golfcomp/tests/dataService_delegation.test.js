/**
 * Tests for DataService delegation layer (lines 28-179) and importData error branches.
 * Core importData happy-path tests are in dataService.test.js.
 */

jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        compUrl: '/competitions/test-comp-id',
        delete: jest.fn().mockResolvedValue()
    }
}));

// Full mocks covering all delegation targets
const mockPlayersStore = {
    allPlayers: [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 0, teamId: null }],
    unassignedPlayers: [{ id: 'p2', name: 'Bob', teamId: null }],
    playerById: jest.fn(),
    playersByTeam: jest.fn(),
    addPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    deletePlayer: jest.fn(),
    assignPlayerToTeam: jest.fn()
};

const mockTeamsStore = {
    allTeams: [{ id: 't1', name: 'Eagles', logoUrl: null }],
    teamById: jest.fn(),
    addTeam: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
    deleteAllTeams: jest.fn().mockResolvedValue(),
    generateTeams: jest.fn(),
    uploadTeamLogo: jest.fn()
};

const mockScoresStore = {
    scores: [],
    get allScores() { return this.scores; },
    $patch: jest.fn(),
    scoresByPlayer: jest.fn(),
    scoresByCourse: jest.fn(),
    scoreByPlayerAndCourse: jest.fn(),
    playerTotalScore: jest.fn(),
    teamTotalScore: jest.fn(),
    get playerLeaderboard() { return [{ id: 'p1', totalScore: 72 }]; },
    get teamLeaderboard() { return [{ id: 't1', totalScore: 144 }]; },
    courseScoresByTeam: jest.fn(),
    updateScore: jest.fn()
};

const mockCoursesStore = {
    allCourses: [{ id: 'c1', name: 'Parkland', roundId: 'r1' }],
    courseById: jest.fn(),
    courseByName: jest.fn()
};

jest.mock('@/stores/players', () => ({ usePlayersStore: () => mockPlayersStore }));
jest.mock('@/stores/teams',   () => ({ useTeamsStore:   () => mockTeamsStore }));
jest.mock('@/stores/scores',  () => ({ useScoresStore:  () => mockScoresStore }));
jest.mock('@/stores/courses', () => ({ useCoursesStore: () => mockCoursesStore }));

import DataService from '@/services/DataService';
import ApiService from '@/services/ApiService';

beforeEach(() => {
    jest.clearAllMocks();
    mockTeamsStore.deleteAllTeams.mockResolvedValue();
    ApiService.delete.mockResolvedValue();
    mockPlayersStore.allPlayers = [];
});

// ============================================================
// Delegation — Player Methods
// ============================================================

describe('DataService - player delegation', () => {
    test('getPlayers returns allPlayers from store', () => {
        mockPlayersStore.allPlayers = [{ id: 'p1' }];
        expect(DataService.getPlayers()).toEqual([{ id: 'p1' }]);
    });

    test('getPlayerById delegates to playerById', () => {
        const player = { id: 'p1', name: 'Alice' };
        mockPlayersStore.playerById.mockReturnValue(player);
        expect(DataService.getPlayerById('p1')).toBe(player);
        expect(mockPlayersStore.playerById).toHaveBeenCalledWith('p1');
    });

    test('getPlayersByTeam delegates to playersByTeam', () => {
        const players = [{ id: 'p1', teamId: 't1' }];
        mockPlayersStore.playersByTeam.mockReturnValue(players);
        expect(DataService.getPlayersByTeam('t1')).toBe(players);
        expect(mockPlayersStore.playersByTeam).toHaveBeenCalledWith('t1');
    });

    test('getUnassignedPlayers returns unassignedPlayers from store', () => {
        expect(DataService.getUnassignedPlayers()).toBe(mockPlayersStore.unassignedPlayers);
    });

    test('createPlayer delegates to addPlayer', async () => {
        mockPlayersStore.addPlayer.mockResolvedValue('p-new');
        const result = await DataService.createPlayer({ name: 'Alice', talentRating: 'A' });
        expect(result).toBe('p-new');
        expect(mockPlayersStore.addPlayer).toHaveBeenCalledWith({ name: 'Alice', talentRating: 'A' });
    });

    test('updatePlayer delegates to updatePlayer with { id, updates }', async () => {
        mockPlayersStore.updatePlayer.mockResolvedValue();
        await DataService.updatePlayer('p1', { name: 'Alice X' });
        expect(mockPlayersStore.updatePlayer).toHaveBeenCalledWith({ id: 'p1', updates: { name: 'Alice X' } });
    });

    test('deletePlayer delegates to deletePlayer', async () => {
        mockPlayersStore.deletePlayer.mockResolvedValue();
        await DataService.deletePlayer('p1');
        expect(mockPlayersStore.deletePlayer).toHaveBeenCalledWith('p1');
    });

    test('assignPlayerToTeam delegates with { playerId, teamId }', async () => {
        mockPlayersStore.assignPlayerToTeam.mockResolvedValue();
        await DataService.assignPlayerToTeam('p1', 't1');
        expect(mockPlayersStore.assignPlayerToTeam).toHaveBeenCalledWith({ playerId: 'p1', teamId: 't1' });
    });
});

// ============================================================
// Delegation — Team Methods
// ============================================================

describe('DataService - team delegation', () => {
    test('getTeams returns allTeams from store', () => {
        mockTeamsStore.allTeams = [{ id: 't1' }];
        expect(DataService.getTeams()).toEqual([{ id: 't1' }]);
    });

    test('getTeamById delegates to teamById', () => {
        const team = { id: 't1', name: 'Eagles' };
        mockTeamsStore.teamById.mockReturnValue(team);
        expect(DataService.getTeamById('t1')).toBe(team);
        expect(mockTeamsStore.teamById).toHaveBeenCalledWith('t1');
    });

    test('createTeam delegates to addTeam', async () => {
        mockTeamsStore.addTeam.mockResolvedValue('t-new');
        const result = await DataService.createTeam({ name: 'Eagles' });
        expect(result).toBe('t-new');
        expect(mockTeamsStore.addTeam).toHaveBeenCalledWith({ name: 'Eagles' });
    });

    test('updateTeam delegates with { id, updates }', async () => {
        mockTeamsStore.updateTeam.mockResolvedValue();
        await DataService.updateTeam('t1', { name: 'New Eagles' });
        expect(mockTeamsStore.updateTeam).toHaveBeenCalledWith({ id: 't1', updates: { name: 'New Eagles' } });
    });

    test('deleteTeam delegates to deleteTeam', async () => {
        mockTeamsStore.deleteTeam.mockResolvedValue();
        await DataService.deleteTeam('t1');
        expect(mockTeamsStore.deleteTeam).toHaveBeenCalledWith('t1');
    });

    test('generateTeams delegates to generateTeams', async () => {
        mockTeamsStore.generateTeams.mockResolvedValue(['t1', 't2']);
        const result = await DataService.generateTeams(2);
        expect(result).toEqual(['t1', 't2']);
        expect(mockTeamsStore.generateTeams).toHaveBeenCalledWith(2);
    });

    test('uploadTeamLogo delegates with { teamId, logoUrl }', async () => {
        mockTeamsStore.uploadTeamLogo.mockResolvedValue();
        await DataService.uploadTeamLogo('t1', 'data:image/png;base64,abc');
        expect(mockTeamsStore.uploadTeamLogo).toHaveBeenCalledWith({ teamId: 't1', logoUrl: 'data:image/png;base64,abc' });
    });
});

// ============================================================
// Delegation — Score Methods
// ============================================================

describe('DataService - score delegation', () => {
    test('getScores returns allScores from store', () => {
        mockScoresStore.scores = [{ id: 's1' }];
        expect(DataService.getScores()).toEqual([{ id: 's1' }]);
    });

    test('getScoresByPlayer delegates to scoresByPlayer', () => {
        const scores = [{ id: 's1', playerId: 'p1' }];
        mockScoresStore.scoresByPlayer.mockReturnValue(scores);
        expect(DataService.getScoresByPlayer('p1')).toBe(scores);
        expect(mockScoresStore.scoresByPlayer).toHaveBeenCalledWith('p1');
    });

    test('getScoresByCourse delegates to scoresByCourse', () => {
        const scores = [{ id: 's1', courseId: 'c1' }];
        mockScoresStore.scoresByCourse.mockReturnValue(scores);
        expect(DataService.getScoresByCourse('c1')).toBe(scores);
        expect(mockScoresStore.scoresByCourse).toHaveBeenCalledWith('c1');
    });

    test('getScoreByPlayerAndCourse delegates to scoreByPlayerAndCourse', () => {
        const score = { id: 's1', playerId: 'p1', courseId: 'c1', value: 72 };
        mockScoresStore.scoreByPlayerAndCourse.mockReturnValue(score);
        expect(DataService.getScoreByPlayerAndCourse('p1', 'c1')).toBe(score);
        expect(mockScoresStore.scoreByPlayerAndCourse).toHaveBeenCalledWith('p1', 'c1');
    });

    test('updateScore delegates with { playerId, courseId, value }', async () => {
        mockScoresStore.updateScore.mockResolvedValue();
        await DataService.updateScore('p1', 'c1', 72);
        expect(mockScoresStore.updateScore).toHaveBeenCalledWith({ playerId: 'p1', courseId: 'c1', value: 72 });
    });

    test('getPlayerTotalScore delegates to playerTotalScore', () => {
        mockScoresStore.playerTotalScore.mockReturnValue(142);
        expect(DataService.getPlayerTotalScore('p1')).toBe(142);
        expect(mockScoresStore.playerTotalScore).toHaveBeenCalledWith('p1');
    });

    test('getTeamTotalScore delegates to teamTotalScore', () => {
        mockScoresStore.teamTotalScore.mockReturnValue(280);
        expect(DataService.getTeamTotalScore('t1')).toBe(280);
        expect(mockScoresStore.teamTotalScore).toHaveBeenCalledWith('t1');
    });
});

// ============================================================
// Delegation — Course Methods
// ============================================================

describe('DataService - course delegation', () => {
    test('getCourses returns allCourses from store', () => {
        expect(DataService.getCourses()).toBe(mockCoursesStore.allCourses);
    });

    test('getCourseById delegates to courseById', () => {
        const course = { id: 'c1', name: 'Parkland' };
        mockCoursesStore.courseById.mockReturnValue(course);
        expect(DataService.getCourseById('c1')).toBe(course);
        expect(mockCoursesStore.courseById).toHaveBeenCalledWith('c1');
    });

    test('getCourseByName delegates to courseByName', () => {
        const course = { id: 'c1', name: 'Parkland' };
        mockCoursesStore.courseByName.mockReturnValue(course);
        expect(DataService.getCourseByName('Parkland')).toBe(course);
        expect(mockCoursesStore.courseByName).toHaveBeenCalledWith('Parkland');
    });
});

// ============================================================
// Delegation — Leaderboard Methods
// ============================================================

describe('DataService - leaderboard delegation', () => {
    test('getPlayerLeaderboard returns playerLeaderboard getter', () => {
        const lb = DataService.getPlayerLeaderboard();
        expect(lb).toEqual([{ id: 'p1', totalScore: 72 }]);
    });

    test('getTeamLeaderboard returns teamLeaderboard getter', () => {
        const lb = DataService.getTeamLeaderboard();
        expect(lb).toEqual([{ id: 't1', totalScore: 144 }]);
    });

    test('getCourseScoresByTeam delegates to courseScoresByTeam', () => {
        const result = [{ teamId: 't1', teamTotal: 72 }];
        mockScoresStore.courseScoresByTeam.mockReturnValue(result);
        expect(DataService.getCourseScoresByTeam('c1')).toBe(result);
        expect(mockScoresStore.courseScoresByTeam).toHaveBeenCalledWith('c1');
    });
});

// ============================================================
// importData — Error Accumulation Branches
// ============================================================

describe('DataService - importData error branches', () => {
    const validJson = JSON.stringify({
        players: [{ id: 'old-p1', name: 'Bob', talentRating: 'B', entryFee: 50, winnings: 0, teamId: null }],
        teams: [{ id: 'old-t1', name: 'Team One', logoUrl: null }],
        scores: [{ playerId: 'old-p1', courseId: 'c1', value: 75 }],
        courses: [{ id: 'c1', name: 'Parkland' }]
    });

    beforeEach(() => {
        mockPlayersStore.addPlayer.mockResolvedValue('p-new');
        mockTeamsStore.addTeam.mockResolvedValue('t-new');
        mockScoresStore.updateScore.mockResolvedValue();
    });

    async function catchImportError(json) {
        try {
            await DataService.importData(json);
        } catch (e) {
            return e;
        }
        return null;
    }

    test('accumulates failure when clearing scores via API throws', async () => {
        ApiService.delete.mockRejectedValueOnce(new Error('Scores clear failed'));
        const err = await catchImportError(validJson);
        expect(err).not.toBeNull();
        expect(err.message).toMatch(/Import completed with errors/);
        expect(err.message).toMatch(/Scores clear failed/);
    });

    test('accumulates failure when deleting an existing player throws', async () => {
        mockPlayersStore.allPlayers = [{ id: 'existing', name: 'Old', talentRating: 'C', teamId: null }];
        mockPlayersStore.deletePlayer.mockRejectedValueOnce(new Error('Delete player failed'));
        const err = await catchImportError(validJson);
        expect(err).not.toBeNull();
        expect(err.message).toMatch(/Import completed with errors/);
        expect(err.message).toMatch(/Delete player failed/);
    });

    test('accumulates failure when adding a new player throws', async () => {
        mockPlayersStore.addPlayer.mockRejectedValueOnce(new Error('Add player failed'));
        const err = await catchImportError(validJson);
        expect(err).not.toBeNull();
        expect(err.message).toMatch(/Import completed with errors/);
        expect(err.message).toMatch(/Add player failed/);
    });

    test('accumulates failure when updating a score throws', async () => {
        mockScoresStore.updateScore.mockRejectedValueOnce(new Error('Score update failed'));
        const err = await catchImportError(validJson);
        expect(err).not.toBeNull();
        expect(err.message).toMatch(/Import completed with errors/);
        expect(err.message).toMatch(/Score update failed/);
    });

    test('accumulates multiple failures in single error message', async () => {
        mockTeamsStore.addTeam.mockRejectedValue(new Error('Team err'));
        mockPlayersStore.addPlayer.mockRejectedValue(new Error('Player err'));

        let caught;
        try {
            await DataService.importData(validJson);
        } catch (e) {
            caught = e;
        }
        expect(caught.message).toMatch(/Team err/);
        expect(caught.message).toMatch(/Player err/);
    });
});
