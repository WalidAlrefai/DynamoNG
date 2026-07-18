import { describe, expect, it } from 'vitest';
import { createMockSelectOption, createMockSelectOptions } from './mock-select-options';

describe('createMockSelectOption', () => {
  it('returns a valid option with default label/value when called with no arguments', () => {
    expect(createMockSelectOption()).toEqual({ label: 'Option', value: 'option' });
  });

  it('applies overrides on top of the defaults', () => {
    expect(createMockSelectOption({ label: 'Custom', disabled: true })).toEqual({
      label: 'Custom',
      value: 'option',
      disabled: true,
    });
  });
});

describe('createMockSelectOptions', () => {
  it('returns the requested number of options with distinct, sequential labels', () => {
    const options = createMockSelectOptions(3);

    expect(options).toHaveLength(3);
    expect(options.map((o) => o.label)).toEqual(['Option 1', 'Option 2', 'Option 3']);
  });

  it('returns an empty array for count 0', () => {
    expect(createMockSelectOptions(0)).toEqual([]);
  });

  it('gives every option a unique value', () => {
    const options = createMockSelectOptions(5);
    const uniqueValues = new Set(options.map((o) => o.value));

    expect(uniqueValues.size).toBe(5);
  });
});
