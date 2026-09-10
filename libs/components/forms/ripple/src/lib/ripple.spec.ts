import { Component, signal } from '@angular/core';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoRipple } from './ripple';

// jsdom has no Web Animations API. A minimal stub whose `finished` resolves
// on the next microtask lets these tests exercise the real spawn/cleanup
// path — same posture as the `Element.scrollTo` polyfill in the
// virtual-scroll specs.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
  Element.prototype.animate = function (): Animation {
    return {
      finished: Promise.resolve(),
      cancel() {
        /* noop */
      },
    } as unknown as Animation;
  };
}

@Component({
  selector: 'dg-ripple-host',
  standalone: true,
  imports: [DynamoRipple],
  template: `
    <button
      type="button"
      dgRipple
      [dgRippleDisabled]="disabled()"
      [dgRippleColor]="color()"
      data-testid="btn"
    >
      Click me
    </button>
  `,
})
class RippleHostComponent {
  readonly disabled = signal(false);
  readonly color = signal<string | undefined>(undefined);
}

function press(el: HTMLElement): void {
  el.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }),
  );
}

describe('DynamoRipple', () => {
  it('appends a ripple span on pointerdown, then removes it once the animation resolves', async () => {
    const { container } = renderDynamoComponent(RippleHostComponent);
    const btn = within(container).getByTestId('btn') as HTMLElement;

    press(btn);
    expect(btn.querySelectorAll('span').length).toBe(1);

    await Promise.resolve();
    await Promise.resolve();
    expect(btn.querySelectorAll('span').length).toBe(0);
  });

  it('makes the host a positioning context with clipped overflow', () => {
    const { container } = renderDynamoComponent(RippleHostComponent);
    const btn = within(container).getByTestId('btn') as HTMLElement;

    press(btn);
    expect(btn.style.position).toBe('relative');
    expect(btn.style.overflow).toBe('hidden');
  });

  it('does nothing when dgRippleDisabled is true', () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      RippleHostComponent,
    );
    componentInstance.disabled.set(true);
    fixture.detectChanges();
    const btn = within(container).getByTestId('btn') as HTMLElement;

    press(btn);
    expect(btn.querySelectorAll('span').length).toBe(0);
  });

  it('applies dgRippleColor as an inline background', () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      RippleHostComponent,
    );
    componentInstance.color.set('rgb(1, 2, 3)');
    fixture.detectChanges();
    const btn = within(container).getByTestId('btn') as HTMLElement;

    press(btn);
    const span = btn.querySelector('span') as HTMLElement;
    expect(span.style.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('respects prefers-reduced-motion', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) =>
      ({
        matches: q.includes('prefers-reduced-motion'),
        media: q,
        addEventListener() {
          /* noop */
        },
        removeEventListener() {
          /* noop */
        },
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    try {
      const { container } = renderDynamoComponent(RippleHostComponent);
      const btn = within(container).getByTestId('btn') as HTMLElement;
      press(btn);
      expect(btn.querySelectorAll('span').length).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(RippleHostComponent);
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
