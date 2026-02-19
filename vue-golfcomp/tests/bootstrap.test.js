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

import ApiService from '@/services/ApiService';
import { initializeApp } from '@/services/bootstrap';

describe('bootstrap', () => {
  beforeEach(() => {
    ApiService._competitionId = null;
    ApiService.get.mockReset();
    ApiService.post.mockReset();
    ApiService.roundsUrl.mockReset();
    ApiService.roundsUrl.mockReturnValue('/competitions/comp/rounds');
  });

  test('when competitions exist, uses first competition ID', async () => {
    ApiService.get
      .mockResolvedValueOnce([{ id: 'comp-1' }])
      .mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }]);

    await initializeApp();

    expect(ApiService.competitionId).toBe('comp-1');
    expect(ApiService.get).toHaveBeenCalledWith('/competitions');
    expect(ApiService.get).toHaveBeenCalledWith('/competitions/comp/rounds');
    expect(ApiService.post).not.toHaveBeenCalled();
  });

  test('when no competitions exist, creates one and uses its ID', async () => {
    ApiService.get
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ApiService.post
      .mockResolvedValueOnce({ id: 'new-comp' })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await initializeApp();

    expect(ApiService.competitionId).toBe('new-comp');
    expect(ApiService.post).toHaveBeenNthCalledWith(1, '/competitions', expect.objectContaining({
      name: 'Golf Competition',
      location: null
    }));
    expect(ApiService.post).toHaveBeenCalledTimes(5);
  });

  test('when rounds exist, does not create new ones', async () => {
    ApiService.get
      .mockResolvedValueOnce([{ id: 'comp-1' }])
      .mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }]);

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
    ApiService.get
      .mockResolvedValueOnce([{ id: 'comp-1' }])
      .mockResolvedValueOnce([]);
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
    ApiService.get.mockRejectedValue(new Error('Network Error'));

    await expect(initializeApp()).rejects.toThrow('Network Error');
  });
});
