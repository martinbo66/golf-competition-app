jest.mock('@/services/ApiService', () => {
  const get = jest.fn();
  const post = jest.fn();
  const coursesUrl = jest.fn((id) => (id ? `/courses/${id}` : '/courses'));
  const roundsUrl = jest.fn(function roundsUrlMock() {
    const oid = this._organizationId;
    const cid = this._competitionId;
    if (oid && cid) {
      return `/organizations/${oid}/competitions/${cid}/rounds`;
    }
    return `/competitions/${cid || 'comp'}/rounds`;
  });
  const api = {
    _competitionId: null,
    _organizationId: null,
    get competitionId() { return this._competitionId; },
    set competitionId(id) { this._competitionId = id; },
    get organizationId() { return this._organizationId; },
    set organizationId(id) { this._organizationId = id; },
    get,
    post,
    roundsUrl,
    coursesUrl
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

jest.mock('@/stores/organizations', () => ({
  useOrganizationsStore: jest.fn()
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
import { useOrganizationsStore } from '@/stores/organizations';
import NotificationService from '@/services/NotificationService';
import { initializeApp } from '@/services/bootstrap';

function pickDefaultCompetition(competitions) {
  const today = new Date().toISOString().split('T')[0];
  const currentAndFuture = competitions
    .filter(c => !c.endDate || c.endDate >= today)
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  return currentAndFuture[0] || competitions[0] || null;
}

describe('bootstrap', () => {
  let mockCompetitionsStore;
  let mockUiStore;
  let mockCoursesStore;
  let mockPlayersStore;
  let mockTeamsStore;
  let mockScoresStore;
  let mockOrgsStore;

  beforeEach(() => {
    ApiService._competitionId = null;
    ApiService._organizationId = null;
    ApiService.get.mockReset();
    ApiService.post.mockReset();
    ApiService.roundsUrl.mockReset();
    ApiService.roundsUrl.mockImplementation(function mockRoundsUrl() {
      const oid = this._organizationId;
      const cid = this._competitionId;
      if (oid && cid) {
        return `/organizations/${oid}/competitions/${cid}/rounds`;
      }
      return `/competitions/${cid || 'comp'}/rounds`;
    });
    NotificationService.error.mockClear();

    mockCompetitionsStore = {
      competitions: [],
      activeCompetition: null,
      fetchCompetitions: jest.fn().mockResolvedValue(),
      createCompetition: jest.fn()
    };

    mockOrgsStore = {
      organizations: [{ id: 'a0000000-0000-0000-0000-000000000001', name: 'Default', slug: 'default' }],
      activeOrganization: null,
      fetchOrganizations: jest.fn().mockResolvedValue(),
      setActiveOrganization: jest.fn(async (org) => {
        mockOrgsStore.activeOrganization = org;
        ApiService.organizationId = org.id;
        await mockCompetitionsStore.fetchCompetitions();
        const best = pickDefaultCompetition(mockCompetitionsStore.competitions);
        if (best) {
          mockCompetitionsStore.activeCompetition = best;
          ApiService.competitionId = best.id;
          await mockCoursesStore.fetchCourses();
          await Promise.all([
            mockPlayersStore.fetchPlayers(),
            mockTeamsStore.fetchTeams()
          ]);
          await mockScoresStore.fetchScores();
        }
      })
    };

    mockCompetitionsStore.createCompetition.mockImplementation(async (data) => {
      const created = {
        id: 'new-comp',
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location
      };
      mockCompetitionsStore.competitions.push(created);
      mockCompetitionsStore.activeCompetition = created;
      ApiService.competitionId = created.id;
      return created;
    });

    mockUiStore = { setLoading: jest.fn() };
    mockCoursesStore = {
      fetchAllCourses: jest.fn().mockResolvedValue(),
      fetchCourses: jest.fn().mockResolvedValue()
    };
    mockPlayersStore = { fetchPlayers: jest.fn().mockResolvedValue() };
    mockTeamsStore = { fetchTeams: jest.fn().mockResolvedValue() };
    mockScoresStore = { fetchScores: jest.fn().mockResolvedValue() };

    useOrganizationsStore.mockReturnValue(mockOrgsStore);
    useCompetitionsStore.mockReturnValue(mockCompetitionsStore);
    useUiStore.mockReturnValue(mockUiStore);
    useCoursesStore.mockReturnValue(mockCoursesStore);
    usePlayersStore.mockReturnValue(mockPlayersStore);
    useTeamsStore.mockReturnValue(mockTeamsStore);
    useScoresStore.mockReturnValue(mockScoresStore);
  });

  const defaultOrgId = 'a0000000-0000-0000-0000-000000000001';
  const expectedRoundsPath = `/organizations/${defaultOrgId}/competitions/comp-1/rounds`;

  test('when competitions exist, uses first competition ID', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }]);
    ApiService.get.mockResolvedValueOnce([]);

    await initializeApp();

    expect(ApiService.competitionId).toBe('comp-1');
    expect(mockOrgsStore.fetchOrganizations).toHaveBeenCalled();
    expect(mockOrgsStore.setActiveOrganization).toHaveBeenCalled();
    expect(ApiService.get).toHaveBeenCalledWith(expectedRoundsPath);
    expect(ApiService.post).not.toHaveBeenCalled();
  });

  test('when no competitions exist, creates one and uses its ID', async () => {
    mockCompetitionsStore.competitions = [];
    ApiService.get.mockResolvedValueOnce([]);
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
    ApiService.get.mockResolvedValueOnce([]);

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
    ApiService.get.mockResolvedValueOnce([]);
    ApiService.post.mockResolvedValue({});

    await initializeApp();

    expect(ApiService.post).toHaveBeenCalledTimes(4);
    for (let i = 0; i < 4; i++) {
      expect(ApiService.post).toHaveBeenNthCalledWith(i + 1, expectedRoundsPath, expect.objectContaining({
        courseId: courseIds[i],
        roundNumber: i + 1
      }));
    }
  });

  test('when API is unavailable, throws/rejects', async () => {
    mockOrgsStore.fetchOrganizations.mockRejectedValue(new Error('Network Error'));

    await expect(initializeApp()).rejects.toThrow('Network Error');
  });

  test('sets ui loading state during initialization', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);
    ApiService.get.mockResolvedValueOnce([]);

    await initializeApp();

    expect(mockUiStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
  });

  test('clears loading state even when API is unavailable', async () => {
    mockOrgsStore.fetchOrganizations.mockRejectedValue(new Error('Network Error'));

    await expect(initializeApp()).rejects.toThrow('Network Error');

    expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
  });

  test('loads all store data after competition bootstrap', async () => {
    mockCompetitionsStore.competitions = [{ id: 'comp-1', name: 'Golf Competition' }];
    ApiService.get.mockResolvedValueOnce([{ id: 'r1' }]);
    ApiService.get.mockResolvedValueOnce([]);

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
    ApiService.get.mockResolvedValueOnce([]);
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
    mockCoursesStore.fetchAllCourses.mockRejectedValue(new Error('Courses pool failed'));

    await expect(initializeApp()).resolves.not.toThrow();
    expect(NotificationService.error).toHaveBeenCalled();
  });
});
