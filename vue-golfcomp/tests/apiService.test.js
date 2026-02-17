// jest.mock is hoisted before const declarations, so the mock factory must be
// self-contained (no references to outer variables). The mock instance is
// retrieved after imports via axios.create.mock.results[0].value.
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  };
  return {
    create: jest.fn(() => mockInstance)
  };
});

import axios from 'axios';
import ApiService from '../src/services/ApiService';

// Retrieve the mock instance created during ApiService singleton construction
const mockAxiosInstance = axios.create.mock.results[0].value;

describe('ApiService', () => {
  describe('methods', () => {
    test('has get, post, put, delete methods', () => {
      expect(typeof ApiService.get).toBe('function');
      expect(typeof ApiService.post).toBe('function');
      expect(typeof ApiService.put).toBe('function');
      expect(typeof ApiService.delete).toBe('function');
    });
  });

  describe('competitionId', () => {
    test('getter and setter work', () => {
      ApiService.competitionId = 'test-id';
      expect(ApiService.competitionId).toBe('test-id');
    });
  });

  describe('URL helpers', () => {
    beforeEach(() => {
      ApiService.competitionId = 'comp-123';
    });

    test('compUrl returns correct path', () => {
      expect(ApiService.compUrl).toBe('/competitions/comp-123');
    });

    test('playersUrl with no id returns collection URL', () => {
      expect(ApiService.playersUrl()).toBe('/competitions/comp-123/players');
    });

    test('playersUrl with id returns item URL', () => {
      expect(ApiService.playersUrl('player-1')).toBe('/competitions/comp-123/players/player-1');
    });

    test('teamsUrl with no id returns collection URL', () => {
      expect(ApiService.teamsUrl()).toBe('/competitions/comp-123/teams');
    });

    test('teamsUrl with id returns item URL', () => {
      expect(ApiService.teamsUrl('team-1')).toBe('/competitions/comp-123/teams/team-1');
    });

    test('roundsUrl with no id returns collection URL', () => {
      expect(ApiService.roundsUrl()).toBe('/competitions/comp-123/rounds');
    });

    test('roundsUrl with id returns item URL', () => {
      expect(ApiService.roundsUrl('round-1')).toBe('/competitions/comp-123/rounds/round-1');
    });

    test('scoresUrl returns scores URL for a round', () => {
      expect(ApiService.scoresUrl('round-1')).toBe('/competitions/comp-123/rounds/round-1/scores');
    });

    test('leaderboardsUrl returns leaderboard URL by type', () => {
      expect(ApiService.leaderboardsUrl('players')).toBe('/competitions/comp-123/leaderboards/players');
    });
  });

  describe('response interceptors', () => {
    let successInterceptor, errorInterceptor;

    beforeAll(() => {
      // Capture the success and error interceptors registered during module init
      [successInterceptor, errorInterceptor] = mockAxiosInstance.interceptors.response.use.mock.calls[0];
    });

    test('unwraps ApiResponse.data on success', () => {
      const response = { status: 200, data: { success: true, data: { id: 1, name: 'Test' } } };
      expect(successInterceptor(response)).toEqual({ id: 1, name: 'Test' });
    });

    test('returns raw data when no ApiResponse wrapper', () => {
      const response = { status: 200, data: { id: 1 } };
      expect(successInterceptor(response)).toEqual({ id: 1 });
    });

    test('returns null for 204 No Content', () => {
      const response = { status: 204 };
      expect(successInterceptor(response)).toBeNull();
    });

    test('extracts code and status from API error response', async () => {
      const error = {
        response: {
          status: 404,
          data: {
            error: {
              code: 'PLAYER_NOT_FOUND',
              message: 'Player not found'
            }
          }
        },
        message: 'Request failed with status 404'
      };

      // Wrap in async arrow so thrown error becomes a rejected promise
      await expect(async () => errorInterceptor(error)).rejects.toMatchObject({
        message: 'Player not found',
        code: 'PLAYER_NOT_FOUND',
        status: 404
      });
    });

    test('re-throws original error when no API error body', () => {
      const error = {
        response: { status: 500, data: {} },
        message: 'Network Error'
      };

      // errorInterceptor throws synchronously; the thrown value is the original object
      let caughtError;
      try {
        errorInterceptor(error);
      } catch (e) {
        caughtError = e;
      }
      expect(caughtError).toBe(error);
      expect(caughtError.message).toBe('Network Error');
    });
  });
});
