/**
 * PlayerAssignment component tests.
 * Tests filter/sort logic, player selection, assignment actions, and notifications.
 */
jest.mock('@/services/NotificationService', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() }
}));

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PlayerAssignment from '../src/components/admin/PlayerAssignment.vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';
import NotificationService from '@/services/NotificationService';

const TEAMS = [
    { id: 't1', name: 'Eagles' },
    { id: 't2', name: 'Hawks' }
];
const PLAYERS = [
    { id: 'p1', name: 'Alice', talentRating: 'A', teamId: 't1', entryFee: 60, winnings: 0 },
    { id: 'p2', name: 'Bob',   talentRating: 'B', teamId: 't2', entryFee: 60, winnings: 0 },
    { id: 'p3', name: 'Carol', talentRating: 'C', teamId: null, entryFee: 60, winnings: 0 },
    { id: 'p4', name: 'Dave',  talentRating: 'D', teamId: 't1', entryFee: 60, winnings: 0 }
];

const mountComponent = () => mount(PlayerAssignment);

beforeEach(() => {
    setActivePinia(createPinia());
    NotificationService.success.mockClear();
    NotificationService.error.mockClear();
});

// ============================================================
// Empty States
// ============================================================

describe('PlayerAssignment — empty states', () => {
    test('shows "no teams" message when teams list is empty', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.empty-state').exists()).toBe(true);
        expect(wrapper.text()).toContain('Create teams first');
    });

    test('shows "no players" message when teams exist but no players', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles' }];

        const wrapper = mountComponent();
        expect(wrapper.find('.empty-state').exists()).toBe(true);
        expect(wrapper.text()).toContain('Add players first');
    });

    test('shows player list when both teams and players exist', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        expect(wrapper.find('.empty-state').exists()).toBe(false);
        expect(wrapper.findAll('.player-card').length).toBeGreaterThan(0);
    });
});

// ============================================================
// Player List Rendering
// ============================================================

describe('PlayerAssignment — player list', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('renders all players by default', () => {
        const wrapper = mountComponent();
        expect(wrapper.findAll('.player-card')).toHaveLength(PLAYERS.length);
    });

    test('displays team name for assigned players', () => {
        const wrapper = mountComponent();
        expect(wrapper.text()).toContain('Eagles');
    });

    test('displays "Unassigned" for players without a team', () => {
        const wrapper = mountComponent();
        expect(wrapper.text()).toContain('Unassigned');
    });
});

// ============================================================
// Filter by Talent
// ============================================================

describe('PlayerAssignment — filter by talent', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('shows only A-rated players when talent filter is "A"', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#filterTalent').setValue('A');
        await wrapper.vm.$nextTick();
        const cards = wrapper.findAll('.player-card');
        expect(cards).toHaveLength(1);
        expect(wrapper.text()).toContain('Alice');
    });

    test('resets to all players when talent filter is cleared', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#filterTalent').setValue('A');
        await wrapper.find('#filterTalent').setValue('');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('.player-card')).toHaveLength(PLAYERS.length);
    });
});

// ============================================================
// Filter by Team
// ============================================================

describe('PlayerAssignment — filter by team', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('shows only unassigned players when filter is "unassigned"', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#filterTeam').setValue('unassigned');
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll('.player-card')).toHaveLength(1);
        expect(wrapper.text()).toContain('Carol');
    });

    test('shows only players in chosen team when a team is selected', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#filterTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        const cards = wrapper.findAll('.player-card');
        // t1 has Alice and Dave
        expect(cards).toHaveLength(2);
        expect(wrapper.text()).toContain('Alice');
        expect(wrapper.text()).toContain('Dave');
    });
});

// ============================================================
// Sorting
// ============================================================

describe('PlayerAssignment — sorting', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('sorts by name by default (alphabetical)', async () => {
        const wrapper = mountComponent();
        const names = wrapper.findAll('.player-name').map(n => n.text());
        expect(names).toEqual([...names].sort());
    });

    test('sorts by talent rating when selected (A first)', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#sortBy').setValue('talentRating');
        await wrapper.vm.$nextTick();
        const names = wrapper.findAll('.player-name').map(n => n.text());
        // Alice (A) should be first, Dave (D) last
        expect(names[0]).toBe('Alice');
        expect(names[names.length - 1]).toBe('Dave');
    });

    test('sorts by team name when selected (unassigned last)', async () => {
        const wrapper = mountComponent();
        await wrapper.find('#sortBy').setValue('teamName');
        await wrapper.vm.$nextTick();
        const names = wrapper.findAll('.player-name').map(n => n.text());
        // Carol is unassigned → last
        expect(names[names.length - 1]).toBe('Carol');
    });
});

// ============================================================
// Player Selection
// ============================================================

describe('PlayerAssignment — player selection', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('assignment panel is hidden before a player is selected', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.assignment-actions').exists()).toBe(false);
    });

    test('shows assignment panel and selected name after clicking a player card', async () => {
        const wrapper = mountComponent();
        await wrapper.findAll('.player-card')[0].trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions').exists()).toBe(true);
        expect(wrapper.find('.current-selection').text()).toContain('Alice');
    });

    test('pre-selects player\'s current team in assignment dropdown', async () => {
        const wrapper = mountComponent();
        await wrapper.findAll('.player-card')[0].trigger('click'); // Alice → t1
        await wrapper.vm.$nextTick();
        expect(wrapper.find('#assignToTeam').element.value).toBe('t1');
    });

    test('marks clicked player card as selected', async () => {
        const wrapper = mountComponent();
        const firstCard = wrapper.findAll('.player-card')[0];
        await firstCard.trigger('click');
        await wrapper.vm.$nextTick();
        expect(firstCard.classes()).toContain('selected');
    });

    test('cancel button hides assignment panel', async () => {
        const wrapper = mountComponent();
        await wrapper.findAll('.player-card')[0].trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('.btn-secondary').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions').exists()).toBe(false);
    });
});

// ============================================================
// Assign Button Text
// ============================================================

describe('PlayerAssignment — assign button text', () => {
    beforeEach(() => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('shows "Unassign Player" when empty team is selected for an assigned player', async () => {
        const wrapper = mountComponent();
        // Alice (p1) is on t1 — click her card
        await wrapper.findAll('.player-card')[0].trigger('click');
        await wrapper.vm.$nextTick();
        // Change assignment dropdown to empty (unassign)
        await wrapper.find('#assignToTeam').setValue('');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions .btn:not(.btn-secondary)').text()).toBe('Unassign Player');
    });

    test('shows "Assign to Team" when an unassigned player gets a team selected', async () => {
        const wrapper = mountComponent();
        // Carol (p3) is unassigned — click 3rd card after alphabetical sort
        const cards = wrapper.findAll('.player-card');
        const carolCard = cards.find(c => c.text().includes('Carol'));
        await carolCard.trigger('click');
        await wrapper.vm.$nextTick();
        // Select a team for Carol
        await wrapper.find('#assignToTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions .btn:not(.btn-secondary)').text()).toBe('Assign to Team');
    });

    test('shows "Change Team" when assigned player switches to a different team', async () => {
        const wrapper = mountComponent();
        // Alice (t1) → click her card
        await wrapper.findAll('.player-card')[0].trigger('click');
        await wrapper.vm.$nextTick();
        // Switch to t2
        await wrapper.find('#assignToTeam').setValue('t2');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions .btn:not(.btn-secondary)').text()).toBe('Change Team');
    });
});

// ============================================================
// assignPlayer action
// ============================================================

describe('PlayerAssignment — assignPlayer', () => {
    let teamsStore, playersStore;

    beforeEach(() => {
        teamsStore = useTeamsStore();
        playersStore = usePlayersStore();
        teamsStore.teams = TEAMS;
        playersStore.players = PLAYERS;
    });

    test('calls assignPlayerToTeam with correct args when assigning to a team', async () => {
        const spy = jest.spyOn(playersStore, 'assignPlayerToTeam').mockResolvedValue();
        const wrapper = mountComponent();
        // Carol (unassigned) → click her card
        const carolCard = wrapper.findAll('.player-card').find(c => c.text().includes('Carol'));
        await carolCard.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('#assignToTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        await wrapper.find('.assignment-actions .btn:not(.btn-secondary)').trigger('click');
        await wrapper.vm.$nextTick();
        expect(spy).toHaveBeenCalledWith({ playerId: 'p3', teamId: 't1' });
    });

    test('calls assignPlayerToTeam with null teamId when unassigning', async () => {
        const spy = jest.spyOn(playersStore, 'assignPlayerToTeam').mockResolvedValue();
        const wrapper = mountComponent();
        // Alice (t1) → unassign
        await wrapper.findAll('.player-card')[0].trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('#assignToTeam').setValue('');
        await wrapper.vm.$nextTick();
        await wrapper.find('.assignment-actions .btn:not(.btn-secondary)').trigger('click');
        await wrapper.vm.$nextTick();
        expect(spy).toHaveBeenCalledWith({ playerId: 'p1', teamId: null });
    });

    test('shows success notification after successful assignment', async () => {
        jest.spyOn(playersStore, 'assignPlayerToTeam').mockResolvedValue();
        const wrapper = mountComponent();
        const carolCard = wrapper.findAll('.player-card').find(c => c.text().includes('Carol'));
        await carolCard.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('#assignToTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        await wrapper.find('.assignment-actions .btn:not(.btn-secondary)').trigger('click');
        await wrapper.vm.$nextTick();
        expect(NotificationService.success).toHaveBeenCalled();
    });

    test('shows error notification when assignment fails', async () => {
        jest.spyOn(playersStore, 'assignPlayerToTeam').mockRejectedValue(new Error('Network error'));
        const wrapper = mountComponent();
        const carolCard = wrapper.findAll('.player-card').find(c => c.text().includes('Carol'));
        await carolCard.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('#assignToTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        await wrapper.find('.assignment-actions .btn:not(.btn-secondary)').trigger('click');
        await wrapper.vm.$nextTick();
        expect(NotificationService.error).toHaveBeenCalled();
    });

    test('clears selection after successful assignment', async () => {
        jest.spyOn(playersStore, 'assignPlayerToTeam').mockResolvedValue();
        const wrapper = mountComponent();
        const carolCard = wrapper.findAll('.player-card').find(c => c.text().includes('Carol'));
        await carolCard.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.find('#assignToTeam').setValue('t1');
        await wrapper.vm.$nextTick();
        await wrapper.find('.assignment-actions .btn:not(.btn-secondary)').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.assignment-actions').exists()).toBe(false);
    });
});
