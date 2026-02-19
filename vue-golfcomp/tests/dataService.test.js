/**
 * DataService tests (US-F013): export from store state, import via API with progress and error reporting.
 */

jest.mock('@/services/ApiService', () => ({
  __esModule: true,
  default: {
    compUrl: '/competitions/test-comp-id',
    delete: jest.fn().mockResolvedValue()
  }
}));

const mockPlayersStore = {
  allPlayers: [],
  addPlayer: jest.fn().mockResolvedValue('p-new-id'),
  deletePlayer: jest.fn().mockResolvedValue(),
  assignPlayerToTeam: jest.fn().mockResolvedValue()
};
const mockTeamsStore = {
  allTeams: [],
  addTeam: jest.fn().mockResolvedValue('t-new-id'),
  deleteAllTeams: jest.fn().mockResolvedValue()
};
const mockScoresStore = {
  scores: [],
  get allScores() {
    return this.scores;
  },
  $patch: jest.fn(),
  updateScore: jest.fn().mockResolvedValue()
};
const mockCoursesStore = {
  allCourses: [
    { id: 'course-1', name: 'Parkland', order: 1, roundId: 'round-1' },
    { id: 'course-2', name: 'Heathland', order: 2, roundId: 'round-2' }
  ],
  roundIdByCourseId: jest.fn().mockImplementation((id) => (id === 'course-1' ? 'round-1' : id === 'course-2' ? 'round-2' : null))
};

jest.mock('@/stores/players', () => ({ usePlayersStore: () => mockPlayersStore }));
jest.mock('@/stores/teams', () => ({ useTeamsStore: () => mockTeamsStore }));
jest.mock('@/stores/scores', () => ({ useScoresStore: () => mockScoresStore }));
jest.mock('@/stores/courses', () => ({ useCoursesStore: () => mockCoursesStore }));

import DataService from '@/services/DataService';
import ApiService from '@/services/ApiService';

describe('DataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayersStore.allPlayers = [];
    mockTeamsStore.allTeams = [];
    mockScoresStore.scores = [];
    mockPlayersStore.addPlayer.mockResolvedValue('p-new-id');
    mockPlayersStore.deletePlayer.mockResolvedValue();
    mockPlayersStore.assignPlayerToTeam.mockResolvedValue();
    mockTeamsStore.addTeam.mockResolvedValue('t-new-id');
    mockTeamsStore.deleteAllTeams.mockResolvedValue();
    mockScoresStore.updateScore.mockResolvedValue();
    ApiService.delete.mockResolvedValue();
  });

  describe('exportData', () => {
    test('returns JSON string with players, teams, scores, courses, and metadata', () => {
      mockPlayersStore.allPlayers = [{ id: 'p1', name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 0, teamId: null }];
      mockTeamsStore.allTeams = [{ id: 't1', name: 'Team A', logoUrl: null }];
      const score = { id: 's1', playerId: 'p1', courseId: 'course-1', value: 72 };
      mockScoresStore.scores = [score];
      mockCoursesStore.allCourses = [{ id: 'course-1', name: 'Parkland', order: 1 }];

      const result = DataService.exportData();

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.players).toHaveLength(1);
      expect(parsed.players[0].name).toBe('Alice');
      expect(parsed.teams).toHaveLength(1);
      expect(parsed.teams[0].name).toBe('Team A');
      expect(parsed.scores).toHaveLength(1);
      expect(parsed.courses).toBeDefined();
      expect(parsed.appMetadata).toMatchObject({
        version: '2.0.0',
        source: 'api'
      });
      expect(parsed.appMetadata.exportDate).toBeDefined();
    });

    test('export reads from current store state', () => {
      mockPlayersStore.allPlayers = [];
      mockTeamsStore.allTeams = [];
      mockScoresStore.scores = [];

      const result = DataService.exportData();
      const parsed = JSON.parse(result);

      expect(parsed.players).toEqual([]);
      expect(parsed.teams).toEqual([]);
      expect(parsed.scores).toEqual([]);
    });
  });

  describe('importData', () => {
    const validJson = JSON.stringify({
      players: [
        { id: 'old-p1', name: 'Bob', talentRating: 'B', entryFee: 50, winnings: 0, teamId: 'old-t1' }
      ],
      teams: [{ id: 'old-t1', name: 'Team One', logoUrl: null }],
      scores: [{ playerId: 'old-p1', courseId: 'course-1', value: 75 }],
      courses: [{ id: 'course-1', name: 'Parkland', order: 1 }]
    });

    test('throws on invalid data format', async () => {
      await expect(DataService.importData('not json')).rejects.toThrow('Invalid data format');
      await expect(DataService.importData('{}')).rejects.toThrow('Invalid data format');
    });

    test('calls progress callback with phase messages', async () => {
      const progressCalls = [];
      await DataService.importData(validJson, {
        onProgress: (msg) => progressCalls.push(msg)
      });

      expect(progressCalls.some((m) => m.includes('Clearing'))).toBe(true);
      expect(progressCalls.some((m) => m.includes('teams'))).toBe(true);
      expect(progressCalls.some((m) => m.includes('players'))).toBe(true);
      expect(progressCalls.some((m) => m.includes('scores'))).toBe(true);
    });

    test('clears existing data before importing', async () => {
      mockPlayersStore.allPlayers = [{ id: 'existing-p', name: 'Existing', talentRating: 'A', entryFee: 0, winnings: 0, teamId: null }];

      await DataService.importData(validJson);

      expect(ApiService.delete).toHaveBeenCalledWith('/competitions/test-comp-id/scores');
      expect(mockTeamsStore.deleteAllTeams).toHaveBeenCalled();
      expect(mockPlayersStore.deletePlayer).toHaveBeenCalledWith('existing-p');
    });

    test('creates teams and players via store actions and maps IDs', async () => {
      mockPlayersStore.allPlayers = [];
      mockTeamsStore.allTeams = [];
      mockTeamsStore.addTeam.mockResolvedValue('t-new-1');
      mockPlayersStore.addPlayer.mockResolvedValue('p-new-1');

      await DataService.importData(validJson);

      expect(mockTeamsStore.addTeam).toHaveBeenCalledWith({
        name: 'Team One',
        logoUrl: null
      });
      expect(mockPlayersStore.addPlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Bob',
          talentRating: 'B',
          entryFee: 50,
          winnings: 0
        })
      );
      expect(mockPlayersStore.assignPlayerToTeam).toHaveBeenCalledWith({
        playerId: 'p-new-1',
        teamId: 't-new-1'
      });
    });

    test('creates scores with courseId (store maps to roundId)', async () => {
      mockPlayersStore.addPlayer.mockResolvedValue('p-new-1');
      mockTeamsStore.addTeam.mockResolvedValue('t-new-1');

      await DataService.importData(validJson);

      expect(mockScoresStore.updateScore).toHaveBeenCalledWith({
        playerId: 'p-new-1',
        courseId: 'course-1',
        value: 75
      });
    });

    test('reports failures when some items fail', async () => {
      mockPlayersStore.allPlayers = [];
      mockTeamsStore.addTeam.mockRejectedValue(new Error('Duplicate team name'));
      mockPlayersStore.addPlayer.mockResolvedValue('p-new-1');

      await expect(DataService.importData(validJson)).rejects.toThrow(/Import completed with errors/);
      await expect(DataService.importData(validJson)).rejects.toThrow(/team/);
      await expect(DataService.importData(validJson)).rejects.toThrow(/Duplicate team name/);
    });

    test('skips score when player ID not in map', async () => {
      const jsonWithOrphanScore = JSON.stringify({
        players: [],
        teams: [],
        scores: [{ playerId: 'missing-player', courseId: 'course-1', value: 80 }],
        courses: [{ id: 'course-1', name: 'Parkland', order: 1 }]
      });

      await DataService.importData(jsonWithOrphanScore);

      expect(mockScoresStore.updateScore).not.toHaveBeenCalled();
    });
  });
});
