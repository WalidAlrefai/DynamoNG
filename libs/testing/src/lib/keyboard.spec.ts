import { describe, expect, it, afterEach } from 'vitest';
import { pressKey } from './keyboard';

describe('pressKey', () => {
  let input: HTMLInputElement;

  afterEach(() => {
    input?.remove();
  });

  it('dispatches a keydown event for the given key against the focused element', async () => {
    input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    let sawEnter = false;
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') sawEnter = true;
    });

    await pressKey('{Enter}');

    expect(sawEnter).toBe(true);
  });

  it('types printable characters into a focused text input', async () => {
    input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await pressKey('a');

    expect(input.value).toBe('a');
  });
});
