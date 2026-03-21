/**
 * TeamList component tests.
 * Covers: empty state, team rendering, getTeamInitials, logo display,
 * player/talent stats, add/edit/delete team flows, and team generation.
 */

jest.mock('@/services/NotificationService', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }
}));

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import TeamList from '../src/components/admin/TeamList.vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import NotificationService from '@/services/NotificationService';
import TeamForm from '../src/components/admin/TeamForm.vue';
import ConfirmationDialog from '../src/components/shared/ConfirmationDialog.vue';

const mountTeamList = () => mount(TeamList, {
    global: {
        stubs: { TeamForm: true, ConfirmationDialog: true }
    }
});

beforeEach(() => {
    setActivePinia(createPinia());
    jest.clearAllMocks();
});

// ============================================================
// Empty state
// ============================================================

describe('TeamList - empty state', () => {
    test('shows empty-state message when no teams', () => {
        const wrapper = mountTeamList();
        expect(wrapper.find('.empty-state').exists()).toBe(true);
    });

    test('does not render teams-grid when no teams', () => {
        const wrapper = mountTeamList();
        expect(wrapper.find('.teams-grid').exists()).toBe(false);
    });
});

// ============================================================
// Team rendering
// ============================================================

describe('TeamList - team rendering', () => {
    test('renders a card for each team', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [
            { id: 't1', name: 'Eagles', logoUrl: null },
            { id: 't2', name: 'Hawks', logoUrl: null }
        ];
        const wrapper = mountTeamList();
        expect(wrapper.findAll('.team-card')).toHaveLength(2);
        expect(wrapper.find('.empty-state').exists()).toBe(false);
    });

    test('shows team name in each card header', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        expect(wrapper.find('.team-header h3').text()).toBe('Eagles');
    });

    test('shows logo-placeholder when team has no logoUrl', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        expect(wrapper.find('.logo-placeholder').exists()).toBe(true);
        expect(wrapper.find('img.logo-image').exists()).toBe(false);
    });

    test('shows logo img when team has a logoUrl', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: 'data:image/png;base64,abc' }];
        const wrapper = mountTeamList();
        expect(wrapper.find('img.logo-image').exists()).toBe(true);
        expect(wrapper.find('.logo-placeholder').exists()).toBe(false);
    });

    test('shows player count from playersByTeam', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        playersStore.players = [
            { id: 'p1', name: 'Alice', talentRating: 'A', teamId: 't1' },
            { id: 'p2', name: 'Bob', talentRating: 'B', teamId: 't1' }
        ];
        const wrapper = mountTeamList();
        // First stat-value is player count
        expect(wrapper.find('.stat-value').text()).toBe('2');
    });

    test('shows talent distribution counts A/B/C/D', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        playersStore.players = [
            { id: 'p1', talentRating: 'A', teamId: 't1' },
            { id: 'p2', talentRating: 'A', teamId: 't1' },
            { id: 'p3', talentRating: 'B', teamId: 't1' }
        ];
        const wrapper = mountTeamList();
        const badges = wrapper.findAll('.talent-badge');
        expect(badges[0].text()).toBe('2'); // A
        expect(badges[1].text()).toBe('1'); // B
        expect(badges[2].text()).toBe('0'); // C
        expect(badges[3].text()).toBe('0'); // D
    });

    test('shows no-players message when team has no players', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        expect(wrapper.find('.no-players').exists()).toBe(true);
    });

    test('lists player names when team has players', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        playersStore.players = [{ id: 'p1', name: 'Alice', talentRating: 'A', teamId: 't1' }];
        const wrapper = mountTeamList();
        expect(wrapper.find('.team-players li').text()).toContain('Alice');
    });
});

// ============================================================
// getTeamInitials (tested via logo-placeholder content)
// ============================================================

describe('TeamList - getTeamInitials', () => {
    const getInitials = (name) => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name, logoUrl: null }];
        return mountTeamList().find('.logo-placeholder').text();
    };

    test('single word: first two letters uppercased', () => {
        expect(getInitials('Eagles')).toBe('EA');
    });

    test('two words: first letter of each', () => {
        expect(getInitials('Team Alpha')).toBe('TA');
    });

    test('three or more words: first three initials', () => {
        expect(getInitials('Bay Area Golfers Club')).toBe('BAG');
    });

    test("apostrophe treated as word separator (O'Brien Golf → O, Brien, Golf → OBG)", () => {
        expect(getInitials("O'Brien Golf")).toBe('OBG');
    });

    test('empty name returns TM', () => {
        expect(getInitials('')).toBe('TM');
    });
});

// ============================================================
// Add Team modal
// ============================================================

describe('TeamList - Add Team modal', () => {
    test('no modal shown initially', () => {
        const wrapper = mountTeamList();
        expect(wrapper.find('.modal').exists()).toBe(false);
    });

    test('clicking Add Team button shows the add modal', async () => {
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[0].trigger('click');
        expect(wrapper.find('.modal').exists()).toBe(true);
        expect(wrapper.find('.modal h3').text()).toBe('Add Team');
    });

    test('close button hides the modal', async () => {
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[0].trigger('click');
        await wrapper.find('.close-btn').trigger('click');
        expect(wrapper.find('.modal').exists()).toBe(false);
    });

    test('TeamForm cancel event closes the modal', async () => {
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[0].trigger('click');
        await nextTick();
        await wrapper.findComponent(TeamForm).vm.$emit('cancel');
        await nextTick();
        expect(wrapper.find('.modal').exists()).toBe(false);
    });

    test('TeamForm save with no id calls addTeam and shows success', async () => {
        const teamsStore = useTeamsStore();
        jest.spyOn(teamsStore, 'addTeam').mockResolvedValue('t-new');
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[0].trigger('click');
        await nextTick();
        await wrapper.findComponent(TeamForm).vm.$emit('save', { name: 'New Team' });
        await nextTick();
        expect(teamsStore.addTeam).toHaveBeenCalledWith({ name: 'New Team' });
        expect(NotificationService.success).toHaveBeenCalled();
    });

    test('addTeam failure shows error notification', async () => {
        const teamsStore = useTeamsStore();
        jest.spyOn(teamsStore, 'addTeam').mockRejectedValue(new Error('Server error'));
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[0].trigger('click');
        await nextTick();
        await wrapper.findComponent(TeamForm).vm.$emit('save', { name: 'New Team' });
        await nextTick();
        expect(NotificationService.error).toHaveBeenCalled();
    });
});

// ============================================================
// Edit team
// ============================================================

describe('TeamList - edit team', () => {
    test('clicking edit button shows edit modal', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        await wrapper.find('[title="Edit Team"]').trigger('click');
        expect(wrapper.find('.modal h3').text()).toBe('Edit Team');
    });

    test('TeamForm save with existing id calls updateTeam', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        jest.spyOn(teamsStore, 'updateTeam').mockResolvedValue();
        const wrapper = mountTeamList();
        await wrapper.find('[title="Edit Team"]').trigger('click');
        await nextTick();
        await wrapper.findComponent(TeamForm).vm.$emit('save', { id: 't1', name: 'Eagles Updated' });
        await nextTick();
        expect(teamsStore.updateTeam).toHaveBeenCalledWith({
            id: 't1',
            updates: { id: 't1', name: 'Eagles Updated' }
        });
        expect(NotificationService.success).toHaveBeenCalled();
    });

    test('updateTeam failure shows error notification', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        jest.spyOn(teamsStore, 'updateTeam').mockRejectedValue(new Error('Conflict'));
        const wrapper = mountTeamList();
        await wrapper.find('[title="Edit Team"]').trigger('click');
        await nextTick();
        await wrapper.findComponent(TeamForm).vm.$emit('save', { id: 't1', name: 'Eagles X' });
        await nextTick();
        expect(NotificationService.error).toHaveBeenCalled();
    });
});

// ============================================================
// Delete flow
// ============================================================

describe('TeamList - delete flow', () => {
    const setup = () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        return { teamsStore, wrapper };
    };

    test('ConfirmationDialog :show is false before clicking delete', () => {
        const { wrapper } = setup();
        expect(wrapper.findComponent(ConfirmationDialog).props('show')).toBe(false);
    });

    test('clicking delete sets :show to true on ConfirmationDialog', async () => {
        const { wrapper } = setup();
        await wrapper.find('[title="Delete Team"]').trigger('click');
        await nextTick();
        expect(wrapper.findComponent(ConfirmationDialog).props('show')).toBe(true);
    });

    test('confirmation message contains team name', async () => {
        const { wrapper } = setup();
        await wrapper.find('[title="Delete Team"]').trigger('click');
        await nextTick();
        expect(wrapper.findComponent(ConfirmationDialog).props('message')).toContain('Eagles');
    });

    test('confirming delete calls store.deleteTeam and shows success', async () => {
        const { teamsStore, wrapper } = setup();
        jest.spyOn(teamsStore, 'deleteTeam').mockResolvedValue();
        await wrapper.find('[title="Delete Team"]').trigger('click');
        await nextTick();
        await wrapper.findComponent(ConfirmationDialog).vm.$emit('confirm');
        await nextTick();
        expect(teamsStore.deleteTeam).toHaveBeenCalledWith('t1');
        expect(NotificationService.success).toHaveBeenCalled();
    });

    test('deleteTeam failure shows error notification', async () => {
        const { teamsStore, wrapper } = setup();
        jest.spyOn(teamsStore, 'deleteTeam').mockRejectedValue(new Error('Server error'));
        await wrapper.find('[title="Delete Team"]').trigger('click');
        await nextTick();
        await wrapper.findComponent(ConfirmationDialog).vm.$emit('confirm');
        await nextTick();
        expect(NotificationService.error).toHaveBeenCalled();
    });

    test('cancelling delete resets :show to false', async () => {
        const { wrapper } = setup();
        await wrapper.find('[title="Delete Team"]').trigger('click');
        await nextTick();
        const dialog = wrapper.findComponent(ConfirmationDialog);
        await dialog.vm.$emit('cancel');
        await nextTick();
        expect(dialog.props('show')).toBe(false);
    });
});

// ============================================================
// Generate Teams modal
// ============================================================

describe('TeamList - Generate Teams', () => {
    test('clicking Generate Teams button shows modal', async () => {
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        expect(wrapper.find('.modal h3').text()).toBe('Generate Teams');
    });

    test('warning alert shown in modal when teams already exist', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles', logoUrl: null }];
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        expect(wrapper.find('.alert-warning').exists()).toBe(true);
    });

    test('no warning when no teams exist', async () => {
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        expect(wrapper.find('.alert-warning').exists()).toBe(false);
    });

    test('generateTeams calls store and shows success', async () => {
        const teamsStore = useTeamsStore();
        jest.spyOn(teamsStore, 'generateTeams').mockResolvedValue();
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        await nextTick();
        // Click the Generate button inside the modal (second btn in form-actions)
        const generateBtn = wrapper.findAll('.form-actions .btn').find(b => b.text().includes('Generate'));
        await generateBtn.trigger('click');
        await nextTick();
        expect(teamsStore.generateTeams).toHaveBeenCalledWith(4); // default numberOfTeams
        expect(NotificationService.success).toHaveBeenCalled();
        // Modal should close after success
        expect(wrapper.find('.modal').exists()).toBe(false);
    });

    test('generateTeams shows warning and skips store when count out of range', async () => {
        const teamsStore = useTeamsStore();
        jest.spyOn(teamsStore, 'generateTeams').mockResolvedValue();
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        await nextTick();
        // Set numberOfTeams input to an out-of-range value
        const input = wrapper.find('#numberOfTeams');
        await input.setValue(1); // below minimum
        const generateBtn = wrapper.findAll('.form-actions .btn').find(b => b.text().includes('Generate'));
        await generateBtn.trigger('click');
        await nextTick();
        expect(teamsStore.generateTeams).not.toHaveBeenCalled();
        expect(NotificationService.warning).toHaveBeenCalled();
    });

    test('generateTeams failure shows error notification', async () => {
        const teamsStore = useTeamsStore();
        jest.spyOn(teamsStore, 'generateTeams').mockRejectedValue(new Error('Not enough players'));
        const wrapper = mountTeamList();
        await wrapper.findAll('.card-actions .btn')[1].trigger('click');
        await nextTick();
        const generateBtn = wrapper.findAll('.form-actions .btn').find(b => b.text().includes('Generate'));
        await generateBtn.trigger('click');
        await nextTick();
        expect(NotificationService.error).toHaveBeenCalled();
    });
});
