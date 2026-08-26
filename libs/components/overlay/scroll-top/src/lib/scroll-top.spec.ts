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

afterEach(() => {
  setScrollY(0);
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

      expect(removeSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );
    });
  });

  describe('user interactions', () => {
    it('smooth-scrolls to the top when clicked', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
      const { fixture, container } = renderDynamoComponent(DynamoScrollTop);
      setScrollY(300);
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      await userEvent.click(within(container).getByRole('button'));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('supports interaction through the DynamoScrollTopHarness', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
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
