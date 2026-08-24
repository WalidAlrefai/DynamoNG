import { Component, input } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { describe, expect, it } from 'vitest';
import { DynamoTag } from './tag';
import { DynamoTagHarness } from './tag.harness';
import type { DynamoTagVariant } from './tag.types';

@Component({
  selector: 'dg-tag-test-host',
  standalone: true,
  imports: [DynamoTag],
  template: `<dg-tag
    [severity]="severity()"
    [variant]="variant()"
    [size]="size()"
    >{{ label() }}</dg-tag
  >`,
})
class TagTestHostComponent {
  readonly label = input('React');
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoTagVariant>('solid');
  readonly size = input<DynamoSize>('md');
}

describe('DynamoTag', () => {
  describe('creation', () => {
    it('renders projected content', () => {
      const { container } = renderDynamoComponent(TagTestHostComponent);

      expect(container.textContent).toContain('React');
    });

    it('does not throw when rendered with no projected content', () => {
      expect(() => renderDynamoComponent(DynamoTag)).not.toThrow();
    });
  });

  describe('default behavior', () => {
    it('defaults severity to "primary", variant to "solid", size to "md"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoTag);

      expect(componentInstance.severity()).toBe('primary');
      expect(componentInstance.variant()).toBe('solid');
      expect(componentInstance.size()).toBe('md');
    });

    it('reflects the primary/solid defaults as solid background classes', () => {
      const { container } = renderDynamoComponent(DynamoTag);

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
        const { container } = renderDynamoComponent(TagTestHostComponent, {
          inputs: { severity },
        });

        const span = container.querySelector('span');
        expect(span?.className).toContain(`bg-${severity}`);
        expect(span?.className).toContain(`text-on-${severity}`);
      },
    );

    it('applies outline classes (bordered, transparent background) when variant is "outline"', () => {
      const { container } = renderDynamoComponent(TagTestHostComponent, {
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
          renderDynamoComponent(TagTestHostComponent, { inputs: { size } }),
        ).not.toThrow();
      },
    );
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(TagTestHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('harness', () => {
    it('supports reading the tag text through the DynamoTagHarness', async () => {
      const { fixture } = renderDynamoComponent(TagTestHostComponent, {
        inputs: { label: 'TypeScript' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTagHarness,
      );

      expect(await harness.getText()).toBe('TypeScript');
    });
  });

  describe('edge cases', () => {
    it('renders a long label without throwing', () => {
      @Component({
        selector: 'dg-tag-long-label-host',
        standalone: true,
        imports: [DynamoTag],
        template: `<dg-tag>{{ longLabel }}</dg-tag>`,
      })
      class TagLongLabelHostComponent {
        readonly longLabel = 'A '.repeat(50).trim();
      }

      expect(() =>
        renderDynamoComponent(TagLongLabelHostComponent),
      ).not.toThrow();
    });
  });
});
