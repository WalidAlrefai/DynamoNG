import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoDivider } from './divider';
import { DynamoDividerHarness } from './divider.harness';

@Component({
  selector: 'dg-divider-labeled-host',
  standalone: true,
  imports: [DynamoDivider],
  template: `<dg-divider>OR</dg-divider>`,
})
class DividerLabeledHostComponent {}

@Component({
  selector: 'dg-divider-vertical-labeled-host',
  standalone: true,
  imports: [DynamoDivider],
  template: `<dg-divider orientation="vertical">OR</dg-divider>`,
})
class DividerVerticalLabeledHostComponent {}

describe('DynamoDivider', () => {
  describe('creation', () => {
    it('renders a role="separator" element', () => {
      const { container } = renderDynamoComponent(DynamoDivider);

      expect(within(container).getByRole('separator')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults orientation to horizontal', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDivider);

      expect(componentInstance.orientation()).toBe('horizontal');
    });
  });

  describe('input properties', () => {
    it('renders a single line with aria-orientation="vertical" when orientation is vertical', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { orientation: 'vertical' },
      });

      const separator = within(container).getByRole('separator');
      expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('does not set aria-orientation when horizontal (the ARIA default)', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { orientation: 'horizontal' },
      });

      expect(
        within(container)
          .getByRole('separator')
          .getAttribute('aria-orientation'),
      ).toBeNull();
    });
  });

  describe('conditional rendering', () => {
    it('renders a projected label between two line segments when horizontal', () => {
      const { container } = renderDynamoComponent(DividerLabeledHostComponent);

      expect(container.textContent).toContain('OR');
      expect(container.querySelectorAll('div.flex-1').length).toBe(2);
    });

    it('renders correctly with no projected content', () => {
      const { container } = renderDynamoComponent(DynamoDivider);

      expect(within(container).getByRole('separator')).toBeTruthy();
      expect(container.textContent?.trim()).toBe('');
    });

    it('renders a projected label between two line segments when vertical', () => {
      const { container } = renderDynamoComponent(
        DividerVerticalLabeledHostComponent,
      );

      expect(container.textContent).toContain('OR');
      expect(container.querySelectorAll('div.flex-1').length).toBe(2);
    });
  });

  describe('type (line style)', () => {
    it.each(['solid', 'dashed', 'dotted'] as const)(
      'applies the border-%s class for type "%s"',
      (type) => {
        const { container } = renderDynamoComponent(DynamoDivider, {
          inputs: { type },
        });

        const lines = container.querySelectorAll('[role="separator"] > div');
        expect(lines[0]?.className).toContain(`border-${type}`);
        expect(lines[1]?.className).toContain(`border-${type}`);
      },
    );
  });

  describe('align', () => {
    it('grows both line segments equally for the default "center" align', () => {
      const { container } = renderDynamoComponent(DynamoDivider);

      const lines = container.querySelectorAll('[role="separator"] > div');
      expect(lines[0]?.className).toContain('flex-1');
      expect(lines[1]?.className).toContain('flex-1');
    });

    it('shrinks the before-line for align "left" (horizontal)', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { align: 'left' },
      });

      const lines = container.querySelectorAll('[role="separator"] > div');
      expect(lines[0]?.className).toContain('flex-none');
      expect(lines[1]?.className).toContain('flex-1');
    });

    it('shrinks the after-line for align "right" (horizontal)', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { align: 'right' },
      });

      const lines = container.querySelectorAll('[role="separator"] > div');
      expect(lines[0]?.className).toContain('flex-1');
      expect(lines[1]?.className).toContain('flex-none');
    });

    it('shrinks the before-line for align "top" (vertical)', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { orientation: 'vertical', align: 'top' },
      });

      const lines = container.querySelectorAll('[role="separator"] > div');
      expect(lines[0]?.className).toContain('flex-none');
      expect(lines[1]?.className).toContain('flex-1');
    });

    it('falls back to "center" when align does not match the orientation', () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { orientation: 'horizontal', align: 'top' },
      });

      const lines = container.querySelectorAll('[role="separator"] > div');
      expect(lines[0]?.className).toContain('flex-1');
      expect(lines[1]?.className).toContain('flex-1');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations horizontal with a label', async () => {
      const { container } = renderDynamoComponent(DividerLabeledHostComponent);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations vertical', async () => {
      const { container } = renderDynamoComponent(DynamoDivider, {
        inputs: { orientation: 'vertical' },
      });
      await expectNoA11yViolations(container);
    });

    it('supports interaction through the DynamoDividerHarness', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoDivider);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDividerHarness,
      );

      expect(await harness.getOrientation()).toBe('horizontal');

      setInputs({ orientation: 'vertical' });
      expect(await harness.getOrientation()).toBe('vertical');
    });
  });

  describe('edge cases', () => {
    it('renders a long label without throwing', () => {
      @Component({
        selector: 'dg-divider-long-label-host',
        standalone: true,
        imports: [DynamoDivider],
        template: `<dg-divider>{{ longLabel }}</dg-divider>`,
      })
      class DividerLongLabelHostComponent {
        readonly longLabel = 'A '.repeat(50).trim();
      }

      const { container } = renderDynamoComponent(
        DividerLongLabelHostComponent,
      );

      expect(within(container).getByRole('separator')).toBeTruthy();
    });
  });
});
