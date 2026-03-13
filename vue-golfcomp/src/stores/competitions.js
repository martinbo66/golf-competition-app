import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';

function mapCompetitionResponse(response) {
    return {
        id: response.id,
        name: response.name,
        startDate: response.startDate || null,
        endDate: response.endDate || null,
        location: response.location || null,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

export const useCompetitionsStore = defineStore('competitions', {
    state: () => ({
        competitions: [],
        activeCompetition: null
    }),

    getters: {
        allCompetitions: (state) => state.competitions,
        activeCompetitionId: (state) => state.activeCompetition?.id || null
    },

    actions: {
        async fetchCompetitions() {
            const list = await ApiService.get(ApiService.competitionsUrl());
            this.competitions = (list || []).map(mapCompetitionResponse);
        },

        async createCompetition(data) {
            const created = await ApiService.post(ApiService.competitionsUrl(), {
                name: data.name,
                startDate: data.startDate || null,
                endDate: data.endDate || null,
                location: data.location || null
            });
            const mapped = mapCompetitionResponse(created);
            this.competitions.push(mapped);
            return mapped;
        },

        async updateCompetition({ id, updates }) {
            const updated = await ApiService.put(ApiService.competitionsUrl(id), {
                name: updates.name,
                startDate: updates.startDate || null,
                endDate: updates.endDate || null,
                location: updates.location || null
            });
            const mapped = mapCompetitionResponse(updated);
            const index = this.competitions.findIndex(c => c.id === id);
            if (index !== -1) {
                this.competitions[index] = mapped;
            }
            if (this.activeCompetition?.id === id) {
                this.activeCompetition = mapped;
            }
        },

        async deleteCompetition(id) {
            await ApiService.delete(ApiService.competitionsUrl(id));
            this.competitions = this.competitions.filter(c => c.id !== id);
        }
    }
});
