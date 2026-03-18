jest.mock('@/services/ApiService', () => {
  const get = jest.fn();
  const post = jest.fn();
  const roundsUrl = jest.fn(() => '/competitions/comp/rounds');
  const api = {
    _competitionId: null,
    get competitionId() { return this._competitionId; },
    set competitionId(id) { this._competitionId = id; },
    get,
    post,
    roundsUrl
  };
  return { __esModule: true, default: api };
});

jest.mock('@/stores/competitions', () => ({
  useCompetitionsStore: jest.fn()
}));

jest.mock('@/stores/ui', () => ({
  useUiStore: jest.fn()
}));

jest.mock('@/stores/courses', () => ({
  useCoursesStore: jest.fn()
}));

jest.mock('@/stores/players', () => ({
  usePlayersStore: jest.fn()
}));

jest.mock('@/stores/teams', () => ({
  useTeamsStore: jest.fn()
}));

jest.mock('@/stores/scores', () => ({
  useScoresStore: jest.fn()
}));

jest.mock('@/services/NotificationService', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}));

import ApiService from '@/services/ApiService';
import { useCompetitionsStore } from '@/stores/competitions';
import { useUiStore } from '@/stores/ui';
import { useCoursesStore } from '@/stores/courses';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';
import NotificationService from '@/services/NotificationService';
import { initializeApp } from '@/services/bootstrap';

describe('bootstrap', () => {
  let mockCompetitionsStore, mockUiStore, mockCoursesStore, mockPlayersStore, mockTeamsStore, mockScoresStore;

  beforeEach(() => {
    ApiService._competitionId = null;
    ApiService.get.mockReset();
    ApiService.post.mockReset();
    ApiService.roundsUrl.mockReset();
    ApiService.roundsUrl.mockReturnValue('/competitions/comp/rounds');
    NotificationService.error.mockClear();

    mockCompetitionsStore = {
      competitions: [],
      activeCompetition: null,
      fetchCompetitions: jest.fn().mockResolvedValue(),
      createCompetition: jest.fn()
    };
    mockUiStore = { setLoading: jest.fn() };
    mockCoursesStore = { fetchCourses: jest.fn().mockResolvedValue() };
    mockPlayersStore = { fetchPlayers: jest.fn().mockResolvedValue() };
    mockTeamsStore = { fetchTeams: jest.fn().mockResolvedValue() };
    mockScoresStore = { fetchScores: jest.fn().mockResolvedValue() };

    useCompetitionsStore.mockReturnValue(mockCompetitionsStore);
    useUiStore.mockReturnValue(mockUiStore);
    useCoursesStore.mockReturnValue(mockCoursesStore);
    usePlayersStore.mockReturnValue(mockPlayersStore);
    useTeamsStore.mockReturnValue(mockTeamsStore);
    useScoresStore.mockReturnValue(mockScoresStore);
  });

  test('when competitions exist, uses first competition ID', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }]);

    await initializeApp();

    expect(ApiService.competitionId).toBe('comp-1');
    expect(mockCompetitionsStore.fetchCompetitions).toHaveBeenCalled();
    expect(ApiService.get).toHaveBeenCalledWith('/competitions/comp/rounds');
    expect(ApiService.post).not.toHaveBeenCalled();
  });

  test('when no competitions exist, creates one and uses its ID', async () => {
    mockCompetitionsStore.competitions = [];
    mockCompetitionsStore.createCompetition.mockResolvedValue({ id: 'new-comp', name: 'Golf Competition' });
    ApiService.get.mockResolvedValueOnce([]);
    ApiService.post.mockResolvedValue({});

    await initializeApp();

    expect(ApiService.competitionId).toBe('new-comp');
    expect(mockCompetitionsStore.createCompetition).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Golf Competition',
      location: null
    }));
    expect(ApiService.post).toHaveBeenCalledTimes(4);
  });

  test('when rounds exist, does not create new ones', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }]);

    await initializeApp();

    expect(ApiService.competitionId).toBe('comp-1');
    expect(ApiService.post).not.toHaveBeenCalled();
  });

  test('when no rounds exist, creates 4 rounds', async () => {
    const courseIds = [
      '071aaf93-773e-49d0-935e-4b825e25670f',
      '2b81e674-816a-42ea-b524-54a96bfb2b14',
      '38a5c806-7f44-4ebb-9472-6ec79431c5ff',
      'd3d8aa11-5320-477b-9602-6501dd63b186'
    ];
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([]);
    ApiService.post.mockResolvedValue({});

    await initializeApp();

    expect(ApiService.post).toHaveBeenCalledTimes(4);
    for (let i = 0; i < 4; i++) {
      expect(ApiService.post).toHaveBeenNthCalledWith(i + 1, '/competitions/comp/rounds', expect.objectContaining({
        courseId: courseIds[i],
        roundNumber: i + 1
      }));
    }
  });

  test('when API is unavailable, throws/rejects', async () => {
    mockCompetitionsStore.fetchCompetitions.mockRejectedValue(new Error('Network Error'));

    await expect(initializeApp()).rejects.toThrow('Network Error');
  });

  test('sets ui loading state during initialization', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);

    await initializeApp();

    expect(mockUiStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
  });

  test('clears loading state even when API is unavailable', async () => {
    mockCompetitionsStore.fetchCompetitions.mockRejectedValue(new Error('Network Error'));

    await expect(initializeApp()).rejects.toThrow('Network Error');

    expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
  });

  test('loads all store data after competition bootstrap', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);

    await initializeApp();

    expect(mockCoursesStore.fetchCourses).toHaveBeenCalled();
    expect(mockPlayersStore.fetchPlayers).toHaveBeenCalled();
    expect(mockTeamsStore.fetchTeams).toHaveBeenCalled();
    expect(mockScoresStore.fetchScores).toHaveBeenCalled();
  });

  test('courses are fetched before scores', async () => {
    const callOrder = [];
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);
    mockCoursesStore.fetchCourses.mockImplementation(() => {
      callOrder.push('courses');
      return Promise.resolve();
    });
    mockScoresStore.fetchScores.mockImplementation(() => {
      callOrder.push('scores');
      return Promise.resolve();
    });

    await initializeApp();

    expect(callOrder.indexOf('courses')).toBeLessThan(callOrder.indexOf('scores'));
  });

  test('shows notification when data load fails but does not throw', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);
    mockPlayersStore.fetchPlayers.mockRejectedValue(new Error('Players fetch failed'));

    await expect(initializeApp()).resolves.not.toThrow();
    expect(NotificationService.error).toHaveBeenCalled();
  });
});
