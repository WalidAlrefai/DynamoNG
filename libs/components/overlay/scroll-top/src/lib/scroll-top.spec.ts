import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamoScrollTop } from './scroll-top';
import { DynamoScrollTopHarness } from './scroll-top.harness';

function setScrollY(value: number): void {
  Object.defineProperty(window, 'scrollY', { value, configurable: true });
}

// jsdom has no real scrollTop layout/`scrollTo` on plain elements — same gap
// tree-select's own spec works around for `Element.prototype.scrollTo`.
function setParentScrollTop(el: HTMLElement, value: number): void {
  Object.defineProperty(el, 'scrollTop', {
    value,
    configurable: true,
    writable: true,
  });
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

afterEach(() => {
  setScrollY(0);
  // `container.parentElement` is `document.body` for every test in this
  // file (renderDynamoComponent appends directly to it) — reset the
  // `scrollTop` override a `target: 'parent'` test may have defined on it,
  // or it leaks into unrelated tests that share the same `document.body`.
  setParentScrollTop(document.body, 0);
});

describe('DynamoScrollTop', () => {
  describe('default behavior', () => {
    it('is hidden by default (scrollY at 0)', () => {
      const { container } = renderDynamoComponent(DynamoScrollTop);

      expect(container.querySelector('button')).toBeNull();
    });
  });

  describe('scroll behavior', () => {
    it('becomes visible after scrolling past the threshold', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { threshold: 200 },
      });

      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(container.querySelector('button')).toBeTruthy();
    });

    it('hides again when scrolling back above the threshold', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { threshold: 200 },
      });

      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      expect(container.querySelector('button')).toBeTruthy();

      setScrollY(50);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(container.querySelector('button')).toBeNull();
    });

    it('respects a custom threshold', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { threshold: 500 },
      });

      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(container.querySelector('button')).toBeNull();
    });

    it('removes the scroll listener on destroy', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { fixture } = renderDynamoComponent(DynamoScrollTop);

      fixture.destroy();

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  describe('user interactions', () => {
    it('smooth-scrolls to the top when clicked', async () => {
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop);
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      await userEvent.click(within(container).getByRole('button'));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('supports interaction through the DynamoScrollTopHarness', async () => {
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);
      const { fixture } = renderDynamoComponent(DynamoScrollTop);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoScrollTopHarness,
      );
      expect(await harness.isVisible()).toBe(false);

      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(await harness.isVisible()).toBe(true);
      await harness.click();
      expect(scrollToSpy).toHaveBeenCalled();
    });

    it('throws from the harness when clicked while not visible', async () => {
      const { fixture } = renderDynamoComponent(DynamoScrollTop);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoScrollTopHarness,
      );

      await expect(harness.click()).rejects.toThrow(
        'DynamoScrollTop is not currently visible',
      );
    });
  });

  describe('target: parent', () => {
    it('uses absolute positioning instead of fixed', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { target: 'parent', threshold: 0 },
      });
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      const parent = container.parentElement as HTMLElement;
      setParentScrollTop(parent, 300);
      parent.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      const button = container.querySelector('button') as HTMLElement;
      expect(button.className).toContain('absolute');
      expect(button.className).not.toContain('fixed');
    });

    it('watches the parent element scrollTop instead of window.scrollY', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { target: 'parent', threshold: 200 },
      });
      const parent = container.parentElement as HTMLElement;

      setScrollY(300); // should be ignored while target is 'parent'
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      expect(container.querySelector('button')).toBeNull();

      setParentScrollTop(parent, 300);
      parent.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(container.querySelector('button')).toBeTruthy();
    });

    it('scrolls the parent element, not window, when clicked', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { target: 'parent' },
      });
      const parent = container.parentElement as HTMLElement;
      const parentScrollToSpy = vi
        .spyOn(parent, 'scrollTo')
        .mockImplementation(() => undefined);
      setParentScrollTop(parent, 300);
      parent.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      await userEvent.click(within(container).getByRole('button'));

      expect(parentScrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });

  describe('behavior', () => {
    it('forwards a custom behavior to scrollTo', async () => {
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { behavior: 'auto' },
      });
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      await userEvent.click(within(container).getByRole('button'));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    });
  });

  describe('custom icon', () => {
    it('projects custom [icon] content in place of the default svg', () => {
      @Component({
        selector: 'dg-scroll-top-custom-icon-host',
        standalone: true,
        imports: [DynamoScrollTop],
        template: `
          <dg-scroll-top [threshold]="0">
            <span icon data-testid="custom-icon">^</span>
          </dg-scroll-top>
        `,
      })
      class CustomIconHostComponent {}

      const { fixture, container } = renderDynamoComponent(
        CustomIconHostComponent,
      );
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(within(container).getByTestId('custom-icon')).toBeTruthy();
      expect(container.querySelector('svg')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('defaults ariaLabel to "Scroll to top"', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop);
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(
        within(container).getByRole('button').getAttribute('aria-label'),
      ).toBe('Scroll to top');
    });

    it('reflects a custom ariaLabel', () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop, {
        inputs: { ariaLabel: 'Back to top' },
      });
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      expect(
        within(container).getByRole('button').getAttribute('aria-label'),
      ).toBe('Back to top');
    });

    it('has no axe violations while visible', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop);
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      await expectNoA11yViolations(container);
    });
  });
});
