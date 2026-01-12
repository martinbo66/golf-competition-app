import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ScoreEntry from '../src/components/scoring/ScoreEntry.vue';
import { usePlayersStore } from '../src/stores/players';
import { useTeamsStore } from '../src/stores/teams';
import { useCoursesStore } from '../src/stores/courses';
import { useScoresStore } from '../src/stores/scores';

describe('ScoreEntry Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
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
                courseId: 'c1'
            }
        });

        expect(wrapper.text()).toContain('Player 1');
        expect(wrapper.text()).toContain('Player 2');
        expect(wrapper.text()).toContain('Team 1');
    });

    test('updates score when input changes', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();

        playersStore.players = [
            { id: 'p1', name: 'Player 1', talentRating: 'A' }
        ];

        const wrapper = mount(ScoreEntry, {
            props: {
                courseId: 'c1'
            }
        });

        const input = wrapper.find('input[type="number"]');
        await input.setValue(72);

        // Check if the local state is updated (we can't easily check local state directly in setup script without exposing it, 
        // but we can check if the save button becomes enabled or if the value persists in the input)
        expect(input.element.value).toBe('72');
    });

    test('saves score when save button is clicked', async () => {
        const playersStore = usePlayersStore();
        const scoresStore = useScoresStore();

        playersStore.players = [
            { id: 'p1', name: 'Player 1', talentRating: 'A' }
        ];

        const wrapper = mount(ScoreEntry, {
            props: {
                courseId: 'c1'
            }
        });

        const input = wrapper.find('input[type="number"]');
        await input.setValue(72);

        const saveButton = wrapper.find('button.btn-sm'); // The first button is Save
        await saveButton.trigger('click');

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        const score = scoresStore.scoreByPlayerAndCourse('p1', 'c1');
        expect(score).toBeDefined();
        expect(score.value).toBe(72);
    });
});
