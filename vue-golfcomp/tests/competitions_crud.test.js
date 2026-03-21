/**
 * Tests for competitions store CRUD actions:
 * fetchCompetitions, createCompetition, updateCompetition, deleteCompetition.
 *
 * Round and setActiveCompetition tests are in competitions.test.js.
 */

jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        _competitionId: null,
        get competitionId() { return this._competitionId; },
        set competitionId(id) { this._competitionId = id; },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        competitionsUrl: jest.fn(id => (id ? `/competitions/${id}` : '/competitions')),
        roundsUrl(id) {
            const cid = this._competitionId || 'unknown';
            return id ? `/competitions/${cid}/rounds/${id}` : `/competitions/${cid}/rounds`;
        },
        playersUrl(id) {
            const cid = this._competitionId || 'unknown';
            return id ? `/competitions/${cid}/players/${id}` : `/competitions/${cid}/players`;
        },
        teamsUrl(id) {
            const cid = this._competitionId || 'unknown';
            return id ? `/competitions/${cid}/teams/${id}` : `/competitions/${cid}/teams`;
        },
        scoresUrl(roundId) {
            const cid = this._competitionId || 'unknown';
            return `/competitions/${cid}/rounds/${roundId}/scores`;
        }
    }
}));

import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import { useCompetitionsStore } from '@/stores/competitions';

const makeComp = (overrides = {}) => ({
    id: 'c1',
    name: 'Summer Cup',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    location: 'Parkland',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides
});

describe('competitions store - CRUD', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService._competitionId = null;
        ApiService.get.mockReset();
        ApiService.post.mockReset();
        ApiService.put.mockReset();
        ApiService.delete.mockReset();
        ApiService.get.mockResolvedValue([]);
    });

    describe('fetchCompetitions', () => {
        test('loads and maps competitions from API', async () => {
            const store = useCompetitionsStore();
            ApiService.get.mockResolvedValue([makeComp(), makeComp({ id: 'c2', name: 'Winter League' })]);

            await store.fetchCompetitions();

            expect(ApiService.get).toHaveBeenCalledWith('/competitions');
            expect(store.allCompetitions).toHaveLength(2);
            expect(store.allCompetitions[0].id).toBe('c1');
            expect(store.allCompetitions[1].name).toBe('Winter League');
        });

        test('maps null optional fields correctly', async () => {
            const store = useCompetitionsStore();
            ApiService.get.mockResolvedValue([makeComp({ startDate: null, endDate: null, location: null })]);

            await store.fetchCompetitions();

            expect(store.allCompetitions[0].startDate).toBeNull();
            expect(store.allCompetitions[0].endDate).toBeNull();
            expect(store.allCompetitions[0].location).toBeNull();
        });

        test('handles empty list', async () => {
            const store = useCompetitionsStore();
            ApiService.get.mockResolvedValue([]);
            await store.fetchCompetitions();
            expect(store.allCompetitions).toHaveLength(0);
        });

        test('handles null response gracefully', async () => {
            const store = useCompetitionsStore();
            ApiService.get.mockResolvedValue(null);
            await store.fetchCompetitions();
            expect(store.allCompetitions).toHaveLength(0);
        });
    });

    describe('createCompetition', () => {
        test('POSTs and adds mapped competition to state', async () => {
            const store = useCompetitionsStore();
            ApiService.post.mockResolvedValue(makeComp());

            const result = await store.createCompetition({
                name: 'Summer Cup',
                startDate: '2026-06-01',
                endDate: '2026-06-30',
                location: 'Parkland'
            });

            expect(ApiService.post).toHaveBeenCalledWith('/competitions', {
                name: 'Summer Cup',
                startDate: '2026-06-01',
                endDate: '2026-06-30',
                location: 'Parkland'
            });
            expect(store.allCompetitions).toHaveLength(1);
            expect(result.id).toBe('c1');
        });

        test('converts undefined optional fields to null', async () => {
            const store = useCompetitionsStore();
            ApiService.post.mockResolvedValue(makeComp({ startDate: null, endDate: null, location: null }));

            await store.createCompetition({ name: 'Minimal' });

            expect(ApiService.post).toHaveBeenCalledWith('/competitions', {
                name: 'Minimal',
                startDate: null,
                endDate: null,
                location: null
            });
        });
    });

    describe('updateCompetition', () => {
        test('PUTs and updates competition in state', async () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp()];
            const updated = makeComp({ name: 'Updated Cup' });
            ApiService.put.mockResolvedValue(updated);

            await store.updateCompetition({ id: 'c1', updates: { name: 'Updated Cup', startDate: '2026-06-01', endDate: '2026-06-30', location: 'Parkland' } });

            expect(ApiService.put).toHaveBeenCalledWith('/competitions/c1', expect.objectContaining({ name: 'Updated Cup' }));
            expect(store.allCompetitions[0].name).toBe('Updated Cup');
        });

        test('also updates activeCompetition when it matches', async () => {
            const store = useCompetitionsStore();
            const comp = makeComp();
            store.competitions = [comp];
            store.activeCompetition = { ...comp };
            const updated = makeComp({ name: 'New Name' });
            ApiService.put.mockResolvedValue(updated);

            await store.updateCompetition({ id: 'c1', updates: { name: 'New Name', startDate: null, endDate: null, location: null } });

            expect(store.activeCompetition.name).toBe('New Name');
        });

        test('does not change activeCompetition when id does not match', async () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp(), makeComp({ id: 'c2', name: 'Other' })];
            store.activeCompetition = makeComp({ id: 'c2', name: 'Other' });
            ApiService.put.mockResolvedValue(makeComp({ name: 'Updated' }));

            await store.updateCompetition({ id: 'c1', updates: { name: 'Updated', startDate: null, endDate: null, location: null } });

            expect(store.activeCompetition.name).toBe('Other');
        });
    });

    describe('deleteCompetition', () => {
        test('DELETEs and removes competition from state', async () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp(), makeComp({ id: 'c2', name: 'Other' })];
            ApiService.delete.mockResolvedValue(undefined);

            await store.deleteCompetition('c1');

            expect(ApiService.delete).toHaveBeenCalledWith('/competitions/c1');
            expect(store.allCompetitions).toHaveLength(1);
            expect(store.allCompetitions[0].id).toBe('c2');
        });

        test('clears activeCompetition and competitionId when active is deleted', async () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp()];
            store.activeCompetition = makeComp();
            ApiService.competitionId = 'c1';
            ApiService.delete.mockResolvedValue(undefined);

            await store.deleteCompetition('c1');

            expect(store.activeCompetition).toBeNull();
            expect(ApiService.competitionId).toBeNull();
        });

        test('does not clear activeCompetition when a different competition is deleted', async () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp(), makeComp({ id: 'c2' })];
            store.activeCompetition = makeComp({ id: 'c2' });
            ApiService.delete.mockResolvedValue(undefined);

            await store.deleteCompetition('c1');

            expect(store.activeCompetition).not.toBeNull();
            expect(store.activeCompetition.id).toBe('c2');
        });
    });

    describe('getters', () => {
        test('allCompetitions returns all competitions', () => {
            const store = useCompetitionsStore();
            store.competitions = [makeComp(), makeComp({ id: 'c2' })];
            expect(store.allCompetitions).toHaveLength(2);
        });

        test('activeCompetitionId returns id of active competition', () => {
            const store = useCompetitionsStore();
            store.activeCompetition = makeComp();
            expect(store.activeCompetitionId).toBe('c1');
        });

        test('activeCompetitionId returns null when no active competition', () => {
            const store = useCompetitionsStore();
            expect(store.activeCompetitionId).toBeNull();
        });
    });
});
