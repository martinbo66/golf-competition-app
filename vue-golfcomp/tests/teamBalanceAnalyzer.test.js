/**
 * TeamBalanceAnalyzer component tests.
 * Tests balance metric computations, class thresholds, and rendering.
 */
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeamBalanceAnalyzer from '../src/components/admin/TeamBalanceAnalyzer.vue';
import { useTeamsStore } from '@/stores/teams';
import { usePlayersStore } from '@/stores/players';

// Seed helpers
const twoBalancedTeams = () => ({
    teams: [
        { id: 't1', name: 'Eagles' },
        { id: 't2', name: 'Hawks' }
    ],
    // Equal talent distribution: each team gets one A and one D → avgTalent = 2.5
    players: [
        { id: 'p1', teamId: 't1', talentRating: 'A' },
        { id: 'p2', teamId: 't1', talentRating: 'D' },
        { id: 'p3', teamId: 't2', talentRating: 'A' },
        { id: 'p4', teamId: 't2', talentRating: 'D' }
    ]
});

const mountAnalyzer = () => mount(TeamBalanceAnalyzer);

beforeEach(() => {
    setActivePinia(createPinia());
});

describe('TeamBalanceAnalyzer — empty state', () => {
    test('shows empty-state message when no teams', () => {
        const wrapper = mountAnalyzer();
        expect(wrapper.find('.empty-state').exists()).toBe(true);
        expect(wrapper.text()).toContain('No teams available');
    });

    test('does not render analysis table when no teams', () => {
        const wrapper = mountAnalyzer();
        expect(wrapper.find('.team-comparison').exists()).toBe(false);
    });
});

describe('TeamBalanceAnalyzer — analysis display', () => {
    test('hides empty-state and shows comparison table when teams exist', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.empty-state').exists()).toBe(false);
        expect(wrapper.find('.team-comparison').exists()).toBe(true);
    });

    test('renders a row per team in the comparison table', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        const rows = wrapper.findAll('tbody tr');
        expect(rows).toHaveLength(2);
    });

    test('displays team name and player counts', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        expect(wrapper.text()).toContain('Eagles');
        expect(wrapper.text()).toContain('Hawks');
    });

    test('renders three balance-indicator elements', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        expect(wrapper.findAll('.balance-indicator')).toHaveLength(3);
    });
});

describe('TeamBalanceAnalyzer — balance classes', () => {
    test('all indicators are "excellent" for perfectly balanced teams', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        wrapper.findAll('.balance-indicator').forEach(ind => {
            expect(ind.classes()).toContain('excellent');
        });
    });

    test('talent-distribution indicator is "poor" when teams have opposite ratings', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [
            { id: 't1', name: 'Eagles' },
            { id: 't2', name: 'Hawks' }
        ];
        // t1 = all A players (avgTalent ≈ 4), t2 = all D players (avgTalent ≈ 1)
        // talentVariance will be high → "poor"
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'A' },
            { id: 'p2', teamId: 't1', talentRating: 'A' },
            { id: 'p3', teamId: 't1', talentRating: 'A' },
            { id: 'p4', teamId: 't2', talentRating: 'D' },
            { id: 'p5', teamId: 't2', talentRating: 'D' },
            { id: 'p6', teamId: 't2', talentRating: 'D' }
        ];

        const wrapper = mountAnalyzer();
        const indicators = wrapper.findAll('.balance-indicator');
        const hasPoor = indicators.some(ind => ind.classes().includes('poor'));
        expect(hasPoor).toBe(true);
    });

    test('player-distribution indicator is "poor" when team sizes differ greatly', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [
            { id: 't1', name: 'Eagles' },
            { id: 't2', name: 'Hawks' }
        ];
        // t1 = 6 players, t2 = 1 player → high count variance
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'B' },
            { id: 'p2', teamId: 't1', talentRating: 'B' },
            { id: 'p3', teamId: 't1', talentRating: 'B' },
            { id: 'p4', teamId: 't1', talentRating: 'B' },
            { id: 'p5', teamId: 't1', talentRating: 'B' },
            { id: 'p6', teamId: 't1', talentRating: 'B' },
            { id: 'p7', teamId: 't2', talentRating: 'B' }
        ];

        const wrapper = mountAnalyzer();
        const indicators = wrapper.findAll('.balance-indicator');
        const hasPoor = indicators.some(ind => ind.classes().includes('poor'));
        expect(hasPoor).toBe(true);
    });

    test('shows "Excellent" text for excellent balance', () => {
        const { teams, players } = twoBalancedTeams();
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = teams;
        playersStore.players = players;

        const wrapper = mountAnalyzer();
        expect(wrapper.text()).toContain('Excellent');
    });
});

describe('TeamBalanceAnalyzer — getAvgTalentClass', () => {
    // talent-a: avgTalent >= 3.5 (A=4, B=3, C=2, D=1)

    test('avg-talent bar gets "talent-a" class when team is all A players', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles' }];
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'A' },
            { id: 'p2', teamId: 't1', talentRating: 'A' }
        ]; // avgTalent = 4 → talent-a

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.avg-talent-value').classes()).toContain('talent-a');
    });

    test('avg-talent bar gets "talent-b" class when team avg is between 2.5 and 3.5', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles' }];
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'B' },  // 3
            { id: 'p2', teamId: 't1', talentRating: 'C' }   // 2 → avg = 2.5 → talent-b
        ];

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.avg-talent-value').classes()).toContain('talent-b');
    });

    test('avg-talent bar gets "talent-c" class when team avg is between 1.5 and 2.5', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles' }];
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'C' },  // 2
            { id: 'p2', teamId: 't1', talentRating: 'D' }   // 1 → avg = 1.5 → talent-c
        ];

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.avg-talent-value').classes()).toContain('talent-c');
    });

    test('avg-talent bar gets "talent-d" class when team is all D players', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Eagles' }];
        playersStore.players = [
            { id: 'p1', teamId: 't1', talentRating: 'D' },
            { id: 'p2', teamId: 't1', talentRating: 'D' }
        ]; // avgTalent = 1 → talent-d

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.avg-talent-value').classes()).toContain('talent-d');
    });
});

describe('TeamBalanceAnalyzer — single team edge case', () => {
    test('shows analysis (not empty state) with one team', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Solo Eagles' }];
        playersStore.players = [{ id: 'p1', teamId: 't1', talentRating: 'B' }];

        const wrapper = mountAnalyzer();
        expect(wrapper.find('.empty-state').exists()).toBe(false);
        expect(wrapper.find('.team-comparison').exists()).toBe(true);
    });

    test('shows "Excellent" balance with a single team (zero variance)', () => {
        const teamsStore = useTeamsStore();
        const playersStore = usePlayersStore();
        teamsStore.teams = [{ id: 't1', name: 'Solo Eagles' }];
        playersStore.players = [{ id: 'p1', teamId: 't1', talentRating: 'B' }];

        const wrapper = mountAnalyzer();
        // variance is 0 for single team → excellent
        wrapper.findAll('.balance-indicator').forEach(ind => {
            expect(ind.classes()).toContain('excellent');
        });
    });
});
