import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCompetitionsStore } from '@/stores/competitions';

function pickDefaultCompetition(competitions) {
    const today = new Date().toISOString().split('T')[0];
    const currentAndFuture = competitions
        .filter(c => !c.endDate || c.endDate >= today)
        .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    return currentAndFuture[0] || competitions[0] || null;
}

const DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

function mapOrganizationResponse(response) {
    return {
        id: response.id,
        name: response.name,
        slug: response.slug,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

export const useOrganizationsStore = defineStore('organizations', {
    state: () => ({
        organizations: [],
        activeOrganization: null
    }),

    getters: {
        allOrganizations: (state) => state.organizations,
        activeOrganizationId: (state) => state.activeOrganization?.id || null,
        hasMultipleOrganizations: (state) => state.organizations.length > 1
    },

    actions: {
        async fetchOrganizations() {
            const list = await ApiService.get(ApiService.organizationsUrl());
            this.organizations = (list || []).map(mapOrganizationResponse);
        },

        async setActiveOrganization(org) {
            this.activeOrganization = org;
            ApiService.organizationId = org.id;

            const competitionsStore = useCompetitionsStore();
            await competitionsStore.fetchCompetitions();
            const best = pickDefaultCompetition(competitionsStore.competitions);
            if (best) {
                await competitionsStore.setActiveCompetition(best);
            }
        },

        async createOrganization(data) {
            const created = await ApiService.post(ApiService.organizationsUrl(), {
                name: data.name,
                slug: data.slug
            });
            const mapped = mapOrganizationResponse(created);
            this.organizations.push(mapped);
            return mapped;
        },

        async updateOrganization({ id, updates }) {
            const updated = await ApiService.put(ApiService.organizationsUrl(id), {
                name: updates.name,
                slug: updates.slug
            });
            const mapped = mapOrganizationResponse(updated);
            const index = this.organizations.findIndex(o => o.id === id);
            if (index !== -1) this.organizations[index] = mapped;
            if (this.activeOrganization?.id === id) this.activeOrganization = mapped;
            return mapped;
        },

        async deleteOrganization(id) {
            await ApiService.delete(ApiService.organizationsUrl(id));
            this.organizations = this.organizations.filter(o => o.id !== id);
            if (this.activeOrganization?.id === id) {
                this.activeOrganization = null;
                ApiService.organizationId = null;
            }
        }
    }
});

export { DEFAULT_ORG_ID, pickDefaultCompetition };
