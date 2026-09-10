import type { DynamoKeyFilterPreset } from './key-filter.types';

/**
 * Each preset is a regex the *candidate full value* must match for a
 * keystroke / paste to be accepted. They allow the empty string and partial
 * input (e.g. a lone `-` or `.`) so the field can be typed into progressively.
 * Names and shapes mirror PrimeNG's own `KeyFilter` preset set.
 */
export const KEY_FILTER_PATTERNS: Record<DynamoKeyFilterPreset, RegExp> = {
  int: /^-?\d*$/,
  pint: /^\d*$/,
  num: /^-?\d*(?:\.\d*)?$/,
  pnum: /^\d*(?:\.\d*)?$/,
  money: /^-?\d*(?:\.\d{0,2})?$/,
  hex: /^[0-9a-f]*$/i,
  alpha: /^[a-z]*$/i,
  alphanum: /^[a-z0-9]*$/i,
  // Permissive while typing: any run of email-legal characters.
  email: /^[a-z0-9._%+\-@]*$/i,
};
