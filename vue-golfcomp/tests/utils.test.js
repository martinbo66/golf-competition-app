import {
  getUserFriendlyErrorMessage,
  formatCurrency,
  validatePlayer
} from '../src/utils';

describe('getUserFriendlyErrorMessage', () => {
  test('returns default message when error is null/undefined', () => {
    expect(getUserFriendlyErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(getUserFriendlyErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });

  test('returns connection message for Network Error', () => {
    expect(getUserFriendlyErrorMessage(new Error('Network Error'))).toBe(
      'Unable to connect. Please check your connection and try again.'
    );
  });

  test('returns connection message for ERR_NETWORK', () => {
    const err = new Error('Request failed');
    err.code = 'ERR_NETWORK';
    expect(getUserFriendlyErrorMessage(err)).toBe(
      'Unable to connect. Please check your connection and try again.'
    );
  });

  test('returns connection message for ECONNABORTED', () => {
    const err = new Error('Timeout');
    err.code = 'ECONNABORTED';
    expect(getUserFriendlyErrorMessage(err)).toBe(
      'Unable to connect. Please check your connection and try again.'
    );
  });

  test('returns not found message for 404 response', () => {
    const err = new Error('Not Found');
    err.response = { status: 404 };
    expect(getUserFriendlyErrorMessage(err)).toBe('The requested item was not found.');
  });

  test('returns server error message for 5xx response', () => {
    const err = new Error('Internal Server Error');
    err.response = { status: 500 };
    expect(getUserFriendlyErrorMessage(err)).toBe(
      'The server encountered an error. Please try again later.'
    );
  });

  test('returns error.message for API errors with message', () => {
    const err = new Error('Validation failed');
    expect(getUserFriendlyErrorMessage(err)).toBe('Validation failed');
  });

  test('falls back to String(error) when error has no message property', () => {
    const err = { toString: () => 'Custom error string' };
    expect(getUserFriendlyErrorMessage(err)).toBe('Custom error string');
  });
});

describe('utils (smoke)', () => {
  test('formatCurrency formats number', () => {
    expect(formatCurrency(60)).toMatch(/\$60\.00/);
  });

  test('formatCurrency formats 0 for null/undefined', () => {
    expect(formatCurrency(null)).toMatch(/\$0\.00/);
    expect(formatCurrency(undefined)).toMatch(/\$0\.00/);
  });

  test('validatePlayer returns errors for invalid input', () => {
    const result = validatePlayer({ name: '', talentRating: 'X' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.talentRating).toBeDefined();
  });
});
