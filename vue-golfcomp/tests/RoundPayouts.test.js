/**
 * RoundPayouts component tests.
 * Covers rendering, button enable/disable states, split preview,
 * form submissions, notifications, and remove-payout flow.
 */
jest.mock('@/services/ApiService', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        payoutsUrl: jest.fn(id => id ? `/competitions/c1/payouts/${id}` : '/competitions/c1/payouts'),
        roundPayoutsUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts`),
        teamWinPayoutUrl: jest.fn(roundId => `/competitions/c1/rounds/${roundId}/payouts/team-win`)
    }
}));

jest.mock('@/services/NotificationService', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() }
}));

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import NotificationService from '@/services/NotificationService';
import RoundPayouts from '../src/components/scoring/RoundPayouts.vue';
import { usePayoutsStore } from '@/stores/payouts';
import { usePlayersStore } from '@/stores/players';
import { useTeamsStore } from '@/stores/teams';
import { useScoresStore } from '@/stores/scores';

const ROUND_ID = 'round-1';
const TEAM_ID = 'team-1';

const TEAMS = [{ id: TEAM_ID, name: 'Eagles', logoUrl: null, createdAt: '', updatedAt: '' }];
const PLAYERS = [
    { id: 'p1', name: 'Alice Smith', nickname: null, talentRating: 'A', teamId: TEAM_ID, teamName: 'Eagles', entryFee: 0, winnings: 0, createdAt: '', updatedAt: '' },
    { id: 'p2', name: 'Bob Jones',   nickname: null, talentRating: 'B', teamId: TEAM_ID, teamName: 'Eagles', entryFee: 0, winnings: 0, createdAt: '', updatedAt: '' }
];

const makePayout = (overrides = {}) => ({
    id: 'payout-1',
    roundId: ROUND_ID,
    playerId: 'p1',
    playerName: 'Alice Smith',
    teamId: TEAM_ID,
    teamName: 'Eagles',
    type: 'GREENIE',
    amount: 25,
    note: 'Hole 5',
    ...overrides
});

const mountComponent = () => mount(RoundPayouts, { props: { roundId: ROUND_ID } });

beforeEach(() => {
    setActivePinia(createPinia());
    NotificationService.success.mockClear();
    NotificationService.error.mockClear();
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('RoundPayouts - rendering', () => {
    test('shows Payouts heading and $0.00 round total when no payouts', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.card-header h3').text()).toBe('Payouts');
        expect(wrapper.text()).toContain('Round total:');
        expect(wrapper.text()).toContain('$0.00');
    });

    test('shows round total summed from store', () => {
        const store = usePayoutsStore();
        store.payouts = [
            makePayout({ type: 'GREENIE', amount: 25 }),
            makePayout({ id: 'p2', type: 'TEAM_WIN', amount: 40 })
        ];
        const wrapper = mountComponent();
        expect(wrapper.text()).toContain('$65.00');
    });

    test('shows "No greenies recorded yet." when no GREENIE payouts', () => {
        const wrapper = mountComponent();
        expect(wrapper.text()).toContain('No greenies recorded yet.');
    });

    test('renders greenie table rows when GREENIE payouts exist', () => {
        const store = usePayoutsStore();
        store.payouts = [makePayout({ type: 'GREENIE', amount: 30, note: 'Hole 3' })];
        const wrapper = mountComponent();
        expect(wrapper.text()).toContain('Alice Smith');
        expect(wrapper.text()).toContain('Hole 3');
        expect(wrapper.text()).toContain('$30.00');
        expect(wrapper.find('.payout-section:last-child table').exists()).toBe(true);
    });

    test('shows team-win form when no TEAM_WIN payouts', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.team-win-form').exists()).toBe(true);
        expect(wrapper.find('.team-win-form select').exists()).toBe(true);
    });

    test('shows team-win table instead of form when TEAM_WIN payouts exist', () => {
        const store = usePayoutsStore();
        store.payouts = [makePayout({ type: 'TEAM_WIN', amount: 40 })];
        const wrapper = mountComponent();
        expect(wrapper.find('.team-win-form').exists()).toBe(false);
        expect(wrapper.text()).toContain('Alice Smith');
        expect(wrapper.text()).toContain('$40.00');
    });

    test('populates team-win select with teams that have scores', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const scoresStore = useScoresStore();
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', courseId: 'c1', roundId: ROUND_ID, value: 80 }
        ];
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        const options = wrapper.findAll('.team-win-form select option');
        // first option is "Select team", rest are teams
        expect(options.length).toBeGreaterThan(1);
        expect(options[1].text()).toContain('Eagles');
    });

    test('shows leading team name when teams have scores', () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const scoresStore = useScoresStore();
        scoresStore.scores = [
            { id: 's1', playerId: 'p1', courseId: 'c1', roundId: ROUND_ID, value: 72 }
        ];
        const wrapper = mountComponent();
        expect(wrapper.find('.leading-team').exists()).toBe(true);
        expect(wrapper.find('.leading-team').text()).toContain('Eagles');
    });

    test('populates greenie player select with sorted players', () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;

        const wrapper = mountComponent();
        const options = wrapper.findAll('.greenie-form select option');
        expect(options.length).toBeGreaterThan(1);
        // Alice comes before Bob alphabetically
        expect(options[1].text()).toContain('Alice');
        expect(options[2].text()).toContain('Bob');
    });
});

// ─── Button states ───────────────────────────────────────────────────────────

describe('RoundPayouts - button enable/disable', () => {
    test('"Record team win" is disabled when no team selected', () => {
        const wrapper = mountComponent();
        const btn = wrapper.find('.team-win-form .btn-primary');
        expect(btn.element.disabled).toBe(true);
    });

    test('"Record team win" is disabled when team selected but no amount', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        const btn = wrapper.find('.team-win-form .btn-primary');
        expect(btn.element.disabled).toBe(true);
    });

    test('"Record team win" is enabled when team + amount + players present', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        await wrapper.find('.amount-input').setValue('80');
        const btn = wrapper.find('.team-win-form .btn-primary');
        expect(btn.element.disabled).toBe(false);
    });

    test('"Add greenie" is disabled when no player selected', () => {
        const wrapper = mountComponent();
        const btn = wrapper.find('.greenie-form .btn-primary');
        expect(btn.element.disabled).toBe(true);
    });

    test('"Add greenie" is disabled when player selected but no amount', async () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        await wrapper.find('.greenie-form select').setValue('p1');
        const btn = wrapper.find('.greenie-form .btn-primary');
        expect(btn.element.disabled).toBe(true);
    });

    test('"Add greenie" is enabled when player + amount present', async () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;

        const wrapper = mountComponent();
        await wrapper.find('.greenie-form select').setValue('p1');
        await wrapper.findAll('.greenie-form input')[1].setValue('25');
        const btn = wrapper.find('.greenie-form .btn-primary');
        expect(btn.element.disabled).toBe(false);
    });
});

// ─── Split preview ───────────────────────────────────────────────────────────

describe('RoundPayouts - split preview', () => {
    test('shows split preview when team and amount are set', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        await wrapper.find('.amount-input').setValue('80');
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.split-preview').exists()).toBe(true);
        expect(wrapper.find('.split-preview').text()).toContain('2 player(s)');
        expect(wrapper.find('.split-preview').text()).toContain('$40.00');
    });

    test('does not show split preview when no team selected', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('.split-preview').exists()).toBe(false);
    });
});

// ─── Record team win ─────────────────────────────────────────────────────────

describe('RoundPayouts - record team win', () => {
    test('calls payoutsStore.recordTeamWin and shows success notification', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'recordTeamWin').mockResolvedValue([]);

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        await wrapper.find('.amount-input').setValue('80');
        await wrapper.find('.team-win-form .btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(payoutsStore.recordTeamWin).toHaveBeenCalledWith({
            roundId: ROUND_ID,
            teamId: TEAM_ID,
            teamAmount: 80
        });
        expect(NotificationService.success).toHaveBeenCalledWith('Team win payout recorded');
    });

    test('resets team win form after successful record', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'recordTeamWin').mockResolvedValue([]);

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        await wrapper.find('.amount-input').setValue('80');
        await wrapper.find('.team-win-form .btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.team-win-form select').element.value).toBe('');
    });

    test('shows error notification when recordTeamWin fails', async () => {
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'recordTeamWin').mockRejectedValue(new Error('Network error'));

        const wrapper = mountComponent();
        await wrapper.find('.team-win-form select').setValue(TEAM_ID);
        await wrapper.find('.amount-input').setValue('80');
        await wrapper.find('.team-win-form .btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(NotificationService.error).toHaveBeenCalled();
    });
});

// ─── Add greenie ──────────────────────────────────────────────────────────────

describe('RoundPayouts - add greenie', () => {
    test('calls payoutsStore.createPayout with correct args and shows success', async () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'createPayout').mockResolvedValue(makePayout());

        const wrapper = mountComponent();
        const greenieForm = wrapper.find('.greenie-form');
        await greenieForm.find('select').setValue('p1');
        await greenieForm.findAll('input')[0].setValue('Hole 7');
        await greenieForm.findAll('input')[1].setValue('30');
        await greenieForm.find('.btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(payoutsStore.createPayout).toHaveBeenCalledWith({
            roundId: ROUND_ID,
            playerId: 'p1',
            type: 'GREENIE',
            amount: 30,
            note: 'Hole 7'
        });
        expect(NotificationService.success).toHaveBeenCalledWith('Greenie recorded');
    });

    test('resets greenie form after successful add', async () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'createPayout').mockResolvedValue(makePayout());

        const wrapper = mountComponent();
        const greenieForm = wrapper.find('.greenie-form');
        await greenieForm.find('select').setValue('p1');
        await greenieForm.findAll('input')[1].setValue('30');
        await greenieForm.find('.btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(greenieForm.find('select').element.value).toBe('');
    });

    test('shows error notification when createPayout fails', async () => {
        const playersStore = usePlayersStore();
        playersStore.players = PLAYERS;
        const teamsStore = useTeamsStore();
        teamsStore.teams = TEAMS;
        const payoutsStore = usePayoutsStore();
        jest.spyOn(payoutsStore, 'createPayout').mockRejectedValue(new Error('Save failed'));

        const wrapper = mountComponent();
        const greenieForm = wrapper.find('.greenie-form');
        await greenieForm.find('select').setValue('p1');
        await greenieForm.findAll('input')[1].setValue('25');
        await greenieForm.find('.btn-primary').trigger('click');
        await wrapper.vm.$nextTick();

        expect(NotificationService.error).toHaveBeenCalled();
    });
});

// ─── Remove payout ───────────────────────────────────────────────────────────

describe('RoundPayouts - remove payout', () => {
    test('calls deletePayout and shows success when user confirms', async () => {
        const payoutsStore = usePayoutsStore();
        payoutsStore.payouts = [makePayout({ id: 'payout-1', type: 'GREENIE' })];
        jest.spyOn(payoutsStore, 'deletePayout').mockResolvedValue();
        jest.spyOn(window, 'confirm').mockReturnValue(true);

        const wrapper = mountComponent();
        await wrapper.find('.btn-danger').trigger('click');
        await wrapper.vm.$nextTick();

        expect(payoutsStore.deletePayout).toHaveBeenCalledWith('payout-1');
        expect(NotificationService.success).toHaveBeenCalledWith('Payout removed');
    });

    test('does not call deletePayout when user cancels confirm', async () => {
        const payoutsStore = usePayoutsStore();
        payoutsStore.payouts = [makePayout({ id: 'payout-1', type: 'GREENIE' })];
        jest.spyOn(payoutsStore, 'deletePayout').mockResolvedValue();
        jest.spyOn(window, 'confirm').mockReturnValue(false);

        const wrapper = mountComponent();
        await wrapper.find('.btn-danger').trigger('click');

        expect(payoutsStore.deletePayout).not.toHaveBeenCalled();
    });

    test('shows error notification when deletePayout fails', async () => {
        const payoutsStore = usePayoutsStore();
        payoutsStore.payouts = [makePayout({ id: 'payout-1', type: 'GREENIE' })];
        jest.spyOn(payoutsStore, 'deletePayout').mockRejectedValue(new Error('Delete failed'));
        jest.spyOn(window, 'confirm').mockReturnValue(true);

        const wrapper = mountComponent();
        await wrapper.find('.btn-danger').trigger('click');
        await wrapper.vm.$nextTick();

        expect(NotificationService.error).toHaveBeenCalled();
    });

    test('remove button appears on TEAM_WIN payout rows', () => {
        const payoutsStore = usePayoutsStore();
        payoutsStore.payouts = [makePayout({ type: 'TEAM_WIN', amount: 40 })];

        const wrapper = mountComponent();
        expect(wrapper.find('.btn-danger').exists()).toBe(true);
    });
});
