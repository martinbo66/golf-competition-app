import axios from 'axios';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    this._competitionId = null;
    this._organizationId = null;

    this.client.interceptors.response.use(
      (response) => {
        if (response.status === 204) return null;
        const apiResponse = response.data;
        if (apiResponse?.success !== undefined) {
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

  get organizationId() { return this._organizationId; }
  set organizationId(id) { this._organizationId = id; }

  get orgCompUrl() {
    if (this._organizationId) {
      return `/organizations/${this._organizationId}/competitions/${this._competitionId}`;
    }
    return `/competitions/${this._competitionId}`;
  }

  get compUrl() { return this.orgCompUrl; }

  competitionsUrl(id) {
    if (this._organizationId) {
      return id
        ? `/organizations/${this._organizationId}/competitions/${id}`
        : `/organizations/${this._organizationId}/competitions`;
    }
    return id ? `/competitions/${id}` : '/competitions';
  }

  organizationsUrl(id) { return id ? `/organizations/${id}` : '/organizations'; }
  coursesUrl(id) { return id ? `/courses/${id}` : '/courses'; }
  playersUrl(id) { return `${this.orgCompUrl}/players${id ? '/' + id : ''}`; }
  teamsUrl(id) { return `${this.orgCompUrl}/teams${id ? '/' + id : ''}`; }
  roundsUrl(id) { return `${this.orgCompUrl}/rounds${id ? '/' + id : ''}`; }
  scoresUrl(roundId) { return `${this.orgCompUrl}/rounds/${roundId}/scores`; }
  leaderboardsUrl(type) { return `${this.orgCompUrl}/leaderboards/${type}`; }

  async get(url) { return this.client.get(url); }
  async post(url, data) { return this.client.post(url, data); }
  async put(url, data) { return this.client.put(url, data); }
  async delete(url) { return this.client.delete(url); }
}

export default new ApiService();
