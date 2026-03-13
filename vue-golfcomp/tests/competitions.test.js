/**
 * Competitions store tests (CM-05: switch active competition).
 */
import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCompetitionsStore } from '@/stores/competitions';
import { useUiStore } from '@/stores/ui';
import { useCoursesStore } from '@/stores/courses';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';

jest.mock('@/services/ApiService', () => ({
  __esModule: true,
  default: {
    _competitionId: null,
    get competitionId() { return this._competitionId; },
    set competitionId(id) { this._competitionId = id; },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    competitionsUrl: jest.fn(id => (id ? `/competitions/${id}` : '/competitions')),
    roundsUrl: jest.fn(id => (id ? `/competitions/comp/rounds/${id}` : '/competitions/comp/rounds'))
  }
}));

describe('competitions store', () => {
  let mockUiStore, mockCoursesStore, mockPlayersStore, mockTeamsStore, mockScoresStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    ApiService._competitionId = null;
    ApiService.get.mockReset();
    ApiService.post.mockReset();
    ApiService.delete.mockReset();

    mockUiStore = useUiStore();
    mockCoursesStore = useCoursesStore();
    mockPlayersStore = usePlayersStore();
    mockTeamsStore = useTeamsStore();
    mockScoresStore = useScoresStore();

    jest.spyOn(mockUiStore, 'setLoading');
    jest.spyOn(mockCoursesStore, 'fetchCourses').mockResolvedValue();
    jest.spyOn(mockPlayersStore, 'fetchPlayers').mockResolvedValue();
    jest.spyOn(mockTeamsStore, 'fetchTeams').mockResolvedValue();
    jest.spyOn(mockScoresStore, 'fetchScores').mockResolvedValue();
  });

  describe('setActiveCompetition', () => {
    test('sets active competition, ApiService.competitionId, and reloads all data', async () => {
      const store = useCompetitionsStore();
      const comp = { id: 'comp-2', name: 'Winter League' };

      await store.setActiveCompetition(comp);

      expect(store.activeCompetition).toEqual(comp);
      expect(ApiService.competitionId).toBe('comp-2');
      expect(mockUiStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
      expect(mockCoursesStore.fetchCourses).toHaveBeenCalled();
      expect(mockPlayersStore.fetchPlayers).toHaveBeenCalled();
      expect(mockTeamsStore.fetchTeams).toHaveBeenCalled();
      expect(mockScoresStore.fetchScores).toHaveBeenCalled();
    });

    test('clears loading even when fetch fails', async () => {
      const store = useCompetitionsStore();
      mockCoursesStore.fetchCourses.mockRejectedValueOnce(new Error('Network error'));

      await expect(store.setActiveCompetition({ id: 'c1', name: 'Test' })).rejects.toThrow('Network error');
      expect(mockUiStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('createRound', () => {
    test('POSTs round and refreshes courses when active competition set', async () => {
      const store = useCompetitionsStore();
      store.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      ApiService.competitionId = 'comp';
      ApiService.post.mockResolvedValue({});

      await store.createRound({
        courseId: 'course-1',
        playDate: '2026-06-14',
        roundNumber: 1
      });

      expect(ApiService.post).toHaveBeenCalledWith('/competitions/comp/rounds', {
        courseId: 'course-1',
        playDate: '2026-06-14',
        roundNumber: 1
      });
      expect(mockCoursesStore.fetchCourses).toHaveBeenCalled();
    });

    test('throws when no active competition', async () => {
      const store = useCompetitionsStore();
      store.activeCompetition = null;

      await expect(
        store.createRound({ courseId: 'c1', playDate: '2026-06-14', roundNumber: 1 })
      ).rejects.toThrow('No active competition');
      expect(ApiService.post).not.toHaveBeenCalled();
    });
  });

  describe('deleteRound', () => {
    test('DELETEs round and refreshes courses when active competition set', async () => {
      const store = useCompetitionsStore();
      store.activeCompetition = { id: 'comp', name: 'Summer Cup' };
      ApiService.competitionId = 'comp';
      ApiService.delete.mockResolvedValue(null);

      await store.deleteRound('round-1');

      expect(ApiService.delete).toHaveBeenCalledWith('/competitions/comp/rounds/round-1');
      expect(mockCoursesStore.fetchCourses).toHaveBeenCalled();
    });

    test('throws when no active competition', async () => {
      const store = useCompetitionsStore();
      store.activeCompetition = null;

      await expect(store.deleteRound('round-1')).rejects.toThrow('No active competition');
      expect(ApiService.delete).not.toHaveBeenCalled();
    });
  });
});
