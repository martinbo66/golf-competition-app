import axios from 'axios';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    this._competitionId = null;

    this.client.interceptors.response.use(
      (response) => {
        if (response.status === 204) return null;
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== undefined) {
          return apiResponse.data;
        }
        return response.data;
      },
      (error) => {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          const err = new Error(apiError.message || 'API Error');
          err.code = apiError.code;
          err.status = error.response.status;
          console.error('[ApiService] API Error:', err.code, err.message);
          throw err;
        }
        console.error('[ApiService] Request Error:', error.message);
        throw error;
      }
    );
  }

  get competitionId() { return this._competitionId; }
  set competitionId(id) { this._competitionId = id; }

  get compUrl() { return `/competitions/${this._competitionId}`; }

  competitionsUrl(id) { return id ? `/competitions/${id}` : '/competitions'; }
  playersUrl(id) { return `${this.compUrl}/players${id ? '/' + id : ''}`; }
  teamsUrl(id) { return `${this.compUrl}/teams${id ? '/' + id : ''}`; }
  roundsUrl(id) { return `${this.compUrl}/rounds${id ? '/' + id : ''}`; }
  scoresUrl(roundId) { return `${this.compUrl}/rounds/${roundId}/scores`; }
  leaderboardsUrl(type) { return `${this.compUrl}/leaderboards/${type}`; }

  async get(url) { return this.client.get(url); }
  async post(url, data) { return this.client.post(url, data); }
  async put(url, data) { return this.client.put(url, data); }
  async delete(url) { return this.client.delete(url); }
}

export default new ApiService();
