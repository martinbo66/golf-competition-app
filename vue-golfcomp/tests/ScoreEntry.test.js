jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        put: jest.fn(),
        scoresUrl: jest.fn((roundId) => `/competitions/c1/rounds/${roundId}/scores`)
    }
}));

jest.mock('@/services/NotificationService', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ApiService from '@/services/ApiService';
import NotificationService from '@/services/NotificationService';
import ScoreEntry from '../src/components/scoring/ScoreEntry.vue';
import { usePlayersStore } from '../src/stores/players';
import { useTeamsStore } from '../src/stores/teams';
import { useCoursesStore } from '../src/stores/courses';
import { useScoresStore } from '../src/stores/scores';

describe('ScoreEntry Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        ApiService.put.mockReset();
        NotificationService.success.mockClear();
        NotificationService.error.mockClear();
    });

    test('renders player list correctly', async () => {
        const playersStore = usePlayersStore();
        const teamsStore = useTeamsStore();
        const coursesStore = useCoursesStore();

        // Setup initial data
        playersStore.players = [
            { id: 'p1', name: 'Player 1', talentRating: 'A', teamId: 't1' },
            { id: 'p2', name: 'Player 2', talentRating: 'B', teamId: 't1' }
        ];
        teamsStore.teams = [
            { id: 't1', name: 'Team 1' }
        ];
        coursesStore.courses = [
            { id: 'c1', name: 'Course 1' }
        ];

        const wrapper = mount(ScoreEntry, {
            props: {
                roundId: 'round1'
            }
        });

        expect(wrapper.text()).toContain('Player 1');
        expect(wrapper.text()).toContain('Player 2');
        expect(wrapper.text()).toContain('Team 1');
    });

    test('updates score when input changes', async () => {
        const playersStore = usePlayersStore();

        playersStore.players = [
            { id: 'p1', name: 'Player 1', talentRating: 'A' }
        ];

        const wrapper = mount(ScoreEntry, {
            props: {
                roundId: 'round1'
            }
        });

        const input = wrapper.find('input[type="number"]');
        await input.setValue(72);

        // Check if the local state is updated (we can't easily check local state directly in setup script without exposing it, 
        // but we can check if the save button becomes enabled or if the value persists in the input)
        expect(input.element.value).toBe('72');
    });

    test('saves score when save all button is clicked', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        const coursesStore = useCoursesStore();

        playersStore.players = [
            { id: 'p1', name: 'Player 1', talentRating: 'A' }
        ];
        coursesStore.courses = [
            { id: 'c1', name: 'Course 1', order: 1, roundId: 'round1' }
        ];
        ApiService.put.mockResolvedValue({
            id: 'score-1',
            playerId: 'p1',
            value: 72,
            updatedAt: '2026-01-01',
            createdAt: '2026-01-01'
        });

        const wrapper = mount(ScoreEntry, {
            props: {
                roundId: 'round1'
            }
        });

        const input = wrapper.find('input[type="number"]');
        await input.setValue(72);

        const saveButton = wrapper.find('button.btn-primary');
        await saveButton.trigger('click');

        await new Promise(resolve => setTimeout(resolve, 50));

        const score = scoresStore.scoreByPlayerAndRound('p1', 'round1');
        expect(score).toBeDefined();
        expect(score.value).toBe(72);
        expect(NotificationService.success).toHaveBeenCalledWith('1 score(s) saved successfully');
    });

    test('save all button shows Saving... while request is in progress', async () => {
        const playersStore = usePlayersStore();
        const coursesStore = useCoursesStore();

        playersStore.players = [{ id: 'p1', name: 'Player 1', talentRating: 'A' }];
        coursesStore.courses = [{ id: 'c1', name: 'Course 1', order: 1, roundId: 'round1' }];

        let resolvePut;
        ApiService.put.mockImplementation(() => new Promise(resolve => { resolvePut = resolve; }));

        const wrapper = mount(ScoreEntry, { props: { roundId: 'round1' } });
        await wrapper.find('input[type="number"]').setValue(72);
        const saveBtn = wrapper.find('button.btn-primary');
        expect(saveBtn.text()).toContain('Save All Scores');

        saveBtn.trigger('click');
        await wrapper.vm.$nextTick();
        expect(saveBtn.text()).toBe('Saving...');

        await resolvePut({ id: 's1', playerId: 'p1', value: 72, updatedAt: '', createdAt: '' });
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(wrapper.find('button.btn-primary').text()).toContain('Save All Scores');
    });

    test('save error displays notification with user-friendly message', async () => {
        const playersStore = usePlayersStore();
        const coursesStore = useCoursesStore();

        playersStore.players = [{ id: 'p1', name: 'Player 1', talentRating: 'A' }];
        coursesStore.courses = [{ id: 'c1', name: 'Course 1', order: 1, roundId: 'round1' }];
        ApiService.put.mockRejectedValue(new Error('Network Error'));

        const wrapper = mount(ScoreEntry, { props: { roundId: 'round1' } });
        await wrapper.find('input[type="number"]').setValue(72);
        await wrapper.find('button.btn-primary').trigger('click');

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(NotificationService.error).toHaveBeenCalled();
    });

    test('score values from store populate inputs on load', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        const coursesStore = useCoursesStore();

        playersStore.players = [{ id: 'p1', name: 'Player 1', talentRating: 'A' }];
        coursesStore.courses = [{ id: 'c1', name: 'Course 1', order: 1, roundId: 'round1' }];
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', roundId: 'round1', value: 68 }
        ];

        const wrapper = mount(ScoreEntry, { props: { roundId: 'round1' } });
        await wrapper.vm.$nextTick();
        const input = wrapper.find('input[type="number"]');
        expect(Number(input.element.value)).toBe(68);
    });

    test('clear removes score locally', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();
        const coursesStore = useCoursesStore();

        playersStore.players = [{ id: 'p1', name: 'Player 1', talentRating: 'A' }];
        coursesStore.courses = [{ id: 'c1', name: 'Course 1', order: 1, roundId: 'round1' }];
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', roundId: 'round1', value: 72 }
        ];

        const wrapper = mount(ScoreEntry, { props: { roundId: 'round1' } });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input[type="number"]').element.value).toBe('72');

        const clearBtn = wrapper.findAll('button.btn-danger').find(b => b.text() === 'Clear');
        expect(clearBtn).toBeDefined();
        window.confirm = jest.fn(() => true);
        await clearBtn.trigger('click');
        await wrapper.vm.$nextTick();

        expect(scoresStore.scores).toHaveLength(0);
        expect(wrapper.find('input[type="number"]').element.value).toBe('');
    });
});
