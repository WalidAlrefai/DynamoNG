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

  describe('dot mode', () => {
    it('defaults to false, rendering projected content', () => {
      const { componentInstance } = renderDynamoComponent(DynamoBadge);
      expect(componentInstance.dot()).toBe(false);
    });

    it('renders no text and a square h-*/w-* pair for each size when dot is true', () => {
      @Component({
        selector: 'dg-badge-dot-host',
        standalone: true,
        imports: [DynamoBadge],
        template: `<dg-badge [size]="size()" [dot]="true">Ignored</dg-badge>`,
      })
      class DotHostComponent {
        readonly size = input<DynamoSize>('md');
      }

      const { container } = renderDynamoComponent(DotHostComponent);
      const span = container.querySelector('span');

      expect(span?.textContent?.trim()).toBe('');
      expect(span?.className).toContain('h-2.5');
      expect(span?.className).toContain('w-2.5');
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'sizes the dot for size "%s"',
      (size) => {
        @Component({
          selector: 'dg-badge-dot-size-host',
          standalone: true,
          imports: [DynamoBadge],
          template: `<dg-badge [size]="size" [dot]="true" />`,
        })
        class DotSizeHostComponent {
          readonly size = size;
        }

        const { container } = renderDynamoComponent(DotSizeHostComponent);
        const span = container.querySelector('span');
        const expected = { sm: 'h-2', md: 'h-2.5', lg: 'h-3' }[size];
        expect(span?.className).toContain(expected);
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
