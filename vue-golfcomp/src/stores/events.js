import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';

function mapEventResponse(response) {
    return {
        id: response.id,
        competitionId: response.competitionId,
        name: response.name,
        eventDate: response.eventDate || null,
        note: response.note || '',
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
    };
}

export const useEventsStore = defineStore('events', {
    state: () => ({
        events: []
    }),

    getters: {
        allEvents: (state) => state.events,
        eventById: (state) => (id) => state.events.find(e => e.id === id) || null
    },

    actions: {
        async fetchEvents() {
            const list = await ApiService.get(ApiService.eventsUrl());
            this.events = (list || []).map(mapEventResponse);
        },

        async createEvent({ name, eventDate, note }) {
            const created = await ApiService.post(ApiService.eventsUrl(), {
                name,
                eventDate,
                note: note || null
            });
            const mapped = mapEventResponse(created);
            this.events.push(mapped);
            return mapped;
        },

        async updateEvent({ id, name, eventDate, note }) {
            const updated = await ApiService.put(ApiService.eventsUrl(id), {
                name,
                eventDate,
                note: note || null
            });
            const mapped = mapEventResponse(updated);
            const index = this.events.findIndex(e => e.id === id);
            if (index !== -1) this.events[index] = mapped;
            else this.events.push(mapped);
            return mapped;
        },

        async deleteEvent(id) {
            await ApiService.delete(ApiService.eventsUrl(id));
            this.events = this.events.filter(e => e.id !== id);
        }
    }
});
