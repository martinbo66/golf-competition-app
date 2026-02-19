/* eslint-env jest */
/**
 * Shared manual mock for ApiService.
 *
 * Usage in test files:
 *   jest.mock('@/services/ApiService');          // auto-uses this file
 *   // OR explicitly override per-test:
 *   jest.mock('@/services/ApiService', () => ({ __esModule: true, default: { ... } }));
 *
 * To reset between tests:
 *   beforeEach(() => {
 *     ApiService.get.mockReset();
 *     ApiService.post.mockReset();
 *     ApiService.put.mockReset();
 *     ApiService.delete.mockReset();
 *   });
 */

const ApiService = {
  competitionId: 'test-competition-id',

  get compUrl() {
    return `/competitions/${this.competitionId}`;
  },

  playersUrl: jest.fn((id) =>
    id
      ? `/competitions/test-competition-id/players/${id}`
      : '/competitions/test-competition-id/players'
  ),
  teamsUrl: jest.fn((id) =>
    id
      ? `/competitions/test-competition-id/teams/${id}`
      : '/competitions/test-competition-id/teams'
  ),
  roundsUrl: jest.fn((id) =>
    id
      ? `/competitions/test-competition-id/rounds/${id}`
      : '/competitions/test-competition-id/rounds'
  ),
  scoresUrl: jest.fn(
    (roundId) => `/competitions/test-competition-id/rounds/${roundId}/scores`
  ),
  leaderboardsUrl: jest.fn(
    (type) => `/competitions/test-competition-id/leaderboards/${type}`
  ),

  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export default ApiService;
