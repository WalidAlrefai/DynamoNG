import { Component, input } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { describe, expect, it } from 'vitest';
import { DynamoBadge } from './badge';
import { DynamoBadgeHarness } from './badge.harness';
import type { DynamoBadgeVariant } from './badge.types';

@Component({
  selector: 'dg-badge-test-host',
  standalone: true,
  imports: [DynamoBadge],
  template: `<dg-badge
    [severity]="severity()"
    [variant]="variant()"
    [size]="size()"
    >{{ label() }}</dg-badge
  >`,
})
class BadgeTestHostComponent {
  readonly label = input('New');
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoBadgeVariant>('solid');
  readonly size = input<DynamoSize>('md');
}

describe('DynamoBadge', () => {
  describe('creation', () => {
    it('renders projected content', () => {
      const { container } = renderDynamoComponent(BadgeTestHostComponent);

      expect(container.textContent).toContain('New');
    });

    it('does not throw when rendered with no projected content', () => {
      expect(() => renderDynamoComponent(DynamoBadge)).not.toThrow();
    });
  });

  describe('default behavior', () => {
    it('defaults severity to "primary", variant to "solid", size to "md"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoBadge);

      expect(componentInstance.severity()).toBe('primary');
      expect(componentInstance.variant()).toBe('solid');
      expect(componentInstance.size()).toBe('md');
    });

    it('reflects the primary/solid defaults as solid background classes', () => {
      const { container } = renderDynamoComponent(DynamoBadge);

      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-primary');
      expect(span?.className).toContain('text-on-primary');
    });
  });

  describe('input properties', () => {
    it.each([
      'primary',
      'secondary',
      'success',
      'info',
      'warning',
      'danger',
    ] as const)(
      'applies solid background/text classes for severity "%s"',
      (severity) => {
        const { container } = renderDynamoComponent(BadgeTestHostComponent, {
          inputs: { severity },
        });

        const span = container.querySelector('span');
        expect(span?.className).toContain(`bg-${severity}`);
        expect(span?.className).toContain(`text-on-${severity}`);
      },
    );

    it('applies outline classes (bordered, transparent background) when variant is "outline"', () => {
      const { container } = renderDynamoComponent(BadgeTestHostComponent, {
        inputs: { variant: 'outline' },
      });

      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-transparent');
      expect(span?.className).toContain('border-primary');
      expect(span?.className).toContain('text-primary');
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'accepts size "%s" without throwing',
      (size) => {
        expect(() =>
          renderDynamoComponent(BadgeTestHostComponent, { inputs: { size } }),
        ).not.toThrow();
      },
    );
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(BadgeTestHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('harness', () => {
    it('supports reading the badge text through the DynamoBadgeHarness', async () => {
      const { fixture } = renderDynamoComponent(BadgeTestHostComponent, {
        inputs: { label: 'Beta' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoBadgeHarness,
      );

      expect(await harness.getText()).toBe('Beta');
    });
  });
});
