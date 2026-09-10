import { Component } from '@angular/core';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DynamoAnimateOnScroll } from './animate-on-scroll';

// jsdom has no IntersectionObserver — a controllable fake that captures the
// callback and lets tests drive intersect / exit.
let observed: {
  callback: IntersectionObserverCallback;
  disconnected: boolean;
} | null = null;

class FakeIntersectionObserver {
  constructor(private readonly cb: IntersectionObserverCallback) {}
  observe(): void {
    observed = { callback: this.cb, disconnected: false };
  }
  disconnect(): void {
    if (observed) observed.disconnected = true;
  }
  unobserve(): void {
    /* noop */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function fireIntersect(isIntersecting: boolean): void {
  observed?.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

@Component({
  selector: 'dg-aos-once-host',
  standalone: true,
  imports: [DynamoAnimateOnScroll],
  template: `<div dgAnimateOnScroll enterClass="fade-in" data-testid="el"></div>`,
})
class OnceHost {}

@Component({
  selector: 'dg-aos-repeat-host',
  standalone: true,
  imports: [DynamoAnimateOnScroll],
  template: `<div
    dgAnimateOnScroll
    enterClass="fade-in"
    leaveClass="fade-out"
    [once]="false"
    data-testid="el"
  ></div>`,
})
class RepeatHost {}

@Component({
  selector: 'dg-aos-disabled-host',
  standalone: true,
  imports: [DynamoAnimateOnScroll],
  template: `<div
    dgAnimateOnScroll
    enterClass="fade-in"
    [dgAnimateOnScrollDisabled]="true"
    data-testid="el"
  ></div>`,
})
class DisabledHost {}

describe('DynamoAnimateOnScroll', () => {
  beforeEach(() => {
    observed = null;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds enterClass when the element intersects, then disconnects (once=true default)', () => {
    const { container } = renderDynamoComponent(OnceHost);
    const el = within(container).getByTestId('el');

    expect(el.classList.contains('fade-in')).toBe(false);
    fireIntersect(true);
    expect(el.classList.contains('fade-in')).toBe(true);
    expect(observed?.disconnected).toBe(true);
  });

  it('with once=false, swaps enterClass ↔ leaveClass on enter/exit and stays observing', () => {
    const { container } = renderDynamoComponent(RepeatHost);
    const el = within(container).getByTestId('el');

    fireIntersect(true);
    expect(el.classList.contains('fade-in')).toBe(true);
    expect(el.classList.contains('fade-out')).toBe(false);

    fireIntersect(false);
    expect(el.classList.contains('fade-in')).toBe(false);
    expect(el.classList.contains('fade-out')).toBe(true);
    expect(observed?.disconnected).toBe(false);
  });

  it('applies enterClass immediately and never observes when disabled', () => {
    const { container } = renderDynamoComponent(DisabledHost);
    expect(
      within(container).getByTestId('el').classList.contains('fade-in'),
    ).toBe(true);
    expect(observed).toBeNull();
  });

  it('applies enterClass immediately when prefers-reduced-motion is set', () => {
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
      const { container } = renderDynamoComponent(OnceHost);
      expect(
        within(container).getByTestId('el').classList.contains('fade-in'),
      ).toBe(true);
      expect(observed).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });

  it('disconnects the observer on destroy', () => {
    const { fixture } = renderDynamoComponent(RepeatHost);
    fixture.destroy();
    expect(observed?.disconnected).toBe(true);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(OnceHost);
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
