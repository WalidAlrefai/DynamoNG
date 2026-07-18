import { describe, expect, it } from 'vitest';
import { getFocusableElements } from './focusable-elements';

function createContainer(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

describe('getFocusableElements', () => {
  it('returns focusable elements in DOM order', () => {
    const container = createContainer(`
      <button>First</button>
      <a href="#">Link</a>
      <input type="text" />
    `);

    const result = getFocusableElements(container);

    expect(result.map((el) => el.tagName)).toEqual(['BUTTON', 'A', 'INPUT']);
  });

  it('excludes disabled form controls', () => {
    const container = createContainer(`<button disabled>Disabled</button><button>Enabled</button>`);

    const result = getFocusableElements(container);

    expect(result).toHaveLength(1);
    expect(result[0]?.textContent).toBe('Enabled');
  });

  it('excludes elements with tabindex="-1"', () => {
    const container = createContainer(`<div tabindex="-1">Not focusable</div><div tabindex="0">Focusable</div>`);

    const result = getFocusableElements(container);

    expect(result).toHaveLength(1);
  });

  it('returns an empty array for a container with no focusable descendants', () => {
    const container = createContainer(`<p>Just text</p>`);

    expect(getFocusableElements(container)).toEqual([]);
  });
});
