/** `true` when running in a real browser DOM (as opposed to Node/SSR). Guards direct `document`/`window` access. */
export function isBrowser(): boolean {
  return typeof document !== 'undefined';
}
