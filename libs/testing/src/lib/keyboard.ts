import userEvent from '@testing-library/user-event';

/**
 * Presses a single key against whatever element currently has focus, using
 * `@testing-library/user-event` so the resulting events match real browser
 * behavior (keydown/keypress/keyup, `key`/`code`, etc.) instead of a single
 * synthetic `KeyboardEvent`.
 *
 * @param key A user-event key spec, e.g. `'{Enter}'`, `'{ArrowDown}'`, `'{Escape}'`.
 */
export async function pressKey(key: string): Promise<void> {
  const user = userEvent.setup();
  await user.keyboard(key);
}
