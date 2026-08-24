import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoSpinner } from './spinner';
import { DynamoSpinnerHarness } from './spinner.harness';

describe('DynamoSpinner', () => {
  describe('creation', () => {
    it('renders without errors', () => {
      const { container } = renderDynamoComponent(DynamoSpinner);

      expect(container.querySelector('span')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('renders as decorative (aria-hidden) with no role when label is unset', () => {
      const { container } = renderDynamoComponent(DynamoSpinner);

      const span = container.querySelector('span');
      expect(span?.getAttribute('aria-hidden')).toBe('true');
      expect(span?.getAttribute('role')).toBeNull();
      expect(span?.getAttribute('aria-label')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('renders as an announced status region when label is set', () => {
      const { container } = renderDynamoComponent(DynamoSpinner, {
        inputs: { label: 'Loading results' },
      });

      const status = within(container).getByRole('status');
      expect(status.getAttribute('aria-label')).toBe('Loading results');
      expect(status.getAttribute('aria-hidden')).toBeNull();
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoSpinner);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('template behavior', () => {
    it('applies different classes for each size', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSpinner, {
        inputs: { size: 'sm' },
      });
      const smClasses = container.querySelector('span')?.className;

      setInputs({ size: 'lg' });
      const lgClasses = container.querySelector('span')?.className;

      expect(smClasses).not.toBe(lgClasses);
    });

    it('supports interaction through the DynamoSpinnerHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSpinner, {
        inputs: { label: 'Loading' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSpinnerHarness,
      );

      expect(await harness.getLabel()).toBe('Loading');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations while decorative (default)', async () => {
      const { container } = renderDynamoComponent(DynamoSpinner);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations while announced with a label', async () => {
      const { container } = renderDynamoComponent(DynamoSpinner, {
        inputs: { label: 'Loading results' },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('toggles between decorative and announced when label is set then cleared', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSpinner, {
        inputs: { label: 'Loading' },
      });
      expect(container.querySelector('span')?.getAttribute('role')).toBe(
        'status',
      );

      setInputs({ label: undefined });

      expect(container.querySelector('span')?.getAttribute('role')).toBeNull();
      expect(container.querySelector('span')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    });
  });
});
