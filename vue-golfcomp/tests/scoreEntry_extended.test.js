/**
 * ScoreEntry extended tests: filtering, validation, dirty tracking,
 * summary stats, and edge cases not covered in scoreEntry.test.js.
 */
jest.mock('@/services/NotificationService', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() }
}));

jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        put: jest.fn(),
        scoresUrl: jest.fn((roundId) => `/competitions/c1/rounds/${roundId}/scores`)
    }
}));

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ScoreEntry from '../src/components/scoring/ScoreEntry.vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import { useScoresStore } from '@/stores/scores';
import NotificationService from '@/services/NotificationService';

const COURSE_ID = 'course-x';
const TEAMS = [
    { id: 't1', name: 'Eagles' },
    { id: 't2', name: 'Hawks' }
];
const PLAYERS = [
    { id: 'p1', name: 'Alice', talentRating: 'A', teamId: 't1' },
    { id: 'p2', name: 'Bob',   talentRating: 'B', teamId: 't2' },
    { id: 'p3', name: 'Carol', talentRating: 'C', teamId: null }
];
const SCORES = [
    { id: 's1', playerId: 'p1', courseId: COURSE_ID, value: 70 },
    { id: 's2', playerId: 'p2', courseId: COURSE_ID, value: 72 }
];

const mountEntry = (courseId = COURSE_ID) =>
    mount(ScoreEntry, { props: { courseId } });

beforeEach(() => {
    setActivePinia(createPinia());
    NotificationService.success.mockClear();
    NotificationService.error.mockClear();
});

// ============================================================
// Empty state
// ============================================================

describe('ScoreEntry (extended) - empty state', () => {
    test('shows empty-state message when no players', () => {
        const wrapper = mountEntry();
        expect(wrapper.find('.empty-state').exists()).toBe(true);
    });
});

// ============================================================
// Score loading
// ============================================================

describe('ScoreEntry (extended) - score loading', () => {
    test('populates score inputs from store on mount', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;

        const wrapper = mountEntry();
        expect(wrapper.vm.scores['p1']).toBe(70);
        expect(wrapper.vm.scores['p2']).toBe(72);
        expect(wrapper.vm.scores['p3']).toBe('');
    });

    test('reloads scores when courseId prop changes', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        playersStore.players = [PLAYERS[0]];
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', courseId: COURSE_ID, value: 70 },
            { id: 's2', playerId: 'p1', courseId: 'course-y', value: 65 }
        ];

        const wrapper = mountEntry(COURSE_ID);
        expect(wrapper.vm.scores['p1']).toBe(70);

        await wrapper.setProps({ courseId: 'course-y' });
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.scores['p1']).toBe(65);
    });
});

// ============================================================
// Filtering
// ============================================================

describe('ScoreEntry (extended) - filtering', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;
    });

    test('shows only unassigned players when team filter is "unassigned"', async () => {
        const wrapper = mountEntry();
        await wrapper.find('#filterTeam').setValue('unassigned');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('tbody tr')).toHaveLength(1);
        expect(wrapper.text()).toContain('Carol');
    });

    test('shows only players in chosen team when a specific team is selected', async () => {
        const wrapper = mountEntry();
        await wrapper.find('#filterTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('tbody tr')).toHaveLength(1);
        expect(wrapper.text()).toContain('Alice');
    });

    test('shows only scored players when status filter is "scored"', async () => {
        const wrapper = mountEntry();
        await wrapper.find('#filterScored').setValue('scored');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    });

    test('shows only unscored players when status filter is "unscored"', async () => {
        const wrapper = mountEntry();
        await wrapper.find('#filterScored').setValue('unscored');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('tbody tr')).toHaveLength(1);
        expect(wrapper.text()).toContain('Carol');
    });
});

// ============================================================
// Score validation
// ============================================================

describe('ScoreEntry (extended) - score input validation', () => {
    beforeEach(() => {
        const playersStore = usePlayersStore();
        playersStore.players = [PLAYERS[0]];
    });

    test('empty input clears any existing error', () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = '';
        wrapper.vm.validateScoreInput('p1');
        expect(wrapper.vm.scoreErrors['p1']).toBeNull();
    });

    test('score above 72 sets a validation error', () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 99;
        wrapper.vm.validateScoreInput('p1');
        expect(wrapper.vm.scoreErrors['p1']).toBeTruthy();
    });

    test('score below 0 sets a validation error', () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = -1;
        wrapper.vm.validateScoreInput('p1');
        expect(wrapper.vm.scoreErrors['p1']).toBeTruthy();
    });

    test('valid score within range clears any existing error', () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 99;
        wrapper.vm.validateScoreInput('p1');
        wrapper.vm.scores['p1'] = 70;
        wrapper.vm.validateScoreInput('p1');
        expect(wrapper.vm.scoreErrors['p1']).toBeNull();
    });
});

// ============================================================
// Dirty tracking
// ============================================================

describe('ScoreEntry (extended) - dirty tracking', () => {
    beforeEach(() => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
    });

    test('markDirty adds playerId to dirtyScores set', () => {
        const wrapper = mountEntry();
        expect(wrapper.vm.dirtyScores.has('p1')).toBe(false);
        wrapper.vm.markDirty('p1');
        expect(wrapper.vm.dirtyScores.has('p1')).toBe(true);
    });

    test('validScoresCount counts players with non-empty, error-free scores', async () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        wrapper.vm.scores['p2'] = 72;
        wrapper.vm.scores['p3'] = '';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.validScoresCount).toBe(2);
    });

    test('validScoresCount excludes players with validation errors', async () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 99;
        wrapper.vm.scoreErrors['p1'] = 'Out of range';
        wrapper.vm.scores['p2'] = 70;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.validScoresCount).toBe(1);
    });
});

// ============================================================
// saveAllScores
// ============================================================

describe('ScoreEntry (extended) - saveAllScores', () => {
    beforeEach(() => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
    });

    test('does nothing when no valid scores exist', async () => {
        const scoresStore = useScoresStore();
        const spy = jest.spyOn(scoresStore, 'updateScore').mockResolvedValue();
        const wrapper = mountEntry();
        await wrapper.vm.saveAllScores();
        expect(spy).not.toHaveBeenCalled();
    });

    test('calls updateScore for each player with a valid score', async () => {
        const scoresStore = useScoresStore();
        const spy = jest.spyOn(scoresStore, 'updateScore').mockResolvedValue();
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        wrapper.vm.scores['p2'] = 72;
        await wrapper.vm.saveAllScores();
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith({ playerId: 'p1', courseId: COURSE_ID, value: 70 });
    });

    test('shows success notification when all saves succeed', async () => {
        const scoresStore = useScoresStore();
        jest.spyOn(scoresStore, 'updateScore').mockResolvedValue();
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        await wrapper.vm.saveAllScores();
        expect(NotificationService.success).toHaveBeenCalled();
        expect(NotificationService.error).not.toHaveBeenCalled();
    });

    test('shows error notification when some saves fail', async () => {
        const scoresStore = useScoresStore();
        jest.spyOn(scoresStore, 'updateScore')
            .mockResolvedValueOnce()
            .mockRejectedValueOnce(new Error('fail'));
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        wrapper.vm.scores['p2'] = 72;
        await wrapper.vm.saveAllScores();
        expect(NotificationService.error).toHaveBeenCalled();
    });

    test('removes successfully saved players from dirtyScores', async () => {
        const scoresStore = useScoresStore();
        jest.spyOn(scoresStore, 'updateScore').mockResolvedValue();
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        wrapper.vm.markDirty('p1');
        await wrapper.vm.saveAllScores();
        expect(wrapper.vm.dirtyScores.has('p1')).toBe(false);
    });
});

// ============================================================
// clearScore
// ============================================================

describe('ScoreEntry (extended) - clearScore', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
        scoresStore.scores = [...SCORES];
        global.confirm = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
        delete global.confirm;
    });

    test('calls deleteScore when user confirms', async () => {
        const scoresStore = useScoresStore();
        const spy = jest.spyOn(scoresStore, 'deleteScore');
        const wrapper = mountEntry();
        await wrapper.vm.clearScore('p1');
        expect(spy).toHaveBeenCalledWith('s1');
    });

    test('clears the local score input after deletion', async () => {
        const wrapper = mountEntry();
        wrapper.vm.scores['p1'] = 70;
        await wrapper.vm.clearScore('p1');
        expect(wrapper.vm.scores['p1']).toBe('');
    });

    test('clears scoreError for the player after deletion', async () => {
        const wrapper = mountEntry();
        wrapper.vm.scoreErrors['p1'] = 'Some error';
        await wrapper.vm.clearScore('p1');
        expect(wrapper.vm.scoreErrors['p1']).toBeNull();
    });

    test('removes player from dirtyScores after deletion', async () => {
        const wrapper = mountEntry();
        wrapper.vm.markDirty('p1');
        await wrapper.vm.clearScore('p1');
        expect(wrapper.vm.dirtyScores.has('p1')).toBe(false);
    });

    test('does NOT call deleteScore when user cancels the confirm dialog', async () => {
        global.confirm = jest.fn().mockReturnValue(false);
        const scoresStore = useScoresStore();
        const spy = jest.spyOn(scoresStore, 'deleteScore');
        const wrapper = mountEntry();
        await wrapper.vm.clearScore('p1');
        expect(spy).not.toHaveBeenCalled();
    });

    test('does nothing when player is not found in store', async () => {
        const scoresStore = useScoresStore();
        const spy = jest.spyOn(scoresStore, 'deleteScore');
        const wrapper = mountEntry();
        await wrapper.vm.clearScore('nonexistent-player');
        expect(spy).not.toHaveBeenCalled();
    });

    test('shows success notification after clearing', async () => {
        const wrapper = mountEntry();
        await wrapper.vm.clearScore('p1');
        expect(NotificationService.success).toHaveBeenCalled();
    });
});

// ============================================================
// Summary statistics
// ============================================================

describe('ScoreEntry (extended) - summary statistics', () => {
    test('scoredCount is 0 when no scores exist', () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const wrapper = mountEntry();
        expect(wrapper.vm.scoredCount).toBe(0);
    });

    test('scoredCount reflects how many filtered players have scores', () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;
        const wrapper = mountEntry();
        expect(wrapper.vm.scoredCount).toBe(2);
    });

    test('averageScore is N/A when no players are scored', () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const wrapper = mountEntry();
        expect(wrapper.vm.averageScore).toBe('N/A');
    });

    test('averageScore is computed correctly across scored players', () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;
        const wrapper = mountEntry();
        expect(wrapper.vm.averageScore).toBe('71.0');
    });

    test('bestScore is N/A when no players are scored', () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const wrapper = mountEntry();
        expect(wrapper.vm.bestScore).toBe('N/A');
    });

    test('bestScore returns the maximum score', () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;
        const wrapper = mountEntry();
        expect(wrapper.vm.bestScore).toBe(72);
    });

    test('worstScore is N/A when no players are scored', () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const wrapper = mountEntry();
        expect(wrapper.vm.worstScore).toBe('N/A');
    });

    test('worstScore returns the minimum score', () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        playersStore.players = PLAYERS;
        scoresStore.scores = SCORES;
        const wrapper = mountEntry();
        expect(wrapper.vm.worstScore).toBe(70);
    });
});
