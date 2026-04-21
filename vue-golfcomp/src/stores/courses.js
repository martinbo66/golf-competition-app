import { defineStore } from 'pinia';
import ApiService from '@/services/ApiService';

const FALLBACK_COURSES = [
    { id: '071aaf93-773e-49d0-935e-4b825e25670f', name: 'Parkland', order: 1, roundId: null },
    { id: '2b81e674-816a-42ea-b524-54a96bfb2b14', name: 'Heathland', order: 2, roundId: null },
    { id: '38a5c806-7f44-4ebb-9472-6ec79431c5ff', name: 'Heritage Club', order: 3, roundId: null },
    { id: 'd3d8aa11-5320-477b-9602-6501dd63b186', name: 'Moorland', order: 4, roundId: null }
];

export const useCoursesStore = defineStore('courses', {
    state: () => ({
        courses: [...FALLBACK_COURSES],
        rounds: [],
        loaded: false,
        allCoursesCache: []
    }),

    getters: {
        allCourses: (state) => state.courses,
        availableCourses: (state) => [...state.allCoursesCache].sort((a, b) => a.name.localeCompare(b.name)),
        courseById: (state) => (id) => state.courses.find(course => course.id === id),
        courseByName: (state) => (name) => state.courses.find(course => course.name.toLowerCase() === name.toLowerCase()),
        coursesSorted: (state) => [...state.courses].sort((a, b) => a.order - b.order),
        roundIdByCourseId: (state) => (courseId) => {
            const course = state.courses.find(c => c.id === courseId);
            return course ? course.roundId : null;
        },
        courseIdByRoundId: (state) => (roundId) => {
            const course = state.courses.find(c => c.roundId === roundId);
            return course ? course.id : null;
        }
    },

    actions: {
        async fetchAllCourses() {
            const data = await ApiService.get(ApiService.coursesUrl());
            this.allCoursesCache = data || [];
        },

        async createCourse(courseData) {
            const created = await ApiService.post(ApiService.coursesUrl(), courseData);
            this.allCoursesCache.push(created);
            return created;
        },

        async updateCourse({ id, updates }) {
            const updated = await ApiService.put(ApiService.coursesUrl(id), updates);
            const idx = this.allCoursesCache.findIndex(c => c.id === id);
            if (idx !== -1) this.allCoursesCache[idx] = updated;
            return updated;
        },

        async deleteCourse(id) {
            try {
                await ApiService.delete(ApiService.coursesUrl(id));
            } catch (err) {
                if (err.status === 409) {
                    const e = new Error('This course is used by one or more rounds and cannot be deleted.');
                    e.status = 409;
                    throw e;
                }
                throw err;
            }
            this.allCoursesCache = this.allCoursesCache.filter(c => c.id !== id);
        },

        clearForCompetition() {
            this.courses = [...FALLBACK_COURSES];
            this.rounds = [];
            this.loaded = false;
        },

        async fetchCourses() {
            try {
                const rounds = await ApiService.get(ApiService.roundsUrl());
                this.rounds = rounds || [];
                if (this.rounds.length > 0) {
                    this.courses = [...this.rounds]
                        .sort((a, b) => {
                            const da = a.playDate ? new Date(a.playDate) : new Date(0);
                            const db = b.playDate ? new Date(b.playDate) : new Date(0);
                            return da - db;
                        })
                        .map((round, index) => ({
                            id: round.course.id,
                            name: round.course.name,
                            order: index + 1,
                            roundId: round.id,
                            playDate: round.playDate || null
                        }));
                } else {
                    this.courses = this.allCoursesCache.length > 0
                        ? this.allCoursesCache.map((c, i) => ({ id: c.id, name: c.name, order: i + 1, roundId: null }))
                        : [...FALLBACK_COURSES];
                }
                this.loaded = true;
            } catch (err) {
                // Keep fallback courses (roundId remains null)
                console.warn('Failed to fetch courses, using fallback:', err.message || err);
                this.loaded = true;
            }
        }
    }
});
