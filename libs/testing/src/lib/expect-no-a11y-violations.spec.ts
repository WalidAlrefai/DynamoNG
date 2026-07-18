import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from './expect-no-a11y-violations';

function createElement(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

describe('expectNoA11yViolations', () => {
  it('resolves without throwing for accessible markup', async () => {
    const el = createElement(`<button type="button">Save</button>`);

    await expect(expectNoA11yViolations(el)).resolves.toBeUndefined();

    el.remove();
  });

  it('throws with a readable summary when a violation is present', async () => {
    const el = createElement(`<img src="logo.png" />`);

    await expect(expectNoA11yViolations(el)).rejects.toThrow(/accessibility violation/i);

    el.remove();
  });

  it('includes the violated rule id in the thrown error message', async () => {
    const el = createElement(`<img src="logo.png" />`);

    await expect(expectNoA11yViolations(el)).rejects.toThrow(/image-alt/);

    el.remove();
  });
});
