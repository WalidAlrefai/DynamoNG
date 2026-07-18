import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class inputs (`clsx`) and resolves conflicting Tailwind
 * utility classes (`tailwind-merge`) so that a later class always wins over an
 * earlier one for the same CSS property. This is the only way component
 * `*.styles.ts` files and consumer-supplied `styleClass`/`pt` overrides should
 * ever be combined — never string concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
