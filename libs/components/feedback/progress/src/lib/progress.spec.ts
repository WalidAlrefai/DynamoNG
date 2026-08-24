import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoProgress } from './progress';
import { DynamoProgressHarness } from './progress.harness';

describe('DynamoProgress', () => {
  describe('creation', () => {
    it('renders a role="progressbar" element', () => {
      const { container } = renderDynamoComponent(DynamoProgress);

      expect(within(container).getByRole('progressbar')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults value to 0, severity to primary, and size to md', () => {
      const { componentInstance } = renderDynamoComponent(DynamoProgress);

      expect(componentInstance.value()).toBe(0);
      expect(componentInstance.severity()).toBe('primary');
      expect(componentInstance.size()).toBe('md');
    });
  });

  describe('input properties', () => {
    it.each([
      { value: -20, expected: 0 },
      { value: 0, expected: 0 },
      { value: 50, expected: 50 },
      { value: 100, expected: 100 },
      { value: 150, expected: 100 },
      { value: NaN, expected: 0 },
    ])(
      'clamps value=$value to $expected for both aria-valuenow and the fill width',
      ({ value, expected }) => {
        const { container } = renderDynamoComponent(DynamoProgress, {
          inputs: { value },
        });

        const track = within(container).getByRole('progressbar');
        const fill = container.querySelector(
          '[role="progressbar"] > div',
        ) as HTMLElement;
        expect(track.getAttribute('aria-valuenow')).toBe(String(expected));
        expect(fill.style.width).toBe(`${expected}%`);
      },
    );

    it('accepts every documented severity without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoProgress);

      for (const severity of [
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'danger',
      ] as const) {
        setInputs({ severity });
        expect(componentInstance.severity()).toBe(severity);
      }
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoProgress);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('template behavior', () => {
    it('applies a different fill color class per severity', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoProgress, {
        inputs: { severity: 'primary' },
      });
      const primaryClasses = (
        container.querySelector('[role="progressbar"] > div') as HTMLElement
      ).className;

      setInputs({ severity: 'danger' });
      const dangerClasses = (
        container.querySelector('[role="progressbar"] > div') as HTMLElement
      ).className;

      expect(primaryClasses).not.toBe(dangerClasses);
    });

    it('applies a different track height class per size', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoProgress, {
        inputs: { size: 'sm' },
      });
      const smClasses = within(container).getByRole('progressbar').className;

      setInputs({ size: 'lg' });
      const lgClasses = within(container).getByRole('progressbar').className;

      expect(smClasses).not.toBe(lgClasses);
    });

    it('supports interaction through the DynamoProgressHarness', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 40 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoProgressHarness,
      );

      expect(await harness.getValue()).toBe(40);

      setInputs({ value: 75 });
      expect(await harness.getValue()).toBe(75);
    });
  });

  describe('accessibility', () => {
    it('sets aria-valuemin/aria-valuemax and falls back aria-label to "Progress" when unset', () => {
      const { container } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 30 },
      });

      const track = within(container).getByRole('progressbar');
      expect(track.getAttribute('aria-valuemin')).toBe('0');
      expect(track.getAttribute('aria-valuemax')).toBe('100');
      expect(track.getAttribute('aria-label')).toBe('Progress');
    });

    it('uses the provided ariaLabel when set', () => {
      const { container } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 30, ariaLabel: 'Upload progress' },
      });

      expect(
        within(container).getByRole('progressbar').getAttribute('aria-label'),
      ).toBe('Upload progress');
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 55 },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('renders a 0% fill without throwing at value=0', () => {
      const { container } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 0 },
      });

      const fill = container.querySelector(
        '[role="progressbar"] > div',
      ) as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('renders a 100% fill without throwing at value=100', () => {
      const { container } = renderDynamoComponent(DynamoProgress, {
        inputs: { value: 100 },
      });

      const fill = container.querySelector(
        '[role="progressbar"] > div',
      ) as HTMLElement;
      expect(fill.style.width).toBe('100%');
    });
  });
});
