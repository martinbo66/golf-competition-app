import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCoursesStore } from '@/stores/courses';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';
import { usePayoutsStore } from '@/stores/payouts';
import { useEventsStore } from '@/stores/events';
import { useUiStore } from '@/stores/ui';

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
            if (this.activeCompetition) {
                const refreshed = this.competitions.find(c => c.id === this.activeCompetition.id);
                this.activeCompetition = refreshed || null;
            }
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
            await this.setActiveCompetition(mapped);
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
            if (this.activeCompetition?.id === id) {
                this.activeCompetition = null;
                ApiService.competitionId = null;
            }
        },

        /**
         * Create a round for the active competition, then refresh courses (round mapping).
         * @param {{ courseId: string, playDate: string, roundNumber: number }} data
         */
        async createRound(data) {
            const id = this.activeCompetition?.id;
            if (!id) throw new Error('No active competition');
            await ApiService.post(ApiService.roundsUrl(), {
                courseId: data.courseId,
                playDate: data.playDate,
                roundNumber: data.roundNumber
            });
            const coursesStore = useCoursesStore();
            await coursesStore.fetchCourses();
        },

        /**
         * Update a round's courseId and/or playDate, then refresh courses.
         * @param {{ roundId: string, courseId: string, playDate: string }} data
         */
        async updateRound({ roundId, courseId, playDate }) {
            const id = this.activeCompetition?.id;
            if (!id) throw new Error('No active competition');
            await ApiService.put(ApiService.roundsUrl(roundId), { courseId, playDate });
            const coursesStore = useCoursesStore();
            await coursesStore.fetchCourses();
        },

        /**
         * Delete a round for the active competition, then refresh courses.
         * @param {string} roundId
         */
        async deleteRound(roundId) {
            const id = this.activeCompetition?.id;
            if (!id) throw new Error('No active competition');
            await ApiService.delete(ApiService.roundsUrl(roundId));
            const coursesStore = useCoursesStore();
            await coursesStore.fetchCourses();
        },

        /**
         * Set the active competition and reload all data (courses, players, teams, scores).
         * Shows global loading overlay during reload. Call after user confirms switch.
         */
        async setActiveCompetition(comp) {
            this.activeCompetition = comp;
            ApiService.competitionId = comp.id;

            const uiStore = useUiStore();
            const coursesStore = useCoursesStore();
            const playersStore = usePlayersStore();
            const teamsStore = useTeamsStore();
            const scoresStore = useScoresStore();
            const payoutsStore = usePayoutsStore();
            const eventsStore = useEventsStore();

            uiStore.setLoading(true);
            try {
                await coursesStore.fetchCourses();
                await Promise.all([
                    playersStore.fetchPlayers(),
                    teamsStore.fetchTeams()
                ]);
                await Promise.all([
                    scoresStore.fetchScores(),
                    payoutsStore.fetchPayouts(),
                    eventsStore.fetchEvents()
                ]);
            } finally {
                uiStore.setLoading(false);
            }
        },

        clearCompetitionContext() {
            this.activeCompetition = null;
            ApiService.competitionId = null;

            const coursesStore = useCoursesStore();
            const playersStore = usePlayersStore();
            const teamsStore = useTeamsStore();
            const scoresStore = useScoresStore();
            const payoutsStore = usePayoutsStore();
            const eventsStore = useEventsStore();

            coursesStore.clearForCompetition();
            playersStore.players = [];
            teamsStore.teams = [];
            scoresStore.scores = [];
            payoutsStore.payouts = [];
            eventsStore.events = [];
        }
    }
});
