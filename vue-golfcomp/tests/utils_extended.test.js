/**
 * Additional utils tests covering functions not reached in utils.test.js.
 */

import {
    talentRatingToPoints,
    formatDate,
    generateTeamName,
    validatePlayer,
    validateScore,
    calculateTeamBalanceMetrics,
    exportDataToJson,
    parseImportedJson
} from '../src/utils';

describe('talentRatingToPoints', () => {
    test('maps A to 4', () => expect(talentRatingToPoints('A')).toBe(4));
    test('maps B to 3', () => expect(talentRatingToPoints('B')).toBe(3));
    test('maps C to 2', () => expect(talentRatingToPoints('C')).toBe(2));
    test('maps D to 1', () => expect(talentRatingToPoints('D')).toBe(1));
    test('returns 0 for unknown rating', () => expect(talentRatingToPoints('Z')).toBe(0));
    test('returns 0 for empty string', () => expect(talentRatingToPoints('')).toBe(0));
});

describe('formatDate', () => {
    test('returns empty string for null', () => {
        expect(formatDate(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(formatDate(undefined)).toBe('');
    });

    test('formats a valid ISO date string', () => {
        const result = formatDate('2026-06-15T10:30:00Z');
        // Result is locale-dependent; just verify it's a non-empty string
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/2026/);
    });
});

describe('generateTeamName', () => {
    test('returns a string with two words', () => {
        const name = generateTeamName(0);
        expect(typeof name).toBe('string');
        expect(name.split(' ')).toHaveLength(2);
    });

    test('first team is Mighty Eagles', () => {
        expect(generateTeamName(0)).toBe('Mighty Eagles');
    });

    test('wraps back to same name after full cycle (10 adjectives × 10 nouns = 100)', () => {
        // index 0 and index 100 both produce adjIndex=0, nounIndex=0
        expect(generateTeamName(0)).toBe(generateTeamName(100));
    });

    test('different indices produce different names', () => {
        const names = new Set([0, 1, 2, 3, 4].map(generateTeamName));
        expect(names.size).toBe(5);
    });
});

describe('validatePlayer', () => {
    test('returns isValid true for valid player', () => {
        const result = validatePlayer({ name: 'Alice', talentRating: 'A', entryFee: 100, winnings: 0 });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    test('returns error when name is whitespace only', () => {
        const result = validatePlayer({ name: '   ', talentRating: 'B' });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeDefined();
    });

    test('returns error for invalid entryFee', () => {
        const result = validatePlayer({ name: 'Bob', talentRating: 'A', entryFee: 'abc' });
        expect(result.isValid).toBe(false);
        expect(result.errors.entryFee).toBeDefined();
    });

    test('returns error for invalid winnings', () => {
        const result = validatePlayer({ name: 'Bob', talentRating: 'A', winnings: 'xyz' });
        expect(result.isValid).toBe(false);
        expect(result.errors.winnings).toBeDefined();
    });

    test('does not error on undefined entryFee/winnings', () => {
        const result = validatePlayer({ name: 'Alice', talentRating: 'B' });
        expect(result.errors.entryFee).toBeUndefined();
        expect(result.errors.winnings).toBeUndefined();
    });
});

describe('validateScore', () => {
    test('returns isValid true for value 0', () => {
        expect(validateScore(0).isValid).toBe(true);
    });

    test('returns isValid true for value 72', () => {
        expect(validateScore(72).isValid).toBe(true);
    });

    test('returns isValid true for value in range', () => {
        expect(validateScore(36).isValid).toBe(true);
        expect(validateScore('45').isValid).toBe(true);
    });

    test('returns error for NaN input', () => {
        const result = validateScore('abc');
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/valid number/i);
    });

    test('returns error for negative value', () => {
        const result = validateScore(-1);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/0 and 72/);
    });

    test('returns error for value above 72', () => {
        const result = validateScore(73);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/0 and 72/);
    });

    test('has null error when valid', () => {
        expect(validateScore(18).error).toBeNull();
    });
});

describe('calculateTeamBalanceMetrics', () => {
    const teams = [
        { id: 't1', name: 'Eagles' },
        { id: 't2', name: 'Tigers' }
    ];
    const players = [
        { id: 'p1', teamId: 't1', talentRating: 'A' },
        { id: 'p2', teamId: 't1', talentRating: 'B' },
        { id: 'p3', teamId: 't2', talentRating: 'C' },
        { id: 'p4', teamId: 't2', talentRating: 'D' }
    ];

    test('returns empty array when teams is null', () => {
        expect(calculateTeamBalanceMetrics(null, players)).toEqual([]);
    });

    test('returns empty array when players is null', () => {
        expect(calculateTeamBalanceMetrics(teams, null)).toEqual([]);
    });

    test('calculates talent counts per team', () => {
        const metrics = calculateTeamBalanceMetrics(teams, players);
        const eagles = metrics.find(m => m.teamId === 't1');
        expect(eagles.talentCounts).toEqual({ A: 1, B: 1, C: 0, D: 0 });
    });

    test('calculates total talent points', () => {
        const metrics = calculateTeamBalanceMetrics(teams, players);
        const eagles = metrics.find(m => m.teamId === 't1');
        expect(eagles.totalTalentPoints).toBe(7); // A=4, B=3
    });

    test('calculates average talent rating', () => {
        const metrics = calculateTeamBalanceMetrics(teams, players);
        const eagles = metrics.find(m => m.teamId === 't1');
        expect(eagles.avgTalentRating).toBeCloseTo(3.5);
    });

    test('returns avgTalentRating of 0 for empty team', () => {
        const metrics = calculateTeamBalanceMetrics([{ id: 'empty', name: 'Empty' }], players);
        expect(metrics[0].avgTalentRating).toBe(0);
    });

    test('returns correct player count', () => {
        const metrics = calculateTeamBalanceMetrics(teams, players);
        expect(metrics.find(m => m.teamId === 't1').playerCount).toBe(2);
        expect(metrics.find(m => m.teamId === 't2').playerCount).toBe(2);
    });
});

describe('exportDataToJson', () => {
    test('returns pretty-printed JSON string', () => {
        const data = { players: [], teams: [] };
        const result = exportDataToJson(data);
        expect(typeof result).toBe('string');
        expect(JSON.parse(result)).toEqual(data);
        expect(result).toContain('\n'); // pretty-printed
    });

    test('serialises complex objects', () => {
        const data = { players: [{ id: 'p1', name: 'Alice' }] };
        const result = exportDataToJson(data);
        expect(result).toContain('Alice');
    });
});

describe('parseImportedJson', () => {
    const validData = {
        players: [{ id: 'p1' }],
        teams: [{ id: 't1' }],
        scores: [{ id: 's1' }],
        courses: [{ id: 'c1' }]
    };

    test('parses and returns valid JSON data', () => {
        const result = parseImportedJson(JSON.stringify(validData));
        expect(result).toEqual(validData);
    });

    test('returns null for invalid JSON', () => {
        expect(parseImportedJson('not json')).toBeNull();
    });

    test('returns null when players array is missing', () => {
        const bad = { ...validData };
        delete bad.players;
        expect(parseImportedJson(JSON.stringify(bad))).toBeNull();
    });

    test('returns null when teams array is missing', () => {
        const bad = { ...validData };
        delete bad.teams;
        expect(parseImportedJson(JSON.stringify(bad))).toBeNull();
    });

    test('returns null when scores array is missing', () => {
        const bad = { ...validData };
        delete bad.scores;
        expect(parseImportedJson(JSON.stringify(bad))).toBeNull();
    });

    test('returns null when courses array is missing', () => {
        const bad = { ...validData };
        delete bad.courses;
        expect(parseImportedJson(JSON.stringify(bad))).toBeNull();
    });

    test('returns null when players is not an array', () => {
        const bad = { ...validData, players: {} };
        expect(parseImportedJson(JSON.stringify(bad))).toBeNull();
    });
});
